import { env } from "../config/env.js";
import { create_child_logger } from "../logs/logger.js";
import { SYSTEM_JSON_MODE, SYSTEM_THINKING_MODE } from "../prompts/index.js";
import type { AIProvider, StreamCallback } from "../types/ai.js";
import { THINKING_END, THINKING_START } from "../types/ai.js";

const log = create_child_logger("modal");

interface ChatCompletionChunk {
	choices?: Array<{
		delta?: {
			content?: string;
		};
	}>;
}

export class ModalProvider implements AIProvider {
	readonly config = {
		name: "modal",
		supports_vision: true,
		supports_thinking: true,
	};

	private get_base_url(use_thinking: boolean): string {
		const url = use_thinking ? env.MODAL_THINKING_URL : env.MODAL_FAST_URL;
		if (!url) {
			throw new Error(
				`MODAL_${use_thinking ? "THINKING" : "FAST"}_URL is required`,
			);
		}
		return url.endsWith("/v1") ? url : `${url}/v1`;
	}

	private get_model(use_thinking: boolean): string {
		const model = use_thinking
			? env.MODAL_THINKING_MODEL
			: env.MODAL_FAST_MODEL;
		if (!model) {
			throw new Error(
				`MODAL_${use_thinking ? "THINKING" : "FAST"}_MODEL is required`,
			);
		}
		return model;
	}

	private get_api_key(): string {
		const key = env.MODAL_API_KEY_AUTH;
		if (!key) {
			throw new Error("MODAL_API_KEY_AUTH is required");
		}
		return key;
	}

	async stream(prompt: string, on_data: StreamCallback): Promise<void> {
		await this.do_stream(prompt, null, on_data, false);
	}

	async stream_with_vision(
		prompt: string,
		image_base64: string,
		on_data: StreamCallback,
	): Promise<void> {
		await this.do_stream(prompt, image_base64, on_data, false);
	}

	async stream_thinking(
		prompt: string,
		on_data: StreamCallback,
	): Promise<void> {
		await this.do_stream(prompt, null, on_data, true);
	}

	async stream_thinking_with_vision(
		prompt: string,
		image_base64: string,
		on_data: StreamCallback,
	): Promise<void> {
		await this.do_stream(prompt, image_base64, on_data, true);
	}

	private async do_stream(
		prompt: string,
		image_base64: string | null,
		on_data: StreamCallback,
		use_thinking: boolean,
	): Promise<void> {
		const base_url = this.get_base_url(use_thinking);
		const model = this.get_model(use_thinking);
		const api_key = this.get_api_key();

		log.debug(
			{ use_thinking, has_image: !!image_base64 },
			"Starting Modal stream",
		);

		const message_content = image_base64
			? [
					{ type: "text", text: prompt },
					{
						type: "image_url",
						image_url: { url: `data:image/jpeg;base64,${image_base64}` },
					},
				]
			: prompt;

		const messages: Array<{
			role: string;
			content: string | typeof message_content;
		}> = [];

		const is_json_request =
			prompt.includes('"items"') ||
			prompt.includes("JSON") ||
			prompt.includes("json");

		if (is_json_request && !image_base64) {
			messages.push({
				role: "system",
				content: SYSTEM_JSON_MODE,
			});
		} else if (use_thinking && !image_base64) {
			messages.push({
				role: "system",
				content: SYSTEM_THINKING_MODE,
			});
		}

		messages.push({ role: "user", content: message_content });

		const response = await fetch(`${base_url}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${api_key}`,
			},
			body: JSON.stringify({
				model,
				messages,
				stream: true,
				max_tokens: 2000,
			}),
		});

		if (!response.ok) {
			throw new Error(`Modal error: ${response.statusText}`);
		}

		if (!response.body) {
			throw new Error("No response body from Modal");
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		let thinking_buffer = "";
		let thinking_finished = !use_thinking;
		let total_chunks = 0;
		let total_chars = 0;
		const start_time = Date.now();

		log.debug({ model, base_url }, "Modal request started");

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (!line.trim() || !line.startsWith("data: ")) continue;

				const data = line.slice(6);
				if (data === "[DONE]") continue;

				try {
					const json: ChatCompletionChunk = JSON.parse(data);
					const delta = json.choices?.[0]?.delta?.content;
					if (!delta) continue;

					total_chunks++;
					total_chars += delta.length;

					if (!use_thinking) {
						on_data(delta);
						continue;
					}

					thinking_buffer += delta;
					thinking_buffer = thinking_buffer.replace(/<think>/g, "");

					if (!thinking_finished) {
						if (thinking_buffer.includes("</think>")) {
							const parts = thinking_buffer.split("</think>");
							const thinking_content = parts[0]?.trim();
							const response_content = parts.slice(1).join("").trim();

							if (thinking_content) {
								on_data(THINKING_START);
								on_data("• Analizando tu pregunta\n");
								on_data(thinking_content);
								on_data(`\n${THINKING_END}`);
							}

							thinking_finished = true;
							thinking_buffer = "";

							if (response_content) {
								on_data(response_content);
							}
						}
					} else {
						on_data(delta);
					}
				} catch {
					log.warn({ line }, "Error parsing Modal line");
				}
			}
		}

		if (use_thinking && !thinking_finished && thinking_buffer.trim()) {
			log.warn("Stream ended without </think> tag");
			this.handle_incomplete_thinking(thinking_buffer, on_data);
		}

		const duration_ms = Date.now() - start_time;
		log.info(
			{
				model,
				use_thinking,
				total_chunks,
				total_chars,
				duration_ms,
				chars_per_second: Math.round(total_chars / (duration_ms / 1000)),
			},
			"Modal stream completed",
		);
	}

	private handle_incomplete_thinking(
		buffer: string,
		on_data: StreamCallback,
	): void {
		const clean_buffer = buffer.replace(/<\/?think>/g, "");

		const response_patterns = [
			/\n\n¡/,
			/\n\nRecomiendo/i,
			/\n\nAquí/i,
			/\n\nEstos/i,
			/\n\nTe sugiero/i,
			/\n\n\*\*/,
			/\n\n###/,
			/\n\n1\./,
		];

		let response_start = -1;
		for (const pattern of response_patterns) {
			const match = clean_buffer.search(pattern);
			if (match !== -1 && (response_start === -1 || match < response_start)) {
				response_start = match;
			}
		}

		if (response_start !== -1) {
			const thinking_content = clean_buffer.slice(0, response_start).trim();
			const response_content = clean_buffer.slice(response_start).trim();

			if (thinking_content) {
				on_data(THINKING_START);
				on_data("• Analizando tu pregunta\n");
				on_data(thinking_content);
				on_data(`\n${THINKING_END}`);
			}

			if (response_content) {
				on_data(response_content);
			}
		} else {
			on_data(THINKING_START);
			on_data("• Analizando tu pregunta\n");
			on_data(clean_buffer.trim());
			on_data(`\n${THINKING_END}`);
			on_data(
				"\n\nLo siento, no pude completar mi análisis. ¿Podrías reformular tu pregunta?",
			);
		}
	}
}

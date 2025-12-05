import { env } from "../config/env.js";
import { create_child_logger } from "../logs/logger.js";
import type { AIProvider, StreamCallback } from "../types/ai.js";

const log = create_child_logger("beam");

interface ChatCompletionChunk {
	choices?: Array<{
		delta?: {
			content?: string;
		};
	}>;
}

export class BeamProvider implements AIProvider {
	readonly config = {
		name: "beam",
		supports_vision: false,
		supports_thinking: false,
	};

	private readonly base_url: string | undefined;
	private readonly api_key: string | undefined;
	private readonly model: string | undefined;

	constructor() {
		this.base_url = env.BEAM_URL;
		this.api_key = env.BEAM_API_KEY;
		this.model = env.BEAM_MODEL;
	}

	async stream(prompt: string, on_data: StreamCallback): Promise<void> {
		if (!this.base_url || !this.api_key) {
			throw new Error("BEAM_URL and BEAM_API_KEY are required");
		}

		log.debug("Starting Beam stream");

		const response = await fetch(this.base_url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.api_key}`,
			},
			body: JSON.stringify({
				model: this.model,
				messages: [{ role: "user", content: prompt }],
				stream: true,
			}),
		});

		if (!response.ok) {
			throw new Error(`Beam error: ${response.statusText}`);
		}

		if (!response.body) {
			throw new Error("No response body from Beam");
		}

		const decoder = new TextDecoder();
		const reader = response.body.getReader();
		let buffer = "";

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
					const content = json.choices?.[0]?.delta?.content;
					if (content) on_data(content);
				} catch {
					log.warn({ line }, "Error parsing Beam line");
				}
			}
		}
	}
}

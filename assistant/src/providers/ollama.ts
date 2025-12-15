import { env } from "../config/env.js";
import { create_child_logger } from "../logs/logger.js";
import { SYSTEM_THINKING_SPANISH } from "../prompts/system.js";
import type {
	AIProvider,
	AIProviderConfig,
	StreamCallback,
} from "../types/ai.js";
import { THINKING_END, THINKING_START } from "../types/ai.js";

const log = create_child_logger("ollama");

// Ollama capability types from /api/show
type OllamaCapability =
	| "completion"
	| "thinking"
	| "vision"
	| "embedding"
	| "tools";

interface OllamaModelInfo {
	capabilities: OllamaCapability[];
	available: boolean;
}

// Cache for model capabilities (model name -> capabilities)
const model_capabilities_cache = new Map<string, OllamaModelInfo>();

async function get_model_capabilities(
	base_url: string,
	model_name: string,
): Promise<OllamaModelInfo> {
	// Check cache first
	const cached = model_capabilities_cache.get(model_name);
	if (cached) return cached;

	try {
		const response = await fetch(`${base_url}/api/show`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: model_name }),
		});

		if (!response.ok) {
			log.debug(
				{ model: model_name, status: response.status },
				"Model not found in Ollama",
			);
			const info: OllamaModelInfo = { capabilities: [], available: false };
			model_capabilities_cache.set(model_name, info);
			return info;
		}

		const data = (await response.json()) as {
			capabilities?: OllamaCapability[];
		};
		const info: OllamaModelInfo = {
			capabilities: data.capabilities || [],
			available: true,
		};

		model_capabilities_cache.set(model_name, info);
		log.debug(
			{ model: model_name, capabilities: info.capabilities },
			"Model capabilities cached",
		);

		return info;
	} catch (err) {
		log.warn(
			{
				model: model_name,
				error: err instanceof Error ? err.message : String(err),
			},
			"Could not fetch model capabilities",
		);
		return { capabilities: [], available: false };
	}
}

export class OllamaProvider implements AIProvider {
	config: AIProviderConfig;

	private readonly base_url: string;
	private readonly model: string;
	private readonly vision_model: string;
	private capabilities_promise: Promise<void> | null = null;

	constructor() {
		this.base_url = env.OLLAMA_URL;
		this.model = env.OLLAMA_MODEL;
		this.vision_model = env.OLLAMA_VISION_MODEL;

		// Initial config with conservative defaults
		// Will be updated when capabilities are checked
		this.config = {
			name: "ollama",
			supports_vision: false,
			supports_thinking: false,
		};

		// Start checking capabilities (will be awaited on first use)
		this.capabilities_promise = this.check_capabilities();
	}

	private async check_capabilities(): Promise<void> {
		// Check main model capabilities
		const main_info = await get_model_capabilities(this.base_url, this.model);

		if (main_info.available) {
			this.config.supports_thinking =
				main_info.capabilities.includes("thinking");
		}

		// Check vision model if configured
		if (this.vision_model) {
			const vision_info = await get_model_capabilities(
				this.base_url,
				this.vision_model,
			);
			this.config.supports_vision =
				vision_info.available && vision_info.capabilities.includes("vision");

			if (!vision_info.available) {
				log.debug(
					{ vision_model: this.vision_model },
					"Vision model not available",
				);
			} else if (!vision_info.capabilities.includes("vision")) {
				log.warn(
					{
						vision_model: this.vision_model,
						capabilities: vision_info.capabilities,
					},
					"Configured vision model does not have vision capability",
				);
			}
		}

		log.info(
			{
				model: this.model,
				vision_model: this.vision_model || "(none)",
				supports_thinking: this.config.supports_thinking,
				supports_vision: this.config.supports_vision,
			},
			"Ollama capabilities ready",
		);
	}

	async get_actual_capabilities(): Promise<AIProviderConfig> {
		// Wait for the single capabilities check to complete
		if (this.capabilities_promise) {
			await this.capabilities_promise;
		}
		return { ...this.config };
	}

	async stream(prompt: string, on_data: StreamCallback): Promise<void> {
		log.debug({ model: this.model }, "Starting Ollama stream");

		const response = await fetch(`${this.base_url}/api/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: this.model,
				prompt: `${prompt}\n\n/no_think`,
			}),
		});

		if (!response.ok) {
			throw new Error(`Ollama error: ${response.statusText}`);
		}

		if (!response.body) {
			throw new Error("No response body from Ollama");
		}

		const decoder = new TextDecoder();
		let buffer = "";
		const reader = response.body.getReader();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (!line.trim()) continue;
				try {
					const json = JSON.parse(line);
					const text = json.response || "";
					if (text) on_data(text);
				} catch {
					log.warn({ line }, "Error parsing line");
				}
			}
		}

		if (buffer) {
			try {
				const json = JSON.parse(buffer);
				const text = json.response || "";
				if (text) on_data(text);
			} catch {
				log.warn({ buffer }, "Error parsing final buffer");
			}
		}

		log.debug("Ollama stream complete");
	}

	async stream_with_vision(
		prompt: string,
		image_base64: string,
		on_data: StreamCallback,
	): Promise<void> {
		const response = await fetch(`${this.base_url}/api/chat`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: this.vision_model,
				messages: [
					{
						role: "user",
						content: prompt,
						images: [image_base64],
					},
				],
				stream: true,
			}),
		});

		if (!response.ok) {
			throw new Error(`Ollama Vision error: ${response.statusText}`);
		}

		if (!response.body) {
			throw new Error("No response body from Ollama Vision");
		}

		const decoder = new TextDecoder();
		let buffer = "";
		const reader = response.body.getReader();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (!line.trim()) continue;
				try {
					const json = JSON.parse(line);
					const text = json.message?.content;
					if (text?.trim()) on_data(text);
				} catch {
					log.warn({ line }, "Error parsing vision line");
				}
			}
		}

		if (buffer) {
			try {
				const json = JSON.parse(buffer);
				const text = json.message?.content;
				if (text?.trim()) on_data(text);
			} catch {
				log.warn({ buffer }, "Error parsing final vision buffer");
			}
		}
	}

	async stream_thinking(
		prompt: string,
		on_data: StreamCallback,
	): Promise<void> {
		log.debug({ model: this.model }, "Starting Ollama thinking stream");

		// Use /api/chat with think: true to get thinking content
		// Add system message to instruct thinking in Spanish
		const response = await fetch(`${this.base_url}/api/chat`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: this.model,
				messages: [
					{ role: "system", content: SYSTEM_THINKING_SPANISH },
					{ role: "user", content: prompt },
				],
				stream: true,
				think: true,
			}),
		});

		if (!response.ok) {
			throw new Error(`Ollama error: ${response.statusText}`);
		}

		if (!response.body) {
			throw new Error("No response body from Ollama");
		}

		const decoder = new TextDecoder();
		let buffer = "";
		let sent_thinking_start = false;
		let sent_thinking_end = false;
		let has_thinking_content = false;
		let thinking_length = 0;
		let content_length = 0;

		const reader = response.body.getReader();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (!line.trim()) continue;
				try {
					const json = JSON.parse(line);
					const message = json.message;

					// Handle thinking content (comes before main content)
					if (message?.thinking) {
						if (!sent_thinking_start) {
							log.debug("Thinking started");
							on_data(THINKING_START);
							sent_thinking_start = true;
						}
						thinking_length += message.thinking.length;
						on_data(message.thinking);
						has_thinking_content = true;
					}

					// Handle main content
					if (message?.content) {
						// If we had thinking, end it before main content
						if (sent_thinking_start && !sent_thinking_end) {
							log.debug({ thinking_length }, "Thinking ended");
							on_data(THINKING_END);
							sent_thinking_end = true;
						}
						content_length += message.content.length;
						on_data(message.content);
					}
				} catch {
					log.warn({ line }, "Error parsing line");
				}
			}
		}

		// Handle remaining buffer
		if (buffer.trim()) {
			try {
				const json = JSON.parse(buffer);
				const message = json.message;
				if (message?.thinking) {
					if (!sent_thinking_start) {
						log.debug("Thinking started (from buffer)");
						on_data(THINKING_START);
						sent_thinking_start = true;
					}
					thinking_length += message.thinking.length;
					on_data(message.thinking);
					has_thinking_content = true;
				}
				if (message?.content) {
					if (sent_thinking_start && !sent_thinking_end) {
						log.debug({ thinking_length }, "Thinking ended (from buffer)");
						on_data(THINKING_END);
						sent_thinking_end = true;
					}
					content_length += message.content.length;
					on_data(message.content);
				}
			} catch {
				log.warn({ buffer }, "Error parsing final buffer");
			}
		}

		// Close thinking block if still open
		if (sent_thinking_start && !sent_thinking_end) {
			log.debug({ thinking_length }, "Thinking ended (force close)");
			on_data(THINKING_END);
		}

		log.debug(
			{ had_thinking: has_thinking_content, thinking_length, content_length },
			"Ollama thinking stream complete",
		);
	}
}

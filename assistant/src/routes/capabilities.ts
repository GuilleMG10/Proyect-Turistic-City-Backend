import { Hono } from "hono";
import { env } from "../config/env.js";
import { get_provider } from "../providers/index.js";
import { OllamaProvider } from "../providers/ollama.js";

export const capabilities_route = new Hono();

capabilities_route.get("/", async (c) => {
	const provider = get_provider();

	// Use actual capabilities for Ollama (checks if models are available)
	let config = provider.config;
	if (provider instanceof OllamaProvider) {
		config = await provider.get_actual_capabilities();
	}

	return c.json({
		provider: config.name,
		model: get_model_name(),
		capabilities: {
			vision: config.supports_vision,
			thinking: config.supports_thinking,
		},
	});
});

function get_model_name(): string {
	switch (env.AI_PROVIDER) {
		case "ollama":
			return env.OLLAMA_MODEL;
		case "modal":
			return env.MODAL_FAST_MODEL || "unknown";
		case "beam":
			return env.BEAM_MODEL || "unknown";
		default:
			return "unknown";
	}
}

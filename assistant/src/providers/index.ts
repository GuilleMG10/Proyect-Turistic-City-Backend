import { env } from "../config/env.js";
import { create_child_logger } from "../logs/logger.js";
import type { AIProvider, AIProviderConfig } from "../types/ai.js";
import { BeamProvider } from "./beam.js";
import { ModalProvider } from "./modal.js";
import { OllamaProvider } from "./ollama.js";

const log = create_child_logger("providers");

const provider_instances = new Map<string, AIProvider>();

function get_or_create_provider(name: string): AIProvider {
	let provider = provider_instances.get(name);
	if (provider) return provider;

	switch (name) {
		case "ollama":
			provider = new OllamaProvider();
			break;
		case "modal":
		case "modal-thinking":
			provider = new ModalProvider();
			break;
		case "beam":
			provider = new BeamProvider();
			break;
		default:
			throw new Error(`Unknown provider: ${name}`);
	}

	provider_instances.set(name, provider);
	log.info({ provider: name }, "Provider initialized");

	return provider;
}

export function get_provider(name?: string): AIProvider {
	const provider_name = name || env.AI_PROVIDER;
	return get_or_create_provider(provider_name);
}

export function get_provider_config(name?: string): AIProviderConfig {
	return get_provider(name).config;
}

export function is_thinking_provider(name: string): boolean {
	return name === "modal-thinking" || name === "ollama-thinking";
}

export { OllamaProvider, ModalProvider, BeamProvider };

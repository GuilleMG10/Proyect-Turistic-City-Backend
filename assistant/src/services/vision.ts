import { create_child_logger } from "../logs/logger.js";
import { build_profile_prompt } from "../prompts/index.js";
import { get_provider, is_thinking_provider } from "../providers/index.js";
import type { StreamCallback } from "../types/ai.js";

const log = create_child_logger("vision");

export { build_profile_prompt };

export async function analyze_profile_image(
	image_base64: string,
	provider_name: string,
	on_data: StreamCallback,
	context?: string,
): Promise<void> {
	const provider = get_provider(provider_name);
	const prompt = build_profile_prompt(context);

	log.debug({ provider: provider_name }, "Analyzing profile image");

	if (!provider.stream_with_vision) {
		throw new Error(`Provider ${provider_name} does not support vision`);
	}

	if (
		is_thinking_provider(provider_name) &&
		provider.stream_thinking_with_vision
	) {
		await provider.stream_thinking_with_vision(prompt, image_base64, on_data);
	} else {
		await provider.stream_with_vision(prompt, image_base64, on_data);
	}
}

export async function analyze_image_with_prompt(
	prompt: string,
	image_base64: string,
	provider_name: string,
	on_data: StreamCallback,
): Promise<void> {
	const provider = get_provider(provider_name);

	log.debug({ provider: provider_name }, "Analyzing image with custom prompt");

	if (!provider.stream_with_vision) {
		throw new Error(`Provider ${provider_name} does not support vision`);
	}

	if (
		is_thinking_provider(provider_name) &&
		provider.stream_thinking_with_vision
	) {
		await provider.stream_thinking_with_vision(prompt, image_base64, on_data);
	} else {
		await provider.stream_with_vision(prompt, image_base64, on_data);
	}
}

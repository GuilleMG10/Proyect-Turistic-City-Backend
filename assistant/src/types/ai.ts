export type StreamCallback = (chunk: string) => void;

export interface AIProviderConfig {
	name: string;
	supports_vision: boolean;
	supports_thinking: boolean;
}

export interface AIProvider {
	readonly config: AIProviderConfig;

	stream(prompt: string, on_data: StreamCallback): Promise<void>;

	stream_with_vision?(
		prompt: string,
		image_base64: string,
		on_data: StreamCallback,
	): Promise<void>;

	stream_thinking?(prompt: string, on_data: StreamCallback): Promise<void>;

	stream_thinking_with_vision?(
		prompt: string,
		image_base64: string,
		on_data: StreamCallback,
	): Promise<void>;
}

export interface ProviderFactory {
	create(provider: string): AIProvider;
}

export const THINKING_START = "[THINKING_START]";
export const THINKING_END = "[THINKING_END]";
export const STREAM_DONE = "[DONE]";

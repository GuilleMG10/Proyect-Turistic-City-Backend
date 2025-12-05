import { describe, expect, it, vi } from "vitest";
import { get_provider, is_thinking_provider } from "../providers/index.js";

// Mock the logger module first
vi.mock("../logs/logger.js", () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		child: () => ({
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		}),
	},
	create_child_logger: () => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	}),
}));

vi.mock("../config/env.js", () => ({
	env: {
		AI_PROVIDER: "ollama",
		OLLAMA_URL: "http://localhost:11434",
		OLLAMA_MODEL: "qwen3",
		OLLAMA_VISION_MODEL: "llava:7b",
		MODAL_API_KEY_AUTH: "test-key",
		MODAL_FAST_URL: "https://test.modal.run",
		MODAL_THINKING_URL: "https://test-thinking.modal.run",
		MODAL_FAST_MODEL: "test-model",
		MODAL_THINKING_MODEL: "test-thinking-model",
		BEAM_URL: "https://test.beam.cloud",
		BEAM_API_KEY: "test-beam-key",
		BEAM_MODEL: "test-beam-model",
		LOG_LEVEL: "info",
	},
}));

describe("providers", () => {
	describe("get_provider", () => {
		it("should return ollama provider by default", () => {
			const provider = get_provider("ollama");
			expect(provider.config.name).toBe("ollama");
		});

		it("should return modal provider", () => {
			const provider = get_provider("modal");
			expect(provider.config.name).toBe("modal");
		});

		it("should return modal provider for modal-thinking", () => {
			const provider = get_provider("modal-thinking");
			expect(provider.config.name).toBe("modal");
		});

		it("should return beam provider", () => {
			const provider = get_provider("beam");
			expect(provider.config.name).toBe("beam");
		});

		it("should throw for unknown provider", () => {
			expect(() => get_provider("unknown")).toThrow(
				"Unknown provider: unknown",
			);
		});

		it("should cache provider instances", () => {
			const provider1 = get_provider("ollama");
			const provider2 = get_provider("ollama");
			expect(provider1).toBe(provider2);
		});
	});

	describe("is_thinking_provider", () => {
		it("should return true for modal-thinking", () => {
			expect(is_thinking_provider("modal-thinking")).toBe(true);
		});

		it("should return false for other providers", () => {
			expect(is_thinking_provider("modal")).toBe(false);
			expect(is_thinking_provider("ollama")).toBe(false);
			expect(is_thinking_provider("beam")).toBe(false);
		});
	});

	describe("provider configs", () => {
		it("ollama should support vision but not thinking", () => {
			const provider = get_provider("ollama");
			expect(provider.config.supports_vision).toBe(true);
			expect(provider.config.supports_thinking).toBe(false);
		});

		it("modal should support vision and thinking", () => {
			const provider = get_provider("modal");
			expect(provider.config.supports_vision).toBe(true);
			expect(provider.config.supports_thinking).toBe(true);
		});

		it("beam should not support vision or thinking", () => {
			const provider = get_provider("beam");
			expect(provider.config.supports_vision).toBe(false);
			expect(provider.config.supports_thinking).toBe(false);
		});
	});
});

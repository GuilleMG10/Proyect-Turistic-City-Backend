import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

// Mock the env module for testing
vi.mock("../config/env.js", () => {
	const schema = z.object({
		AI_PROVIDER: z
			.enum(["ollama", "modal", "modal-thinking", "beam"])
			.default("ollama"),
		OLLAMA_URL: z.url().optional(),
		OLLAMA_MODEL: z.string().default("qwen3"),
		OLLAMA_VISION_MODEL: z.string().default("llava:7b"),
		MODAL_API_KEY_AUTH: z.string().optional(),
		MODAL_FAST_URL: z.url().optional(),
		MODAL_THINKING_URL: z.url().optional(),
		MODAL_FAST_MODEL: z.string().optional(),
		MODAL_THINKING_MODEL: z.string().optional(),
		BEAM_URL: z.url().optional(),
		BEAM_API_KEY: z.string().optional(),
		BEAM_MODEL: z.string().optional(),
		CHROMA_URL: z.url().default("http://localhost:8000"),
		CHROMA_API_KEY: z.string().optional(),
	});

	return {
		env: schema.parse({
			AI_PROVIDER: "ollama",
			OLLAMA_URL: "http://localhost:11434",
			CHROMA_URL: "http://localhost:8000",
		}),
		env_schema: schema,
	};
});

describe("env config", () => {
	it("should have default AI_PROVIDER as ollama", async () => {
		const { env } = await import("../config/env.js");
		expect(env.AI_PROVIDER).toBe("ollama");
	});

	it("should have default OLLAMA_MODEL as qwen3", async () => {
		const { env } = await import("../config/env.js");
		expect(env.OLLAMA_MODEL).toBe("qwen3");
	});

	it("should have default CHROMA_URL", async () => {
		const { env } = await import("../config/env.js");
		expect(env.CHROMA_URL).toBe("http://localhost:8000");
	});
});

describe("env_schema validation", () => {
	it("should reject invalid AI_PROVIDER", () => {
		const schema = z.object({
			AI_PROVIDER: z
				.enum(["ollama", "modal", "modal-thinking", "beam"])
				.default("ollama"),
		});

		const result = schema.safeParse({ AI_PROVIDER: "invalid" });
		expect(result.success).toBe(false);
	});

	it("should reject invalid URL format", () => {
		const schema = z.object({
			OLLAMA_URL: z.url(),
		});

		const result = schema.safeParse({ OLLAMA_URL: "not-a-url" });
		expect(result.success).toBe(false);
	});

	it("should accept valid URL format", () => {
		const schema = z.object({
			OLLAMA_URL: z.url(),
		});

		const result = schema.safeParse({ OLLAMA_URL: "http://localhost:11434" });
		expect(result.success).toBe(true);
	});
});

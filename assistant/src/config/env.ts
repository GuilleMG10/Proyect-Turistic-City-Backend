import { z } from "zod";

const env_schema = z.object({
	AI_PROVIDER: z.enum(["modal", "beam", "ollama"]),
	AI_PORT: z.coerce.number(),
	FRONTEND_URL: z.url(),

	OLLAMA_URL: z.url(),
	OLLAMA_MODEL: z.string(),
	OLLAMA_VISION_MODEL: z.string(),
	OLLAMA_EMBEDDING_MODEL: z.string().default("nomic-embed-text"),

	CHROMA_URL: z.url(),

	MODAL_API_KEY_AUTH: z.string().optional(),
	MODAL_FAST_URL: z.url().optional(),
	MODAL_THINKING_URL: z.url().optional(),
	MODAL_FAST_MODEL: z.string().optional(),
	MODAL_THINKING_MODEL: z.string().optional(),

	BEAM_API_KEY: z.string().optional(),
	BEAM_URL: z.url().optional(),
	BEAM_MODEL: z.string().optional(),

	LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
	LOG_FILE: z.string().optional(),
});

type Env = z.infer<typeof env_schema>;

function load_env(): Env {
	const result = env_schema.safeParse(process.env);

	if (!result.success) {
		console.error("Invalid environment variables:");
		console.error(z.treeifyError(result.error));
		process.exit(1);
	}

	return result.data;
}

export const env = load_env();

export type AIProviderType = Env["AI_PROVIDER"];

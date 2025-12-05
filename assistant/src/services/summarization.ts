import { get_memory_store } from "../chroma/index.js";
import { env } from "../config/env.js";
import { create_child_logger } from "../logs/logger.js";
import { SUMMARIZATION_PROMPT_TEMPLATE } from "../prompts/system.js";
import type { RecentMessage } from "../types/memory.js";

const log = create_child_logger("summarization");

const SUMMARIZE_THRESHOLD = 30;
const KEEP_RECENT_COUNT = 10;
const MESSAGES_TO_SUMMARIZE = 20;

export async function check_and_summarize(user_id: string): Promise<void> {
	const store = await get_memory_store();

	const all_messages = await store.get({ userId: user_id });

	const regular_messages = all_messages.filter(
		(m) => m.metadata.type !== "summary",
	);

	if (regular_messages.length < SUMMARIZE_THRESHOLD) {
		log.debug(
			{
				user_id,
				count: regular_messages.length,
				threshold: SUMMARIZE_THRESHOLD,
			},
			"Not enough messages to summarize",
		);
		return;
	}

	log.info(
		{ user_id, count: regular_messages.length },
		"Starting conversation summarization",
	);

	const sorted_messages = regular_messages
		.map((r) => ({
			id: r.id,
			content: r.content,
			role: (r.metadata.role as string) || "usuario",
			timestamp: (r.metadata.timestamp as number) || 0,
		}))
		.sort((a, b) => a.timestamp - b.timestamp);

	const messages_to_summarize = sorted_messages.slice(0, MESSAGES_TO_SUMMARIZE);
	const messages_to_keep = sorted_messages.slice(MESSAGES_TO_SUMMARIZE);

	const conversation_text = messages_to_summarize
		.map(
			(m) => `${m.role === "usuario" ? "Usuario" : "Asistente"}: ${m.content}`,
		)
		.join("\n\n");

	const summary = await generate_summary(conversation_text);

	if (!summary) {
		log.error({ user_id }, "Failed to generate summary");
		return;
	}

	const ids_to_delete = messages_to_summarize.map((m) => m.id);
	await store.delete(ids_to_delete);

	log.debug({ user_id, deleted: ids_to_delete.length }, "Deleted old messages");

	const summary_id = `summary_${user_id}_${Date.now()}`;
	await store.add([
		{
			id: summary_id,
			content: summary,
			metadata: {
				userId: user_id,
				type: "summary",
				timestamp: Date.now(),
				messages_summarized: messages_to_summarize.length,
			},
		},
	]);

	log.info(
		{
			user_id,
			summarized: messages_to_summarize.length,
			remaining: messages_to_keep.length,
		},
		"Conversation summarized successfully",
	);
}

async function generate_summary(conversation: string): Promise<string | null> {
	const prompt = SUMMARIZATION_PROMPT_TEMPLATE.replace(
		"{conversation}",
		conversation,
	);

	try {
		const response = await fetch(`${env.OLLAMA_URL}/api/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: env.OLLAMA_MODEL,
				prompt: `${prompt}\n\n/no_think`,
				stream: false,
			}),
		});

		if (!response.ok) {
			log.error({ status: response.status }, "Ollama summarization failed");
			return null;
		}

		const data = (await response.json()) as { response?: string };
		const summary = data.response?.trim();

		if (!summary) {
			log.warn("Empty summary response from Ollama");
			return null;
		}

		log.debug({ length: summary.length }, "Summary generated");
		return summary;
	} catch (error) {
		log.error({ error }, "Error generating summary");
		return null;
	}
}

export async function get_conversation_summaries(
	user_id: string,
): Promise<Array<{ summary: string; created_at: string }>> {
	const store = await get_memory_store();

	const results = await store.get({ userId: user_id });

	const summaries = results
		.filter((r) => r.metadata.type === "summary")
		.map((r) => ({
			summary: r.content,
			timestamp: (r.metadata.timestamp as number) || 0,
			created_at: new Date(
				(r.metadata.timestamp as number) || 0,
			).toLocaleDateString("es-ES", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}),
		}))
		.sort((a, b) => a.timestamp - b.timestamp);

	return summaries;
}

export async function get_memory_context(
	user_id: string,
	query: string,
): Promise<{
	recent: RecentMessage[];
	summaries: string[];
	relevant: string[];
}> {
	const store = await get_memory_store();

	const all_results = await store.get({ userId: user_id });

	const summaries = all_results
		.filter((r) => r.metadata.type === "summary")
		.sort(
			(a, b) =>
				(a.metadata.timestamp as number) - (b.metadata.timestamp as number),
		)
		.map((r) => r.content);

	const regular_messages = all_results
		.filter((r) => r.metadata.type !== "summary")
		.map((r) => ({
			content: r.content,
			role: (r.metadata.role as "usuario" | "asistente") || "usuario",
			timestamp: (r.metadata.timestamp as number) || 0,
		}))
		.sort((a, b) => b.timestamp - a.timestamp)
		.slice(0, KEEP_RECENT_COUNT)
		.reverse();

	const semantic_results = await store.search(query, 5, { userId: user_id });
	const relevant = semantic_results
		.filter((r) => r.metadata.type !== "summary")
		.map((r) => r.content);

	return { recent: regular_messages, summaries, relevant };
}

import { Hono } from "hono";
import { stream } from "hono/streaming";
import { env } from "../config/env.js";
import { create_child_logger } from "../logs/logger.js";
import {
	build_conversation_prompt,
	build_minimal_prompt,
	build_simple_prompt,
	format_memory_results,
	format_places_results,
	format_recent_messages,
	format_stored_favorites,
	format_summaries,
	format_user_interests,
} from "../prompts/index.js";
import { get_provider } from "../providers/index.js";
import {
	get_recent_messages,
	get_user_favorites,
	save_message,
	save_user_favorites,
	search_memory,
} from "../services/memory.js";
import { search_places } from "../services/places.js";
import {
	check_and_summarize,
	get_conversation_summaries,
} from "../services/summarization.js";
import { STREAM_DONE } from "../types/ai.js";
import { prompt_request_schema } from "../types/schemas.js";

const log = create_child_logger("routes:prompt");

export const prompt_route = new Hono();

prompt_route.post("/", async (c) => {
	const body = await c.req.json();
	log.debug(
		{
			body_keys: Object.keys(body),
			userId: body.userId,
			user_id: body.user_id,
		},
		"Raw request body",
	);

	const result = prompt_request_schema.safeParse(body);

	if (!result.success) {
		log.error(
			{
				issues: result.error.issues,
				body_preview: JSON.stringify(body).slice(0, 500),
			},
			"Validation failed",
		);
		return c.json({ error: result.error.issues[0]?.message }, 400);
	}

	const {
		prompt,
		user_id,
		image_base64,
		interests,
		skip_memory,
		provider: req_provider,
		model,
	} = result.data;

	log.info(
		{ user_id, skip_memory, has_image: !!image_base64, req_provider, model },
		"New prompt request",
	);

	log.debug(
		{ user_id, skip_memory, will_save: !skip_memory && !!user_id },
		"Memory settings",
	);

	c.header("Content-Type", "text/event-stream");
	c.header("Cache-Control", "no-cache");
	c.header("Connection", "keep-alive");

	return stream(c, async (s) => {
		try {
			// Build user favorites context
			let favorites_context = "";

			if (interests && Array.isArray(interests) && interests.length > 0) {
				favorites_context = format_user_interests(interests);

				if (user_id) {
					await save_user_favorites(user_id, interests);
				}
			} else if (user_id) {
				const stored_favorites = await get_user_favorites(user_id);
				if (stored_favorites) {
					favorites_context = format_stored_favorites(stored_favorites);
				}
			}

			// Build memory contexts
			let long_term_context = "";
			let short_term_context = "";
			let summaries_context = "";

			if (!skip_memory && user_id) {
				// Get recent conversation history (short-term memory)
				const recent_messages = await get_recent_messages(user_id, 10);
				short_term_context = format_recent_messages(recent_messages);

				// Get semantically relevant past messages (long-term memory)
				const long_memory = await search_memory(user_id, prompt);
				long_term_context = format_memory_results(long_memory);

				// Get conversation summaries (compressed long-term context)
				const summaries = await get_conversation_summaries(user_id);
				summaries_context = format_summaries(summaries);
			}

			// Build places RAG context
			let places_context = "";
			if (!skip_memory) {
				const places_memory = await search_places(prompt);
				places_context = format_places_results(places_memory);
			}

			// Build final prompt using composable builders
			let final_prompt: string;

			if (skip_memory) {
				final_prompt = build_minimal_prompt(prompt);
			} else if (
				favorites_context ||
				places_context ||
				short_term_context ||
				summaries_context
			) {
				final_prompt = build_conversation_prompt({
					user_query: prompt,
					favorites_context: favorites_context || undefined,
					places_context: places_context || undefined,
					short_term_context: short_term_context || undefined,
					long_term_context: long_term_context || undefined,
					summaries_context: summaries_context || undefined,
				});
			} else {
				final_prompt = build_simple_prompt(
					prompt,
					long_term_context || undefined,
				);
			}

			if (!skip_memory && user_id) {
				await save_message(user_id, "usuario", prompt);
			}

			let response_buffer = "";
			const on_data = (chunk: string) => {
				response_buffer += chunk;
				if (
					chunk === "[THINKING_START]" ||
					chunk === "[THINKING_END]" ||
					chunk === "[DONE]"
				) {
					s.write(`data: ${chunk}\n\n`);
				} else {
					const safe_chunk = JSON.stringify(chunk);
					s.write(`data: ${safe_chunk}\n\n`);
				}
			};

			const provider_name = req_provider || env.AI_PROVIDER;
			const provider = get_provider(provider_name);
			const use_thinking = model === "thinking" && provider.stream_thinking;

			log.debug(
				{ provider: provider_name, model, use_thinking },
				"Using provider",
			);

			if (image_base64) {
				// Vision request with image
				if (use_thinking && provider.stream_thinking_with_vision) {
					await provider.stream_thinking_with_vision(
						final_prompt,
						image_base64,
						on_data,
					);
				} else if (provider.stream_with_vision) {
					await provider.stream_with_vision(
						final_prompt,
						image_base64,
						on_data,
					);
				} else {
					throw new Error(`Provider ${provider_name} does not support vision`);
				}
			} else if (use_thinking && provider.stream_thinking) {
				await provider.stream_thinking(final_prompt, on_data);
			} else {
				await provider.stream(final_prompt, on_data);
			}

			// Send [DONE] immediately after streaming completes (before memory operations)
			// This ensures the frontend gets the completion signal even if memory operations fail
			s.write(`data: ${STREAM_DONE}\n\n`);

			if (!skip_memory && user_id) {
				try {
					await save_message(user_id, "asistente", response_buffer);
				} catch (err) {
					log.error(
						{ error: err instanceof Error ? err.message : String(err) },
						"Failed to save message to memory",
					);
				}

				// Check if we need to summarize old messages to prevent token explosion
				check_and_summarize(user_id).catch((err) => {
					log.error(
						{ error: err.message },
						"Failed to check/summarize conversation",
					);
				});
			}

			log.info(
				{
					user_id,
					provider: provider_name,
					model,
					response_length: response_buffer.length,
				},
				"Prompt completed successfully",
			);

			log.debug(
				{
					response_preview: response_buffer
						.replace(/\n/g, " ")
						.replace(/[^\x20-\x7E\u00C0-\u024F]/g, ""), // Remove non-ASCII except accented chars
				},
				"Response preview",
			);
		} catch (error) {
			const err_msg = error instanceof Error ? error.message : String(error);
			const err_stack = error instanceof Error ? error.stack : undefined;
			log.error(
				{ error: err_msg, stack: err_stack },
				"Error processing prompt",
			);
			s.write(`data: {"error": "${err_msg}"}\n\n`);
			s.write(`data: ${STREAM_DONE}\n\n`);
		}
	});
});

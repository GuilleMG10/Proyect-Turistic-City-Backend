export const SECTION_LABELS = {
	FAVORITES: "Información de lugares favoritos del usuario",
	PLACES_RAG: "Lugares disponibles en memoria usando RAG",
	SHORT_TERM: "Historial de conversación reciente",
	LONG_TERM: "Contexto semántico de conversaciones previas",
	SUMMARIES: "Resúmenes de conversaciones anteriores",
	USER_QUERY: "Nueva pregunta del usuario",
	NO_DATA: "(sin datos)",
	NO_PLACES: "(no hay lugares registrados)",
	NO_RECENT: "(sin historial reciente)",
	NO_HISTORY: "(sin historial previo)",
	NO_SUMMARIES: "(sin resúmenes previos)",
} as const;

export interface ConversationPromptData {
	user_query: string;
	favorites_context?: string | undefined;
	places_context?: string | undefined;
	short_term_context?: string | undefined;
	long_term_context?: string | undefined;
	summaries_context?: string | undefined;
}

export function build_section(
	label: string,
	content: string | undefined,
	fallback: string,
): string {
	return `${label}:\n${content || fallback}`;
}

export function build_conversation_prompt(
	data: ConversationPromptData,
): string {
	const sections: string[] = [];

	// Add summaries first as they provide broader context
	if (data.summaries_context) {
		sections.push(
			build_section(
				SECTION_LABELS.SUMMARIES,
				data.summaries_context,
				SECTION_LABELS.NO_SUMMARIES,
			),
		);
	}

	sections.push(
		build_section(
			SECTION_LABELS.FAVORITES,
			data.favorites_context,
			SECTION_LABELS.NO_DATA,
		),
	);

	sections.push(
		build_section(
			SECTION_LABELS.PLACES_RAG,
			data.places_context,
			SECTION_LABELS.NO_PLACES,
		),
	);

	sections.push(
		build_section(
			SECTION_LABELS.SHORT_TERM,
			data.short_term_context,
			SECTION_LABELS.NO_RECENT,
		),
	);

	sections.push(
		build_section(
			SECTION_LABELS.LONG_TERM,
			data.long_term_context,
			SECTION_LABELS.NO_HISTORY,
		),
	);

	sections.push(`${SECTION_LABELS.USER_QUERY}:\n${data.user_query}`);

	return sections.join("\n\n");
}

export function build_minimal_prompt(user_query: string): string {
	return user_query;
}

export function build_simple_prompt(
	user_query: string,
	context?: string | undefined,
): string {
	if (!context) {
		return `Contexto previo:\n${SECTION_LABELS.NO_HISTORY}\n\nNueva pregunta del usuario:\n${user_query}\n\nAsistente:`;
	}
	return `Contexto previo:\n${context}\n\nNueva pregunta del usuario:\n${user_query}\n\nAsistente:`;
}

export function format_recent_messages(
	messages: Array<{ role: "usuario" | "asistente"; content: string }>,
): string {
	if (!messages.length) return "";
	return messages
		.map(
			(m) => `${m.role === "usuario" ? "Usuario" : "Asistente"}: ${m.content}`,
		)
		.join("\n");
}

export function format_memory_results(
	results: Array<{ role: string; content: string }>,
): string {
	if (!results.length) return "";
	return results.map((m) => `${m.role}: ${m.content}`).join("\n");
}

export function format_places_results(
	results: Array<{ content: string }>,
): string {
	if (!results.length) return "";
	return results.map((p) => p.content).join("\n\n");
}

export function format_user_interests(
	interests: Array<{
		name: string;
		description: string;
		category?: string | undefined;
	}>,
): string {
	if (!interests.length) return "";
	return (
		"El usuario ha mostrado interés en los siguientes lugares o eventos:\n" +
		interests
			.map((ev) => {
				const category = ev.category ? ` (categoría: ${ev.category})` : "";
				return `${ev.name}: ${ev.description}${category}`;
			})
			.join("\n")
	);
}

export function format_stored_favorites(favorites_text: string): string {
	return `El usuario tiene los siguientes intereses guardados:\n${favorites_text}`;
}

export function format_summaries(
	summaries: Array<{ summary: string; created_at: string }>,
): string {
	if (!summaries.length) return "";
	return summaries.map((s) => `[${s.created_at}] ${s.summary}`).join("\n\n");
}

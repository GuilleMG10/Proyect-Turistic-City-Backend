import { get_favorites_store, get_memory_store } from "../chroma/index.js";
import { create_child_logger } from "../logs/logger.js";
import type {
	MemorySearchResult,
	RecentMessage,
	UserFavorite,
} from "../types/memory.js";

const log = create_child_logger("memory");

export async function save_message(
	user_id: string,
	role: "usuario" | "asistente",
	content: string,
): Promise<void> {
	const store = await get_memory_store();

	const timestamp = Date.now();
	const doc_id = `msg_${user_id}_${timestamp}`;

	await store.add([
		{
			id: doc_id,
			content,
			metadata: { userId: user_id, role, timestamp },
		},
	]);

	log.info({ user_id, role, doc_id }, "Message saved to memory");
}

export async function get_recent_messages(
	user_id: string,
	limit = 10,
): Promise<RecentMessage[]> {
	const store = await get_memory_store();

	// Get all messages for this user
	const results = await store.get({ userId: user_id });

	if (!results.length) {
		return [];
	}

	// Map to RecentMessage objects
	const messages: RecentMessage[] = results
		.map((r) => ({
			content: r.content,
			role: (r.metadata.role as "usuario" | "asistente") || "usuario",
			timestamp: (r.metadata.timestamp as number) || 0,
		}))
		.filter((m) => m.content);

	// Sort by timestamp descending, take last N, then reverse for chronological order
	const recent = messages
		.sort((a, b) => b.timestamp - a.timestamp)
		.slice(0, limit)
		.reverse();

	log.debug({ user_id, count: recent.length }, "Retrieved recent messages");

	return recent;
}

export async function search_memory(
	user_id: string,
	query: string,
	top_k = 10,
): Promise<MemorySearchResult[]> {
	const store = await get_memory_store();

	const results = await store.search(query, top_k, { userId: user_id });

	log.debug({ user_id, count: results.length }, "Memory search completed");

	return results.map((r) => ({
		content: r.content,
		role: (r.metadata.role as string) || "",
	}));
}

export async function save_user_favorites(
	user_id: string,
	favorites: UserFavorite[],
): Promise<void> {
	const store = await get_favorites_store();

	const text_data = favorites
		.map((fav) => {
			const category = fav.category ? ` (categoría: ${fav.category})` : "";
			return `${fav.name}: ${fav.description}${category}`;
		})
		.join("\n");

	const doc_id = `favorites_${user_id}`;

	// Delete existing favorites for this user
	try {
		await store.delete([doc_id]);
	} catch {
		// Ignore if doesn't exist
	}

	await store.add([
		{
			id: doc_id,
			content: text_data,
			metadata: { userId: user_id, type: "favorites" },
		},
	]);

	log.debug({ user_id }, "User favorites saved");
}

export async function get_user_favorites(
	user_id: string,
): Promise<string | null> {
	const store = await get_favorites_store();

	const results = await store.search("favoritos del usuario", 1, {
		userId: user_id,
	});

	if (!results.length || !results[0]?.content) {
		log.debug({ user_id }, "No favorites found");
		return null;
	}

	const favorites_text = results[0].content;
	log.debug({ user_id }, "Favorites retrieved");

	return favorites_text;
}

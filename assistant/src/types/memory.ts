export interface ChatMessage {
	role: "usuario" | "asistente";
	content: string;
}

export interface UserFavorite {
	name: string;
	description: string;
	category?: string | undefined;
}

export interface MemorySearchResult {
	content: string;
	role: string;
}

export interface RecentMessage {
	content: string;
	role: "usuario" | "asistente";
	timestamp: number;
}

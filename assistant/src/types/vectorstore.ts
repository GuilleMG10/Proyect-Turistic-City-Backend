export interface VectorDocument {
	id: string;
	content: string;
	metadata: Record<string, unknown>;
}

export interface VectorSearchResult {
	id: string;
	content: string;
	metadata: Record<string, unknown>;
	score?: number | undefined;
}

export interface VectorFilter {
	[key: string]: string | number | boolean;
}

export interface VectorStore {
	add(documents: VectorDocument[]): Promise<void>;
	search(
		query: string,
		limit?: number,
		filter?: VectorFilter,
	): Promise<VectorSearchResult[]>;
	get(filter: VectorFilter, limit?: number): Promise<VectorSearchResult[]>;
	delete(ids: string[]): Promise<void>;
}

export interface EmbeddingFunction {
	embed(texts: string[]): Promise<number[][]>;
	readonly model: string;
}

export interface VectorStoreFactory {
	get_store(collection: string): Promise<VectorStore>;
}

import { OllamaEmbeddings } from "@langchain/ollama";
import {
	ChromaClient,
	type Collection,
	type EmbeddingFunction,
} from "chromadb";
import { env } from "../config/env.js";
import { create_child_logger } from "../logs/logger.js";
import type {
	VectorDocument,
	VectorFilter,
	VectorSearchResult,
	VectorStore,
	VectorStoreFactory,
} from "../types/vectorstore.js";

const log = create_child_logger("chroma");

let client: ChromaClient | null = null;
let embedding_function: EmbeddingFunction | null = null;

function get_client(): ChromaClient {
	if (!client) {
		const url = new URL(env.CHROMA_URL);
		client = new ChromaClient({
			host: url.hostname,
			port: Number.parseInt(url.port, 10) || 8000,
			ssl: url.protocol === "https:",
		});
		log.info({ url: env.CHROMA_URL }, "ChromaDB client initialized");
	}
	return client;
}

class LangChainEmbeddingAdapter implements EmbeddingFunction {
	private readonly embeddings: OllamaEmbeddings;

	constructor() {
		log.info(
			{ baseUrl: env.OLLAMA_URL, model: env.OLLAMA_EMBEDDING_MODEL },
			"Initializing LangChain Ollama embeddings",
		);
		this.embeddings = new OllamaEmbeddings({
			baseUrl: env.OLLAMA_URL,
			model: env.OLLAMA_EMBEDDING_MODEL,
		});
		log.info(
			{ model: env.OLLAMA_EMBEDDING_MODEL },
			"LangChain Ollama embeddings initialized",
		);
	}

	async generate(texts: string[]): Promise<number[][]> {
		return this.embeddings.embedDocuments(texts);
	}
}

function get_embedding_function(): EmbeddingFunction {
	if (!embedding_function) {
		embedding_function = new LangChainEmbeddingAdapter();
	}
	return embedding_function;
}

export class ChromaVectorStore implements VectorStore {
	constructor(private readonly collection: Collection) {}

	async add(documents: VectorDocument[]): Promise<void> {
		log.debug(
			{ count: documents.length, ids: documents.map((d) => d.id) },
			"Adding documents to collection",
		);
		await this.collection.add({
			ids: documents.map((d) => d.id),
			documents: documents.map((d) => d.content),
			metadatas: documents.map(
				(d) => d.metadata as Record<string, string | number | boolean>,
			),
		});
		log.info({ count: documents.length }, "Documents added to collection");
	}

	async search(
		query: string,
		limit = 10,
		filter?: VectorFilter,
	): Promise<VectorSearchResult[]> {
		const query_options: {
			queryTexts: string[];
			nResults: number;
			where?: Record<string, string | number | boolean>;
		} = {
			queryTexts: [query],
			nResults: limit,
		};

		if (filter) {
			query_options.where = filter as Record<string, string | number | boolean>;
		}

		const results = await this.collection.query(query_options);

		if (!results.documents?.[0]) {
			return [];
		}

		return results.documents[0].map((doc, i) => ({
			id: results.ids[0]?.[i] || "",
			content: doc || "",
			metadata: (results.metadatas?.[0]?.[i] as Record<string, unknown>) || {},
			score: results.distances?.[0]?.[i] ?? undefined,
		}));
	}

	async get(
		filter: VectorFilter,
		limit?: number,
	): Promise<VectorSearchResult[]> {
		const get_options: {
			where: Record<string, string | number | boolean>;
			limit?: number;
			include: ("documents" | "metadatas")[];
		} = {
			where: filter as Record<string, string | number | boolean>,
			include: ["documents", "metadatas"],
		};

		if (limit !== undefined) {
			get_options.limit = limit;
		}

		const results = await this.collection.get(get_options);

		if (!results.documents) {
			return [];
		}

		return results.documents.map((doc, i) => ({
			id: results.ids[i] || "",
			content: doc || "",
			metadata: (results.metadatas?.[i] as Record<string, unknown>) || {},
		}));
	}

	async delete(ids: string[]): Promise<void> {
		await this.collection.delete({ ids });
		log.debug({ count: ids.length }, "Documents deleted from collection");
	}
}

class ChromaVectorStoreFactory implements VectorStoreFactory {
	private readonly stores = new Map<string, ChromaVectorStore>();

	async get_store(collection_name: string): Promise<VectorStore> {
		let store = this.stores.get(collection_name);
		if (store) return store;

		const collection = await get_client().getOrCreateCollection({
			name: collection_name,
			embeddingFunction: get_embedding_function(),
		});

		store = new ChromaVectorStore(collection);
		this.stores.set(collection_name, store);
		log.info({ collection: collection_name }, "Vector store initialized");

		return store;
	}
}

export const vector_store_factory = new ChromaVectorStoreFactory();

export const COLLECTIONS = {
	MEMORY: "chat_memory",
	PLACES: "places_collection",
	FAVORITES: "raw",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export async function get_memory_store(): Promise<VectorStore> {
	return vector_store_factory.get_store(COLLECTIONS.MEMORY);
}

export async function get_places_store(): Promise<VectorStore> {
	return vector_store_factory.get_store(COLLECTIONS.PLACES);
}

export async function get_favorites_store(): Promise<VectorStore> {
	return vector_store_factory.get_store(COLLECTIONS.FAVORITES);
}

import { ChromaClient } from "chromadb";

const client = new ChromaClient();

const args = process.argv.slice(2);
const cmd = args[0];
const collection_arg = args[1];
const extra_arg = args[2];

function get_collection_name(arg: string | undefined): string {
	switch (arg) {
		case "favorites":
			return "raw";
		case "places":
			return "places_collection";
		default:
			return "chat_memory";
	}
}

const collection_name = get_collection_name(collection_arg);

const dummy_embedding = {
	generate: async (texts: string[]) => texts.map(() => []),
};

async function get_collection() {
	return await client.getOrCreateCollection({
		name: collection_name,
		embeddingFunction: dummy_embedding,
	});
}

async function list_all() {
	const coll = await get_collection();
	const results = await coll.get({
		include: ["documents", "metadatas"],
	});

	console.log(`Documents in collection '${collection_name}':`);

	if (!results.ids || results.ids.length === 0) {
		console.log("No documents found.");
		return;
	}

	console.log(`Total: ${results.ids.length} documents\n`);

	results.ids.forEach((id, i) => {
		console.log({
			id,
			document: results.documents?.[i],
			metadata: results.metadatas?.[i],
		});
	});
}

async function delete_by_id(id: string) {
	const coll = await get_collection();
	await coll.delete({ ids: [id] });
	console.log(`Document ${id} deleted from collection '${collection_name}'`);
}

async function delete_by_user_id(user_id: string) {
	const coll = await get_collection();
	await coll.delete({ where: { userId: user_id } });
	console.log(
		`Documents for user ${user_id} deleted from collection '${collection_name}'`,
	);
}

async function delete_all() {
	try {
		await client.deleteCollection({ name: collection_name });
		console.log(`Collection '${collection_name}' deleted completely`);
	} catch (error) {
		const err = error as Error;
		console.error("Error deleting collection:", err.message || error);
	}
}

function print_help() {
	console.log(`
Usage: npx tsx src/chroma/cli.ts <command> [collection] [arg]

Commands:
  list [collection]                List all documents
  delete_by_id [collection] <id>   Delete a document by ID
  delete_by_user [collection] <id> Delete all docs for a user
  delete_all [collection]          Delete entire collection

Collections:
  (default)   chat_memory
  favorites   raw
  places      places_collection

Examples:
  npx tsx src/chroma/cli.ts list
  npx tsx src/chroma/cli.ts list favorites
  npx tsx src/chroma/cli.ts delete_by_user favorites user123
  npx tsx src/chroma/cli.ts delete_all places
`);
}

async function main() {
	switch (cmd) {
		case "list":
			await list_all();
			break;
		case "delete_by_id":
			if (!extra_arg) {
				console.log("Error: ID required");
				return;
			}
			await delete_by_id(extra_arg);
			break;
		case "delete_by_user":
			if (!extra_arg) {
				console.log("Error: User ID required");
				return;
			}
			await delete_by_user_id(extra_arg);
			break;
		case "delete_all":
			await delete_all();
			break;
		default:
			print_help();
	}
}

main().catch(console.error);

import { ChromaClient } from "chromadb";

const client = new ChromaClient();

const [,, cmd, collectionArg, arg] = process.argv;

let collectionName;

switch (collectionArg) {
  case "favorites":
    collectionName = "raw";
    break;
  case "places":
    collectionName = "places_collection";
    break;
  default:
    collectionName = "chat_memory";
}

const dummyEmbedding = {
  generate: async (texts) => texts.map(() => []),
};

//similar al generate de longMemory.js pero este por cada texto solo te retorna un vector vacio y como estamos usando un map
//de cada texto retornaremos un vector de vectores vacios
//a diferencia d elong memory que creaba un embedder con un modelo de hugging face y generabamos el embedding de cada texto
//y lo poniamos en un array

async function getCollection() {
  return await client.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: dummyEmbedding,
  });
}

async function listAll() {
  const coll = await getCollection();
  const results = await coll.get({
    include: ["documents", "metadatas", "embeddings", "uris"]
  });
  //lo de arriba es el metod get, diferente a .query la estructura que trae este metodo get es muy similar
  //a a query solo que solo colecciona ids, metadatas y documents(los textos), embeddings(si lo especificas) y uris(si lo especificas), pero cada uno ya no necesariamentes
  //  es un vector de vectores,
  //son simplemente vectores asi:
  // {
  //   "ids": [
  //     "user123-1758661403678",
  //     "user123-1758661462505"
  //   ],
  //   "documents": [
  //     "Hola, me llamo Ana",
  //     "¡Hola, Ana! Encantado de conocerte. ¿En qué puedo ayudarte?"
  //   ],
  //   "metadatas": [
  //     { "role": "usuario", "sessionId": "user123" },
  //     { "role": "IA", "sessionId": "user123" }
  //   ],
  //   "embeddings": [
  //     [0.0123, -0.0345, 0.0567, ..., 0.0091],   // vector del doc 1
  //     [0.0211, -0.0287, 0.0665, ..., -0.0042]   // vector del doc 2
  //   ],
  //   "uris": []
  // }
  //el metodo get por defecto viene con id, metadata y documents si quisieras ver los embeddings los debes poner en el include
  //pero eso te obliga a poner documents y metadata en el include, id siempre viene en todo por eso no se incluye en include

  console.log(`Documentos guardados en la colección '${collectionName}':`);
  if (!results.ids || results.ids.length === 0) {
    console.log("No hay documentos.");
    return;
  }

  console.log("RESULTS", results)
  console.log(`Total: ${results.ids.length} documentos\n`);

  results.ids.forEach((id, i) => {
    console.log({
      id,
      document: results.documents?.[i],
      metadata: results.metadatas?.[i],
    });
  });
}

async function deleteById(id) {
  const coll = await getCollection();
  await coll.delete({ ids: [id] });
  console.log(`Documento ${id} eliminado de la colección '${collectionName}'`);
}

async function deleteByUserId(userId) {
  const coll = await getCollection();
  await coll.delete({ where: { userId } });
  console.log(`Documentos del usuario ${userId} eliminados de la colección '${collectionName}'`);
}

async function deleteAll() {
  try {
    await client.deleteCollection({ name: collectionName });
    console.log(`Colección '${collectionName}' eliminada completamente`);
  } catch (error) {
    console.error("Error al eliminar la colección:", error.message || error);
  }
}

(async () => {
  switch (cmd) {
    case "list":
      await listAll();
      break;
    case "deleteById":
      if (!arg) return console.log("Debes pasar un ID");
      await deleteById(arg);
      break;
    case "deleteByUserId":
      if (!arg) return console.log("Debes pasar un sessionId");
      await deleteByUserId(arg);
      break;
    case "deleteAll":
      await deleteAll();
      break;
    default:
      console.log(`
Uso: node chromaInterface.js <comando> [coleccion] [arg]

Comandos:
  list [coleccion]                Lista todos los documentos
  deleteById [coleccion] <id>     Elimina un documento por ID
  deleteByUserId [coleccion] <id> Elimina todos los docs de un usuario
  deleteAll [coleccion]           Elimina todo en la colección


Ejemplos:
  node chromaInterface.js list
  node chromaInterface.js list favorites
  node chromaInterface.js deleteByUserId favorites user123
  node chromaInterface.js deleteAll favorites
`);
  }
})();


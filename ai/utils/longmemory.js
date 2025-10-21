import { Chroma } from "@langchain/community/vectorstores/chroma";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";

// Inicializar embeddings
const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-mpnet-base-v2",
});

// Inicializar Chroma
let vectorStore;
async function getVectorStore() {
  if (!vectorStore) {
    vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: "chat_memory",
      url: "http://localhost:8000", // tu servidor Chroma
    });
    //fromExistingCollection obtiene una coleccion ya existente asi como tambien la crea si no existe
    //la primera vez que la crea te advierte algo como:
    //No embedding function configuration found for collection chat_memory2. 'add' and 'query' 
    // will fail unless you provide them embeddings directly.
    //Sin embargo si le indicaste un modelo que embedea asi que no hay problema, ese error de arriba ya no aparecera
    //de nuevo una vez que insertes un documento en la coleccion o hagas una busqueda
    console.log("📦 Colección inicializada en Chroma con LangChain");
  }
  return vectorStore;
}

//Este objeto (store) sabe cómo guardar documentos y cómo buscar documentos por embeddings.


// Guardar mensaje
export const saveMessage = async (userId, role, content) => {
  const store = await getVectorStore();

  await store.addDocuments([
    {
      pageContent: content,
      metadata: { userId, role },
    },
  ]);

  console.log(`💾 Guardado en Chroma (${role}):`, content);
};

// Buscar memoria
export const searchMemory = async (userId, query, topK = 10) => {
  const store = await getVectorStore();

  const results = await store.similaritySearch(query, topK, {
    userId, 
  });

  console.log("RESULTS", results);

//   [
//   Document {
//     pageContent: "Mi canción favorita es 'COQUETA'",
//     metadata: { userId: 'user123', role: 'usuario' },
//     id: '0694d8a0-9f55-11f0-bae3-43d35769ef50'
//   },
//   Document {
//     pageContent: 'Cual es mi nombre?',
//     metadata: { role: 'usuario', userId: 'user123' },
//     id: 'user123-1759382794601'
//   },
//   Document {
//     pageContent: 'Cual es mi nombre?',
//     metadata: { role: 'usuario', userId: 'user123' },
//     id: 'user123-1759383137846'
//   }
// ]

  return results.map(r => ({
    content: r.pageContent,
    role: r.metadata.role,
  }));
};
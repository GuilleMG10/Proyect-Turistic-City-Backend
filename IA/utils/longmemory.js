import { pipeline } from "@xenova/transformers";
import { ChromaClient } from "chromadb";

// Inicializar embeddings locales con all-mpnet-base-v2
let embedder;
async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");
    console.log("🧠 Modelo de embeddings cargado: all-mpnet-base-v2");
  }
  return embedder;
}

// Adaptador para Chroma
const embeddingFunction = {
  generate: async (texts) => {
    const extractor = await getEmbedder();
    const vectors = [];
    for (const text of texts) {
      const output = await extractor(text, { pooling: "mean", normalize: true });
      vectors.push(Array.from(output.data));

    }
    return vectors;
  },
};

//Tensor {
//   type: 'float32',
//   data: Float32Array(768) [0.0123, -0.0345, 0.0567, ...], // 768 números
//   dims: [768]
// }
//TODO LO DE ARRIBA ES OUTPUT
//

// "Los gatos corren."
// → ["Los", "gatos", "cor", "ren", "."]   lO DE AQUI SE LLAMA TOKENS
//CADA TOKEN TIENE UN ID RELACIONADO:
// "Los"   → 1523
// "gatos" → 2098
// "cor"   → 4021
// "ren"   → 1789
// "."     → 9
//a cada ID se le relaciona un embedding:
// 1523 → [0.12, -0.07, 0.33]
// 2098 → [0.08, -0.03, 0.28]
// 4021 → [0.22, -0.10, 0.40]
// 1789 → [0.19, -0.05, 0.31]
// 9    → [0.05, -0.02, 0.10]
//sacamos un promedio de todos los vectores para tener un solo embedding: Promedio = [0.13, -0.05, 0.28]
//y lo normalizamos: sacar la raiz cuadrada de la suma de todos los elementos, ese numero pasara a dividir todos los elementos
//esto con el objetivo de poder realizar busquedas semanticas de forma mas sencilla
const client = new ChromaClient({ path: "http://localhost:8000" });
let collection;

async function initCollection() {
  if (!collection) {
    collection = await client.getOrCreateCollection({
      name: "chat_memory",
      embeddingFunction,
    });
    console.log("📦 Colección inicializada en Chroma:", collection.name);
  }
  return collection;
}
//arriba le estamos asignando un valor a mi variable coleccion
//puede que en realidad ya tenga un valor asignado en tal caso simplemente lo retornamos
//caso contrario lo que haremos sera entrar a la base de datos y buscar la coleccion llamada
//chat_memory si es que existe se lo asignamos a nuestra variable llamada collection, caso contrario
//la creamos dandole un nombre eh indicandole 
// que Para cada documento que guarde o consulta que haga, usa este embeddingFunction para convertir texto en vectores.”

export const saveMessage = async (userId, role, content) => {
  const coll = await initCollection();

  await coll.add({
    ids: [`${userId}-${Date.now()}`],
    metadatas: [{ userId, role }],
    documents: [content],
  });

  console.log(`💾 Guardado en Chroma (${role}):`, content);
};

export const searchMemory = async (userId, query, topK = 10) => {
  const coll = await initCollection();

  const results = await coll.query({
    queryTexts: [query],
    nResults: topK,
    where: { userId },
  });
  //Chroma busca solo en los documentos cuya metadata tenga sessionId
  //recuerda que creaste: ids: [`${sessionId}-${Date.now()}`], ese es el identificador unico del documento
  //no nos ayuda a buscar los documentos de un solo usuario, lo que si nos ayuda es la metadata

  //queryTexts es un vector, en este caso de un solo elemento, pero es un vector porque mi const embeddingFunction  podia recibir varios strings


  console.log("📚 Resultados desde Chroma:", results);

//   {
//   ids: [
//     ["abc123-1695567890123", "abc123-1695567890456"]
//   ],
//   documents: [
//     ["Hola, ¿cómo estás?", "Muy bien, ¿y tú?"]
//   ],
//   metadatas: [
//     [
//       { sessionId: "abc123", role: "user" },
//       { sessionId: "abc123", role: "assistant" }
//     ]
//   ],
//   distances: [
//     [0.08, 0.25]
//   ]
// }
//results se ve como lo de arriba, nota que es un objeto donde tenemos elementos como ids, documents, metadatas, distances y embeddings no siempre vienen , puse distances como ejemplo
//cada uno siempre es un vector que contiene vectores adentro
//ids es un vector que tiene un vector de strings
//documents es lo mismo
//metadata es un vector que tiene un vector de objetos
//distancias es un vector que tiene un vector de numeros
//embeddings seria un vector que tiene un vector con emebddings(y los embeddings son vectores)
//distances es distancia euclidiana, mientras mas cercado a cero significa que el documento relacionado a esa distancia
//se parece mas semanticamente con el query original, mientras mas alejado del cero el documento se parece menos semanticamente hablando del documento original

  if (!results.documents.length || !results.documents[0]) return [];

  return results.documents[0].map(
    (doc, i) => ({
    content: doc,
    role: results.metadatas[0][i].role,
  })
    );
    //esa línea dice que para cada documento en el primer grupo de resultados, se construye un nuevo objeto { content, role }.
    //estariamos retornando un vector de objetos

};

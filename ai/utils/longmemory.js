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
    console.log("Colección inicializada en Chroma con LangChain");
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

let raw;

async function getRawStore() {
  if (!raw) {
    raw = await Chroma.fromExistingCollection(embeddings, {
      collectionName: "raw",
      url: "http://localhost:8000",
    });
    console.log("Colección 'raw' inicializada en Chroma");
  }
  return raw;
}

export const saveUserFavorites = async (userId, favoritesList) => {
  const store = await getRawStore();

  const textData = favoritesList
    .map(fav => {
      const category = fav.category ? ` (categoría: ${fav.category})` : "";
      return `${fav.name}: ${fav.description}${category}`;
    })
    .join("\n");

  // Eliminar cualquier registro anterior del usuario
  await store.delete({ filter: { userId: { $eq: userId } } });


  // Guardar un único documento por usuario
  await store.addDocuments([
    {
      pageContent: textData,
      metadata: { userId, type: "favorites" },
    },
  ]);

  console.log(`Guardado en Chroma (1 registro por usuario: ${userId}):`, textData);
};

export const getUserFavorites = async (userId) => {
  const store = await getRawStore();

  const results = await store.similaritySearch("favoritos del usuario", 1, {
    userId, 
  });

  if (!results || results.length === 0) {
    console.log(`No se encontraron favoritos para el usuario ${userId}`);
    return null;
  }

  const favoritesText = results[0].pageContent;
  console.log(`Favoritos recuperados para ${userId}:`, favoritesText);

  return favoritesText;
};



let placesStore;

async function getPlacesStore() {
  if (!placesStore) {
    placesStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: "places_collection",
      url: "http://localhost:8000",
    });
    console.log("✅ Colección 'places_collection' inicializada en Chroma");
  }
  return placesStore;
}

/**
 * Inserta o actualiza lugares (upsert).
 * Si existe un documento con el mismo name → se elimina y reemplaza.
 */
export const upsertPlaces = async (places) => {
  const store = await getPlacesStore();
  const processed = [];

  for (const place of places) {
    if (!place.name) continue;

    const name = place.name.trim();
    const description = place.description || "Sin descripción";
    const category = place.category || "Categoria no especificada";
    const type = place.type?.toLowerCase() === "evento" ? "evento" : "lugar";
    const atencion = place.atencion || "Horario no especificado";
    const tiempoEstimadoVisita = place.tiempoEstimadoVisita || "Tiempo de visita no especificado";
    const loMasIconicoDelLugar = place.loMasIconicoDelLugar || "No especificado";
    const estimatedPrice = place.estimatedPrice || "Precio estimado no especificado";

    // Construir texto a indexar
    const content = [
      `Nombre: ${name}`,
      `Descripcion: ${description}`,
      `Categoria: ${category}`,
      `Tipo: ${type}`,
      `Atención: ${atencion}`,
      `Tiempo estimado de visita: ${tiempoEstimadoVisita}`,
      `Lo mas iconico del lugar: ${loMasIconicoDelLugar}`,
      `Precio estimado: ${estimatedPrice} Bs`,
    ].join("\n");

    

    // 🧹 Eliminar cualquier registro previo que tenga el mismo nombre
    try {
      await store.delete({ filter: { name: { $eq: name } } });

      console.log(`🧹 Eliminado documento previo de '${name}' (si existía)`);
    } catch (err) {
      console.warn(`⚠️ No se pudo eliminar '${name}' (puede que no existiera):`, err.message);
    }

    // 💾 Insertar nuevo documento (ID automático)
    await store.addDocuments([
      {
        pageContent: content,
        metadata: { name, description, category, type, atencion, tiempoEstimadoVisita, loMasIconicoDelLugar, estimatedPrice},
      },
    ]);

    processed.push({ name, type, status: "upserted" });
  }

  return processed;
};


/**
 * Busca en la colección de lugares (places_collection)
 * Devuelve los lugares más relevantes según el texto de consulta.
 */
export const searchPlacesMemory = async (query, topK = 10) => {
  const store = await getPlacesStore();

  const results = await store.similaritySearch(query, topK);

  console.log("📍 Resultados encontrados en places_collection:");
  if (results.length === 0) {
    console.log("(sin resultados relevantes)");
  } else {
    results.forEach((r, i) => {
      console.log(`[${i + 1}] ${r.metadata.name} (${r.metadata.type})`);
    });
  }

  return results.map(r => ({
    name: r.metadata.name,
    description: r.metadata.description,
    category: r.metadata.category,
    type: r.metadata.type,
    atencion: r.metadata.atencion,
    tiempoEstimadoVisita: r.metadata.tiempoEstimadoVisita,
    loMasIconicoDelLugar: r.metadata.loMasIconicoDelLugar,
    estimatedPrice: r.metadata.estimatedPrice,
    content: r.pageContent,
  }));
};

# Sistema de IA Legacy (JavaScript) - Documentación Técnica

**Última actualización:** Diciembre 2025

> Esta es la implementación **legacy** en JavaScript. 
> Esta documentación se mantiene como referencia.

## Tecnologías Principales

- **Node.js**: Runtime de JavaScript (ES Modules)
- **Express 5**: Framework web para APIs REST
- **Ollama**: Motor de LLM local con modelos qwen3 y llava
- **ChromaDB**: Base de datos vectorial para memoria semántica
- **LangChain Community**: Integración con ChromaDB y embeddings
- **HuggingFace Transformers**: Embeddings locales
- **Multer**: Manejo de archivos subidos (imágenes)
- **OpenAI SDK**: Cliente para proveedores compatibles (Groq, Modal)

## Estructura del Proyecto

```
ai/
├── app.js                   # Punto de entrada del servidor Express
├── backend.js               # Script de pruebas de streaming
├── package.json             # Dependencias (type: module)
├── chromaInterface.js       # Interfaz alternativa de ChromaDB
├── controllers/
│   └── iaController.js      # Controladores principales
├── services/
│   ├── ollamaService.js     # Servicios de LLM (Ollama, Groq, Modal)
│   └── visionService.js     # Servicios de análisis de imágenes
├── routes/
│   └── iaRoutes.js          # Definición de rutas
├── utils/
│   └── longmemory.js        # Sistema de memoria con ChromaDB
├── models/
│   └── promptModel.js       # Modelos de prompts
├── modal/                   # Scripts para Modal (cloud GPU)
└── tests/
    └── memory.test.js       # Tests de memoria
```

## Arquitectura del Sistema

### Flujo de Comunicación

```
Frontend (React)
    ↓ (fetch con JWT)
Backend Go (extrae userID, enriquece contexto)
    ↓ (HTTP POST)
Sistema IA Legacy (Node.js :3000)
    ↓
┌───────────────────────────────────────┐
│  1. Validación básica                 │
│  2. Contexto de intereses del usuario │
│  3. Búsqueda en memoria (ChromaDB)    │
│  4. Búsqueda de lugares (RAG)         │
│  5. Envío a Ollama (streaming)        │
│  6. Guardado en memoria               │
└───────────────────────────────────────┘
    ↓ (SSE streaming)
Frontend
```

## Punto de Entrada (app.js)

```javascript
import express from "express";
import cors from "cors";
import iaRoutes from "./routes/iaRoutes.js";

const app = express();
const PORT = process.env.AI_PORT;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use("/ia", iaRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
```

## Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/ia/prompt` | Chat principal con el asistente |
| POST | `/ia/places` | Registrar/actualizar lugares en RAG |
| POST | `/ia/vision/profile` | Análisis de foto de perfil |
| POST | `/ia/itinerary` | Generación de itinerarios |

### POST /ia/prompt

**Request:**
```json
{
  "prompt": "¿Qué lugares me recomiendas?",
  "userId": 8,
  "interests": [
    { "name": "Festival", "description": "...", "category": "Cultural" }
  ],
  "skipMemory": false,
  "provider": "ollama"
}
```

**Response:** Stream SSE
```
data: "Te recomiendo"
data: " visitar..."
data: [DONE]
```

### POST /ia/places

Registra lugares en la colección de ChromaDB para búsqueda RAG.

**Request:**
```json
{
  "places": [
    {
      "name": "Plaza Principal",
      "description": "Centro histórico de la ciudad",
      "category": "Histórico",
      "type": "lugar",
      "atencion": "24 horas",
      "tiempoEstimadoVisita": "1 hora",
      "loMasIconicoDelLugar": "Fuente colonial",
      "estimatedPrice": "Gratis"
    }
  ]
}
```

### POST /ia/vision/profile

Analiza una imagen de perfil para determinar si es apropiada.

**Request:** (multipart/form-data o JSON)
```json
{
  "imageBase64": "iVBORw0KGgo...",
  "context": "Perfil profesional",
  "provider": "ollama"
}
```

### POST /ia/itinerary

Genera un itinerario optimizado basado en preferencias.

**Request:**
```json
{
  "nearbyPlaces": [{ "name": "Plaza" }],
  "interests": [{ "name": "Cultural" }],
  "placesAlreadySelected": [],
  "budget": 500,
  "scheduleAvailability": "10:00-18:00",
  "maximumItinerarySize": 5
}
```

## Proveedores de IA (ollamaService.js)

### Ollama (Local)

```javascript
export const callOllamaStream = async (prompt, onData) => {
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL,
      prompt: prompt,
    }),
  });
  
  // Filtra tags <think> del modelo
  let started = false;
  for await (const chunk of response.body) {
    const text = json.response;
    if (!started && text.includes("</think>")) {
      started = true;
      onData(text.split("</think>")[1]);
    } else if (started) {
      onData(text);
    }
  }
};
```

### Groq (Cloud)

```javascript
export const callGroqStream = async (prompt, onData) => {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: process.env.GROQ_URL
  });
  
  const stream = await client.chat.completions.create({
    model: process.env.GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    stream: true
  });
  
  for await (const chunk of stream) {
    onData(chunk.choices?.[0]?.delta?.content);
  }
};
```

### Modal (Cloud GPU)

```javascript
export const callModalStream = async (prompt, onData, modelType, imageBase64) => {
  const baseURL = modelType === "thinking" 
    ? process.env.MODAL_THINKING_URL 
    : process.env.MODAL_FAST_URL;
    
  const client = new OpenAI({
    apiKey: process.env.MODAL_API_KEY_AUTH,
    baseURL: `${baseURL}/v1`
  });
  
  // Soporta multimodal (texto + imagen)
  let messageContent = imageBase64 
    ? [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` }}
      ]
    : prompt;
    
  const stream = await client.chat.completions.create({
    model: modelName,
    messages: [{ role: "user", content: messageContent }],
    stream: true
  });
  
  // Maneja marcadores [THINKING_START]/[THINKING_END] para modo razonador
};
```

### Selector de Proveedor

```javascript
export const generateAIResponse = async (prompt, provider, onData, imageBase64) => {
  if (provider === "modal-thinking") return callModalStream(prompt, onData, "thinking", imageBase64);
  if (provider === "modal") return callModalStream(prompt, onData, "instruct", imageBase64);
  if (provider === "ollama") return callOllamaStream(prompt, onData);
  if (provider === "huggingface") return callHuggingFace(prompt);
  if (provider === "groq") return callGroqStream(prompt, onData);
};
```

## Sistema de Memoria (longmemory.js)

### Embeddings con HuggingFace Transformers

```javascript
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";

const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: process.env.EMBEDDING_MODEL,  // Xenova/all-mpnet-base-v2
});
```

### Colecciones en ChromaDB

| Colección | Propósito |
|-----------|-----------|
| `chat_memory` | Historial de conversaciones |
| `raw` | Favoritos e intereses del usuario |
| `places_collection` | Lugares para búsqueda RAG |

### Funciones de Memoria

```javascript
// Guardar mensaje de conversación
export const saveMessage = async (userId, role, content) => {
  const store = await getVectorStore();
  await store.addDocuments([{
    pageContent: content,
    metadata: { userId, role },
  }]);
};

// Búsqueda semántica de memoria
export const searchMemory = async (userId, query, topK = 10) => {
  const store = await getVectorStore();
  const results = await store.similaritySearch(query, topK, { userId });
  return results.map(r => ({
    content: r.pageContent,
    role: r.metadata.role,
  }));
};

// Guardar favoritos del usuario
export const saveUserFavorites = async (userId, favoritesList) => {
  const store = await getRawStore();
  // Elimina favoritos anteriores
  await store.delete({ filter: { userId: { $eq: userId } } });
  // Guarda nuevo documento
  await store.addDocuments([{
    pageContent: textData,
    metadata: { userId, type: "favorites" },
  }]);
};

// Upsert de lugares (para RAG)
export const upsertPlaces = async (places) => {
  const store = await getPlacesStore();
  for (const place of places) {
    // Elimina versión anterior
    await store.delete({ filter: { name: { $eq: place.name } } });
    // Inserta nuevo documento
    await store.addDocuments([{
      pageContent: content,
      metadata: { name, category, type, atencion, ... },
    }]);
  }
};

// Búsqueda de lugares
export const searchPlacesMemory = async (query, topK = 10) => {
  const store = await getPlacesStore();
  return await store.similaritySearch(query, topK);
};
```

## Servicio de Visión (visionService.js)

### LLaVA (Ollama Local)

```javascript
export const analyzeWithLLaVAStream = async (prompt, base64Image, onData) => {
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    body: JSON.stringify({
      model: process.env.OLLAMA_VISION_MODEL,  // llava
      messages: [{
        role: "user",
        content: prompt,
        images: [base64Image],
      }],
      stream: true,
    }),
  });
  
  for await (const chunk of response.body) {
    const text = json.message?.content;
    if (text) onData(text);
  }
};
```

### Modal Multimodal (Cloud)

```javascript
export const analyzeWithModalStream = async (prompt, base64Image, onData, useThinking) => {
  const modelType = useThinking ? "thinking" : "instruct";
  return await callModalVision(prompt, base64Image, onData, modelType);
};
```

### Prompt de Evaluación de Perfil

```javascript
export const buildProfilePrompt = (context = "") => `
Eres un evaluador estricto de fotografías de perfil.
Tu tarea es analizar la imagen y responder:
- "Sí es adecuada como foto de perfil"
- "No es adecuada como foto de perfil"

Criterios:
- Buena iluminación, nitidez, rostro visible
- Fondo neutro o apropiado
- Vestimenta adecuada
- Sin gestos ofensivos ni contenido inapropiado
`;
```

## Controlador de Itinerarios

```javascript
export const generateItinerary = async (req, res) => {
  const { nearbyPlaces, interests, placesAlreadySelected, 
          budget, scheduleAvailability, maximumItinerarySize } = req.body;
  
  // 1. Recopilar lugares sin duplicados
  let collected = [];
  
  for (const place of nearbyPlaces) {
    const results = await searchPlacesMemory(place.name, 1);
    // Agregar si no existe...
  }
  
  // 2. Construir prompt estructurado
  const finalPrompt = `
    Eres un generador de itinerarios. Responde SOLO en JSON.
    
    LUGARES DISPONIBLES (RAG):
    ${placesDetails}
    
    DATOS DEL USUARIO:
    - Presupuesto: ${budget} Bs
    - Horario: ${scheduleAvailability}
    - Máximo lugares: ${maximumItinerarySize}
    
    Devuelve SOLO JSON con estructura:
    {
      "itinerario": [...],
      "resumen": {...}
    }
  `;
  
  // 3. Stream respuesta
  await generateAIResponse(finalPrompt, provider, handleChunk);
};
```

## Variables de Entorno

```env
# Servidor
AI_PORT=3000
FRONTEND_URL=http://localhost:5173

# Ollama
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3
OLLAMA_VISION_MODEL=llava

# ChromaDB
CHROMA_URL=http://localhost:8000

# Embeddings
EMBEDDING_MODEL=Xenova/all-mpnet-base-v2

# Proveedores opcionales
AI_PROVIDER=ollama

# Groq (opcional)
GROQ_API_KEY=
GROQ_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama3-8b-8192

# Modal (opcional)
MODAL_API_KEY_AUTH=
MODAL_FAST_URL=
MODAL_THINKING_URL=
MODAL_FAST_MODEL=
MODAL_THINKING_MODEL=

# HuggingFace (opcional)
HF_TOKEN=
HF_URL=
HF_MODEL=
```

## Comandos de Ejecución

```bash
# Instalar dependencias
npm install

# Producción
npm start

# Tests
npm test
```
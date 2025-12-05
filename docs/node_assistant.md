# Asistente de IA (Node.js/TypeScript) - Documentación Técnica

**Última actualización:** Diciembre 2025

> La carpeta `ai/` contiene una implementación legacy en JavaScript. 
> La carpeta `assistant/` es la implementación moderna en TypeScript que intenta mejorar anterior (eso espero).

## Tecnologías Principales

- **Node.js 22+**: Runtime de JavaScript/TypeScript
- **TypeScript 5.x**: Tipado estático con modo estricto
- **Hono**: Framework web moderno y ligero
- **Ollama**: Motor de LLM local con modelo **qwen3**
- **ChromaDB**: Base de datos vectorial para memoria semántica
- **LangChain Ollama**: Embeddings con modelo **nomic-embed-text**
- **Zod**: Validación de esquemas y variables de entorno
- **Pino**: Sistema de logging estructurado

## Estructura del Proyecto

```
assistant/
├── src/
│   ├── init.ts              # Punto de entrada del servidor
│   ├── config/
│   │   └── env.ts           # Validación de variables de entorno con Zod
│   ├── chroma/
│   │   ├── index.ts         # Exportaciones del módulo
│   │   └── store.ts         # Abstracción de ChromaDB con VectorStore
│   ├── logs/
│   │   └── logger.ts        # Configuración de Pino logger
│   ├── prompts/
│   │   ├── index.ts         # Exportaciones de prompts
│   │   ├── conversation.ts  # Constructores de prompts conversacionales
│   │   ├── itinerary.ts     # Prompts para generación de itinerarios
│   │   ├── system.ts        # Prompts de sistema
│   │   └── vision.ts        # Prompts para análisis de imágenes
│   ├── providers/
│   │   ├── index.ts         # Factory de proveedores
│   │   ├── ollama.ts        # Proveedor Ollama (principal)
│   │   ├── modal.ts         # Proveedor Modal (alternativo)
│   │   └── beam.ts          # Proveedor Beam (alternativo)
│   ├── routes/
│   │   ├── index.ts         # Registro de rutas
│   │   ├── prompt.ts        # POST /ia/prompt - Chat principal
│   │   ├── vision.ts        # POST /ia/vision - Análisis de imágenes
│   │   ├── itinerary.ts     # POST /ia/itinerary - Generación de itinerarios
│   │   ├── places.ts        # POST /ia/places - Agregar lugares a RAG
│   │   ├── capabilities.ts  # GET /ia/capabilities - Capacidades del modelo
│   │   └── health.ts        # GET /health - Health check
│   ├── services/
│   │   ├── memory.ts        # Gestión de memoria conversacional
│   │   ├── places.ts        # Búsqueda RAG de lugares
│   │   └── summarization.ts # Resumen automático de conversaciones
│   └── types/
│       ├── ai.ts            # Tipos de proveedores y callbacks
│       ├── memory.ts        # Tipos de memoria
│       ├── places.ts        # Tipos de lugares
│       ├── schemas.ts       # Esquemas Zod para validación
│       └── vectorstore.ts   # Interfaz abstracta de VectorStore
├── package.json
├── tsconfig.json
└── biome.json               # Configuración de linter/formatter
```

## Arquitectura del Sistema

### Flujo de Comunicación

```
Frontend (React)
    ↓ (fetch con JWT)
Backend Go (extrae userID, obtiene intereses)
    ↓ (HTTP POST con contexto enriquecido)
Asistente IA (Node.js :3500)
    ↓ 
┌───────────────────────────────────────┐
│  1. Validación con Zod               │
│  2. Construcción de contexto:        │
│     - Favoritos del usuario          │
│     - Mensajes recientes (memoria)   │
│     - Búsqueda semántica (RAG)       │
│     - Resúmenes de conversaciones    │
│     - Lugares relevantes             │
│  3. Envío a Ollama (streaming)       │
│  4. Guardado en memoria              │
└───────────────────────────────────────┘
    ↓ (SSE streaming)
Frontend (actualiza UI en tiempo real)
```

## Proveedores de IA

### Ollama (Principal)

```typescript
class OllamaProvider implements AIProvider {
  // Streaming básico (modo rápido)
  async stream(prompt: string, on_data: StreamCallback): Promise<void>
  
  // Streaming con razonamiento visible
  async stream_thinking(prompt: string, on_data: StreamCallback): Promise<void>
  
  // Análisis de imágenes
  async stream_with_vision(prompt: string, image_base64: string, on_data: StreamCallback): Promise<void>
  
  // Capacidades detectadas dinámicamente desde /api/show
  async get_actual_capabilities(): Promise<AIProviderConfig>
}
```

**Detección de Capacidades:**
```typescript
// Consulta a Ollama /api/show para obtener capacidades reales
const response = await fetch(`${base_url}/api/show`, {
  method: "POST",
  body: JSON.stringify({ name: "qwen3" }),
});
// Respuesta: { capabilities: ["completion", "tools", "thinking"] }
```

**Modos de Operación:**

1. **Modo Rápido** (`/api/generate` con `/no_think`):
   - Usa el endpoint de generación directa
   - Agrega `/no_think` al prompt para desactivar razonamiento
   - Respuestas más rápidas

2. **Modo Razonador** (`/api/chat` con `think: true`):
   - Usa el endpoint de chat con sistema de mensajes
   - Activa razonamiento con `think: true`
   - Separa `message.thinking` de `message.content`
   - Envía marcadores `[THINKING_START]` y `[THINKING_END]`

### Proveedores Alternativos

- **Modal**: Proveedor en la nube con modelos DeepSeek
- **Beam**: Proveedor alternativo en la nube

## Endpoints de la API

### POST /ia/prompt
Chat principal con el asistente.

**Request:**
```json
{
  "prompt": "¿Qué lugares me recomiendas?",
  "userId": 8,
  "interests": [{ "name": "Festival Cultural", "description": "...", "category": "Cultural" }],
  "model": "thinking",  // "fast" o "thinking"
  "skipMemory": false   // true para itinerarios
}
```

**Response:** Stream SSE
```
data: "[THINKING_START]"
data: "Analizando la consulta..."
data: "[THINKING_END]"
data: "Te recomiendo visitar..."
data: "[DONE]"
```

### POST /ia/vision
Análisis de imágenes.

**Request:**
```json
{
  "context": "¿Qué ves en esta imagen?",
  "imageBase64": "iVBORw0KGgo..."
}
```

### POST /ia/itinerary
Generación de itinerarios personalizados.

**Request:**
```json
{
  "nearby_places": [{ "name": "Plaza Principal" }],
  "interests": [{ "name": "Cultural" }],
  "budget": 500,
  "schedule_availability": "10:00-18:00",
  "maximum_itinerary_size": 5
}
```

### GET /ia/capabilities
Capacidades del proveedor actual.

**Response:**
```json
{
  "provider": "ollama",
  "model": "qwen3",
  "capabilities": {
    "vision": false,
    "thinking": true
  }
}
```

## Sistema de Memoria

### Arquitectura de Memoria

ChromaDB almacena tres colecciones:

1. **chat_memory**: Mensajes de conversación
2. **places_collection**: Lugares para RAG
3. **raw**: Favoritos e intereses del usuario

### Funciones de Memoria

```typescript
// Guardar mensaje
async function save_message(
  user_id: string, 
  role: "usuario" | "asistente", 
  content: string
): Promise<void>

// Obtener mensajes recientes (memoria a corto plazo)
async function get_recent_messages(
  user_id: string, 
  limit: number
): Promise<RecentMessage[]>

// Búsqueda semántica (memoria a largo plazo)
async function search_memory(
  user_id: string, 
  query: string, 
  top_k: number
): Promise<MemorySearchResult[]>

// Guardar favoritos del usuario
async function save_user_favorites(
  user_id: string, 
  favorites: UserFavorite[]
): Promise<void>
```

### Embeddings con LangChain Ollama

```typescript
class LangChainEmbeddingAdapter implements EmbeddingFunction {
  private readonly embeddings: OllamaEmbeddings;
  
  constructor() {
    this.embeddings = new OllamaEmbeddings({
      baseUrl: env.OLLAMA_URL,
      model: env.OLLAMA_EMBEDDING_MODEL,  // nomic-embed-text
    });
  }
  
  async generate(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts);
  }
}
```

### Resumen Automático de Conversaciones

Para evitar explosión de tokens, el sistema resume conversaciones largas:

```typescript
// Configuración
const SUMMARIZE_THRESHOLD = 30;    // Mensajes antes de resumir
const KEEP_RECENT_COUNT = 10;      // Mensajes recientes a mantener
const MESSAGES_TO_SUMMARIZE = 20;  // Mensajes a comprimir

async function check_and_summarize(user_id: string): Promise<void>
```

**Flujo:**
1. Cuenta mensajes del usuario
2. Si supera umbral (30), toma los 20 más antiguos
3. Genera resumen con Ollama
4. Elimina mensajes originales, guarda resumen
5. Mantiene los 10 mensajes más recientes intactos

## Construcción de Prompts

### Prompt Conversacional Completo

```typescript
build_conversation_prompt({
  user_query: "¿Qué lugares visitar?",
  favorites_context: "Intereses: Festival Cultural, Tour Gastronómico",
  places_context: "Lugares relevantes: Plaza Principal, Museo de Arte",
  short_term_context: "Mensajes recientes: ...",
  long_term_context: "Memoria semántica: ...",
  summaries_context: "Resumen de conversaciones: ...",
});
```

### Prompt de Itinerario

```typescript
build_itinerary_prompt({
  names_nearby: "Plaza Principal, Catedral",
  names_interests: "Cultural, Histórico",
  places_details: "• Plaza Principal\n  - Categoría: Histórico\n  - Horario: 09:00-18:00",
  budget: 500,
  schedule_availability: "10:00-18:00",
  maximum_itinerary_size: 5,
});
```

### Prompt de Sistema para Razonamiento

```typescript
export const SYSTEM_THINKING_SPANISH = `Eres un asistente turístico experto. 
Cuando razones internamente, hazlo SIEMPRE en español.
Estructura tu pensamiento de forma clara y concisa.`;
```

## Validación con Zod

### Variables de Entorno

```typescript
const env_schema = z.object({
  AI_PROVIDER: z.enum(["modal", "beam", "ollama"]),
  AI_PORT: z.coerce.number(),
  FRONTEND_URL: z.url(),
  
  OLLAMA_URL: z.url(),
  OLLAMA_MODEL: z.string(),
  OLLAMA_VISION_MODEL: z.string(),
  OLLAMA_EMBEDDING_MODEL: z.string().default("nomic-embed-text"),
  
  CHROMA_URL: z.url(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
});
```

### Esquema de Request de Prompt

```typescript
export const prompt_request_schema = z
  .object({
    prompt: z.string().min(1, "The 'prompt' field is required."),
    user_id: z.union([z.string(), z.number()]).optional(),
    userId: z.union([z.string(), z.number()]).optional(),
    interests: z.array(z.object({
      name: z.string(),
      description: z.string(),
      category: z.string().optional(),
    })).optional(),
    skip_memory: z.boolean().optional(),
    skipMemory: z.boolean().optional(),  // Alias para Go
    model: z.enum(["fast", "thinking"]).optional().or(z.literal("")),
  })
  .transform((data) => ({
    ...data,
    user_id: data.user_id ?? data.userId,
    skip_memory: data.skip_memory ?? data.skipMemory ?? false,
  }));
```

## Logging con Pino

```typescript
import { create_child_logger } from "../logs/logger.js";

const log = create_child_logger("routes:prompt");

log.info({ user_id, model }, "New prompt request");
log.debug({ context_length }, "Built context");
log.error({ error: err.message }, "Failed to process");
```

**Formato de salida:**
```
[2025-12-05 17:14:33.242 -0400] INFO: New prompt request
    module: "routes:prompt"
    user_id: "8"
    model: "thinking"
```

## Variables de Entorno

```env
# Proveedor de IA
AI_PROVIDER=ollama
AI_PORT=3500
FRONTEND_URL=http://localhost:5173

# Ollama
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3
OLLAMA_VISION_MODEL=qwen3-vl
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# ChromaDB
CHROMA_URL=http://localhost:8000

# Logging
LOG_LEVEL=debug
```

## Comandos de Ejecución

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm start

# Linting
npm run lint

# Formateo
npm run format
```

## Requisitos del Sistema

1. **Node.js 22+** instalado
2. **Ollama** corriendo en localhost:11434
3. **Modelo qwen3** descargado: `ollama pull qwen3`
4. **Modelo nomic-embed-text**: `ollama pull nomic-embed-text`
5. **ChromaDB** corriendo en puerto 8000
6. (Opcional) **Modelo de visión**: `ollama pull qwen3-vl`

## Flujo de Ejecución

### Inicio del Servidor

```typescript
// init.ts
const app = new Hono();

app.use("*", cors({ origin: env.FRONTEND_URL }));
app.route("/health", health_route);
app.route("/ia", ia_routes);

serve({ fetch: app.fetch, port: env.AI_PORT }, (info) => {
  logger.info({ port: info.port }, "Server started");
});
```

### Procesamiento de Prompt

```typescript
// routes/prompt.ts
prompt_route.post("/", async (c) => {
  // 1. Validar request con Zod
  const result = prompt_request_schema.safeParse(body);
  
  // 2. Construir contexto (favoritos, memoria, lugares)
  const favorites_context = format_user_interests(interests);
  const short_term_context = format_recent_messages(recent);
  const places_context = format_places_results(places);
  
  // 3. Construir prompt final
  const final_prompt = build_conversation_prompt({...});
  
  // 4. Guardar pregunta del usuario
  await save_message(user_id, "usuario", prompt);
  
  // 5. Stream respuesta
  if (model === "thinking") {
    await provider.stream_thinking(final_prompt, on_data);
  } else {
    await provider.stream(final_prompt, on_data);
  }
  
  // 6. Enviar [DONE] y guardar respuesta
  s.write(`data: [DONE]\n\n`);
  await save_message(user_id, "asistente", response_buffer);
});
```
## Tecnologías Principales

- **Node.js**: Runtime de JavaScript del lado del servidor (ES Modules)
- **Express**: Framework web para APIs REST
- **Ollama**: Motor de LLM local con modelo **qwen3**
- **ChromaDB**: Base de datos vectorial para memoria a largo plazo (búsqueda semántica)
- **Xenova Transformers**: Embeddings locales con modelo all-mpnet-base-v2
- **CORS**: Middleware para peticiones cross-origin
- **Hugging Face** (opcional): Proveedor alternativo de LLM con DeepSeek-R1

## Estructura del Proyecto

```
ai/
├── app.js                   # Punto de entrada de la aplicación
├── backend.js               # Script de prueba de streaming
├── package.json             # Dependencias y scripts (type: module)
├── controllers/
│   └── iaController.js      # Controlador principal de IA
├── services/
│   └── ollamaService.js     # Servicios Ollama y Hugging Face
├── routes/
│   └── iaRoutes.js          # Definición de rutas (solo /ia/prompt)
├── utils/
│   └── longmemory.js        # Sistema de memoria con ChromaDB y embeddings
└── chromadb/                # Datos de ChromaDB
    └── chroma/
        └── chroma.sqlite3   # Base de datos vectorial local
```

**Nota**: La aplicación usa ES Modules (`"type": "module"` en package.json), por lo que todos los imports usan sintaxis `import/export`.

Dani, revisa esto con cuidado!
si, lo hare ahjdshskadahjka

## Arquitectura del Sistema

### Flujo de Comunicación

```
Frontend (React)
    ↓
Backend Go (JWT + Contexto + Intereses del Usuario)
    ↓
Sistema IA Node.js (construye prompt con contexto)
    ↓
ChromaDB (búsqueda de memoria semántica)
    ↓
Ollama LLM (qwen3)
```

### Componentes Principales

#### 1. Express Server (app.js)
- Puerto: 3000
- CORS configurado para `http://localhost:5173` (frontend)
- Middleware JSON
- Ruta principal: `/ia/prompt`

#### 2. Controlador de IA (iaController.js)
- Recibe prompts del backend Go con:
  - `prompt`: Pregunta del usuario
  - `userId`: ID del usuario desde JWT
  - `interests`: Array de eventos de interés del usuario
- Construye contexto personalizado basado en intereses
- Busca conversaciones previas en ChromaDB
- Construye prompt final con contexto + memoria
- Consulta a Ollama (modelo qwen3)
- Devuelve respuesta en formato streaming (SSE)
- Guarda interacción en ChromaDB para memoria futura

#### 3. Servicio Ollama (ollamaService.js)
- **callOllamaStream**: Streaming con modelo qwen3
  - Filtra tags `<think>` del modelo
  - Envía solo la respuesta final
- **callHuggingFace**: Alternativa con DeepSeek-R1
- **generateAIResponse**: Selector de proveedor

#### 4. Sistema de Memoria (longmemory.js)
- **Embeddings locales**: all-mpnet-base-v2 (768 dimensiones)
- **ChromaDB**: Base de datos vectorial local (puerto 8000)
- **Búsqueda semántica**: Top 10 conversaciones más relevantes
- **Almacenamiento**: Cada mensaje con userId, role (usuario/IA), timestamp

## Endpoint Principal

### POST /ia/prompt

Procesa prompts del usuario y devuelve respuestas del LLM.

#### Request
```json
{
  "prompt": "¿Qué lugares puedo visitar en La Paz?",
  "userId": 8,
  "interests": [
    { "event_id": 5, "event_name": "Festival de Música" },
    { "event_id": 12, "event_name": "Tour Gastronómico" }
  ]
}
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer <token> (validado por backend Go)
```

#### Response
Streaming de texto (Server-Sent Events):
```
data: Basándome 
data: en tus 
data: intereses...
```

## Construcción de Contexto

### Construcción del Contexto del Usuario

El sistema construye contexto desde dos fuentes:

#### 1. Intereses del Usuario (desde Go backend)
```javascript
let userContextText = "";
if (interests && interests.length > 0) {
  const interestNames = interests.map(event => event.name).join(", ");
  userContextText = `El usuario ha mostrado interés en los siguientes eventos: ${interestNames}.`;
}
```

**Ejemplo:**
```
El usuario ha mostrado interés en los siguientes eventos: Festival de Música Andina, Tour Gastronómico por el Centro, Concierto de Rock en Vivo.
```

#### 2. Memoria de Conversaciones (desde ChromaDB)
```javascript
const longMemory = await searchMemory(userId, prompt, 10);
const context = longMemory.map(m => `${m.role}: ${m.content}`).join("\n");
```

**Ejemplo:**
```
usuario: ¿Qué lugares puedo visitar?
IA: Te recomiendo la Plaza Murillo y el Valle de la Luna...
usuario: ¿Hay eventos musicales?
IA: Sí, hay varios conciertos este fin de semana...
```

### Prompt Final Ensamblado

Con intereses:
```javascript
`Información del usuario:
${userContextText}

Contexto de conversaciones previas:
${context}

Nueva pregunta del usuario:
${prompt}

IA (responde considerando las preferencias del usuario):`
```

Sin intereses:
```javascript
`Contexto previo:
${context}

Nueva pregunta del usuario:
${prompt}

IA:`
```

## Integración con Ollama

### Configuración
```javascript
const OLLAMA_API = "http://127.0.0.1:11434/api/generate";
const MODEL = "qwen3";
```

### Request a Ollama
```javascript
{
  model: "qwen3",
  prompt: fullPrompt
  // stream es manejado por el endpoint de Ollama
}
```

### Response Streaming y Filtrado
Ollama (qwen3) devuelve chunks de JSON que pueden incluir razonamiento interno:

**Respuesta cruda de Ollama:**
```json
{"response":"<think>Analizando intereses del usuario...</think>","done":false}
{"response":"Basándome","done":false}
{"response":" en tus","done":false}
{"response":" intereses...","done":false}
{"response":"","done":true}
```

**Filtrado implementado:**
```javascript
let started = false;
// Ignorar todo hasta encontrar </think>
if (!started && text.includes("</think>")) {
  started = true;
  const after = text.split("</think>")[1];
  if (after && after.trim()) onData(after);
} else if (started) {
  if (text.trim()) onData(text);
}
```

**Resultado enviado al cliente:**
```
data: Basándome
data: en tus
data: intereses...
data: [DONE]
```

## Sistema de Memoria

### Sistema de Embeddings Locales

El sistema utiliza **Xenova Transformers** para generar embeddings sin necesidad de servicios externos:

```javascript
import { pipeline } from "@xenova/transformers";

// Modelo: all-mpnet-base-v2 (768 dimensiones)
const embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");
```

**Proceso de embedding:**
1. **Tokenización**: Texto → tokens → IDs numéricos
2. **Embedding**: Cada token → vector de 768 dimensiones
3. **Pooling**: Promedio de vectores de todos los tokens
4. **Normalización**: División por norma L2 para comparación eficiente

**Ejemplo:**
```
"Los gatos corren" 
→ Tokens: ["Los", "gatos", "cor", "ren"] 
→ IDs: [1523, 2098, 4021, 1789]
→ Embeddings individuales → Promedio → Normalización
→ Vector final [0.13, -0.05, 0.28, ..., 0.41] (768 dims)
```

### Memoria con ChromaDB (longmemory.js)

ChromaDB almacena conversaciones con búsqueda semántica:

```javascript
const embeddingFunction = {
  generate: async (texts) => {
    const extractor = await getEmbedder();
    const vectors = [];
    for (const text of texts) {
      const output = await extractor(text, { 
        pooling: "mean", 
        normalize: true 
      });
      vectors.push(Array.from(output.data));
    }
    return vectors;
  }
};

const collection = await client.getOrCreateCollection({
  name: "chat_memory",
  embeddingFunction: embeddingFunction
});
```

### Funciones Principales

#### saveMessage(userId, role, content)
Guarda un mensaje en ChromaDB:
```javascript
await collection.add({
  ids: [`${userId}-${Date.now()}`],
  metadatas: [{ userId, role }], // role: "usuario" o "IA"
  documents: [content]
});
```

#### searchMemory(userId, query, topK = 10)
Busca conversaciones relevantes por similitud semántica:
```javascript
const results = await collection.query({
  queryTexts: [query],    // Convertido a embedding automáticamente
  nResults: topK,         // Top 10 más similares
  where: { userId }       // Solo del usuario actual
});

// Retorna: [{ content: "...", role: "usuario" }, ...]
```

**Resultado de ChromaDB:**
```javascript
{
  ids: [["userId-timestamp1", "userId-timestamp2"]],
  documents: [["¿Qué lugares visitar?", "Te recomiendo..."]],
  metadatas: [[
    { userId: 8, role: "usuario" },
    { userId: 8, role: "IA" }
  ]],
  distances: [[0.08, 0.25]] // Distancia euclidiana (menor = más similar)
}
```

## ChromaDB - Base de Datos Vectorial

### Configuración
```javascript
import { ChromaClient } from "chromadb";

const client = new ChromaClient({ 
  host: "localhost",
  port: 8000
});

const collection = await client.getOrCreateCollection({
  name: "chat_memory",
  embeddingFunction: embeddingFunction // all-mpnet-base-v2
});
```

### Estructura de Datos Almacenados
```javascript
{
  ids: ["8-1728912345678"], // userId-timestamp
  documents: ["¿Qué lugares puedo visitar en La Paz?"],
  metadatas: [{
    userId: 8,
    role: "usuario" // o "IA"
  }]
}
```

**Nota:** No se almacenan timestamps explícitos, el timestamp está en el ID.

### Búsqueda Semántica

**Query de ejemplo:**
```javascript
const results = await collection.query({
  queryTexts: ["eventos musicales"], // Convertido a embedding
  nResults: 10,
  where: { userId: 8 } // Filtra por usuario
});
```

**Resultado:**
```javascript
{
  ids: [["8-1728912345", "8-1728912456"]],
  documents: [["¿Hay conciertos?", "Sí, hay varios..."]],
  metadatas: [[
    { userId: 8, role: "usuario" },
    { userId: 8, role: "IA" }
  ]],
  distances: [[0.08, 0.25]] // Similitud semántica (menor = más similar)
}
```

### Casos de Uso
1. **Memoria conversacional** - Recupera contexto de conversaciones previas
2. **Continuidad entre sesiones** - Usuario puede retomar temas días después
3. **Búsqueda por similitud** - "eventos musicales" encuentra "conciertos", "festivales", etc.
4. **Personalización** - Cada usuario tiene su propia historia aislada

## Flujo Completo de una Petición

### 1. Frontend envía prompt
```javascript
fetch('/ia/prompt', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt: "¿Qué lugares visitar?" })
})
```

### 2. Backend Go intercepta
```go
// Extrae userID del JWT
userID := c.GetUint("userID")

// Busca intereses del usuario
interests := repository.FindUserInterests(userID)

// Reenvía a sistema IA
response := http.Post("http://localhost:3000/ia/prompt", payload)
```

### 3. Sistema IA procesa
```javascript
// Recibe payload del backend Go
const { prompt, userId, interests } = req.body;

// Construye contexto de intereses
const interestNames = interests.map(e => e.name).join(", ");
const userContext = `El usuario ha mostrado interés en: ${interestNames}.`;

// Busca memoria semántica
const memory = await searchMemory(userId, prompt, 10);
const memoryContext = memory.map(m => `${m.role}: ${m.content}`).join("\n");

// Construye prompt final
const finalPrompt = `${userContext}\n\n${memoryContext}\n\n${prompt}`;

// Guarda pregunta en memoria
await saveMessage(userId, "usuario", prompt);

// Consulta Ollama con streaming
let responseBuffer = "";
await callOllamaStream(finalPrompt, (chunk) => {
  responseBuffer += chunk;
  res.write(`data: ${chunk}\n\n`); // SSE
});

// Guarda respuesta en memoria
await saveMessage(userId, "IA", responseBuffer);

res.write("data: [DONE]\n\n");
res.end();
```

### 4. Frontend recibe stream
```javascript
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Actualiza UI con chunk
}
```

## Manejo de Errores

### Errores de Conexión con Ollama
```javascript
try {
  const response = await fetch(OLLAMA_API, ...);
  if (!response.ok) {
    throw new Error('Ollama no disponible');
  }
} catch (error) {
  res.status(500).json({ 
    error: 'Error conectando con el modelo de IA' 
  });
}
```

### Errores de Parsing
```javascript
try {
  const data = JSON.parse(chunk);
  res.write(`data: ${data.response}\n\n`);
} catch (error) {
  console.error('Error parsing chunk:', error);
  // Continúa con siguiente chunk
}
```

### Timeout
```javascript
const timeout = setTimeout(() => {
  res.status(504).json({ error: 'Timeout esperando respuesta' });
}, 30000); // 30 segundos
```

## Configuración del Modelo

### Modelo Actual
- **Nombre**: qwen3
- **Proveedor**: Ollama (local)
- **Características**: 
  - Incluye razonamiento interno con tags `<think>`
  - Filtrado automático de pensamientos
  - Solo retorna respuesta final al usuario
- **Capacidad**: Conversaciones y recomendaciones turísticas personalizadas

### Configuración de Ollama
```javascript
{
  model: "qwen3",
  prompt: fullPrompt,
  // Sin parámetros adicionales en la implementación actual
}
```

### Proveedores Alternativos
El sistema soporta dos proveedores:

1. **Ollama** (default): qwen3 local
2. **Hugging Face**: DeepSeek-R1 vía fireworks-ai
   - Requiere `HF_TOKEN` en variables de entorno
   - Modelo: `deepseek-ai/DeepSeek-R1:fireworks-ai`

## Optimizaciones

### 1. Cache de Respuestas
```javascript
const responseCache = new Map();

function getCachedResponse(prompt) {
  const key = hash(prompt);
  return responseCache.get(key);
}
```

### 2. Batch Processing
```javascript
// Procesar múltiples prompts en paralelo
await Promise.all(
  prompts.map(p => ollama.generate(p))
);
```

### 3. Compresión de Contexto
```javascript
function compressContext(interests) {
  // Solo incluir top 5 intereses más recientes
  return interests.slice(-5);
}
```

### 4. Streaming Optimizado
```javascript
// Enviar chunks más grandes
let buffer = '';
response.on('data', chunk => {
  buffer += chunk;
  if (buffer.length > 100) {
    res.write(`data: ${buffer}\n\n`);
    buffer = '';
  }
});
```

## Logging y Debugging

### Logs del Sistema
```javascript
console.log('Received prompt from user:', userId);
console.log('User interests:', interests.length);
console.log('Sending to Ollama:', fullPrompt.substring(0, 100));
console.log('Response complete');
```

### Monitoreo de Performance
```javascript
const startTime = Date.now();
// ... proceso ...
const duration = Date.now() - startTime;
console.log(`⏱Request completed in ${duration}ms`);
```

## Variables de Entorno

### Requeridas
```env
# No hay variables de entorno obligatorias para Ollama
# El sistema funciona con configuración por defecto
```

### Opcionales
```env
HF_TOKEN=tu_token_aqui       # Solo si usas Hugging Face como proveedor
```

### Configuración por Defecto
- **Puerto**: 3000 (hardcoded en app.js)
- **Ollama**: http://127.0.0.1:11434
- **ChromaDB**: localhost:8000
- **Modelo Ollama**: qwen3
- **Modelo Embeddings**: Xenova/all-mpnet-base-v2
- **Memoria ChromaDB**: 10 conversaciones más relevantes

## Despliegue

### Requisitos
1. **Node.js 18+** instalado (para ES Modules nativos)
2. **Ollama** instalado y corriendo en localhost:11434
3. **Modelo qwen3** descargado: `ollama pull qwen3`
4. **ChromaDB** corriendo en puerto 8000
5. Dependencias instaladas: `npm install`

### Instalación
```bash
cd ai
npm install
```

### Ejecución
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

### Verificación

**1. Verificar Ollama:**
```bash
# Ver modelos instalados
ollama list

# Debe mostrar qwen3
```

**2. Verificar ChromaDB:**
```bash
# ChromaDB debe estar corriendo en puerto 8000
curl http://localhost:8000/api/v1/heartbeat
```

**3. Test del endpoint:**
```bash
curl -X POST http://localhost:3000/ia/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hola","userId":1,"interests":[]}'
```

**Respuesta esperada:**
```
data: Hola
data: ,
data: ¿cómo
data: puedo
data: ayudarte
data: ?
data: [DONE]
```

## Seguridad

### Validación de Input
```javascript
if (!prompt || typeof prompt !== 'string') {
  return res.status(400).json({ error: 'Prompt inválido' });
}

if (prompt.length > 1000) {
  return res.status(400).json({ error: 'Prompt muy largo' });
}
```

### Sanitización
```javascript
const sanitizePrompt = (text) => {
  return text
    .replace(/[<>]/g, '') // Remover HTML
    .trim()
    .substring(0, 1000);  // Límite de caracteres
};
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10 // 10 requests por minuto
});

app.use('/ia', limiter);
```

## Mejoras Futuras

### Sistema de IA
1. **Fine-tuning del modelo qwen3** con datos específicos de turismo boliviano
2. **Ajuste de filtrado de `<think>`** - actualmente se descarta todo el razonamiento
3. **Parámetros configurables** - temperature, top_p, max_tokens via variables de entorno
4. **Sistema de feedback** - que usuarios califiquen respuestas para mejorar prompts
5. **Detección de intención** - clasificar preguntas (lugares, eventos, rutas, recomendaciones)
6. **Multi-idioma** - soporte para Quechua, Aymara además de Español

### Memoria
1. **RAG con datos turísticos** - embeddings de lugares, eventos del sistema
2. **Limpieza de memoria** - eliminar conversaciones antiguas o poco relevantes
3. **Resumen de sesiones largas** - comprimir historial cuando supera tokens
4. **Priorización de memoria** - dar más peso a conversaciones recientes
5. **Backup y sincronización** - exportar memoria entre instancias

### Performance
1. **Batch embeddings** - generar embeddings de múltiples textos en paralelo
2. **Cache de embeddings** - reutilizar embeddings de prompts comunes
3. **Lazy loading del modelo** - cargar embeddings solo cuando se necesita
4. **Compresión de memoria** - limitar a top 5 conversaciones más relevantes
5. **Pool de conexiones** a ChromaDB

### Monitoreo y Operaciones
1. **Logging estructurado** - JSON logs para análisis
2. **Métricas de latencia** - tiempo de embedding, búsqueda, generación
3. **Health checks** - verificar Ollama, ChromaDB, embeddings
4. **Rate limiting** por usuario para prevenir abuso
5. **Alertas** si Ollama o ChromaDB caen
6. **Dashboard** - visualizar uso, tokens, latencias

### Seguridad y Privacidad
1. **Encriptación de mensajes** en ChromaDB
2. **Política de retención** - eliminar mensajes después de X días
3. **GDPR compliance** - permitir exportar/eliminar datos del usuario
4. **Sanitización mejorada** - filtrar injection attacks en prompts
5. **Validación de roles** - verificar que userId coincide con token JWT

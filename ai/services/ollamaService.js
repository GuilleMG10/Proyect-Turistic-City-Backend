import dotenv from 'dotenv';
import fetch from "node-fetch";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from "openai";


// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });


export const callOllamaStream = async (prompt, onData) => {
  const ollamaUrl = process.env.OLLAMA_URL;
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL,
      prompt: prompt,
    }),
  });

  if (!response.ok) throw new Error(`Error en Ollama: ${response.statusText}`);

  const decoder = new TextDecoder();
  let buffer = "";
  let started = false;


  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        const text = json.response;

        if (!started) {
          if (text.includes("</think>")) {
            started = true;
            const after = text.split("</think>")[1];
            if (after && after.trim()) onData(after);
          }
        } else {
          if (text.trim()) onData(text);
        }

      } catch (err) {
        console.warn("Error parseando línea:", line);
      }
    }
  }

  // Procesar el último buffer si quedó algo
  if (buffer) {
    try {
      const json = JSON.parse(buffer);
      const text = json.response;
      if (text && text.trim()) {
        onData(text);
      }
    } catch (err) {
      console.warn("Error parseando buffer final:", buffer);
    }
  }
};

export const callHuggingFace = async (prompt) => {
  try {
    const response = await fetch(
      process.env.HF_URL,
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "user", content: prompt },
          ],
          model: process.env.HF_MODEL,
        }),
      }
    );

    if (!response.ok) throw new Error(`Error en Hugging Face: ${response.statusText}`);

    const result = await response.json();
    //     Response {
    //   status: 200,
    //   statusText: "OK",
    //   ok: true,
    //   headers: Headers {
    //     "content-type": "application/json",
    //     "content-length": "64"
    //   },
    //   body: ReadableStream {
    //     // El contenido crudo en texto JSON sería algo como:
    //     '{"nombre":"Jonathan","edad":25,"ciudad":"Cochabamba"}'
    //   },
    //   url: "https://api.ejemplo.com/data"
    // }
    //Nota que el response es un objeto javascript, tiene un body, dentro del body hay un string en formato json
    //el metodo .json extrae este string y lo vuelve un objeto javascript 

    const content = result.choices[0].message.content;
    const index = content.indexOf('</think>');

    let finalText;

    if (index !== -1) {
      finalText = content.slice(index + '</think>'.length).trim();
    } else {
      finalText = content;
    }

    return finalText;

  } catch (error) {
    console.error("Error llamando a Hugging Face:", error);
    throw error;
  }
};

// const client = new OpenAI({
//   apiKey: process.env.GROQ_API_KEY,
//   baseURL: "https://api.groq.com/openai/v1"
// });

export const callGroqStream = async (prompt, onData) => {
  const API_KEY = process.env.GROQ_API_KEY;

  if (!API_KEY) {
    throw new Error("Falta GROQ_API_KEY en .env");
  }

  const client = new OpenAI({
    apiKey: API_KEY,
    baseURL: process.env.GROQ_URL
  });

  try {
    const stream = await client.chat.completions.create({
      model: process.env.GROQ_MODEL, 
      messages: [{ role: "user", content: prompt }],
      stream: true
    });

    // Leer el stream de Groq
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) onData(delta);
    }

  } catch (err) {
    console.error("Error en Groq streaming:", err);
    throw err;
  }
};

export const callModalStream = async (prompt, onData, modelType = "instruct", imageBase64 = null) => {
  // We expect two env vars now, or we derive them.
  // Let's assume the user puts the base URL for instruct in MODAL_FAST_URL
  // and we try to guess the thinking one, or they provide MODAL_THINKING_URL.
  
  let baseURL = process.env.MODAL_FAST_URL; // Default to instruct
  let modelName = process.env.MODAL_FAST_MODEL;

  if (modelType === "thinking") {
    // If user defined a specific URL for thinking, use it
    if (process.env.MODAL_THINKING_URL) {
      baseURL = process.env.MODAL_THINKING_URL;
    } else if (baseURL) {
      // Fallback: try to replace 'serve-multimodal-instruct' with 'serve-multimodal-thinking' in the URL
      baseURL = baseURL.replace("serve-multimodal-instruct", "serve-multimodal-thinking");
    }
    modelName = process.env.MODAL_THINKING_MODEL;
  }

  if (!baseURL) {
    throw new Error("Falta MODAL_FAST_URL (o MODAL_THINKING_URL) en .env");
  }

  // Get Modal API key from environment (supports both MODAL_API_KEY and MODAL_API_KEY_AUTH)
  const modalApiKey = process.env.MODAL_API_KEY || process.env.MODAL_API_KEY_AUTH;
  if (!modalApiKey) {
    throw new Error("Falta MODAL_API_KEY o MODAL_API_KEY_AUTH en .env (debe coincidir con VLLM_API_KEY del servidor Modal)");
  }

  // Append /v1 if missing
  const finalURL = baseURL.endsWith('/v1') ? baseURL : `${baseURL}/v1`;

  console.log(`[MODAL] Conectando a Modal (${modelType}): ${finalURL}`);
  if (imageBase64) {
    console.log(`[IMAGE] Enviando imagen (${Math.round(imageBase64.length / 1024)}KB base64)`);
  }

  const client = new OpenAI({
    apiKey: modalApiKey,
    baseURL: finalURL
  });

  try {
    // Build message content - supports multimodal (text + image)
    let messageContent;
    if (imageBase64) {
      // Multimodal request with image
      // Format: https://platform.openai.com/docs/guides/vision
      messageContent = [
        { type: "text", text: prompt },
        { 
          type: "image_url", 
          image_url: { 
            url: `data:image/jpeg;base64,${imageBase64}` 
          } 
        }
      ];
    } else {
      // Text-only request
      messageContent = prompt;
    }

    // Build messages array with system prompt for better JSON compliance
    const messages = [];
    
    // Add system message for JSON-heavy prompts (like itinerary generation)
    const isJsonRequest = prompt.includes('"items"') || prompt.includes('JSON') || prompt.includes('json');
    if (isJsonRequest && !imageBase64) {
      messages.push({
        role: "system",
        content: "Eres un asistente que responde SOLO en formato JSON válido. No agregues texto antes ni después del JSON. No uses markdown ni bloques de código."
      });
    } else if (modelType === "thinking" && !imageBase64) {
      // System prompt for thinking model - be very explicit about format and brevity
      messages.push({
        role: "system",
        content: `Eres un asistente turístico de Cochabamba, Bolivia.

FORMATO DE RESPUESTA OBLIGATORIO:
1. Primero, piensa BREVEMENTE dentro de <think>...</think> (máximo 3-4 oraciones de análisis)
2. Luego, CIERRA con </think> y da tu respuesta final al usuario

REGLAS ESTRICTAS:
- Tu análisis en <think> debe ser CORTO: identifica qué busca el usuario y decide qué recomendar
- NO repitas el mismo razonamiento. Una vez que tengas la idea, CIERRA </think> y responde
- NO analices múltiples veces la misma información
- La respuesta final debe ser útil, concisa y en español

EJEMPLO DE FORMATO:
<think>
El usuario busca lugares turísticos. Tiene interés en eventos culturales. Recomendaré 3-4 lugares populares de Cochabamba.
</think>

¡Hola! Aquí mis recomendaciones...`
      });
    }
    
    messages.push({ role: "user", content: messageContent });

    const stream = await client.chat.completions.create({
      model: modelName,
      messages: messages,
      stream: true,
      max_tokens: 2000, // Conservative limit to fit within context window
    });

    let thinkingFinished = false;
    let buffer = "";

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        if (modelType === "thinking") {
          buffer += delta;
          
          // Remove <think> tag if present
          if (buffer.includes("<think>")) {
            buffer = buffer.replace(/<think>/g, "");
          }
          
          if (!thinkingFinished) {
            // Check for </think> end tag - this marks the END of thinking
            if (buffer.includes("</think>")) {
              const parts = buffer.split("</think>");
              const thinkingContent = parts[0].trim();
              const responseContent = parts.slice(1).join("").trim();
              
              // Now send ALL the thinking content at once
              if (thinkingContent) {
                onData("[THINKING_START]");
                onData("• Analizando tu pregunta\n");
                onData(thinkingContent);
                onData("\n[THINKING_END]");
              }
              
              thinkingFinished = true;
              buffer = "";
              
              // Send response content (what comes after </think>)
              if (responseContent) {
                onData(responseContent);
              }
            }
            // While waiting for </think>, don't stream anything - just buffer
          } else {
            // After </think>, stream response directly
            onData(delta);
          }
        } else {
          // For instruct/chat, just stream everything
          onData(delta);
        }
      }
    }
    
    // Finalize: handle case where model never closed </think> tag
    if (modelType === "thinking") {
      if (!thinkingFinished && buffer.trim()) {
        // Model never sent </think> - try to extract response from buffer
        console.warn("[MODAL] Stream ended without </think> tag, attempting to extract response");
        
        // Clean up any stray tags
        buffer = buffer.replace(/<\/?think>/g, "");
        
        // Look for patterns that indicate the start of the actual response
        const responsePatterns = [
          /\n\n¡/,           // Response starting with greeting
          /\n\nRecomiendo/i, // Recommendation
          /\n\nAquí/i,       // "Here are..."
          /\n\nEstos/i,      // "These are..."
          /\n\nTe sugiero/i, // Suggestion
          /\n\n\*\*/,        // Bold text start (markdown)
          /\n\n###/,         // Heading start
          /\n\n1\./,         // Numbered list
        ];
        
        let responseStart = -1;
        for (const pattern of responsePatterns) {
          const match = buffer.search(pattern);
          if (match !== -1 && (responseStart === -1 || match < responseStart)) {
            responseStart = match;
          }
        }
        
        if (responseStart !== -1) {
          // Found a response pattern - send thinking then response
          const thinkingContent = buffer.slice(0, responseStart).trim();
          const responseContent = buffer.slice(responseStart).trim();
          
          if (thinkingContent) {
            onData("[THINKING_START]");
            onData("• Analizando tu pregunta\n");
            onData(thinkingContent);
            onData("\n[THINKING_END]");
          }
          
          if (responseContent) {
            onData(responseContent);
          }
        } else {
          // No clear response pattern - send everything as thinking with fallback message
          onData("[THINKING_START]");
          onData("• Analizando tu pregunta\n");
          onData(buffer.trim());
          onData("\n[THINKING_END]");
          // Send a fallback response
          onData("\n\nLo siento, no pude completar mi análisis. ¿Podrías reformular tu pregunta?");
        }
      } else if (!thinkingFinished) {
        // Empty buffer but thinking not finished - just close if needed
        onData("\n\nLo siento, no recibí respuesta del modelo. Por favor intenta de nuevo.");
      }
    }

  } catch (err) {
    console.error(`Error en Modal streaming (${modelType}):`, err);
    throw err;
  }
};

export const generateAIResponse = async (prompt, provider = "ollama", onData, imageBase64 = null) => {
  if (!prompt) throw new Error("El prompt es obligatorio");

  // Support "modal-thinking" as a provider string
  if (provider === "modal-thinking") return await callModalStream(prompt, onData, "thinking", imageBase64);
  if (provider === "modal") return await callModalStream(prompt, onData, "instruct", imageBase64);

  if (provider === "ollama") return await callOllamaStream(prompt, onData);
  if (provider === "huggingface") return await callHuggingFace(prompt);
  if (provider === "groq") return await callGroqStream(prompt, onData);

  throw new Error(`Proveedor desconocido: ${provider}`);
};

/**
 * Convenience function for vision tasks using Modal multimodal models
 * @param {string} prompt - The text prompt describing what to analyze
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {function} onData - Callback for streaming chunks
 * @param {string} modelType - "instruct" for fast, "thinking" for deeper analysis
 */
export const callModalVision = async (prompt, imageBase64, onData, modelType = "instruct") => {
  if (!imageBase64) {
    throw new Error("Se requiere una imagen en base64 para análisis de visión");
  }
  return await callModalStream(prompt, onData, modelType, imageBase64);
};
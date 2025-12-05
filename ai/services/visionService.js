// services/visionService.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fetch from "node-fetch";
import dotenv from 'dotenv';
import { callModalVision } from "./ollamaService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Convierte una imagen (archivo) a base64
 */
export const getBase64Image = (filePath) => {
  const imageBuffer = fs.readFileSync(filePath);
  return imageBuffer.toString("base64");
};

/**
 * Analyze image with Modal multimodal models (Qwen3-VL)
 * Uses cloud GPU for better performance
 */
export const analyzeWithModalStream = async (prompt, base64Image, onData, useThinking = false) => {
  const modelType = useThinking ? "thinking" : "instruct";
  console.log(`[VISION] Analizando imagen con Modal (${modelType})...`);
  
  return await callModalVision(prompt, base64Image, onData, modelType);
};


export const analyzeWithLLaVAStream = async (prompt, base64Image, onData) => {
  const ollamaUrl = process.env.OLLAMA_URL;
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_VISION_MODEL, // o llava:13b / llava:34b según tu instalación
      messages: [
        {
          role: "user",
          content: prompt,
          images: [base64Image],
        },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error en Ollama Vision: ${response.statusText}`);
  }

  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const json = JSON.parse(line);
        const text = json.message?.content;

        if (text && text.trim()) {
          onData(text); // envía cada fragmento al cliente
        }
      } catch (err) {
        console.warn("[WARN] Error parseando linea:", line);
      }
    }
  }

  // procesar el último buffer si queda
  if (buffer) {
    try {
      const json = JSON.parse(buffer);
      const text = json.message?.content;
      if (text && text.trim()) onData(text);
    } catch (err) {
      console.warn("[WARN] Error parseando buffer final:", buffer);
    }
  }
};


export const buildProfilePrompt = (context = "") => `
Eres un evaluador estricto y profesional de fotografías de perfil en redes laborales o académicas.
Tu tarea es analizar la imagen y responder únicamente con una de las siguientes frases:
- "Sí es adecuada como foto de perfil"
- "No es adecuada como foto de perfil"

Considera los siguientes criterios:
- La persona debe mostrarse con buena iluminación, nitidez, rostro visible y postura natural.
- El fondo debe ser neutro o apropiado.
- La vestimenta debe ser adecuada (formal o casual-profesional).
- No debe haber gestos obscenos, signos ofensivos (como mostrar el dedo medio), expresiones vulgares ni contenido sexual, sugestivo o con desnudos parciales o totales.
- No debe haber violencia, consumo de sustancias, ni actitudes que puedan considerarse irrespetuosas.

No des ninguna explicación adicional; limita tu respuesta a una sola frase. 
${context ? `Contexto adicional del usuario: ${context}` : ""}
`;


//336×336 px
//512×512 px
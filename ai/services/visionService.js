// services/visionService.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 🔹 Convierte una imagen (archivo) a base64
 */
export const getBase64Image = (filePath) => {
  const imageBuffer = fs.readFileSync(filePath);
  return imageBuffer.toString("base64");
};


export const analyzeWithLLaVAStream = async (prompt, base64Image, onData) => {
  const response = await fetch("http://127.0.0.1:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llava:7b", // o llava:13b / llava:34b según tu instalación
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
        console.warn("⚠️ Error parseando línea:", line);
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
      console.warn("⚠️ Error parseando buffer final:", buffer);
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
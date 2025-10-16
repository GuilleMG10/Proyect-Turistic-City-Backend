import dotenv from 'dotenv';
import fetch from "node-fetch";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

export const callOllamaStream = async (prompt, onData) => {
  const response = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen3",
      prompt: prompt,
    }),
  });

  if (!response.ok) throw new Error(`Error en Ollama: ${response.statusText}`);

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
        // El modelo qwen3 ya procesa el thinking internamente y no envia las tags, si usamos otro modelo esto volveria, pensar en como hacer esto dinamico
        // Solo enviamos el campo 'response' que es la respuesta final
        const text = json.response;
        if (text && text.trim()) {
          onData(text);
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
      "https://router.huggingface.co/v1/chat/completions",
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
          model: "deepseek-ai/DeepSeek-R1:fireworks-ai",
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

export const generateAIResponse = async (prompt, provider = "ollama", onData) => {
  if (!prompt) throw new Error("El prompt es obligatorio");

  if (provider === "ollama") return await callOllamaStream(prompt, onData);
  if (provider === "huggingface") return await callHuggingFace(prompt);

  throw new Error(`Proveedor desconocido: ${provider}`);
};
import 'dotenv/config';
import fetch from 'node-fetch';

export const callOllama = async (prompt) => {
  try {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "hf.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF:Q4_K_M",
        prompt: prompt,
      }),
    });

    if (!response.ok) throw new Error(`Error en Ollama: ${response.statusText}`);

    const raw = await response.text();
    //Lee todo el cuerpo de la respuesta como texto plano. se ve algo asi:
//     {"model":"hf.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF:Q4_K_M","created_at":"2025-08-29T03:44:44.0423133Z","response":" y","done":false}
// {"model":"hf.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF:Q4_K_M","created_at":"2025-08-29T03:44:44.1922604Z","response":" có","done":false}

    console.log(raw)
    const lines = raw.split("\n").filter(line => line.trim() !== "");

    let fullResponse = "";
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.response) fullResponse += json.response;
      } catch (err) {
        console.warn("No se pudo parsear línea de Ollama:", line);
      }
    }
    return fullResponse;

  } catch (error) {
    console.error("Error llamando a Ollama:", error);
    throw error;
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
    
    const content = result.response.choices[0].message.content;
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




export const generateAIResponse = async (prompt, provider = "ollama") => {
  if (!prompt) throw new Error("El prompt es obligatorio");
  if (provider === "ollama") return await callOllama(prompt);
  if (provider === "huggingface") return await callHuggingFace(prompt);
  throw new Error(`Proveedor desconocido: ${provider}`);
};

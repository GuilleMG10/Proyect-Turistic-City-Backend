// import Prompt from "../models/promptModel.js";
// import { getChatHistory, addMessageToHistory, clearChatHistory } from "../utils/memory.js";
// import { generateAIResponse } from "../services/ollamaService.js";

// export const generateResponse = async (req, res) => {
//   try {
//     const { prompt, sessionId } = req.body;

//     if (!prompt) return res.status(400).json({ error: "El campo 'prompt' es obligatorio" });

//     res.setHeader("Content-Type", "text/event-stream");
//     //esto crea un SSE es decir Es decir, el servidor “empuja” información hacia el navegador o
//     //  aplicación, sin que el cliente tenga que hacer peticiones repetidas.

//     res.setHeader("Cache-Control", "no-cache");
//     //evitamos que la informacion que se esta empujando se guarde en el cache del usuario
//     res.setHeader("Connection", "keep-alive");
//     //necesario para mantener la conexion viva porque estamos enviando varios chunk
//     //sin esta linea solo unos cuatos chunk se envian
//     const history = getChatHistory(sessionId);//aqui estamos recuperando un array de objetos, objetos que se ven asi: { role: "usuario", content: "Hola, me llamo Ana" }

//     // construimos el contexto (chat corto)
//     const context = history.map(m => `${m.role}: ${m.content}`).join("\n");
//     const finalPrompt = context + `\nusuario: ${prompt}\nIA:`;
//     console.log("FINAL PROMPT:", finalPrompt)

//     // guardamos mensaje del usuario
//     addMessageToHistory(sessionId, "usuario", prompt);

//     let responseBuffer = "";



//     const onData = (chunk) => {
//       responseBuffer += chunk;
//       res.write(`data: ${chunk}\n\n`); // envia chunks  si solo pusieramos un salto de linea
//       //el usuario pensaria que le estamos enviando textos con saltos de linea pero al poner dos saltos
//       //le indicamos al usuario que el evento sse termino
//     };

//     await generateAIResponse(finalPrompt, "ollama", onData);

//     addMessageToHistory(sessionId, "IA", responseBuffer);

//     res.write("data: [DONE]\n\n"); // indica fin de la transmisión
//     res.end();
//     //res.end() cierra la conexión HTTP.

//   } catch (error) {
//     console.error("Error en controlador IA:", error);
//     res.status(500).json({ error: "Error en controlador IA" });
//   }
// };

// controllers/iaController.js

import { saveMessage, searchMemory } from "../utils/longmemory.js";
import { generateAIResponse } from "../services/ollamaService.js";

export const generateResponse = async (req, res) => {
  try {
    const { prompt, userId } = req.body;
    if (!prompt) return res.status(400).json({ error: "El campo 'prompt' es obligatorio" });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    console.log("⚡ Nueva petición:");
    console.log("👉 Prompt recibido:", prompt);
    console.log("👉 UserId:", userId);

    // 🔹 Recuperamos memoria a largo plazo (Chroma)
    const longMemory = await searchMemory(userId, prompt);
    console.log("📚 Memoria recuperada desde Chroma:");
    if (longMemory.length === 0) {
      console.log("   (sin resultados relevantes en la memoria)");
    } else {
      longMemory.forEach((m, i) => {
        console.log(`   [${i + 1}] (${m.role}) ${m.content}`);
      });
    }

    // 🔹 Construimos contexto solo con memoria a largo plazo
    const context = longMemory.map(m => `${m.role}: ${m.content}`).join("\n");
    const finalPrompt = `Contexto previo:\n${context}\n\nNueva pregunta del usuario:\n${prompt}\n\nIA:`;


    console.log("🧠 FINAL PROMPT enviado a Ollama:\n", finalPrompt);

    // Guardamos mensaje del usuario
    await saveMessage(userId, "usuario", prompt);
    console.log("💾 Guardado en memoria (usuario)");

    let responseBuffer = "";

    const onData = (chunk) => {
      responseBuffer += chunk;
      res.write(`data: ${chunk}\n\n`);
    };

    await generateAIResponse(finalPrompt, "ollama", onData);

    // Guardamos respuesta de la IA
    await saveMessage(userId, "IA", responseBuffer);
    console.log("💾 Guardado en memoria (IA)");

    res.write("data: [DONE]\n\n");
    res.end();

    console.log("✅ Respuesta final enviada al cliente.");
  } catch (error) {
    console.error("❌ Error en controlador IA:", error);
    res.status(500).json({ error: "Error en controlador IA" });
  }
};


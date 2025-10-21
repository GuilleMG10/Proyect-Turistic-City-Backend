import { saveMessage, searchMemory,saveUserFavorites, getUserFavorites } from "../utils/longmemory.js";
import { generateAIResponse } from "../services/ollamaService.js";


export const generateResponse = async (req, res) => {
  try {
    const { prompt, userId, interests } = req.body;
    if (!prompt) return res.status(400).json({ error: "El campo 'prompt' es obligatorio" });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    console.log("Nueva petición:");
    console.log("Prompt recibido:", prompt);
    console.log("UserID:", userId);
    
    // 🔹 Construir o recuperar contexto de intereses del usuario
    let userContextText = "";

    if (interests && Array.isArray(interests) && interests.length > 0) {
      // Recibimos intereses del backend principal → los usamos y guardamos en Chroma
      const formatted = interests.map(ev => {
        const category = ev.category ? ` (categoría: ${ev.category})` : "";
        return `${ev.name}: ${ev.description}${category}`;
      }).join("\n");

      userContextText = `El usuario ha mostrado interés en los siguientes lugares o eventos:\n${formatted}`;
      
      await saveUserFavorites(userId, interests);
      console.log("💾 Intereses recibidos y guardados en memoria:", userContextText);

    } else {
      // No se recibieron intereses → intentar recuperarlos desde memoria persistente
      const storedFavorites = await getUserFavorites(userId);
      if (storedFavorites) {
        userContextText = `El usuario tiene los siguientes intereses guardados:\n${storedFavorites}`;
        console.log("📚 Intereses recuperados desde Chroma:", storedFavorites);
      } else {
        console.log("⚠️ No se encontraron intereses guardados para este usuario.");
      }
    }




    const longMemory = await searchMemory(userId, prompt);
    console.log("Memoria recuperada desde Chroma:");
    if (longMemory.length === 0) {
      console.log("(sin resultados relevantes en la memoria)");
    } else {
      longMemory.forEach((m, i) => {
        console.log(`[${i + 1}] (${m.role}) ${m.content}`);
      });
    }

    const context = longMemory.map(m => `${m.role}: ${m.content}`).join("\n");
    
    // Build enhanced prompt with user preferences
    let finalPrompt = "";
    if (userContextText) {
      finalPrompt = `Información del usuario:\n${userContextText}\n\nContexto de conversaciones previas:\n${context}\n\nNueva pregunta del usuario:\n${prompt}\n\nIA (responde considerando las preferencias del usuario):`;
    } else {
      finalPrompt = `Contexto previo:\n${context}\n\nNueva pregunta del usuario:\n${prompt}\n\nIA:`;
    }

    console.log("FINAL PROMPT enviado a Ollama:\n", finalPrompt);

    await saveMessage(userId, "usuario", prompt);
    console.log("Guardado en memoria (usuario)");

    let responseBuffer = "";
    const onData = (chunk) => {
      responseBuffer += chunk;
      res.write(`data: ${chunk}\n\n`);
    };

    await generateAIResponse(finalPrompt, "ollama", onData);

    await saveMessage(userId, "IA", responseBuffer);
    console.log("Guardado en memoria (IA)");

    res.write("data: [DONE]\n\n");
    res.end();

    console.log("Respuesta final enviada al cliente.");
  } catch (error) {
    console.error("Error en controlador IA:", error);
    res.status(500).json({ error: "Error en controlador IA" });
  }
};
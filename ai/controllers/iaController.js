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

export const generateItinerary = async (req, res) => {
  try {
    const { userId, schedule, budget, places } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    console.log("🧭 Nueva solicitud de itinerario recibida");
    if (userId) console.log("UserID:", userId);
    if (schedule) console.log("Horario:", schedule);
    if (budget) console.log("Presupuesto:", budget);
    if (places && Array.isArray(places)) console.log("Lugares recibidos:", places.length);

    const formattedPlaces = Array.isArray(places)
      ? places.map(p => {
          const dateRange = p.start && p.end ? ` (desde ${p.start} hasta ${p.end})` : "";
          const category = p.category ? ` (categoría: ${p.category})` : "";
          const estimatedPrice = p.estimatedPrice ? ` (precio estimado: ${p.estimatedPrice} Bs)` : "";
          return `${p.name || "Lugar sin nombre"}: ${p.description || "Sin descripción"}${category}${dateRange}${estimatedPrice}`;
        }).join("\n")
      : "No se proporcionaron lugares.";

    const prompt = `Planificar un itinerario según el siguiente contexto:\nHorario: ${schedule || "No especificado"}\nPresupuesto: ${budget || "No especificado"} Bs\nLugares:\n${formattedPlaces}`;
    if (userId) await saveMessage(userId, "usuario", prompt);
    console.log("💾 Guardado en memoria (usuario itinerario)");

    const longMemory = userId ? await searchMemory(userId, prompt, 2) : [];
    console.log("📚 Memoria recuperada desde Chroma:");
    if (longMemory.length === 0) {
      console.log("(sin resultados relevantes en la memoria)");
    } else {
      longMemory.forEach((m, i) => {
        console.log(`[${i + 1}] (${m.role}) ${m.content}`);
      });
    }

    const context = longMemory.map(m => `${m.role}: ${m.content}`).join("\n");

    const finalPrompt = `
Eres un asistente especializado en planificación personalizada de itinerarios.
Usa los mensajes anteriores que el usuario te envió o tú le enviaste para recordar y mejorar la planificación.

Contexto previo:
${context || "No hay contexto previo disponible."}

Solicitud actual (texto base):
${prompt}

Tarea:
Diseña un itinerario realista en base a la nueva solicitud, optimizado en tiempo y presupuesto.
Incluye horarios aproximados, recomendaciones breves de transporte si aplica y una breve justificación para cada actividad.
Responde en español, de forma clara y organizada.
    `;

    console.log("🧠 Prompt final enviado a Ollama:\n", finalPrompt);

    let responseBuffer = "";
    const onData = (chunk) => {
      responseBuffer += chunk;
      res.write(`data: ${chunk}\n\n`);
    };

    await generateAIResponse(finalPrompt, "ollama", onData);

    if (userId) await saveMessage(userId, "IA", responseBuffer);
    console.log("💾 Guardado en memoria (IA itinerario)");

    res.write("data: [DONE]\n\n");
    res.end();

    console.log("✅ Itinerario transmitido y guardado exitosamente.");
  } catch (error) {
    console.error("❌ Error en generateItinerary:", error);
    res.status(500).json({ error: "Error generando el itinerario." });
  }
};


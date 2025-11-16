import { saveMessage, searchMemory,saveUserFavorites, getUserFavorites, upsertPlaces, searchPlacesMemory } from "../utils/longmemory.js";
import { generateAIResponse } from "../services/ollamaService.js";


export const generateResponse = async (req, res) => {
  try {
    const { prompt, userId, interests } = req.body;
    if (!prompt) return res.status(400).json({ error: "El campo 'prompt' es obligatorio" });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    console.log("🧠 Nueva petición recibida");
    console.log("Prompt:", prompt);
    console.log("UserID:", userId);

    // ============================================================
    // 🔹 1. Recuperar o construir contexto de intereses del usuario
    // ============================================================
    let userContextText = "";

    if (interests && Array.isArray(interests) && interests.length > 0) {
      const formatted = interests.map(ev => {
        const category = ev.category ? `(categoría: ${ev.category})` : "";
        return `${ev.name}: ${ev.description}${category}`;
      }).join("\n");

      userContextText = `El usuario ha mostrado interés en los siguientes lugares o eventos:\n${formatted}`;
      await saveUserFavorites(userId, interests);
      console.log("💾 Intereses recibidos y guardados en memoria.");
    } else {
      const storedFavorites = await getUserFavorites(userId);
      if (storedFavorites) {
        userContextText = `El usuario tiene los siguientes intereses guardados:\n${storedFavorites}`;
        console.log("📚 Intereses recuperados desde memoria persistente.");
      } else {
        console.log("⚠️ No se encontraron intereses guardados para este usuario.");
      }
    }

    // ==============================================
    // 🔹 2. Recuperar memoria larga del usuario
    // ==============================================
    const longMemory = await searchMemory(userId, prompt);
    console.log("📖 Memoria recuperada desde Chroma:", longMemory.length);
    const context = longMemory.map(m => `${m.role}: ${m.content}`).join("\n");

    // ==============================================
    // 🔹 3. Recuperar lugares disponibles desde Chroma
    // ==============================================
    const placesMemory = await searchPlacesMemory(prompt);
    console.log("📍 Lugares relevantes recuperados desde Chroma:", placesMemory.length);

    let placesContext = "";
    if (placesMemory.length > 0) {
      placesContext = placesMemory
        .map(p => {
          return  `Nombre: ${p.name}`,
                  `Descripcion: ${p.description}`,
                  `Categoria: ${p.category}`,
                  `Tipo: ${p.type}`,
                  `Atención: ${atencion}`,
                  `Tiempo estimado de visita: ${p.tiempoEstimadoVisita}`,
                  `Lo mas iconico del lugar: ${p.loMásIconicoDelLugar}`,
                  `Precio estimado: ${p.estimatedPrice} Bs`
        })
        .join("\n");
    }

    // ==============================================
    // 🔹 4. Construir el prompt final enriquecido
    // ==============================================
    let finalPrompt = "";

    if (userContextText || placesContext) {
      finalPrompt = `Información de lugares favoritos del usuario:\n${userContextText || "(sin datos)"}\n\n` +
                    `Lugares disponibles en memoria usando RAG:\n${placesContext || "(no hay lugares registrados)"}\n\n` +
                    `Contexto de conversaciones previas:\n${context || "(sin historial previo)"}\n\n` +
                    `Nueva pregunta del usuario:\n${prompt}\n\n`
    } else {
      finalPrompt = `Contexto previo:\n${context || "(sin historial previo)"}\n\n` +
                    `Nueva pregunta del usuario:\n${prompt}\n\nIA:`;
    }

    console.log("🧩 FINAL PROMPT enviado a Ollama:\n", finalPrompt);

    // ==============================================
    // 🔹 5. Guardar mensaje del usuario
    // ==============================================
    await saveMessage(userId, "usuario", prompt);
    console.log("💾 Guardado en memoria (usuario)");

    // ==============================================
    // 🔹 6. Generar respuesta desde Ollama y transmitir en tiempo real
    // ==============================================
    let responseBuffer = "";
    const onData = (chunk) => {
      responseBuffer += chunk;
      res.write(`data: ${chunk}\n\n`);
    };

    await generateAIResponse(finalPrompt, "ollama", onData);

    // ==============================================
    // 🔹 7. Guardar respuesta de la IA
    // ==============================================
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






export const registerPlaces = async (req, res) => {
  try {
    const { places } = req.body;

    if (!places || !Array.isArray(places) || places.length === 0) {
      return res.status(400).json({ error: "El campo 'places' debe ser un arreglo con al menos un elemento." });
    }

    res.setHeader("Content-Type", "application/json");
    console.log("📍 Nueva solicitud de registro/actualización de lugares recibida");
    console.log("Total lugares:", places.length);

    // Guardar o actualizar lugares en Chroma
    const result = await upsertPlaces(places);

    console.log("💾 Lugares procesados correctamente:", result.length);

    return res.status(200).json({
      message: "Lugares registrados o actualizados correctamente",
      processed: result,
    });
  } catch (error) {
    console.error("❌ Error en registerPlaces:", error);
    return res.status(500).json({ error: "Error registrando o actualizando lugares" });
  }
};



import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { analyzeWithLLaVAStream, getBase64Image, buildProfilePrompt } from "../services/visionService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const evaluateProfilePhoto = async (req, res) => {
  try {
    const { context } = req.body;
    let imageBase64;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (req.file) {
      imageBase64 = req.file.buffer.toString("base64");
    } else if (req.body.imageBase64) {
      imageBase64 = req.body.imageBase64;
    }


    if (!imageBase64) {
      return res.status(400).json({ error: "Debe enviar una imagen en base64 o como archivo." });
    }



//     req.file = {
//   fieldname: "image",
//   originalname: "foto.jpg",
//   encoding: "7bit",
//   mimetype: "image/jpeg",
//   buffer: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 ...>,
//   size: 20342
// }


//tras aplicar toString se vuelve: /9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUQEhIVFhUVFRUVFRUVFRUVFRUWFxUWFxUV
//FhUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lHyYtLS0tLS0tLS0t





    const prompt = buildProfilePrompt(context);
    let fullResponse = "";

    console.log("📷 Streaming desde LLaVA...");
    await analyzeWithLLaVAStream(prompt, imageBase64, (chunk) => {
      fullResponse += chunk;
      res.write(`data: ${chunk}\n\n`);
    });

    res.write("data: [DONE]\n\n");
    res.end();

    console.log("✅ Respuesta completa:", fullResponse);

  } catch (error) {
    console.error("❌ Error evaluando imagen:", error);
    res.status(500).json({ error: "Error procesando la imagen" });
  }
};

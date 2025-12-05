import { saveMessage, searchMemory,saveUserFavorites, getUserFavorites, upsertPlaces, searchPlacesMemory } from "../utils/longmemory.js";
import { generateAIResponse } from "../services/ollamaService.js";

export const generateResponse = async (req, res) => {
  try {
    const { prompt, userId, interests, skipMemory } = req.body;
    if (!prompt) return res.status(400).json({ error: "El campo 'prompt' es obligatorio" });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    console.log("[AI] Nueva peticion recibida");
    console.log("Prompt:", prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')); // Truncate for logging
    console.log("UserID:", userId);
    console.log("Skip Memory:", skipMemory ? 'Yes' : 'No');

    // ============================================================
    // 1. Recuperar o construir contexto de intereses del usuario
    // ============================================================
    let userContextText = "";

    if (interests && Array.isArray(interests) && interests.length > 0) {
      const formatted = interests.map(ev => {
        const category = ev.category ? `(categoría: ${ev.category})` : "";
        return `${ev.name}: ${ev.description}${category}`;
      }).join("\n");

      userContextText = `El usuario ha mostrado interés en los siguientes lugares o eventos:\n${formatted}`;
      await saveUserFavorites(userId, interests);
      console.log("[SAVE] Intereses recibidos y guardados en memoria.");
    } else {
      const storedFavorites = await getUserFavorites(userId);
      if (storedFavorites) {
        userContextText = `El usuario tiene los siguientes intereses guardados:\n${storedFavorites}`;
        console.log("[LOAD] Intereses recuperados desde memoria persistente.");
      } else {
        console.log("[WARN] No se encontraron intereses guardados para este usuario.");
      }
    }

    // ==============================================
    // 2. Recuperar memoria larga del usuario (skip for JSON generation)
    // ==============================================
    let context = "";
    if (!skipMemory) {
      const longMemory = await searchMemory(userId, prompt);
      console.log("[MEMORY] Memoria recuperada desde Chroma:", longMemory.length);
      context = longMemory.map(m => `${m.role}: ${m.content}`).join("\n");
    } else {
      console.log("[SKIP] Omitiendo recuperación de memoria (skipMemory=true)");
    }

    // ==============================================
    // 3. Recuperar lugares disponibles desde Chroma (skip for JSON generation)
    // ==============================================
    let placesMemory = [];
    if (!skipMemory) {
      placesMemory = await searchPlacesMemory(prompt);
      console.log("[PLACES] Lugares relevantes recuperados desde Chroma:", placesMemory.length);
    } else {
      console.log("[SKIP] Omitiendo búsqueda de lugares (skipMemory=true)");
    }

    let placesContext = "";
    if (placesMemory.length > 0) {
      placesContext = placesMemory
      .map(p => {
        return p.content;
      })
      .join("\n\n"); // <-- separación entre lugares
    }

    // ==============================================
    // 4. Construir el prompt final enriquecido
    // ==============================================
    let finalPrompt = "";

    if (skipMemory) {
      // For JSON generation (itineraries), send prompt as-is without context
      finalPrompt = prompt;
      console.log("[PROMPT] Usando prompt sin contexto adicional (skipMemory=true)");
    } else if (userContextText || placesContext) {
      finalPrompt = `Información de lugares favoritos del usuario:\n${userContextText || "(sin datos)"}\n\n` +
                    `Lugares disponibles en memoria usando RAG:\n${placesContext || "(no hay lugares registrados)"}\n\n` +
                    `Contexto de conversaciones previas:\n${context || "(sin historial previo)"}\n\n` +
                    `Nueva pregunta del usuario:\n${prompt}\n\n`
    } else {
      finalPrompt = `Contexto previo:\n${context || "(sin historial previo)"}\n\n` +
                    `Nueva pregunta del usuario:\n${prompt}\n\nIA:`;
    }

    console.log("[PROMPT] FINAL PROMPT enviado a Ollama:\n", finalPrompt.substring(0, 200) + '...');

    // ==============================================
    // 5. Guardar mensaje del usuario (skip for itinerary/JSON generation)
    // ==============================================
    if (!skipMemory) {
      await saveMessage(userId, "usuario", prompt);
      console.log("[SAVE] Guardado en memoria (usuario)");
    } else {
      console.log("[SKIP] No se guarda en memoria (skipMemory=true)");
    };

    // ==============================================
    // 6. Generar respuesta desde Ollama y transmitir en tiempo real
    // ==============================================
    let responseBuffer = "";
    const onData = (chunk) => {
      responseBuffer += chunk;
      // For markers, send as plain text; for content, JSON encode to preserve newlines
      if (chunk === '[THINKING_START]' || chunk === '[THINKING_END]' || chunk === '[DONE]') {
        res.write(`data: ${chunk}\n\n`);
      } else {
        // JSON encode content to preserve newlines safely in SSE
        const safeChunk = JSON.stringify(chunk);
        res.write(`data: ${safeChunk}\n\n`);
      }
    };

    // Determine provider: request body > env var > default 'ollama'
    const provider = req.body.provider || process.env.AI_PROVIDER;
    console.log(`[AI] Usando proveedor IA: ${provider}`);

    await generateAIResponse(finalPrompt, provider, onData);

    // ==============================================
    // 7. Guardar respuesta de la IA (skip for itinerary/JSON generation)
    // ==============================================
    if (!skipMemory) {
      await saveMessage(userId, "IA", responseBuffer);
      console.log("[SAVE] Guardado en memoria (IA)");
    }

    res.write("data: [DONE]\n\n");
    res.end();
    console.log("[OK] Respuesta final enviada al cliente.");

  } catch (error) {
    console.error("[ERROR] Error en controlador IA:", error);
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
    console.log("[PLACES] Nueva solicitud de registro/actualizacion de lugares recibida");
    console.log("Total lugares:", places.length);

    // Guardar o actualizar lugares en Chroma
    const result = await upsertPlaces(places);

    console.log("[SAVE] Lugares procesados correctamente:", result.length);

    return res.status(200).json({
      message: "Lugares registrados o actualizados correctamente",
      processed: result,
    });
  } catch (error) {
    console.error("[ERROR] Error en registerPlaces:", error);
    return res.status(500).json({ error: "Error registrando o actualizando lugares" });
  }
};

import { fileURLToPath } from "url";
import { dirname } from "path";
import { analyzeWithLLaVAStream, analyzeWithModalStream, getBase64Image, buildProfilePrompt } from "../services/visionService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const evaluateProfilePhoto = async (req, res) => {
  try {
    const { context, provider } = req.body;
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

    // Determine vision provider: request body > env var > default 'ollama'
    const visionProvider = provider || process.env.AI_PROVIDER || "ollama";
    const useModal = visionProvider === "modal" || visionProvider === "modal-thinking";
    
    if (useModal) {
      // Use Modal multimodal models (Qwen3-VL)
      const useThinking = visionProvider === "modal-thinking";
      console.log(`[VISION] Streaming desde Modal (${useThinking ? 'thinking' : 'instruct'})...`);
      await analyzeWithModalStream(prompt, imageBase64, (chunk) => {
        fullResponse += chunk;
        res.write(`data: ${chunk}\n\n`);
      }, useThinking);
    } else {
      // Use local Ollama LLaVA
      console.log("[VISION] Streaming desde LLaVA (Ollama local)...");
      await analyzeWithLLaVAStream(prompt, imageBase64, (chunk) => {
        fullResponse += chunk;
        res.write(`data: ${chunk}\n\n`);
      });
    }

    res.write("data: [DONE]\n\n");
    res.end();

    console.log("[OK] Respuesta completa:", fullResponse);

  } catch (error) {
    console.error("[ERROR] Error evaluando imagen:", error);
    res.status(500).json({ error: "Error procesando la imagen" });
  }
};


export const generateItinerary = async (req, res) => {
  try {
    const {
      nearbyPlaces = [],
      interests = [],
      placesAlreadySelected = [],
      budget,
      scheduleAvailability,
      maximumItinerarySize
    } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    console.log("\n==============================");
    console.log("[ITINERARY] NUEVA SOLICITUD DE ITINERARIO");
    console.log("==============================\n");

    // ==========================================================
    // 1. Vector donde juntaremos todos los lugares (sin duplicados)
    // ==========================================================
    let collected = [];

    // ==========================================================
    // 2. Buscar lugares según nearbyPlaces (topK = 1)
    // ==========================================================
    console.log("\n[SEARCH] Buscando lugares (nearbyPlaces)...");

    for (const place of nearbyPlaces) {
      console.log(`[->] Buscando nearby: "${place.name}"`);

      const results = await searchPlacesMemory(place.name, 1);

      if (results.length === 0) {
        console.log(`   [NOT FOUND] No se encontro informacion en Chroma para "${place.name}"`);
      }

      results.forEach(r => {
        if (!collected.some(c => c.name === r.name)) {
          console.log(`   [ADDED] Anadido desde nearbyPlaces: ${r.name}`);
          collected.push(r);
        } else {
          console.log(`   [SKIP] Saltado (duplicado): ${r.name}`);
        }
      });
    }

    // ==========================================================
    // 3. Buscar lugares segun placesAlreadySelected (topK = 1)
    // ==========================================================
    console.log("\n[SEARCH] Buscando lugares (placesAlreadySelected)...");

    for (const place of placesAlreadySelected) {
      console.log(`[->] Buscando seleccionado por usuario: "${place.name}"`);

      const results = await searchPlacesMemory(place.name, 1);

      if (results.length === 0) {
        console.log(`   [NOT FOUND] No se encontro informacion en Chroma para "${place.name}"`);
      }

      results.forEach(r => {
        if (!collected.some(c => c.name === r.name)) {
          console.log(`   [ADDED] Anadido desde placesAlreadySelected: ${r.name}`);
          collected.push(r);
        } else {
          console.log(`   [SKIP] Saltado (duplicado): ${r.name}`);
        }
      });
    }

    // ==========================================================
    // 4. Buscar lugares segun interests (topK flexible)
    // ==========================================================
    const interestTopK = 2;

    console.log(`\n[SEARCH] Buscando lugares (interests) con topK = ${interestTopK}...`);

    for (const place of interests) {
      console.log(`[->] Buscando interes del usuario: "${place.name}"`);

      const results = await searchPlacesMemory(place.name, interestTopK);

      if (results.length === 0) {
        console.log(`   [NOT FOUND] No se encontro informacion en Chroma para "${place.name}"`);
      }

      results.forEach(r => {
        if (!collected.some(c => c.name === r.name)) {
          console.log(`   [ADDED] Anadido desde interests: ${r.name}`);
          collected.push(r);
        } else {
          console.log(`   [SKIP] Saltado (duplicado): ${r.name}`);
        }
      });
    }

    const scheduleResults = await searchPlacesMemory(scheduleAvailability, 5);


    if (scheduleResults.length === 0) {
      console.log(`   [NOT FOUND] No se encontro nada relevante a "${scheduleAvailability}" en memoria`);
    }

    scheduleResults.forEach(r => {
      if (!collected.some(c => c.name === r.name)) {
        console.log(`   [SCHEDULE] Anadido desde scheduleAvailability (embedding): ${r.name}`);
        collected.push(r);
      } else {
        console.log(`   [SKIP] Saltado (duplicado): ${r.name}`);
      }
    });

    console.log("\n[TOTAL] TOTAL de lugares unicos recopilados:", collected.length);
    console.log("[PLACES] Lugares finales:", collected.map(x => x.name));
    console.log("\n------------------------------------------------------\n");

    // ==========================================================
    // 5. Construir el PROMPT final para IA
    // ==========================================================
    const namesNearby = nearbyPlaces.map(p => p.name).join(", ");
    const namesSelected = placesAlreadySelected.map(p => p.name).join(", ");
    const namesInterests = interests.map(p => p.name).join(", ");

    const placesDetails = collected
      .map(p => `• ${p.name}
  - Categoria: ${p.category}
  - Horario: ${p.atencion}
  - Precio estimado: ${p.estimatedPrice}
  - Lo más iconico: ${p.loMasIconicoDelLugar}
  - Tiempo estimado de visita: ${p.tiempoEstimadoVisita}
  `)
      .join("\n\n");



    const finalPrompt = `
Eres un generador de itinerarios. Debes responder exclusivamente en JSON válido.

INSTRUCCIONES OBLIGATORIAS Y ESTRICTAS:
- Tu salida debe ser exclusivamente un JSON válido.
- No debes agregar texto fuera del JSON.
- No debes explicar nada.
- No debes añadir títulos.
- No uses asteriscos, viñetas, markdown, comentarios ni texto adicional.
- Solo devuelve el JSON EXACTO.
- Si quieres explicar algo, hazlo dentro de "notas_adicionales".
- Respeta la disponibilidad horaria del usuario (si un lugar no calza, NO lo incluyas).
- Respeta el presupuesto total del usuario.
- Respeta el límite máximo de lugares.
- Incluye los lugares los lugares obligatorios que el usuario quiere incluir en "placesAlreadySelected" solamente si es posible según horarios.
- Cada lugar tiene un tiempo estimado de visita: puedes igualarlo o reducirlo al crear el itinerario, pero nunca excederlo.

LUGARES CERCANOS:
${namesNearby || "(sin datos)"}

LUGARES OBLIGATORIOS QUE EL USUARIO QUIERE INCLUIR:
${namesSelected || "(sin datos)"}

LUGARES FAVORITOS DEL USUARIO:
${namesInterests || "(sin datos)"}

INFORMACIÓN COMPLETA DE LOS LUGARES DISPONIBLES (RAG):
${placesDetails}

DATOS DEL USUARIO:
- Presupuesto total: ${budget} Bs
- Horario disponible: ${scheduleAvailability}
- Máximo de lugares: ${maximumItinerarySize}


FORMATO ESTRICTO (OBLIGATORIO).
Debes responder EXACTAMENTE con esta estructura JSON, sin agregar ni quitar claves:

\`\`\`json
{
  "itinerario": [
    {
      "lugar": "",
      "dia_sugerido": "",
      "horario_sugerido": "",
      "costo_estimado": "",
      "motivo_eleccion": "",
      "tiempo_estimado_visita": ""
    }
  ],
  "resumen": {
    "presupuesto_total_estimado": "",
    "cantidad_lugares": "",
    "tiempo_total_estimado": "",
    "notas_adicionales": ""
  }
}
\`\`\`

NO ESCRIBAS NINGÚN TEXTO FUERA DEL JSON.

Devuelve SOLO el JSON. Nada más.
`;



    console.log("[PROMPT] PROMPT FINAL PARA ITINERARIO CREADO:\n");
    console.log(finalPrompt)

    // ==========================================================
    // 6. Enviar prompt a IA con streaming SSE
    // ==========================================================
    let buffer = "";
    const handleChunk = (chunk) => {
      buffer += chunk;
      res.write(`data: ${chunk}\n\n`);
    };

    // Determine provider: request body > env var > default 'groq' (keeping groq as default for itinerary if not specified, or maybe ollama?)
    // The user wants to use Modal, so let's allow override.
    // For itineraries, "thinking" models are usually better.
    const defaultProvider = process.env.AI_PROVIDER;
    const provider = req.body.provider || (defaultProvider === "modal" ? "modal-thinking" : defaultProvider);
    
    console.log(`[AI] Generando itinerario con proveedor: ${provider}`);

    await generateAIResponse(finalPrompt, provider, handleChunk);

    res.write("data: [DONE]\n\n");
    res.end();

    console.log("[DEBUG] BUFFER SIN MODIFICAR.\n");
    console.log(buffer)

    // Clean buffer before parsing JSON
    let cleanBuffer = buffer;
    // Remove <think> tags if they leaked through
    if (cleanBuffer.includes("</think>")) {
      cleanBuffer = cleanBuffer.split("</think>")[1];
    }
    // Remove markdown code blocks
    cleanBuffer = cleanBuffer.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const jsonResponse = JSON.parse(cleanBuffer);
      console.log("BUFFER MODIFICADO:", jsonResponse);
    } catch (err) {
      console.log("[WARN] El JSON esta incompleto o mal formado:", err.message);
      console.log("Respuesta cruda:", buffer);
    }

  } catch (err) {
    console.error("[ERROR] Error generando itinerario:", err);
    res.status(500).json({ error: "Error generando itinerario" });
  }
};

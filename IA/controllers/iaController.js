import Prompt from "../models/promptModel.js";
import { generateAIResponse } from "../services/ollamaService.js";

export const generateResponse = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) return res.status(400).json({ error: "El campo 'prompt' es obligatorio" });

    res.setHeader("Content-Type", "text/event-stream");
    //esto crea un SSE es decir Es decir, el servidor “empuja” información hacia el navegador o
    //  aplicación, sin que el cliente tenga que hacer peticiones repetidas.

    res.setHeader("Cache-Control", "no-cache");
    //evitamos que la informacion que se esta empujando se guarde en el cache del usuario
    res.setHeader("Connection", "keep-alive");
    //necesario para mantener la conexion viva porque estamos enviando varios chunk
    //sin esta linea solo unos cuatos chunk se envian

    const onData = (chunk) => {
      res.write(`data: ${chunk}\n\n`); // envia chunks  si solo pusieramos un salto de linea
      //el usuario pensaria que le estamos enviando textos con saltos de linea pero al poner dos saltos
      //le indicamos al usuario que el evento sse termino
    };

    await generateAIResponse(prompt, "ollama", onData);

    res.write("data: [DONE]\n\n"); // indica fin de la transmisión
    res.end();
    //res.end() cierra la conexión HTTP.

  } catch (error) {
    console.error("Error en controlador IA:", error);
    res.status(500).json({ error: "Error en controlador IA" });
  }
};


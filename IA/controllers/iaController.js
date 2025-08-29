import Prompt from "../models/promptModel.js";
import { generateAIResponse } from "../services/ollamaService.js";

export const generateResponse = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "El campo 'prompt' es obligatorio" });
    }
    console.log("Prompt que se enviará a Ollama:", prompt);

    const userPrompt = new Prompt(prompt);

    const aiResponse = await generateAIResponse(userPrompt.text, "ollama");

    res.json({
      input: userPrompt.text,
      response: aiResponse,
    });
  } catch (error) {
    console.error("Error en controlador IA:", error);
    res.status(500).json({ error: "Error en controlador IA" });
  }
};

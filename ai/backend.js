import fetch from "node-fetch"; // Si Node >= 18, puedes usar fetch nativo sin instalar
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

async function enviarPromptStreaming() {
  const prompt = "Dime 10 nombres que empiecen con D";

  try {
    const endpoint = process.env.AI_ENDPOINT;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    console.log("=== Comenzando a recibir chunks ===");

    response.body.on("data", (chunk) => {
      console.log("Chunk recibido:", chunk.toString());
    });

    response.body.on("end", () => {
      console.log("=== Todos los chunks recibidos ===");
    });

  } catch (err) {
    console.error("Error al hacer la petición:", err);
  }
}

enviarPromptStreaming();
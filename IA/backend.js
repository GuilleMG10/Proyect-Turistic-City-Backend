import fetch from "node-fetch"; // Si Node >= 18, puedes usar fetch nativo sin instalar

async function enviarPromptStreaming() {
  const prompt = "Hola, que es el modelo MVC?";

  try {
    const response = await fetch("https://2bef669bf710.ngrok-free.app/ia/prompt", {
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
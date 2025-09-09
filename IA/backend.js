import fetch from "node-fetch"; // Si Node >= 18, puedes usar fetch nativo sin instalar

async function enviarPromptStreaming() {
  const prompt = "Dime 10 nombres que empiecen con D";

  try {
    const response = await fetch("http://localhost:3000/ia/prompt", {
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
import {
  getChatHistory,
  addMessageToHistory,
  clearChatHistory,
} from "../utils/memory.js";

describe("Manejo de la memoria del chat", () => {
  const sessionId = "test-session-123";

  // Limpia el historial antes de cada prueba para asegurar que los tests sean independientes
  beforeEach(() => {
    clearChatHistory(sessionId);
  });

  test("debería crear un historial vacío para una nueva sesión", () => {
    const history = getChatHistory(sessionId);
    expect(history).toEqual([]); // El historial debe ser un array vacío
  });

  test("debería añadir un mensaje al historial correctamente", () => {
    addMessageToHistory(sessionId, "usuario", "Hola");
    const history = getChatHistory(sessionId);
    expect(history).toHaveLength(1); // El historial ahora debe tener 1 mensaje
    expect(history[0]).toEqual({ role: "usuario", content: "Hola" });
  });

  test("no debería exceder el límite de 10 mensajes", () => {
    // Añadimos 11 mensajes
    for (let i = 1; i <= 11; i++) {
      addMessageToHistory(sessionId, "IA", `Mensaje ${i}`);
    }

    const history = getChatHistory(sessionId);
    expect(history).toHaveLength(10); // La longitud debe ser 10 [cite: 40]
    expect(history[0].content).toBe("Mensaje 2"); // El primer mensaje ("Mensaje 1") debe haber sido eliminado [cite: 40]
  });

  test("debería limpiar el historial de una sesión", () => {
    addMessageToHistory(sessionId, "usuario", "Hola");
    clearChatHistory(sessionId);
    const history = getChatHistory(sessionId);
    // Al pedirlo de nuevo, se debe crear uno vacío
    expect(history).toEqual([]);
  });
});
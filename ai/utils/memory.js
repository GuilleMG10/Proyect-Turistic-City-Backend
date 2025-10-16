const chatHistories = new Map();

// chatHistories = {
//   "user123": [
//     { role: "usuario", content: "Hola, me llamo Ana" },
//     { role: "IA", content: "Hola Ana, un gusto conocerte" }
//   ],
//   "user456": [
//     { role: "usuario", content: "Quiero una recomendación de museos" }
//   ]
// }

export const getChatHistory = (sessionId) => {
  if (!chatHistories.has(sessionId)) {
    chatHistories.set(sessionId, []);
  }
  return chatHistories.get(sessionId);
  //esto retorna el valor de esa clave, en este caso un array de objetos
};

export const addMessageToHistory = (sessionId, role, content) => {
  const history = getChatHistory(sessionId);
  history.push({ role, content });

  if (history.length > 10) history.shift();
  //arriba estamos eliminando el objeto de la posicion 10 
};

export const clearChatHistory = (sessionId) => {
  chatHistories.delete(sessionId);
};

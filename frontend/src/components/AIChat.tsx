import React, { useState } from 'react';
import { MessageCircle, Send, X } from "lucide-react";
import { useUserStore } from "../store/userStore";
import ReactMarkdown from 'react-markdown';

type Message = {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function AIChat({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUserStore();

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    if (!user) {
      alert('Debes iniciar sesión para usar el chat');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      type: "ai",
      content: "",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
      // Get token from Zustand store (same as ApiService)
      const userStorage = localStorage.getItem('user-storage');
      let token = null;
      if (userStorage) {
        try {
          const parsed = JSON.parse(userStorage);
          token = parsed.state?.token || null;
        } catch {
          token = null;
        }
      }

      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      // Connect to Go backend which forwards to AI service
      const response = await fetch(`${API_BASE_URL}/ia/prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                setIsLoading(false);
                return;
              }

              if (data.trim()) {
                setMessages(prev =>
                  prev.map(msg => {
                    if (msg.id === aiMessageId) {
                      // Add the new chunk
                      let newContent = msg.content + data;
                      // I think here I can do some better procesing instead of doing it later in the rendering
                      // this would be good for performance, y zzz lo mejorare en el siguiente sprint asdasdadasd no me maten (?
                      newContent = newContent
                        // Fix malformed bold markers (****text -> **text)
                        .replace(/\*{3,}/g, '**')
                        // Headings
                        .replace(/([.!?])\s*###/g, '$1\n\n###')
                        .replace(/###\s*/g, '\n\n### ')
                        .replace(/([.!?])\s*##/g, '$1\n\n##')
                        .replace(/##\s*/g, '\n\n## ')
                        .replace(/([.!?])\s*#/g, '$1\n\n#')
                        // Lists with dashes
                        .replace(/([.!?:])\s*-\s/g, '$1\n- ')
                        .replace(/([a-záéíóúñ])\s*-\s\*\*/gi, '$1\n- **')
                        // Numbered lists - handle both after punctuation and after bold/text
                        .replace(/([.!?:])\s*(\d+)\.\s/g, '$1\n\n$2. ')
                        .replace(/\*\*(\d+)\.\s/g, '**\n\n$1. ')
                        .replace(/([a-záéíóúñ])(\d+)\.\s/gi, '$1\n\n$2. ')
                        .replace(/\.(\d+)\.\s\*\*/g, '.\n\n$1. **')
                        // Fix spacing after punctuation before capital letters or question marks
                        .replace(/\.([A-ZÁÉÍÓÚÑ¿])/g, '. $1')
                        .replace(/!([A-ZÁÉÍÓÚÑ¿])/g, '! $1')
                        .replace(/\?([A-ZÁÉÍÓÚÑ¿])/g, '? $1')
                        // Clean excessive line breaks
                        .replace(/\n{3,}/g, '\n\n');
                      return { ...msg, content: newContent };
                    }
                    return msg;
                  })
                );
              }
            }
          }
        }
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: "No se ha podido conectar con el asistente. Inténtalo de nuevo más tarde." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-t-lg md:rounded-lg w-full max-w-md max-h-[85vh] md:h-[600px] flex flex-col shadow-xl" role="document">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Asistente de inteligencia artificial</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-gray-100"
            aria-label="Cerrar chat"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Messages */}
        <section className="flex-1 overflow-y-auto p-4 space-y-4" aria-label="Mensajes del chat">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>¡Hola! Soy tu asistente turístico.</p>
              <p className="text-sm">Pregúntame sobre lugares para visitar en Cochabamba.</p>
            </div>
          )}

          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${message.type === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                  }`}
              >
                {message.type === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="text-sm prose prose-sm max-w-none 
                    prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-headings:mt-3 prose-headings:mb-2
                    prose-h3:text-base prose-h2:text-lg prose-h1:text-xl
                    prose-p:my-2 prose-p:leading-relaxed dark:prose-p:text-gray-200
                    prose-ul:my-2 prose-ol:my-2 prose-li:my-1 dark:prose-li:text-gray-200
                    prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-semibold">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
                {message.content === "" && message.type === "ai" && isLoading && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        {/* Input */}
        <footer className="p-4 border-t dark:border-gray-700">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pregunta sobre lugares turísticos..."
              className="flex-1 rounded-lg border dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              aria-label="Mensaje a enviar"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Enviar mensaje"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}

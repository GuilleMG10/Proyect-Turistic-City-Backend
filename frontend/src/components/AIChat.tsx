import { useState } from "react";
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

const AI_BACKEND_URL = import.meta.env.VITE_AI_URL || 'http://localhost:3000';

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
      // Connect to Node.js AI backend service
      const response = await fetch(`${AI_BACKEND_URL}/ia/prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          userId: user.id,
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
              const data = line.slice(6); // Remove 'data: ' prefix

              if (data === '[DONE]') {
                setIsLoading(false);
                return;
              }

              if (data.trim()) {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, content: msg.content + data }
                      : msg
                  )
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
            ? { ...msg, content: "¡Oh no! No pude conectar con el asistente. Inténtalo de nuevo más tarde." }
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg w-full max-w-md h-[600px] flex flex-col" role="document">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Asistente AI Turístico</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Cerrar chat"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Messages */}
        <section className="flex-1 overflow-y-auto p-4 space-y-4" aria-label="Mensajes del chat">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
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
                    prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mt-3 prose-headings:mb-2
                    prose-h3:text-base prose-h2:text-lg prose-h1:text-xl
                    prose-p:my-2 prose-p:leading-relaxed
                    prose-ul:my-2 prose-ol:my-2 prose-li:my-1
                    prose-strong:text-gray-900 prose-strong:font-semibold">
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
        <footer className="p-4 border-t">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pregunta sobre lugares turísticos..."
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

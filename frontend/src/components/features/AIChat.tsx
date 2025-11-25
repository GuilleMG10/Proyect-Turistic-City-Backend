import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, Sparkles, User, Paperclip, Zap, Brain, ChevronDown, Plus } from "lucide-react";
import { useUserStore } from "../../store/userStore";
import ReactMarkdown from 'react-markdown';

type Message = {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
};

type ModelType = 'fast' | 'thinking';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function AIChat({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('fast');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const { user } = useUserStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close model menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Handle file attachment logic
      console.log('File selected:', file.name);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setSelectedModel('fast');
  };

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
          model: selectedModel, // Pass selected model to backend
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
                      const newContent = msg.content + data;
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[100] p-0 md:p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl w-full max-w-lg h-[85vh] md:h-[700px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300" role="document">
        {/* Header */}
        <header className="relative bg-gradient-to-r from-cyan-500 to-blue-600 p-4 shrink-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 shadow-inner">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Asistente interactivo</h3>
                <div className="flex items-center gap-1.5 opacity-90">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                  </span>
                  <span className="text-xs font-medium">En línea</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewChat}
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/90 hover:text-white"
                aria-label="Nuevo chat"
                title="Nuevo chat"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/90 hover:text-white"
                aria-label="Cerrar chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <section className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900/50 scroll-smooth" aria-label="Mensajes del chat">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Sparkles className="h-10 w-10 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">¡Hola! Soy tu guía virtual</h4>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                Puedo ayudarte a descubrir lugares increíbles, planificar tu viaje o encontrar eventos en Cochabamba.
              </p>
              
              <div className="mt-8 grid grid-cols-1 gap-2 w-full max-w-xs">
                <button 
                  onClick={() => setInput("¿Qué lugares turísticos me recomiendas?")}
                  className="text-sm text-left p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-md transition-all text-gray-600 dark:text-gray-300"
                >
                  ¿Qué lugares turísticos me recomiendas?
                </button>
                <button 
                  onClick={() => setInput("Busco restaurantes de comida típica")}
                  className="text-sm text-left p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-md transition-all text-gray-600 dark:text-gray-300"
                >
                  Busco restaurantes de comida típica, ¿alguna sugerencia?
                </button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex gap-3 ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                message.type === "user" 
                  ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400" 
                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              }`}>
                {message.type === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.type === "user"
                    ? "bg-cyan-600 text-white rounded-tr-none"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-none"
                }`}
              >
                {message.type === "user" ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="text-sm leading-relaxed prose prose-sm max-w-none 
                    prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-headings:mt-3 prose-headings:mb-2
                    prose-h3:text-base prose-h2:text-lg prose-h1:text-xl
                    prose-p:my-2 prose-p:leading-relaxed dark:prose-p:text-gray-200
                    prose-ul:my-2 prose-ol:my-2 prose-li:my-1 dark:prose-li:text-gray-200
                    prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-semibold
                    prose-a:text-cyan-600 dark:prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
                {message.content === "" && message.type === "ai" && isLoading && (
                  <div className="flex items-center gap-1.5 py-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                )}
              </div>
            </article>
          ))}
          <div ref={messagesEndRef} />
        </section>

        {/* Input */}
        <footer className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          {/* Model Selector & Attachments */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="relative" ref={modelMenuRef}>
              <button
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors"
              >
                {selectedModel === 'fast' ? (
                  <>
                    <Zap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Rápido</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Pensando</span>
                  </>
                )}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>

              {isModelMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setSelectedModel('fast');
                        setIsModelMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedModel === 'fast' 
                          ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md ${selectedModel === 'fast' ? 'bg-cyan-100 dark:bg-cyan-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Modelo rápido</div>
                        <div className="text-[10px] opacity-70">Respuestas más instantáneas</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedModel('thinking');
                        setIsModelMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedModel === 'thinking' 
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md ${selectedModel === 'thinking' ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        <Brain className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Modelo razonador</div>
                        <div className="text-[10px] opacity-70">Respuestas más elaboradas</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
            
            <button
              onClick={handleFileSelect}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Adjuntar imagen"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          <form 
            className="relative flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:border-cyan-500 transition-all" 
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje aquí..."
              className="flex-1 bg-transparent border-none px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400"
              disabled={isLoading}
              autoFocus
              aria-label="Mensaje a enviar"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
              aria-label="Enviar mensaje"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-2">
            El asistente puede cometer errores. Verifica la información importante.
          </p>
        </footer>
      </div>
    </div>
  );
}

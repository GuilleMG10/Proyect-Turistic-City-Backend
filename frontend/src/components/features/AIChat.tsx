import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, Sparkles, User, Paperclip, Zap, Brain, ChevronDown, Plus, ChevronUp, Clock, CheckCircle2 } from "lucide-react";
import { useModalEscape } from '../../hooks/useModalEscape';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useDraggableModal } from '../../hooks/useDraggableModal';
import { useUserStore } from "../../store/userStore";
import ReactMarkdown from 'react-markdown';

type ThinkingStep = {
  title: string;
  content: string;
};

type Message = {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  thinking?: ThinkingStep[];
  thinkingTime?: number;
  isThinking?: boolean;
  hasImage?: boolean;
  imageUrl?: string;
};

type ModelType = 'fast' | 'thinking';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Fix markdown formatting issues from streaming AI responses.
 * Handles common issues like missing line breaks, emoji headers, and indented lists.
 */
function fixMarkdownFormatting(text: string): string {
  let result = text;
  
  // 0. Remove any stray </think> tags that made it through
  result = result.replace(/<\/?think>/g, '');
  
  // 0.5. Fix '>' used as list markers (convert to proper list items)
  // e.g., "> - Plaza" → "- Plaza" and standalone ">" at line start to "-"
  result = result.replace(/^>\s*-\s*/gm, '- ');
  result = result.replace(/^>\s+/gm, '- ');
  
  // 1. Fix horizontal rules (---) that are glued to text
  // e.g., "Cochabamba:---" → "Cochabamba:\n\n---"
  result = result.replace(/([^\n\s])---/g, '$1\n\n---');
  result = result.replace(/---([^\n\s-])/g, '---\n\n$1');
  
  // 2. Ensure line breaks before markdown headings (### ## #)
  result = result.replace(/([^\n])(#{1,4}\s)/g, '$1\n\n$2');
  
  // 3. Fix headings that are glued to previous content (no space after #)
  // e.g., "text)####1." → "text)\n\n#### 1."
  result = result.replace(/(#{1,4})(\d)/g, '$1 $2');
  
  // 4. Fix headings glued to text before them
  // e.g., "tradicional)####" → "tradicional)\n\n####"
  result = result.replace(/([)\]:.!?])(\s*#{1,4})/g, '$1\n\n$2');
  
  // 5. Convert emoji-prefixed lines to h3 headers if they look like titles
  // Match lines starting with emoji followed by title-like text (capitalized, ends without punctuation or with :)
  result = result.replace(/\n([\u{1F300}-\u{1F9FF}][\u{1F300}-\u{1F9FF}]?\s+[A-ZÁÉÍÓÚÑ][^\n]{5,60})(?=\n|$)/gu, '\n\n### $1\n');
  
  // 6. Fix indented list items (4 spaces + text) to proper markdown lists
  // e.g., "    Actividades principales:" → "- **Actividades principales:**"
  result = result.replace(/\n {4}([A-ZÁÉÍÓÚÑ¿][^:\n]+):/g, '\n- **$1:**');
  
  // 7. Ensure line breaks before list items (- or *)
  result = result.replace(/([^\n])(\n\s*[-*]\s)/g, '$1\n$2');
  
  // 8. Fix numbered lists that are glued together after parenthesis or text
  // e.g., "teatro)2." → "teatro)\n2."
  result = result.replace(/\)(\d+\.)/g, ')\n$1');
  
  // 9. Fix numbered lists that are glued after punctuation
  // e.g., "text.1. Item" → "text.\n\n1. Item"
  result = result.replace(/([.!?:])(\d+\.\s+\*{0,2}[A-ZÁÉÍÓÚÑ])/g, '$1\n\n$2');
  // Also handle "text1. Item" without punctuation
  result = result.replace(/([a-záéíóúñ])(\d+\.\s+\*{0,2}[A-ZÁÉÍÓÚÑ])/g, '$1\n\n$2');
  
  // 10. Ensure line break between numbered list items
  // e.g., "...end of item.2. Next item" → "...end of item.\n\n2. Next item"
  result = result.replace(/([.!?])(\d+\.\s)/g, '$1\n\n$2');
  
  // 11. Fix list items with italic markers that are glued
  // e.g., "*¿Por qué?*" should have line break before it
  result = result.replace(/([.!?])\s*(\n?\s*[-*]\s+\*[¿A-ZÁÉÍÓÚÑ])/g, '$1\n$2');
  
  // 12. Clean up excessive line breaks (more than 3)
  result = result.replace(/\n{4,}/g, '\n\n\n');
  
  // 13. Fix "Conclusión:" style headers
  result = result.replace(/\n([\u{1F300}-\u{1F9FF}]?\s*Conclusión:)/gu, '\n\n### $1');
  
  // 14. Ensure proper spacing after headings
  result = result.replace(/(#{1,4}\s+[^\n]+)\n([^#\n-*\d])/g, '$1\n\n$2');
  
  return result;
}

type AICapabilities = {
  provider: string;
  model: string;
  capabilities: {
    vision: boolean;
    thinking: boolean;
  };
};

export default function AIChat({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('fast');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const { user } = useUserStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const thinkingStartTime = useRef<number>(0);

  // Draggable modal for mobile
  const { dragHandleProps, modalStyle, isDragging } = useDraggableModal({
    isOpen,
    onClose,
    threshold: 25,
  });

  // Handle escape key
  useModalEscape(isOpen, onClose);

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  // Fetch AI capabilities on mount
  useEffect(() => {
    const fetchCapabilities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/ia/capabilities`);
        if (response.ok) {
          const data = await response.json();
          setCapabilities(data);
        }
      } catch (error) {
        console.warn('Could not fetch AI capabilities:', error);
      }
    };
    fetchCapabilities();
  }, []);

  const scrollToBottom = (force = false) => {
    // Only auto-scroll if user is already at the bottom (or forced)
    if (force || isUserAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Check if user is scrolled to bottom
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // Consider "at bottom" if within 100px of the bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < 30;
    setIsUserAtBottom(atBottom);
  };

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isUserAtBottom]);

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
      setAttachedFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setSelectedModel('fast');
    setAttachedFile(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    if (!user) {
      alert('Debes iniciar sesión para usar el chat');
      return;
    }

    // Convert attached file to base64 if present
    let imageBase64: string | null = null;
    if (attachedFile) {
      imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]; // Remove data:image/...;base64, prefix
          resolve(base64);
        };
        reader.readAsDataURL(attachedFile);
      });
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
      hasImage: !!attachedFile,
      imageUrl: attachedFile ? URL.createObjectURL(attachedFile) : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachedFile(null); // Clear attached file after sending
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    const isThinkingModel = selectedModel === 'thinking';
    const aiMessage: Message = {
      id: aiMessageId,
      type: "ai",
      content: "",
      timestamp: new Date(),
      thinking: isThinkingModel ? [] : undefined,
      isThinking: isThinkingModel,
    };
    setMessages(prev => [...prev, aiMessage]);
    
    // Track thinking time and auto-expand thinking section
    if (isThinkingModel) {
      thinkingStartTime.current = Date.now();
      console.log('[AIChat] Thinking started, thinkingStartTime set to:', thinkingStartTime.current);
      // Auto-expand the thinking section for this message
      setExpandedThinking(prev => ({ ...prev, [aiMessageId]: true }));
    }

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
      // Use vision endpoint if image is attached, otherwise use regular prompt
      const endpoint = imageBase64 ? `${API_BASE_URL}/ia/vision` : `${API_BASE_URL}/ia/prompt`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(imageBase64 ? {
          context: userMessage.content,
          imageBase64: imageBase64,
        } : {
          prompt: userMessage.content,
          model: selectedModel, // Pass selected model to backend
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let currentThinkingStep: ThinkingStep | null = null;
      let isInThinkingBlock = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              let data = line.slice(6);
              
              // Skip empty data
              if (!data || data.trim() === '') continue;
              
              // Check for plain markers first (not JSON encoded)
              if (data === '[DONE]' || data === '[THINKING_START]' || data === '[THINKING_END]') {
                // Handle as-is
              } else if (data.startsWith('"')) {
                // Parse JSON-encoded data from backend
                try {
                  data = JSON.parse(data);
                } catch {
                  // If parsing fails, use as-is
                }
              }

              if (data === '[DONE]') {
                // Mark thinking as done and record time
                if (isThinkingModel) {
                  const now = Date.now();
                  const startTime = thinkingStartTime.current;
                  const thinkingTime = Math.round((now - startTime) / 1000);
                  console.log('[AIChat] Thinking completed:', { now, startTime, thinkingTime });
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === aiMessageId
                        ? { ...msg, isThinking: false, thinkingTime }
                        : msg
                    )
                  );
                }
                setIsLoading(false);
                return;
              }

              if (data.trim()) {
                // Check for thinking block markers (exact match first, then includes)
                let remainingData = data;
                
                // Handle exact marker matches (when sent as separate SSE events)
                if (data === '[THINKING_START]') {
                  isInThinkingBlock = true;
                  currentThinkingStep = null;
                  continue;
                }
                
                if (data === '[THINKING_END]') {
                  isInThinkingBlock = false;
                  // Final save of current step
                  if (currentThinkingStep && currentThinkingStep.content.trim()) {
                    const finalStep = { ...currentThinkingStep };
                    setMessages(prev =>
                      prev.map(msg => {
                        if (msg.id === aiMessageId && msg.thinking) {
                          const existingIndex = msg.thinking.findIndex(t => t.title === finalStep.title);
                          if (existingIndex >= 0) {
                            const updatedThinking = [...msg.thinking];
                            updatedThinking[existingIndex] = finalStep;
                            return { ...msg, thinking: updatedThinking };
                          }
                          return { ...msg, thinking: [...msg.thinking, finalStep] };
                        }
                        return msg;
                      })
                    );
                  }
                  currentThinkingStep = null;
                  // Auto-collapse thinking section when thinking ends
                  setExpandedThinking(prev => ({ ...prev, [aiMessageId]: false }));
                  continue;
                }
                
                // Handle markers embedded in content (fallback)
                if (remainingData.includes('[THINKING_START]')) {
                  isInThinkingBlock = true;
                  currentThinkingStep = null;
                  remainingData = remainingData.replace('[THINKING_START]', '').trim();
                  if (!remainingData) continue;
                }
                
                if (remainingData.includes('[THINKING_END]')) {
                  // Split content before and after the marker
                  const parts = remainingData.split('[THINKING_END]');
                  const beforeEnd = parts[0];
                  const afterEnd = parts.slice(1).join('[THINKING_END]');
                  
                  // Add any remaining thinking content before the marker
                  if (beforeEnd.trim() && isInThinkingBlock && currentThinkingStep) {
                    currentThinkingStep.content += beforeEnd;
                    const updatedStep = { ...currentThinkingStep };
                    setMessages(prev =>
                      prev.map(msg => {
                        if (msg.id === aiMessageId && msg.thinking && msg.thinking.length > 0) {
                          const updatedThinking = [...msg.thinking];
                          const lastIndex = updatedThinking.length - 1;
                          updatedThinking[lastIndex] = updatedStep;
                          return { ...msg, thinking: updatedThinking };
                        }
                        return msg;
                      })
                    );
                  }
                  
                  isInThinkingBlock = false;
                  
                  // Final save of current step if exists
                  if (currentThinkingStep && currentThinkingStep.content.trim()) {
                    const finalStep = { ...currentThinkingStep };
                    setMessages(prev =>
                      prev.map(msg => {
                        if (msg.id === aiMessageId && msg.thinking) {
                          const existingIndex = msg.thinking.findIndex(t => t.title === finalStep.title);
                          if (existingIndex >= 0) {
                            const updatedThinking = [...msg.thinking];
                            updatedThinking[existingIndex] = finalStep;
                            return { ...msg, thinking: updatedThinking };
                          }
                          return { ...msg, thinking: [...msg.thinking, finalStep] };
                        }
                        return msg;
                      })
                    );
                  }
                  currentThinkingStep = null;
                  // Auto-collapse thinking section when thinking ends
                  setExpandedThinking(prev => ({ ...prev, [aiMessageId]: false }));
                  
                  // Process any content after [THINKING_END] as regular response
                  if (afterEnd.trim()) {
                    setMessages(prev =>
                      prev.map(msg => {
                        if (msg.id === aiMessageId) {
                          return { ...msg, content: msg.content + afterEnd.trim() };
                        }
                        return msg;
                      })
                    );
                  }
                  continue;
                }
                
                // Check for thinking step title (format: "• Title\n" or "• Title\nContent")
                if (isInThinkingBlock && remainingData.includes('• ')) {
                  // Extract the title part
                  const titleMatch = remainingData.match(/• ([^\n]+)/);
                  if (titleMatch) {
                    const title = titleMatch[1].trim();
                    const titleEnd = remainingData.indexOf('\n', remainingData.indexOf('• '));
                    const afterTitle = titleEnd > 0 ? remainingData.slice(titleEnd + 1) : '';
                    
                    // Create new step and add to thinking array immediately
                    currentThinkingStep = {
                      title: title,
                      content: afterTitle,
                    };
                    
                    setMessages(prev =>
                      prev.map(msg => {
                        if (msg.id === aiMessageId && msg.thinking) {
                          return { ...msg, thinking: [...msg.thinking, currentThinkingStep!] };
                        }
                        return msg;
                      })
                    );
                    continue;
                  }
                }
                
                // Accumulate thinking content in real-time
                if (isInThinkingBlock && currentThinkingStep) {
                  currentThinkingStep.content += remainingData;
                  // Update the current thinking step in real-time
                  const updatedStep = { ...currentThinkingStep };
                  setMessages(prev =>
                    prev.map(msg => {
                      if (msg.id === aiMessageId && msg.thinking && msg.thinking.length > 0) {
                        const updatedThinking = [...msg.thinking];
                        const lastIndex = updatedThinking.length - 1;
                        updatedThinking[lastIndex] = updatedStep;
                        return { ...msg, thinking: updatedThinking };
                      }
                      return msg;
                    })
                  );
                  continue;
                }
                
                // If in thinking block but no current step, create one
                if (isInThinkingBlock && !currentThinkingStep && remainingData.trim()) {
                  currentThinkingStep = {
                    title: 'Razonando',
                    content: remainingData,
                  };
                  setMessages(prev =>
                    prev.map(msg => {
                      if (msg.id === aiMessageId && msg.thinking) {
                        return { ...msg, thinking: [...msg.thinking, currentThinkingStep!] };
                      }
                      return msg;
                    })
                  );
                  continue;
                }
                
                // Regular content (not in thinking block)
                if (!isInThinkingBlock) {
                  setMessages(prev =>
                    prev.map(msg => {
                      if (msg.id === aiMessageId) {
                        const newContent = msg.content + remainingData;
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
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[100] p-0 md:p-4" 
      role="dialog" 
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl w-full max-w-lg h-[85vh] md:h-[700px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300" 
        role="document"
        data-modal-content
        style={modalStyle}
      >
        {/* Drag Handle (Mobile) */}
        <div 
          className="md:hidden flex justify-center py-2 cursor-grab active:cursor-grabbing"
          {...dragHandleProps}
        >
          <div className={`w-12 h-1 rounded-full transition-colors ${isDragging ? 'bg-gray-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
        </div>
        
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
                className="hidden md:block p-2 hover:bg-white/20 rounded-full transition-colors text-white/90 hover:text-white"
                aria-label="Cerrar chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <section 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900/50 scroll-smooth" 
          aria-label="Mensajes del chat"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Sparkles className="h-10 w-10 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">¿En que puedo ayudarte?</h4>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                Descubramos lugares increíbles, planifiquemos tu viaje o encontremos eventos.
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
                className={`max-w-[85%] rounded-2xl shadow-sm ${
                  message.type === "user"
                    ? "bg-cyan-600 text-white rounded-tr-none px-4 py-3"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-none"
                }`}
              >
                {message.type === "user" ? (
                  <div>
                    {message.imageUrl && (
                      <img 
                        src={message.imageUrl} 
                        alt="Imagen adjunta" 
                        className="max-w-full max-h-48 rounded-lg mb-2 border border-cyan-500/30"
                      />
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                ) : (
                  <>
                    {/* Thinking Process (for reasoning model) */}
                    {message.thinking && message.thinking.length > 0 && (
                      <div className="border-b border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => setExpandedThinking(prev => ({ 
                            ...prev, 
                            [message.id]: !prev[message.id] 
                          }))}
                          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mr-1">
                              {message.isThinking ? 'Pensando' : 'Razonamiento'}
                            </span>
                            {message.isThinking && (
                              <div className="flex items-center gap-0.5 ml-0.5">
                                <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" />
                                <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!message.isThinking && message.thinkingTime !== undefined && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="h-3 w-3" />
                                {message.thinkingTime >= 60 
                                  ? `${Math.floor(message.thinkingTime / 60)}m ${message.thinkingTime % 60}s`
                                  : `${message.thinkingTime}s`
                                }
                              </span>
                            )}
                            {!message.isThinking && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            <ChevronUp className={`h-4 w-4 text-gray-400 transition-transform ${
                              expandedThinking[message.id] ? '' : 'rotate-180'
                            }`} />
                          </div>
                        </button>
                        
                        {expandedThinking[message.id] && (
                          <div className="px-4 pb-3 space-y-3 bg-gray-50/50 dark:bg-gray-900/30">
                            {message.thinking.map((step, index) => (
                              <div key={index} className="text-sm">
                                <div className="flex items-start gap-2">
                                  <span className="shrink-0 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{step.title}</p>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 leading-relaxed whitespace-pre-wrap">{step.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Main Response Content */}
                    <div className="px-4 py-3 text-sm leading-relaxed prose prose-sm max-w-none 
                      prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-headings:mt-5 prose-headings:mb-3
                      prose-h1:text-xl prose-h1:pb-2 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-700
                      prose-h2:text-lg prose-h2:text-gray-800 dark:prose-h2:text-gray-200
                      prose-h3:text-base prose-h3:text-cyan-700 dark:prose-h3:text-cyan-400
                      prose-h4:text-sm prose-h4:font-semibold prose-h4:text-cyan-600 dark:prose-h4:text-cyan-500 prose-h4:mt-4 prose-h4:mb-2
                      prose-p:my-3 prose-p:leading-7 dark:prose-p:text-gray-200
                      prose-ul:my-3 prose-ul:pl-6 prose-ol:my-3 prose-ol:pl-6
                      prose-li:my-1.5 prose-li:pl-1 dark:prose-li:text-gray-200 prose-li:leading-7
                      prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                      prose-em:text-cyan-700 dark:prose-em:text-cyan-400 prose-em:italic prose-em:font-medium
                      prose-a:text-cyan-600 dark:prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                      prose-hr:my-6 prose-hr:border-0 prose-hr:h-px prose-hr:bg-gradient-to-r prose-hr:from-transparent prose-hr:via-gray-300 prose-hr:to-transparent dark:prose-hr:via-gray-600
                      prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-cyan-50 dark:prose-blockquote:bg-cyan-900/20 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-4 prose-blockquote:rounded-r-lg prose-blockquote:italic
                      prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-cyan-700 dark:prose-code:text-cyan-400 prose-code:font-mono prose-code:text-xs
                      prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto">
                      <ReactMarkdown>{fixMarkdownFormatting(message.content)}</ReactMarkdown>
                    </div>
                  </>
                )}
                {message.content === "" && message.type === "ai" && isLoading && !message.thinking?.length && (
                  <div className="flex items-center gap-1.5 py-3 px-4">
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

                    {capabilities?.capabilities.thinking && (
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
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {capabilities?.capabilities.vision && (
              <>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                
                <button
                  onClick={handleFileSelect}
                  className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${
                    attachedFile 
                      ? 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  title={attachedFile ? `Archivo adjunto: ${attachedFile.name}` : "Adjuntar imagen"}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* Attached file indicator with preview */}
          {attachedFile && (
            <div className="flex items-center gap-3 px-3 py-2 mb-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl text-sm">
              <img 
                src={URL.createObjectURL(attachedFile)} 
                alt="Preview" 
                className="h-12 w-12 object-cover rounded-lg border border-cyan-200 dark:border-cyan-700 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-cyan-700 dark:text-cyan-300 truncate block max-w-[180px]" title={attachedFile.name}>
                  {attachedFile.name}
                </span>
                <span className="text-xs text-cyan-500 dark:text-cyan-400">
                  {(attachedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                onClick={removeAttachedFile}
                className="p-1 hover:bg-cyan-100 dark:hover:bg-cyan-800 rounded text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors flex-shrink-0"
                title="Eliminar archivo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

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

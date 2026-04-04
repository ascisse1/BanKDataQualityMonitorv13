import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Minimize2,
  Maximize2,
  Sparkles,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import aiService, { type ChatMessage, type FaroStatus } from '@/services/aiService';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  durationMs?: number;
  model?: string;
}

const SUGGESTIONS = [
  'Quels sont les champs les plus critiques pour la conformite KYC ?',
  'Comment reduire les anomalies sur le champ TELEPHONE ?',
  'Explique les regles de validation FATCA',
  'Quelles sont les bonnes pratiques de saisie client ?',
];

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [faroStatus, setFaroStatus] = useState<FaroStatus | null>(null);
  const [hasError, setHasError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check AI service status — poll every 5s while not ready
  useEffect(() => {
    if (!isOpen) return;

    const checkStatus = () => {
      aiService.getStatus()
        .then((res) => {
          setFaroStatus(res.data.status);
          // Stop polling once ready
          if (res.data.status === 'ready' && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        })
        .catch(() => setFaroStatus('offline'));
    };

    checkStatus();

    // Poll if not yet ready
    if (faroStatus !== 'ready') {
      pollRef.current = setInterval(checkStatus, 5000);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isOpen, faroStatus]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const addMessage = useCallback((role: DisplayMessage['role'], content: string, extra?: Partial<DisplayMessage>) => {
    const msg: DisplayMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      ...extra,
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    setInput('');
    setHasError(false);
    addMessage('user', messageText);

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: messageText }];

    setIsLoading(true);
    try {
      const response = await aiService.chat(messageText, chatHistory);
      const { answer, model, durationMs } = response.data;

      addMessage('assistant', answer, { model, durationMs });
      setChatHistory([...newHistory, { role: 'assistant', content: answer }]);
    } catch {
      setHasError(true);
      addMessage('system', "Impossible de contacter Faro. Verifiez que le service Ollama est demarre.");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chatHistory, addMessage]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setChatHistory([]);
    setHasError(false);
  };

  const panelWidth = isExpanded ? 'w-[600px]' : 'w-[400px]';
  const panelHeight = isExpanded ? 'h-[700px]' : 'h-[520px]';

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2
                     bg-primary-600 hover:bg-primary-700 text-white
                     rounded-full px-5 py-3 shadow-lg
                     transition-all duration-200 hover:scale-105 hover:shadow-xl
                     group"
          aria-label="Ouvrir Faro"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Faro</span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 ${panelWidth} ${panelHeight}
                      bg-white dark:bg-slate-900 rounded-2xl shadow-2xl
                      border border-slate-200 dark:border-slate-700
                      flex flex-col overflow-hidden
                      transition-all duration-300 ease-in-out`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          bg-gradient-to-r from-primary-600 to-primary-700 text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <h3 className="text-sm font-semibold">Faro</h3>
                <p className="text-[10px] text-primary-200 flex items-center gap-1">
                  {faroStatus === 'ready' && (
                    <><span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Esprit de clarte connecte</>
                  )}
                  {faroStatus === 'downloading' && (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Telechargement du modele Mistral...</>
                  )}
                  {faroStatus === 'offline' && (
                    <><span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" /> Faro hors ligne</>
                  )}
                  {faroStatus === null && (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Eveil en cours...</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Effacer la conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title={isExpanded ? 'Reduire' : 'Agrandir'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30
                                flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Faro - Esprit de Clarte
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {faroStatus === 'downloading'
                    ? 'Faro telecharge le modele Mistral 7B... Cela peut prendre quelques minutes lors du premier demarrage.'
                    : faroStatus === 'offline'
                      ? 'Faro est hors ligne. Demarrez le service Ollama pour activer l\'assistant.'
                      : 'Je suis Faro, votre guide pour la qualite des donnees. Posez-moi vos questions sur les anomalies, les regles de validation...'
                  }
                </p>
                {faroStatus === 'downloading' && (
                  <div className="w-full mb-4 flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    <p className="text-[10px] text-slate-400">Verification automatique toutes les 5 secondes...</p>
                  </div>
                )}
                <div className="w-full space-y-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      disabled={faroStatus !== 'ready'}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg
                                 bg-slate-50 dark:bg-slate-800
                                 hover:bg-primary-50 dark:hover:bg-primary-900/20
                                 text-slate-600 dark:text-slate-300
                                 border border-slate-200 dark:border-slate-700
                                 hover:border-primary-300 dark:hover:border-primary-600
                                 transition-colors duration-150
                                 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-800"
                    >
                      <MessageCircle className="w-3 h-3 inline mr-1.5 text-primary-500" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role !== 'user' && (
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5
                    ${msg.role === 'assistant'
                      ? 'bg-primary-100 dark:bg-primary-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                    }`}
                  >
                    {msg.role === 'assistant'
                      ? <Bot className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      : <AlertCircle className="w-4 h-4 text-red-500" />
                    }
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : msg.role === 'assistant'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-bl-sm'
                    }`}
                >
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  {msg.role === 'assistant' && msg.durationMs && (
                    <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                      {msg.model} - {(msg.durationMs / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700
                                  flex items-center justify-center mt-0.5">
                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30
                                flex items-center justify-center mt-0.5">
                  <Bot className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 rounded-bl-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Faro reflechit...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error banner */}
          {hasError && (
            <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20
                            border border-amber-200 dark:border-amber-800
                            text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Verifiez que Ollama est demarre sur le serveur.
            </div>
          )}

          {/* Input area */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700
                          bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={faroStatus !== 'ready' && !isLoading}
                placeholder={
                  faroStatus === 'downloading' ? 'Faro telecharge le modele...'
                    : faroStatus === 'offline' ? 'Faro est hors ligne'
                      : 'Demandez a Faro...'
                }
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-300 dark:border-slate-600
                           bg-white dark:bg-slate-900
                           text-sm text-slate-700 dark:text-slate-200
                           placeholder:text-slate-400
                           px-3 py-2.5
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed
                           max-h-24 overflow-y-auto"
                style={{ minHeight: '40px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading || faroStatus !== 'ready'}
                className="flex-shrink-0 p-2.5 rounded-xl
                           bg-primary-600 hover:bg-primary-700
                           disabled:bg-slate-300 dark:disabled:bg-slate-700
                           text-white disabled:text-slate-500
                           transition-colors duration-150"
                aria-label="Envoyer"
              >
                {isLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 text-center">
              Shift+Entree pour un retour a la ligne
            </p>
          </div>
        </div>
      )}
    </>
  );
}

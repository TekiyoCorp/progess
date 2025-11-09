'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, User, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useTasks } from '@/hooks/useTasks';
import { useFolders } from '@/hooks/useFolders';
// import { toast } from '@/lib/toast'; // Toasts désactivés
import { saveChatAuditLog, ChatAuditLog } from '@/lib/chat-audit';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: any[];
  insights?: string[];
  suggestions?: string[];
  timestamp: Date;
}

export function ChatColumn() {
  const { allTasks, createTask, updateTask, deleteTask } = useTasks();
  const { folders, createFolder, updateFolder, deleteFolder } = useFolders();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Écouter les événements pour ouvrir le chat avec un message
  useEffect(() => {
    const handleOpenChatWithMessage = (event: CustomEvent) => {
      const { message } = event.detail;
      if (message && inputRef.current) {
        setInput(message);
        inputRef.current.focus();
        // Scroll vers le bas pour voir le message
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    };

    window.addEventListener('open-chat-with-message', handleOpenChatWithMessage as EventListener);
    return () => {
      window.removeEventListener('open-chat-with-message', handleOpenChatWithMessage as EventListener);
    };
  }, []);

  const executeAction = async (action: any): Promise<{ success: boolean; error?: string }> => {
    try {
      switch (action.type) {
        case 'create_task':
          await createTask({
            title: action.data.title,
            ...(action.data.percentage && { percentage: action.data.percentage }),
            ...(action.data.type && { type: action.data.type }),
            ...(action.data.event_start && { event_start: action.data.event_start }),
            ...(action.data.entity_id && { entity_id: action.data.entity_id }),
            ...(action.data.folder_id && { folder_id: action.data.folder_id }),
          });
          return { success: true };
        case 'update_task':
          await updateTask({
            id: action.data.id,
            title: action.data.title,
            completed: action.data.completed,
            percentage: action.data.percentage,
            event_start: action.data.event_start,
            folder_id: action.data.folder_id,
          });
          return { success: true };
        case 'delete_task':
          await deleteTask(action.data.id);
          return { success: true };
        case 'create_folder':
          await createFolder({
            name: action.data.name,
            price: action.data.price,
          });
          return { success: true };
        case 'update_folder':
          await updateFolder({
            id: action.data.id,
            name: action.data.name,
            price: action.data.price,
          });
          return { success: true };
        case 'delete_folder':
          await deleteFolder(action.data.id);
          return { success: true };
        default:
          console.warn('Unknown action type:', action.type);
          return { success: false, error: `Unknown action type: ${action.type}` };
      }
    } catch (error) {
      console.error('Error executing action:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      // toast.error(`Erreur lors de l'exécution de l'action: ${action.type}`); // Toasts désactivés
      return { success: false, error: errorMessage };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Calculer le CA actuel depuis les dossiers
      const { calculateRevenueFromFolders } = await import('@/lib/revenue');
      const currentAmount = calculateRevenueFromFolders(folders, allTasks);
      const monthlyGoal = parseInt(process.env.NEXT_PUBLIC_MONTHLY_GOAL || '50000');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
          tasks: allTasks,
          folders: folders.map(f => ({
            ...f,
            tasks: allTasks.filter(t => t.folder_id === f.id),
          })),
          currentAmount,
          monthlyGoal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur API');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        actions: data.actions || [],
        insights: data.insights || [],
        suggestions: data.suggestions || [],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Exécuter les actions et logger pour audit trail
      if (data.actions && data.actions.length > 0) {
        const executedActions = [];
        
        for (const action of data.actions) {
          const result = await executeAction(action);
          executedActions.push({
            ...action,
            success: result.success,
            error: result.error,
          });
        }
        
        // Logger les actions pour audit trail
        const auditLog = {
          id: Date.now().toString(),
          message: input.trim(),
          response: data.message,
          actions: executedActions,
          timestamp: new Date().toISOString(),
          context: {
            tasksCount: allTasks.length,
            foldersCount: folders.length,
          },
        };
        
        saveChatAuditLog(auditLog);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // toast.error('Erreur lors de l\'envoi du message'); // Toasts désactivés
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Désolé, je n\'ai pas pu traiter ta demande. Peux-tu reformuler ?',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Fade gradient en haut */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-xs text-white/60 mb-1">Salut Zak ! 👋</p>
            <p className="text-xs text-white/40">
              Je peux t'aider à gérer tes tâches, créer des dossiers, planifier ta journée...
            </p>
            <p className="text-xs text-white/30 mt-2">
              Dis-moi ce que tu veux faire !
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2 px-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="h-6 w-6 flex items-center justify-center shrink-0 mt-0.5">
                      <Image src="/star.svg" alt="" width={24} height={24} className="opacity-90" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-white/10 text-white/90'
                        : 'bg-white/5 text-white/80'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="text-xs leading-relaxed">
                        <ReactMarkdown
                          components={{
                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                        {message.insights && message.insights.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <p className="text-[10px] text-white/50 mb-1 font-medium">💡 Insights:</p>
                            {message.insights.map((insight, idx) => (
                              <p key={idx} className="text-[10px] text-white/40 mb-0.5">
                                • {insight}
                              </p>
                            ))}
                          </div>
                        )}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <p className="text-[10px] text-white/50 mb-1 font-medium">🚀 Suggestions:</p>
                            {message.suggestions.map((suggestion, idx) => (
                              <p key={idx} className="text-[10px] text-white/40 mb-0.5">
                                • {suggestion}
                              </p>
                            ))}
                          </div>
                        )}
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <p className="text-[10px] text-white/40 mb-1">Actions exécutées:</p>
                            {message.actions.map((action, idx) => (
                              <p key={idx} className="text-[10px] text-white/30">
                                ✓ {action.type}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-white/90">{message.content}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3 w-3 text-white/60" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="h-6 w-6 flex items-center justify-center shrink-0 mt-0.5">
                  <Image src="/star.svg" alt="" width={24} height={24} className="opacity-90" />
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <Loader2 className="h-3 w-3 text-white/60 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3 shrink-0">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Parle avec l'IA..."
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-1 text-xs h-8 text-white placeholder:text-white/40 outline-none focus:border-white/20"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="sm"
            className="h-8 w-8 p-0"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}


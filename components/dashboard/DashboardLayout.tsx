'use client';

import { useState, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useProgress } from '@/hooks/useProgress';
import { useFolders } from '@/hooks/useFolders';
import { TasksColumn } from './TasksColumn';
import { ProgressColumn } from './ProgressColumn';
import { ChatColumn } from '@/components/chat/ChatColumn';
import { MonthlyResetChecker } from './MonthlyResetChecker';
import { FocusModal } from '@/components/focus/FocusModal';
import { SearchModal } from '@/components/search/SearchModal';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';

export function DashboardLayout() {
  const { allTasks, toggleTask } = useTasks();
  const { folders } = useFolders();
  const { currentPercentage, currentAmount, monthlyGoal } = useProgress(allTasks, folders);
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Vérifier si l'utilisateur est dans un input/textarea
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable;
      
      // Cmd+K ou Ctrl+K pour la recherche
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      
      // Cmd+F ou Ctrl+F pour Focus Mode (sans tâche spécifique)
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && !isSearchOpen && !isTyping) {
        e.preventDefault();
        setIsFocusMode(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  return (
    <div className="min-h-screen bg-black text-white">
      <MonthlyResetChecker />

      {/* Main Dashboard Grid */}
      <main className="h-screen overflow-hidden" role="main">
        <div className="container mx-auto px-12 py-12 h-full">
        <div className={`grid grid-cols-1 gap-12 h-full max-w-[1400px] mx-auto ${
          isChatVisible ? 'lg:grid-cols-[1fr_1fr_1fr]' : 'lg:grid-cols-[1fr_1fr]'
        }`}>
          {/* Progress Column - Left (avec H1, événements, etc.) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="h-full flex flex-col max-w-[400px]"
            role="region"
            aria-label="Vue d'ensemble"
          >
            <ProgressColumn
              percentage={currentPercentage}
              amount={currentAmount}
              monthlyGoal={monthlyGoal}
            />
          </motion.div>

          {/* Tasks Column - Center */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="h-full flex flex-col min-h-0 max-w-[400px] mx-auto"
            role="region"
            aria-label="Tâches"
          >
            <h2 className="text-xs text-white/40 mb-4 shrink-0">Tâches</h2>
            <div className="flex-1 min-h-0">
              <TasksColumn />
            </div>
          </motion.div>

          {/* Chat Column - Right */}
          {isChatVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3 }}
              className="h-full flex flex-col min-h-0 max-w-[400px] ml-auto"
              role="region"
              aria-label="Chat"
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="text-xs text-white/40">Chat</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatVisible(false)}
                  className="h-5 w-5"
                >
                  <X className="h-3 w-3 text-white/40" />
                </Button>
              </div>
              <div className="flex-1 min-h-0">
                <ChatColumn />
              </div>
            </motion.div>
          )}
          
          {/* Button to show chat when hidden */}
          {!isChatVisible && (
            <div className="fixed bottom-8 right-8 z-50">
              <Button
                onClick={() => setIsChatVisible(true)}
                size="sm"
                className="bg-white/10 hover:bg-white/20 border border-white/10"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>
          )}
        </div>
        </div>
      </main>

      {/* Focus Modal */}
      <FocusModal
        isOpen={isFocusMode}
        priorityTask={null}
        onClose={() => setIsFocusMode(false)}
        onCompleteTask={(id) => toggleTask(id)}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';

interface SuggestedTask {
  title: string;
  type: string;
  percentage: number;
  reason: string;
  suggested_date?: string | null;
}

interface AutoCreateNotificationProps {
  originalTaskTitle: string;
  suggestedTasks: SuggestedTask[];
  isFollowUp?: boolean;
  onDismiss: () => void;
}

export function AutoCreateNotification({
  originalTaskTitle,
  suggestedTasks,
  isFollowUp = false,
  onDismiss,
}: AutoCreateNotificationProps) {
  const { createTask } = useTasks();
  const [creating, setCreating] = useState<string | null>(null);

  const handleCreateTask = async (suggestedTask: SuggestedTask) => {
    setCreating(suggestedTask.title);
    try {
      await createTask({
        title: suggestedTask.title,
        type: suggestedTask.type as any,
        event_start: suggestedTask.suggested_date || undefined,
      });
    } catch (error) {
      console.error('Error creating suggested task:', error);
    } finally {
      setCreating(null);
    }
  };

  const handleCreateAll = async () => {
    for (const suggestedTask of suggestedTasks) {
      if (creating) continue;
      await handleCreateTask(suggestedTask);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  if (suggestedTasks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <div>
            <p className="text-xs font-medium text-white">
              {isFollowUp ? 'Tâches de suivi suggérées' : 'Tâches complémentaires détectées'}
            </p>
            <p className="text-[10px] text-white/50">
              Pour : "{originalTaskTitle}"
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0"
          onClick={onDismiss}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div className="space-y-1.5">
        {suggestedTasks.map((suggestedTask, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-2 p-2 rounded-md bg-white/5 border border-white/10"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-white truncate">
                {suggestedTask.title}
              </p>
              <p className="text-[10px] text-white/50">
                {suggestedTask.reason}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] shrink-0"
              onClick={() => handleCreateTask(suggestedTask)}
              disabled={creating === suggestedTask.title}
            >
              {creating === suggestedTask.title ? (
                <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
            </Button>
          </div>
        ))}
      </div>

      {suggestedTasks.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-[10px] h-6"
          onClick={handleCreateAll}
          disabled={!!creating}
        >
          Créer toutes ({suggestedTasks.length})
        </Button>
      )}
    </motion.div>
  );
}


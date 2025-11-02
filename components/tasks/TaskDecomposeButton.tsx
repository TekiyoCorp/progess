'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskDecomposeButtonProps {
  task: any;
  onCreateSubtasks: (subtasks: any[]) => void;
}

export function TaskDecomposeButton({ task, onCreateSubtasks }: TaskDecomposeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [subtasks, setSubtasks] = useState<any>(null);

  // Ne montrer le bouton que pour les tâches > 5%
  if (!task.percentage || task.percentage <= 5) return null;

  const handleDecompose = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/decompose-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          taskType: task.type,
          taskPercentage: task.percentage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubtasks(data);
      }
    } catch (error) {
      console.error('Error decomposing task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDecompose}
        disabled={loading}
        className="h-6 px-2 text-[10px] gap-1"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Layers className="w-3 h-3" />
        )}
        Décomposer
      </Button>

      <AnimatePresence>
        {subtasks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-6 mt-2 space-y-1"
          >
            <div className="text-[10px] text-white/50 mb-2">
              {subtasks.subtasks.length} micro-tâches • {subtasks.totalTime}
            </div>
            {subtasks.subtasks.map((subtask: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-2 py-2 px-3 rounded bg-white/5 border border-white/10"
              >
                <span className="text-[10px] text-white/40 shrink-0">{subtask.order}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/90">{subtask.title}</p>
                  <p className="text-[10px] text-white/50">{subtask.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-purple-400">{subtask.percentage}%</span>
                    <span className="text-[10px] text-white/40">• {subtask.estimatedTime}</span>
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onCreateSubtasks(subtasks.subtasks);
                setSubtasks(null);
              }}
              className="w-full h-7 text-[10px] gap-1 mt-2"
            >
              <Plus className="w-3 h-3" />
              Créer ces {subtasks.subtasks.length} tâches
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BatchModeSuggestionsProps {
  tasks: any[];
  onBatchSelect: (taskIds: string[]) => void;
}

export function BatchModeSuggestions({ tasks, onBatchSelect }: BatchModeSuggestionsProps) {
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    detectBatches();
  }, [tasks]);

  const detectBatches = async () => {
    if (tasks.filter(t => !t.completed).length < 2) {
      setBatches([]);
      return;
    }

    try {
      const response = await fetch('/api/ai/batch-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: tasks.filter(t => !t.completed) }),
      });

      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error('Error detecting batches:', error);
    }
  };

  if (batches.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="px-4 mb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-2 bg-white/5 rounded-lg border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs text-white/70">Mode Batch ({batches.length})</h3>
          </div>

          <div className="space-y-2">
            {batches.map((batch, index) => (
              <div key={index} className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/90 mb-0.5">{batch.name}</p>
                  <p className="text-[10px] text-white/40">{batch.estimatedTime} • Gain: {batch.timeSaved}</p>
                </div>
                <button
                  onClick={() => onBatchSelect(batch.task_ids)}
                  className="text-[10px] text-white/50 hover:text-white/80 shrink-0"
                >
                  Sélectionner
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


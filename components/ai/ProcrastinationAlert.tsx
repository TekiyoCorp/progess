'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProcrastinationAlertProps {
  tasks: any[];
}

export function ProcrastinationAlert({ tasks }: ProcrastinationAlertProps) {
  const [procrastinated, setProcrastinated] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkProcrastination();
    const interval = setInterval(checkProcrastination, 3600000); // 1h
    return () => clearInterval(interval);
  }, [tasks]);

  const checkProcrastination = async () => {
    try {
      const response = await fetch('/api/ai/procrastination-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });

      if (response.ok) {
        const data = await response.json();
        setProcrastinated(data.procrastinated || []);
      }
    } catch (error) {
      console.error('Error checking procrastination:', error);
    }
  };

  const visibleAlerts = procrastinated.filter(p => !dismissed.has(p.taskId));

  if (visibleAlerts.length === 0) return null;

  return (
    <AnimatePresence>
      {visibleAlerts.map((alert) => {
        const task = tasks.find(t => t.id === alert.taskId);
        if (!task) return null;

        return (
          <div key={alert.taskId} className="px-4 mb-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-3 py-2 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 text-white/40 shrink-0 mt-0.5" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs text-white/70 truncate">{task.title}</h3>
                    <button
                      onClick={() => setDismissed(prev => new Set(prev).add(alert.taskId))}
                      className="text-white/40 hover:text-white/70 shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <p className="text-[10px] text-white/40 mb-1">
                    {alert.reason}
                  </p>

                  <p className="text-[10px] text-white/50">
                    💪 {alert.solution.encouragement}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </AnimatePresence>
  );
}


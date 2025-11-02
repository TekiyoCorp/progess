'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WeeklyPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: any[];
  onApplyPlan: (plan: any) => void;
}

export function WeeklyPlanningModal({ isOpen, onClose, tasks, onApplyPlan }: WeeklyPlanningModalProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  // Reset plan when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPlan(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && tasks.length > 0 && !plan && !loading) {
      generatePlan();
    }
  }, [isOpen]); // Seulement quand isOpen change

  const generatePlan = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/weekly-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          currentDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPlan(data.plan);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const dayNames: { [key: string]: string } = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-[#0a0a0a] rounded-2xl border border-white/10 p-8 max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Plan de la semaine by IA</h2>
                  <p className="text-xs text-white/50">Semaine du {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'dd MMMM', { locale: fr })}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-3" />
                <p className="text-sm text-white/60">L'IA analyse tes tâches...</p>
              </div>
            ) : plan ? (
              <>
                {/* Week Plan */}
                <div className="space-y-4 mb-6">
                  {Object.entries(plan.weekPlan || {}).map(([day, dayTasks]: [string, any]) => (
                    <div key={day} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        {dayNames[day]}
                      </h3>
                      <div className="space-y-2">
                        {dayTasks.map((item: any, index: number) => {
                          const task = tasks.find(t => t.id === item.taskId);
                          return (
                            <div key={index} className="flex items-start justify-between gap-3 py-2 px-3 rounded bg-white/5">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white/90 truncate">{task?.title || 'Tâche'}</p>
                                <p className="text-[10px] text-white/50 mt-0.5">{item.reason}</p>
                              </div>
                              <span className="text-[10px] text-purple-400 shrink-0">{item.time}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-white/50 mb-1">Progression prévue</p>
                      <p className="text-lg font-semibold text-white">{plan.totalPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 mb-1">Charge de travail</p>
                      <p className="text-lg font-semibold text-white">{plan.workloadBalance}</p>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                {plan.tips && plan.tips.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-medium text-white/60 mb-2">💡 Conseils de l'IA</h3>
                    <ul className="space-y-1">
                      {plan.tips.map((tip: string, index: number) => (
                        <li key={index} className="text-xs text-white/70">• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => {
                      onApplyPlan(plan);
                      onClose();
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Appliquer le plan
                  </Button>
                  <Button variant="ghost" onClick={generatePlan}>
                    Regénérer
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-white/60">Aucun plan généré</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


'use client';

import { AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task } from '@/types';
import { PomodoroTimer } from './PomodoroTimer';
import { useFocus } from '@/hooks/useFocus';
import { DarkVeilWrapper } from '@/components/DarkVeilWrapper';

interface FocusModalProps {
  isOpen: boolean;
  priorityTask: Task | null;
  onClose: () => void;
  onCompleteTask: (id: string) => void;
}

export function FocusModal({ isOpen, priorityTask, onClose, onCompleteTask }: FocusModalProps) {
  const {
    isPomodoroActive,
    pomodoroTime,
    pomodoroType,
    completedPomodoros,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    skipToNextPhase,
    formatTime,
  } = useFocus();

  return (
    <DarkVeilWrapper isOpen={isOpen} onClose={onClose} intensity="strong">
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 flex flex-col items-center justify-center">
            {/* Close button */}
            <div className="absolute top-8 right-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4 text-white/40" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center gap-16">
              {/* Task title ou mode focus simple */}
              {priorityTask ? (
                <div className="text-center max-w-md">
                  <p className="text-xs text-white/70 mb-2">
                    {priorityTask.percentage.toFixed(1)}%
                  </p>
                  <h1 className="text-xs text-white/90">
                    {priorityTask.title}
                  </h1>
                </div>
              ) : (
                <div className="text-center max-w-md">
                  <h1 className="text-xs text-white/90">
                    Mode Focus
                  </h1>
                  <p className="text-xs text-white/40 mt-2">
                    Concentre-toi sur ta tâche actuelle
                  </p>
                </div>
              )}

              {/* Pomodoro Timer */}
              <PomodoroTimer
                time={pomodoroTime}
                isActive={isPomodoroActive}
                type={pomodoroType}
                completedCount={completedPomodoros}
                onStart={startPomodoro}
                onPause={pausePomodoro}
                onReset={resetPomodoro}
                onSkip={skipToNextPhase}
                formatTime={formatTime}
              />

              {/* Complete button - seulement si une tâche */}
              {priorityTask && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onCompleteTask(priorityTask.id);
                    onClose();
                  }}
                  className="text-xs text-white/60 hover:text-white"
                >
                  Marquer comme terminée
                </Button>
              )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className="text-[10px] text-white/30">
                ESC pour quitter • Cmd+F pour ouvrir
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </DarkVeilWrapper>
  );
}


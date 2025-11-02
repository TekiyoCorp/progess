'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Task } from '@/types';
import Image from 'next/image';

interface CalendarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onDateClick: (date: Date) => void;
}

export function CalendarOverlay({ isOpen, onClose, tasks, onDateClick }: CalendarOverlayProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = monthStart.getDay();
  const daysToAdd = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Adjust for Monday start

  // Padding days from previous month
  const paddingDays = Array.from({ length: daysToAdd }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (daysToAdd - i));
    return date;
  });

  const allDays = [...paddingDays, ...daysInMonth];

  // Group tasks by date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.event_start) return false;
      return isSameDay(new Date(task.event_start), date);
    });
  };

  // Get task icon/avatar
  const getTaskIcon = (task: Task) => {
    if (task.type === 'call') return '📞';
    if (task.type === 'dev') return '💻';
    if (task.type === 'content') return '📝';
    return '📋';
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
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
            className="w-full max-w-5xl bg-[#0a0a0a] rounded-2xl border border-white/10 p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPreviousMonth}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-2xl font-semibold text-white">
                  {format(currentDate, 'MMMM yyyy', { locale: fr })}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextMonth}
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-4">
              {/* Days of week */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                  <div key={index} className="text-center text-sm text-white/40 font-medium">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-2">
                {allDays.map((date, index) => {
                  const dayTasks = getTasksForDate(date);
                  const isCurrentMonth = isSameMonth(date, currentDate);
                  const isTodayDate = isToday(date);

                  return (
                    <motion.button
                      key={index}
                      onClick={() => onDateClick(date)}
                      className={`
                        relative aspect-square rounded-xl p-2 flex flex-col items-center justify-center
                        transition-all hover:bg-white/5
                        ${!isCurrentMonth ? 'opacity-30' : ''}
                        ${isTodayDate ? 'bg-white/10 ring-2 ring-white/20' : ''}
                      `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className={`text-lg font-medium mb-1 ${isTodayDate ? 'text-white' : 'text-white/70'}`}>
                        {format(date, 'd')}
                      </span>

                      {/* Task indicators */}
                      {dayTasks.length > 0 && (
                        <div className="absolute bottom-2 flex items-center justify-center gap-0.5 flex-wrap max-w-full px-1">
                          {dayTasks.slice(0, 3).map((task, taskIndex) => (
                            <div
                              key={taskIndex}
                              className="w-6 h-6 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-xs"
                              title={task.title}
                            >
                              {getTaskIcon(task)}
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-[10px] text-white/60">
                              +{dayTasks.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer stats */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500/20 border border-purple-500/40"></div>
                  <span className="text-white/60">Tâches planifiées</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500/20 border border-pink-500/40"></div>
                  <span className="text-white/60">Deadlines</span>
                </div>
              </div>
              <p className="text-white/40">
                {tasks.filter(t => t.event_start).length} tâches ce mois
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


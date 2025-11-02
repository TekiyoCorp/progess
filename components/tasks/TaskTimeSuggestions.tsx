'use client';

import { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimeSuggestion {
  datetime: string;
  label: string;
  reason: string;
}

interface TaskTimeSuggestionsProps {
  taskId: string;
  taskTitle: string;
  taskType: string;
  taskPercentage: number;
  onSelectTime: (datetime: string) => void;
}

export function TaskTimeSuggestions({
  taskId,
  taskTitle,
  taskType,
  taskPercentage,
  onSelectTime,
}: TaskTimeSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TimeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks/suggest-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle,
          taskType,
          taskPercentage,
          currentDateTime: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching time suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTime = (datetime: string) => {
    onSelectTime(datetime);
    setShowSuggestions(false);
  };

  const formatDateTime = (datetime: string) => {
    try {
      const date = new Date(datetime);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return `Aujourd'hui ${format(date, 'HH:mm', { locale: fr })}`;
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return `Demain ${format(date, 'HH:mm', { locale: fr })}`;
      } else {
        return format(date, 'EEE dd/MM HH:mm', { locale: fr });
      }
    } catch {
      return datetime;
    }
  };

  if (!showSuggestions && !loading) {
    return (
      <button
        onClick={fetchSuggestions}
        className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 transition-colors"
        type="button"
      >
        <Clock className="w-3 h-3" />
        <span>Quand faire ?</span>
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-white/40">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Analyse...</span>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {showSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-2 space-y-1.5"
        >
          <p className="text-[10px] text-white/50 mb-1.5">💡 Créneaux suggérés :</p>
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              onClick={() => handleSelectTime(suggestion.datetime)}
              className="w-full text-left p-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
              type="button"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-white mb-0.5">
                    {suggestion.label}
                  </div>
                  <div className="text-[10px] text-white/50">
                    {suggestion.reason}
                  </div>
                </div>
                <div className="text-[10px] text-white/40 shrink-0">
                  {formatDateTime(suggestion.datetime)}
                </div>
              </div>
            </motion.button>
          ))}
          <button
            onClick={() => setShowSuggestions(false)}
            className="text-[10px] text-white/30 hover:text-white/50 transition-colors mt-1"
            type="button"
          >
            Masquer
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


'use client';

import { motion } from 'framer-motion';
import { TaskSuggestion } from '@/types';
import { Sparkles } from 'lucide-react';

interface TaskSuggestionsProps {
  suggestions: TaskSuggestion[];
  onSelect: (title: string) => void;
  position: { top: number; left: number };
}

export function TaskSuggestions({ suggestions, onSelect, position }: TaskSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed z-[9999] bg-black/95 border border-white/20 rounded-lg p-2 min-w-[300px] max-w-[400px] backdrop-blur-sm shadow-2xl"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        transform: 'translateY(8px)'
      }}
    >
      <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
        <Sparkles className="h-3 w-3 text-purple-400" />
        <span className="text-[10px] text-white/50 uppercase tracking-wider">Suggestions</span>
      </div>
      
      <div className="space-y-0.5">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion.title)}
            className="w-full text-left px-2 py-1.5 rounded hover:bg-white/10 transition-colors group"
          >
            <div className="text-xs text-white/70 group-hover:text-white/90">
              {suggestion.title}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
                  style={{ width: `${suggestion.similarity * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-white/40">
                {Math.round(suggestion.similarity * 100)}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}


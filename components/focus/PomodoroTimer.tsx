'use client';

import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PomodoroTimerProps {
  time: number;
  isActive: boolean;
  type: 'work' | 'short' | 'long';
  completedCount: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  formatTime: (seconds: number) => string;
}

export function PomodoroTimer({
  time,
  isActive,
  type,
  completedCount,
  onStart,
  onPause,
  formatTime,
}: PomodoroTimerProps) {
  // Calcul du pourcentage pour le cercle de progression
  const maxTime = type === 'work' ? 25 * 60 : type === 'short' ? 5 * 60 : 15 * 60;
  const progress = ((maxTime - time) / maxTime) * 100;
  const circumference = 2 * Math.PI * 80; // rayon = 80 (plus petit)
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Cercle de progression minimaliste */}
      <div className="relative">
        <svg className="transform -rotate-90" width="200" height="200">
          {/* Cercle de fond */}
          <circle
            cx="100"
            cy="100"
            r="80"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
            fill="none"
          />
          {/* Cercle de progression */}
          <motion.circle
            cx="100"
            cy="100"
            r="80"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </svg>

        {/* Timer au centre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-light text-white/90 tabular-nums tracking-tight">
            {formatTime(time)}
          </span>
        </div>
      </div>

      {/* Compteur de pomodoros minimaliste */}
      <div className="flex items-center gap-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full ${
              i < completedCount % 4 ? 'bg-white/40' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Bouton play/pause minimaliste */}
      <Button
        variant="ghost"
        size="icon"
        onClick={isActive ? onPause : onStart}
        className="h-10 w-10"
      >
        {isActive ? (
          <Pause className="h-4 w-4 text-white/40" fill="currentColor" />
        ) : (
          <Play className="h-4 w-4 text-white/40" fill="currentColor" />
        )}
      </Button>
    </div>
  );
}


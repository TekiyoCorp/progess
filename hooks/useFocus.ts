'use client';

import { useState, useEffect, useCallback } from 'react';

export function useFocus() {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes en secondes
  const [pomodoroType, setPomodoroType] = useState<'work' | 'short' | 'long'>('work');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  // Gérer le raccourci clavier pour entrer en focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Échapper pour quitter le focus mode
      if (e.key === 'Escape' && isFocusMode) {
        exitFocusMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  // Timer Pomodoro
  useEffect(() => {
    if (!isPomodoroActive || pomodoroTime <= 0) return;

    const timer = setInterval(() => {
      setPomodoroTime(prev => {
        if (prev <= 1) {
          handlePomodoroComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPomodoroActive, pomodoroTime]);

  const enterFocusMode = useCallback(() => {
    setIsFocusMode(true);
    resetPomodoro();
  }, []);

  const exitFocusMode = useCallback(() => {
    setIsFocusMode(false);
    setIsPomodoroActive(false);
    resetPomodoro();
  }, []);

  const startPomodoro = useCallback(() => {
    setIsPomodoroActive(true);
  }, []);

  const pausePomodoro = useCallback(() => {
    setIsPomodoroActive(false);
  }, []);

  const resetPomodoro = useCallback(() => {
    setIsPomodoroActive(false);
    const duration = pomodoroType === 'work' ? 25 * 60 : pomodoroType === 'short' ? 5 * 60 : 15 * 60;
    setPomodoroTime(duration);
  }, [pomodoroType]);

  const handlePomodoroComplete = useCallback(() => {
    setIsPomodoroActive(false);
    
    if (pomodoroType === 'work') {
      const newCompletedCount = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedCount);
      
      // Après 4 pomodoros, proposer une longue pause
      if (newCompletedCount % 4 === 0) {
        setPomodoroType('long');
        setPomodoroTime(15 * 60);
      } else {
        setPomodoroType('short');
        setPomodoroTime(5 * 60);
      }
    } else {
      // Retour au travail après une pause
      setPomodoroType('work');
      setPomodoroTime(25 * 60);
    }

    // Notification sonore ou visuelle (optionnel)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro terminé !', {
        body: pomodoroType === 'work' ? 'Temps de faire une pause !' : 'De retour au travail !',
      });
    }
  }, [pomodoroType, completedPomodoros]);

  const skipToNextPhase = useCallback(() => {
    handlePomodoroComplete();
  }, [handlePomodoroComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isFocusMode,
    isPomodoroActive,
    pomodoroTime,
    pomodoroType,
    completedPomodoros,
    enterFocusMode,
    exitFocusMode,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    skipToNextPhase,
    formatTime,
  };
}


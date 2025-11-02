'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp } from 'lucide-react';

interface MomentumTrackerProps {
  tasks: any[];
  revenueForecast?: { forecast: number; confidence: number } | null;
}

export function MomentumTracker({ tasks, revenueForecast }: MomentumTrackerProps) {
  const [streak, setStreak] = useState(0);
  const [momentum, setMomentum] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    calculateMomentum();
  }, [tasks]);

  const calculateMomentum = () => {
    // Calculer le streak (jours consécutifs avec au moins 1 tâche complétée)
    const completedDates = tasks
      .filter(t => t.completed && t.updated_at)
      .map(t => new Date(t.updated_at).toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let currentStreak = 0;
    const today = new Date().toDateString();
    
    if (completedDates[0] === today) {
      currentStreak = 1;
      for (let i = 1; i < completedDates.length; i++) {
        const prevDate = new Date(completedDates[i]);
        const currDate = new Date(completedDates[i - 1]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    setStreak(currentStreak);

    // Calculer le momentum (% moyen des 7 derniers jours vs 7 jours d'avant)
    const last7Days = tasks.filter(t => {
      const date = new Date(t.created_at);
      const diffDays = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && t.completed;
    });

    const prev7Days = tasks.filter(t => {
      const date = new Date(t.created_at);
      const diffDays = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 7 && diffDays <= 14 && t.completed;
    });

    const last7Percentage = last7Days.reduce((sum, t) => sum + (t.percentage || 0), 0);
    const prev7Percentage = prev7Days.reduce((sum, t) => sum + (t.percentage || 0), 0);

    if (prev7Percentage === 0) {
      setMomentum(100);
      setTrend('up');
    } else {
      const momentumValue = Math.round((last7Percentage / prev7Percentage) * 100);
      setMomentum(momentumValue);
      setTrend(momentumValue > 100 ? 'up' : momentumValue < 100 ? 'down' : 'stable');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10"
    >
      {/* Streak + Momentum */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-3 h-3 text-white/40" />
          <div>
            <p className="text-xs text-white/70">Streak : {streak} jours</p>
            <p className="text-[10px] text-white/40">Continue comme ça !</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] text-white/40">Momentum</p>
            <p className="text-xs text-white/70">{momentum}%</p>
          </div>
          {trend === 'up' && <TrendingUp className="w-3 h-3 text-white/40" />}
        </div>
      </div>
      
      {/* Prévision CA */}
      {revenueForecast && (
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div>
            <p className="text-[10px] text-white/40">Prévision CA</p>
            <p className="text-xs text-white/70">{revenueForecast.forecast.toLocaleString()}€</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40">Confiance</p>
            <p className="text-xs text-white/70">{revenueForecast.confidence}%</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}


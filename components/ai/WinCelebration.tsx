'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { Sparkles, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WinCelebrationProps {
  trigger: {
    type: 'task_completed' | 'deal_closed' | 'streak' | 'goal_reached';
    task?: any;
    percentage?: number;
    streak?: number;
  } | null;
  onClose: () => void;
}

export function WinCelebration({ trigger, onClose }: WinCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [message, setMessage] = useState({ title: '', subtitle: '', emoji: '🎉' });

  useEffect(() => {
    if (trigger) {
      setShowConfetti(true);
      generateMessage(trigger);
      
      // Auto-close after 5s
      const timeout = setTimeout(() => {
        setShowConfetti(false);
        setTimeout(onClose, 500);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [trigger]);

  const generateMessage = (t: any) => {
    if (t.type === 'task_completed' && t.percentage > 5) {
      setMessage({
        title: 'BRAVO ZAK !',
        subtitle: `+${t.percentage}% vers ton objectif 🚀`,
        emoji: '🎉',
      });
    } else if (t.type === 'deal_closed') {
      setMessage({
        title: 'DEAL CLOSÉ !',
        subtitle: `Tu viens de closer ${t.task?.title} !`,
        emoji: '💰',
      });
    } else if (t.type === 'streak' && t.streak >= 7) {
      setMessage({
        title: `🔥 STREAK ${t.streak} JOURS !`,
        subtitle: 'Continue comme ça, tu es inarrêtable !',
        emoji: '🔥',
      });
    } else if (t.type === 'goal_reached') {
      setMessage({
        title: 'OBJECTIF ATTEINT !',
        subtitle: '50k€ ce mois ! 🎯',
        emoji: '🏆',
      });
    }
  };

  if (!trigger) return null;

  return (
    <AnimatePresence>
      {showConfetti && (
        <>
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={500}
            gravity={0.3}
          />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl border border-white/20 p-12 text-center max-w-md backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: 2,
                }}
                className="text-8xl mb-6"
              >
                {message.emoji}
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-3">
                {message.title}
              </h2>
              
              <p className="text-lg text-white/80 mb-6">
                {message.subtitle}
              </p>

              {trigger.type === 'task_completed' && (
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="text-center">
                    <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-1" />
                    <p className="text-xs text-white/60">En hausse</p>
                  </div>
                  <div className="text-center">
                    <Award className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                    <p className="text-xs text-white/60">Bien joué</p>
                  </div>
                  <div className="text-center">
                    <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                    <p className="text-xs text-white/60">Continue</p>
                  </div>
                </div>
              )}

              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Continuer
              </Button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


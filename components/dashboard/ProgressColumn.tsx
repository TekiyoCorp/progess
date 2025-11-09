'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LogoPlaceholder } from '@/components/progress/LogoPlaceholder';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { ProgressStats } from '@/components/progress/ProgressStats';
import { ConfettiAnimation } from '@/components/progress/ConfettiAnimation';
import { AICommandInput } from '@/components/ai/AICommandInput';
import { useTasks } from '@/hooks/useTasks';
import { useFolders } from '@/hooks/useFolders';
import { useProblems } from '@/hooks/useProblems';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressColumnProps {
  percentage: number;
  amount: number;
  monthlyGoal: number;
}

export function ProgressColumn({ percentage, amount, monthlyGoal }: ProgressColumnProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasReached100, setHasReached100] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const { allTasks, refetch } = useTasks();
  const { folders } = useFolders();
  const { problems } = useProblems();

  useEffect(() => {
    if (percentage >= 100 && !hasReached100) {
      setShowConfetti(true);
      setHasReached100(true);
      
      // Reset confetti trigger after animation
      const timeout = setTimeout(() => {
        setShowConfetti(false);
      }, 3500);

      return () => clearTimeout(timeout);
    }
  }, [percentage, hasReached100]);

  // Trouver la tâche prioritaire (non complétée avec le plus haut pourcentage)
  const priorityTask = allTasks
    .filter(task => !task.completed)
    .sort((a, b) => b.percentage - a.percentage)[0];

  // Générer le Daily Brief au chargement
  useEffect(() => {
    const generateSummary = async () => {
      try {
        // Calculer le CA réel depuis les dossiers
        const { calculateRevenueFromFolders } = await import('@/lib/revenue');
        const realAmount = calculateRevenueFromFolders(folders, allTasks);
        
        const response = await fetch('/api/ai/daily-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            tasks: allTasks,
            folders: folders.map(f => ({
              ...f,
              tasks: allTasks.filter(t => t.folder_id === f.id),
            })),
            problems: problems,
            currentAmount: realAmount || amount, // Utiliser le CA réel calculé depuis les dossiers
            monthlyGoal: monthlyGoal,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAiSummary(data.summary);
        }
      } catch (error) {
        console.error('Error generating AI summary:', error);
      }
    };

    if (allTasks.length > 0 || folders.length > 0) {
      generateSummary();
    }
  }, [allTasks.length, amount, monthlyGoal, folders, problems]);

  return (
    <div className="h-full flex flex-col" style={{ fontSize: '0.94rem' }}>
      <ConfettiAnimation trigger={showConfetti} />
      
      {/* Logo en haut */}
      <div className="mb-8">
        <Image
          src="/Logo-Tekiyo-Blanc.png"
          alt="Tekiyo"
          width={28}
          height={28}
          className="opacity-90"
        />
      </div>

      {/* Contenu principal centré */}
      <div className="flex-1 flex flex-col justify-center">
        {/* H1 avec gradient */}
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[36px] font-normal mb-6"
          style={{
            background: 'linear-gradient(to right, rgb(244, 114, 182), rgb(168, 85, 247), rgb(96, 165, 250))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Hello Zak!
        </motion.h1>

        {/* Tâche prioritaire */}
        <AnimatePresence mode="wait">
          {priorityTask && (
            <motion.div
              key={priorityTask.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 mb-6"
            >
              <Image
                src="/star.svg"
                alt=""
                width={12}
                height={12}
              />
              <p className="text-xs bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
                {priorityTask.title}
              </p>
              <span className="text-xs text-white/40">
                {priorityTask.percentage.toFixed(1)}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Barre de progression + Résumé IA en bas */}
      <div className="space-y-4 mt-auto">
        {/* Résumé IA */}
        {aiSummary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-white/80 leading-relaxed break-words overflow-wrap-anywhere"
            style={{ wordBreak: 'break-word' }}
          >
            {aiSummary}
          </motion.div>
        )}

        {/* Progress bar */}
        <ProgressBar percentage={percentage} goal={monthlyGoal} />
        
        {percentage >= 100 && (
          <p className="text-xs text-white/60">
            Objectif atteint
          </p>
        )}
      </div>
    </div>
  );
}


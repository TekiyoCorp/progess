'use client';

import { motion } from 'framer-motion';
import { formatPercentage } from '@/lib/utils';

interface ProgressBarProps {
  percentage: number;
  goal: number;
}

export function ProgressBar({ percentage, goal }: ProgressBarProps) {
  // Cap at 100% for visual display
  const displayPercentage = Math.min((percentage / 100) * 100, 100);

  return (
    <div className="space-y-2 w-full" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Progression mensuelle">
      <div className="relative h-2 rounded-full overflow-hidden bg-white/5">
        <motion.div
          key={percentage}
          initial={false}
          animate={{ width: `${displayPercentage}%` }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
          className="absolute inset-y-0 left-0 bg-white rounded-full"
        />
      </div>

      <div className="flex items-center justify-center">
        <motion.span
          key={percentage}
          initial={{ opacity: 0.5, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-xs text-white/60"
        >
          {formatPercentage(percentage)}
        </motion.span>
      </div>
    </div>
  );
}


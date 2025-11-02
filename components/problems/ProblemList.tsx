'use client';

import { Problem } from '@/types';
import { ProblemItem } from './ProblemItem';
import { AnimatePresence } from 'framer-motion';
import { memo } from 'react';

interface ProblemListProps {
  problems: Problem[];
  onSolve: (id: string) => void;
  onDelete: (id: string) => void;
  solvingId: string | null;
}

export const ProblemList = memo(function ProblemList({ problems, onSolve, onDelete, solvingId }: ProblemListProps) {
  return (
    <div className="pt-2">
      <AnimatePresence mode="popLayout">
        {problems.map((problem) => (
          <ProblemItem
            key={problem.id}
            problem={problem}
            onSolve={onSolve}
            onDelete={onDelete}
            isSolving={solvingId === problem.id}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});


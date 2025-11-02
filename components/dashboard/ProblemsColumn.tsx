'use client';

import React from 'react';
import { useProblems } from '@/hooks/useProblems';
import { ProblemList } from '@/components/problems/ProblemList';
import { ProblemInput } from '@/components/problems/ProblemInput';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export function ProblemsColumn() {
  const {
    problems,
    loading,
    solving,
    createProblem,
    deleteProblem,
    solveProblemWithAI,
  } = useProblems();

  // Utiliser useCallback pour éviter de recréer les fonctions à chaque render
  const handleAddProblem = React.useCallback(async (title: string) => {
    await createProblem({ title });
  }, [createProblem]);

  return (
    <div className="h-full flex flex-col relative">
      {/* Fade gradient en haut */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white/60 rounded-full" />
          </div>
        ) : (
          <>
            <ProblemList
              problems={problems}
              onSolve={solveProblemWithAI}
              onDelete={deleteProblem}
              solvingId={solving}
            />
            <div className="pt-3">
              <ProblemInput onAdd={handleAddProblem} />
            </div>
          </>
        )}
      </div>

    </div>
  );
}

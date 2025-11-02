'use client';

import { Problem } from '@/types';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { memo } from 'react';

interface ProblemItemProps {
  problem: Problem;
  onSolve: (id: string) => void;
  onDelete: (id: string) => void;
  isSolving: boolean;
}

export const ProblemItem = memo(function ProblemItem({ problem, onSolve, onDelete, isSolving }: ProblemItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-3 space-y-2 border-b border-white/5 group flex flex-col items-start"
    >
      {/* Titre du problème */}
      <div className="flex items-start gap-2 w-full justify-start">
        <h3 className={`text-xs text-left flex-1 break-words ${problem.solved ? 'text-white/30 line-through' : 'text-white/70'}`}>
          {problem.title}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(problem.id)}
          className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
          aria-label={`Supprimer le problème: ${problem.title}`}
        >
          <Trash2 className="h-3 w-3 text-white/40" aria-hidden="true" />
        </Button>
      </div>

      {/* Bouton IA (toujours affiché si pas résolu) */}
      {!problem.solved && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSolve(problem.id)}
          disabled={isSolving}
          className="h-5 text-xs px-2 text-pink-400 hover:text-pink-300 gap-1"
          aria-label={`Résoudre le problème: ${problem.title}`}
        >
          {isSolving ? (
            <div className="h-3 w-3 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          ) : (
            <Image
              src="/star.svg"
              alt=""
              width={12}
              height={12}
            />
          )}
          <span>Réponse de l'IA</span>
        </Button>
      )}

      {/* Solution avec dégradé rose-bleu et star SVG */}
      <AnimatePresence>
        {problem.solution && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden w-full"
          >
            <div className="flex items-start gap-2 justify-start">
              <Image
                src="/star.svg"
                alt=""
                width={12}
                height={12}
                className="mt-0.5 shrink-0"
              />
              <div className="text-xs leading-relaxed bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent flex-1 text-left break-words">
                <ReactMarkdown 
                  components={{
                    p: ({node, ...props}) => <p className="mb-2 break-words" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                  }}
                >
                  {problem.solution}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});


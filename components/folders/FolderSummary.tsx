'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface FolderSummaryProps {
  summary?: string;
  isGenerating?: boolean;
}

export function FolderSummary({ summary, isGenerating }: FolderSummaryProps) {
  if (!summary && !isGenerating) return null;

  return (
    <AnimatePresence>
      {(summary || isGenerating) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden mb-2"
        >
          <div className="flex items-start gap-2 py-2">
            <Image 
              src="/star.svg" 
              alt="" 
              width={12} 
              height={12} 
              className="shrink-0 mt-0.5" 
            />
            <p 
              className="text-xs leading-relaxed flex-1"
              style={{
                background: 'linear-gradient(to right, rgb(244, 114, 182), rgb(168, 85, 247), rgb(96, 165, 250))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {isGenerating ? 'Génération du résumé...' : summary}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



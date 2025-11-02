'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import DarkVeil from './DarkVeil';

interface DarkVeilWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  intensity?: 'light' | 'medium' | 'strong';
}

export function DarkVeilWrapper({ isOpen, onClose, children, intensity = 'medium' }: DarkVeilWrapperProps) {
  // Map intensity to component props
  const intensityMap = {
    light: { noiseIntensity: 0.02, speed: 0.3 },
    medium: { noiseIntensity: 0.05, speed: 0.5 },
    strong: { noiseIntensity: 0.08, speed: 0.7 },
  };

  const props = intensityMap[intensity];

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100]"
        >
          {/* DarkVeil background */}
          <div className="absolute inset-0">
            <DarkVeil {...props} />
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Content */}
          <div className="relative z-10 w-full h-full">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


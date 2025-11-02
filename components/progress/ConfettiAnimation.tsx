'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiAnimationProps {
  trigger: boolean;
}

export function ConfettiAnimation({ trigger }: ConfettiAnimationProps) {
  useEffect(() => {
    if (!trigger) return;

    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#0071E3', '#FFFFFF', '#000000'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Burst at the center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });
  }, [trigger]);

  return null;
}



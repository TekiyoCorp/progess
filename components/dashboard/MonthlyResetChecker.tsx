'use client';

import { useEffect } from 'react';
import { checkAndResetIfNeeded } from '@/lib/monthly-reset';

export function MonthlyResetChecker() {
  useEffect(() => {
    // Check on mount
    checkAndResetIfNeeded();

    // Check daily (every 24 hours)
    const interval = setInterval(() => {
      checkAndResetIfNeeded();
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}



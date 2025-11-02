'use client';

import { TaskFilter as TaskFilterType } from '@/types';
import { Button } from '@/components/ui/button';

interface TaskFilterProps {
  current: TaskFilterType;
  onChange: (filter: TaskFilterType) => void;
  counts: {
    all: number;
    completed: number;
    pending: number;
  };
}

export function TaskFilter({ current, onChange, counts }: TaskFilterProps) {
  return null; // Filter removed for minimal design
}


'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarOverlay } from './CalendarOverlay';
import { useTasks } from '@/hooks/useTasks';

export function CalendarButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { allTasks } = useTasks();

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
    // TODO: Ouvrir modal avec détails du jour
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs text-white/60 hover:text-white/90"
      >
        <Calendar className="w-4 h-4 mr-2" />
        Calendrier
      </Button>

      <CalendarOverlay
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tasks={allTasks}
        onDateClick={handleDateClick}
      />
    </>
  );
}


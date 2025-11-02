'use client';

import { CalendarEvent } from '@/types';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarEventItemProps {
  event: CalendarEvent;
  onClick?: () => void;
}

export function CalendarEventItem({ event, onClick }: CalendarEventItemProps) {
  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className="py-1.5 flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity cursor-pointer group"
    >
      <Calendar className="h-3 w-3 text-white/40 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/60 truncate">{event.summary}</p>
        <p className="text-[10px] text-white/40">{formatEventTime(event.start)}</p>
      </div>
    </motion.div>
  );
}



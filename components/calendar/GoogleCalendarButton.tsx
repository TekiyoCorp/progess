'use client';

import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, X } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useTasks } from '@/hooks/useTasks';
import { useState } from 'react';

export function GoogleCalendarButton() {
  const { isAuthenticated, isSyncing, connectGoogleCalendar, disconnectGoogleCalendar, syncCalendar } = useGoogleCalendar();
  const { createTask } = useTasks();
  const [syncMessage, setSyncMessage] = useState('');

  const handleSync = async () => {
    try {
      const result = await syncCalendar(async (tasks) => {
        // Create tasks from calendar events
        for (const task of tasks) {
          await createTask({
            title: task.title,
            type: task.type,
          });
        }
      });

      if (result) {
        setSyncMessage(`✓ ${result.tasksGenerated} tâches`);
        setTimeout(() => setSyncMessage(''), 3000);
      }
    } catch (error) {
      setSyncMessage('✗ Erreur');
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  if (!isAuthenticated) {
    return (
      <Button
        onClick={connectGoogleCalendar}
        variant="ghost"
        size="sm"
        className="h-6 text-xs px-2 text-white/40 hover:text-white/70 gap-1.5"
      >
        <Calendar className="h-3 w-3" />
        <span>Connecter Calendar</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        variant="ghost"
        size="sm"
        className="h-6 text-xs px-2 text-white/40 hover:text-white/70 gap-1.5"
      >
        {isSyncing ? (
          <>
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Sync...</span>
          </>
        ) : (
          <>
            <Calendar className="h-3 w-3" />
            <span>Sync</span>
          </>
        )}
      </Button>

      <Button
        onClick={disconnectGoogleCalendar}
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-white/40 hover:text-white/70"
        title="Déconnecter"
      >
        <X className="h-3 w-3" />
      </Button>

      {syncMessage && (
        <span className="text-xs text-white/60">{syncMessage}</span>
      )}
    </div>
  );
}

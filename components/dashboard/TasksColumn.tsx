'use client';

import { useTasks } from '@/hooks/useTasks';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useFolders } from '@/hooks/useFolders';
import { TasksWithFolders } from '@/components/tasks/TasksWithFolders';
import { TaskInput } from '@/components/tasks/TaskInput';
import { TaskFilter } from '@/components/tasks/TaskFilter';
import { RevenueInput } from '@/components/revenue/RevenueInput';
import { MomentumTracker } from '@/components/ai/MomentumTracker';
import { WinCelebration } from '@/components/ai/WinCelebration';
// import { ProcrastinationAlert } from '@/components/ai/ProcrastinationAlert'; // Désactivé
import { Card } from '@/components/ui/card';
import { GoogleCalendarButton } from '@/components/calendar/GoogleCalendarButton';
import { CalendarEventItem } from '@/components/calendar/CalendarEventItem';
import { FoldersOverlay } from '@/components/folders/FoldersOverlay';
import { Button } from '@/components/ui/button';
import { Folder } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';

export function TasksColumn() {
  const {
    tasks,
    allTasks,
    loading,
    filter,
    setFilter,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    duplicateTask,
    archiveTask,
    blockTask,
    refetch,
  } = useTasks();

  const { folders } = useFolders();
  const { events, loading: eventsLoading, isAuthenticated, refreshEvents } = useCalendarEvents();

  // Utiliser une ref pour allTasks pour éviter les boucles infinies
  const allTasksRef = useRef(allTasks);
  useEffect(() => {
    allTasksRef.current = allTasks;
  }, [allTasks]);

  // États pour les nouvelles fonctionnalités IA
  const [winTrigger, setWinTrigger] = useState<any>(null);
  const [revenueForecast, setRevenueForecast] = useState<any>(null);
  const [showFoldersOverlay, setShowFoldersOverlay] = useState(false);


  // Fetch revenue forecast périodiquement
  useEffect(() => {
    const fetchForecast = async () => {
      const goal = parseInt(localStorage.getItem('monthly_revenue_goal') || '50000');
      
      // Récupérer les dossiers depuis localStorage ou Supabase
      const foldersData = localStorage.getItem('folders');
      const folders = foldersData ? JSON.parse(foldersData) : [];
      
      logger.info('📊 [Forecast] Raw folders from localStorage:', folders);
      
      // Calculer le % de complétion pour chaque dossier
      const foldersWithCompletion = folders.map((folder: any) => {
        const folderTasks = allTasks.filter(t => t.folder_id === folder.id);
        const completedTasks = folderTasks.filter(t => t.completed).length;
        const completedPercentage = folderTasks.length > 0
          ? Math.round((completedTasks / folderTasks.length) * 100)
          : 0;
        
        logger.info(`📁 [Forecast] Folder "${folder.name}": price=${folder.price}, completion=${completedPercentage}%, tasks=${folderTasks.length}`);
        
        return {
          ...folder,
          completed_percentage: completedPercentage,
        };
      });
      
      logger.info('📊 [Forecast] Analyzing', folders.length, 'folders with completion:', foldersWithCompletion);
      
      const response = await fetch('/api/ai/revenue-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          folders: foldersWithCompletion, 
          goal,
          tasks: allTasks, // Envoyer les tâches pour le calcul précis
        }),
      });
      if (response.ok) {
        const data = await response.json();
        logger.info('📊 [Forecast] Result:', data);
        setRevenueForecast(data);
      } else {
        logger.error('❌ [Forecast] API error:', response.status);
      }
    };

    fetchForecast();
    const interval = setInterval(fetchForecast, 300000); // 5min
    return () => clearInterval(interval);
  }, [allTasks.length]);

  // Check for wins on task completion
  const handleTaskToggle = async (id: string) => {
    const task = allTasks.find(t => t.id === id);
    await toggleTask(id);
    
    if (task && !task.completed && task.percentage > 5) {
      setWinTrigger({ type: 'task_completed', task, percentage: task.percentage });
    }
  };

  // Apply weekly plan
  const handleApplyPlan = async (plan: any) => {
    Object.entries(plan.weekPlan || {}).forEach(([day, dayTasks]: [string, any], dayIndex) => {
      dayTasks.forEach((item: any) => {
        const date = new Date();
        date.setDate(date.getDate() - date.getDay() + 1 + dayIndex);
        const [startHour] = item.time.split('-')[0].split('h');
        date.setHours(parseInt(startHour), 0, 0, 0);
        
        updateTask({ id: item.taskId, event_start: date.toISOString() });
      });
    });
    await refetch();
  };

  // Synchroniser automatiquement les événements en tâches
  const syncCalendarEventsToTasks = useCallback(async () => {
    if (!isAuthenticated || events.length === 0) return;

    logger.info('🔄 [Sync] Syncing', events.length, 'calendar events to tasks...');

    for (const event of events) {
      const existingTask = allTasksRef.current.find(t => t.event_id === event.id);
      
      if (!existingTask) {
        logger.info('➕ [Sync] Creating task from event:', event.summary);
        
        try {
          const newTask = await createTask({
            title: event.summary,
            type: 'call',
          });
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const tasks = JSON.parse(localStorage.getItem('tekiyo_tasks') || '[]');
          const lastTask = tasks[tasks.length - 1];
          
          if (lastTask) {
            await updateTask({
              id: lastTask.id,
              event_id: event.id,
              event_start: event.start,
            });
          }
        } catch (error) {
          logger.error('❌ [Sync] Error creating task:', error);
        }
      }
    }
  }, [isAuthenticated, events, createTask, updateTask]);

  // Auto-sync
  const previousEventsLengthRef = useRef(0);
  
  useEffect(() => {
    const eventsChanged = events.length !== previousEventsLengthRef.current;
    previousEventsLengthRef.current = events.length;
    
    if (isAuthenticated && events.length > 0 && eventsChanged) {
      syncCalendarEventsToTasks();
    }
  }, [events.length, isAuthenticated, syncCalendarEventsToTasks]);

  const handleAddTask = async (title: string, eventStart?: string, entityId?: string) => {
    await createTask({ title, event_start: eventStart, entity_id: entityId });
  };

  const handleUpdateTaskFolder = useCallback(async (taskId: string, folderId: string | null) => {
    await updateTask({ id: taskId, folder_id: folderId });
  }, [updateTask]);

  // Handler pour envoyer une tâche à l'IA (ouvre le chat)
  const handleSendToAI = useCallback((taskTitle: string) => {
    // Émettre un événement personnalisé pour ouvrir le chat avec le message
    const event = new CustomEvent('open-chat-with-message', {
      detail: { message: `Peux-tu m'aider avec cette tâche : "${taskTitle}" ?` }
    });
    window.dispatchEvent(event);
  }, []);

  // Handler pour ajouter une tâche à un dossier
  const handleAddToFolder = useCallback(async (taskId: string, folderId: string) => {
    await updateTask({ id: taskId, folder_id: folderId });
    await refetch(); // Rafraîchir les données après l'ajout
  }, [updateTask, refetch]);

  const handleRevenueUpdate = async (amount: number) => {
    const { logger } = await import('@/lib/logger');
    logger.info('💰 [Tasks] Revenue updated:', amount);
    // toast.success(`Objectif CA mis à jour: ${amount.toLocaleString()}€`); // Toasts désactivés
    await refetch();
  };


  return (
    <div className="h-full flex flex-col relative overflow-visible">
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
      
      <div className="flex-1 overflow-y-auto overflow-x-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white/60 rounded-full" />
          </div>
        ) : (
          <>
            {/* Buttons Row */}
            <div className="mb-3 pt-2 flex items-center gap-2">
              <GoogleCalendarButton />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFoldersOverlay(true)}
                className="text-xs h-7 px-2 text-white/60 hover:text-white/90"
              >
                <Folder className="h-3 w-3 mr-1.5" />
                Dossiers
              </Button>
            </div>

            {/* AI Stats */}
            <div className="px-4 mb-3">
              <MomentumTracker 
                tasks={allTasks} 
                revenueForecast={revenueForecast || { forecast: 0, confidence: 0 }} 
              />
            </div>

            {/* Revenue Input */}
            <RevenueInput onUpdate={handleRevenueUpdate} />
            
            {/* Tasks */}
            <TasksWithFolders 
              tasks={allTasks} 
              onToggle={handleTaskToggle} 
              onDelete={deleteTask}
              onUpdateTask={handleUpdateTaskFolder}
              onDuplicate={duplicateTask}
              onArchive={archiveTask}
              onBlock={blockTask}
              onRefetch={refetch}
              onCreateTask={createTask}
              onSendToAI={handleSendToAI}
              onAddToFolder={handleAddToFolder}
              folders={folders}
            />
            
            <div className="pt-3">
              <TaskInput 
                onAdd={handleAddTask}
              />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <WinCelebration
        trigger={winTrigger}
        onClose={() => setWinTrigger(null)}
      />

      {/* Folders Overlay */}
      <FoldersOverlay
        isOpen={showFoldersOverlay}
        onClose={() => setShowFoldersOverlay(false)}
        tasks={allTasks}
        onToggleTask={handleTaskToggle}
        onDeleteTask={deleteTask}
        onUpdateTask={handleUpdateTaskFolder}
        onDuplicateTask={duplicateTask}
        onArchiveTask={archiveTask}
        onBlockTask={blockTask}
        onRefetch={refetch}
      />
    </div>
  );
}

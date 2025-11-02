'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Task, CreateTaskInput, UpdateTaskInput, TaskFilter } from '@/types';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';

const STORAGE_KEY = 'tekiyo_tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>('all');

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(async () => {
    try {
      // Check if supabase is available
      if (!supabase) {
        console.log('Using localStorage for tasks');
        const localTasks = loadFromLocalStorage<Task[]>(STORAGE_KEY, []);
        setTasks(localTasks);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        // Parser les attachments JSONB si nécessaire
        const tasksWithParsedAttachments = data.map(task => ({
          ...task,
          attachments: typeof task.attachments === 'string' 
            ? JSON.parse(task.attachments) 
            : (task.attachments || []),
        }));
        
        setTasks(tasksWithParsedAttachments);
        saveToLocalStorage(STORAGE_KEY, tasksWithParsedAttachments);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Fallback to localStorage
      const localTasks = loadFromLocalStorage<Task[]>(STORAGE_KEY, []);
      setTasks(localTasks);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + Realtime subscription
  useEffect(() => {
    fetchTasks();
    
    // Supabase Realtime subscription
    if (supabase) {
      console.log('📡 [Tasks] Setting up Realtime subscription...');
      
      const channel = supabase
        .channel('public:tasks')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          (payload: any) => {
            console.log('🔥 [Tasks] Realtime event:', payload.eventType, payload.new);
            fetchTasks();
          }
        )
        .subscribe((status: any) => {
          console.log('📡 [Tasks] Subscription status:', status);
        });
      
      return () => {
        console.log('🔌 [Tasks] Cleaning up Realtime subscription...');
        supabase.removeChannel(channel);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchTasks est stable (useCallback avec []), pas besoin de dépendance

  // Create task with AI scoring
  const createTask = async (input: CreateTaskInput): Promise<Task | null> => {
    try {
      // Call AI scoring API
      let percentage = 1;
      let type = input.type || 'other';

      try {
        const scoreResponse = await fetch('/api/score-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: input.title }),
        });

        if (scoreResponse.ok) {
          const scoreData = await scoreResponse.json();
          percentage = scoreData.percentage || 1;
          type = scoreData.type || 'other';
        }
      } catch (aiError) {
        console.log('AI scoring unavailable, using default percentage');
      }

      // Si event_start est fourni, créer l'événement dans Google Calendar
      let eventId: string | undefined = undefined;
      if (input.event_start && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.provider_token) {
            console.log('📅 [Create Task] Creating calendar event...');
            
            // Calculer endDateTime (1h après start)
            const startDate = new Date(input.event_start);
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 1);
            
            const eventResponse = await fetch('/api/calendar/create-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accessToken: session.provider_token,
                title: input.title,
                startDateTime: input.event_start,
                endDateTime: endDate.toISOString(),
              }),
            });

            if (eventResponse.ok) {
              const eventData = await eventResponse.json();
              eventId = eventData.event.id;
              console.log('✅ [Create Task] Calendar event created:', eventId);
            } else {
              const errorData = await eventResponse.json().catch(() => ({ error: 'Unknown error' }));
              console.error('❌ [Create Task] Failed to create calendar event:', errorData);
            }
          }
        } catch (calendarError) {
          console.error('❌ [Create Task] Error creating calendar event:', calendarError);
          // Continue même si la création du calendar échoue
        }
      }

      // Try Supabase first
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('tasks')
            .insert({
              title: input.title,
              percentage,
              type,
              completed: false,
              ...(input.event_start && { event_start: input.event_start }),
              ...(eventId && { event_id: eventId }),
              ...(input.entity_id && { entity_id: input.entity_id }),
            })
            .select()
            .single();

          if (!error && data) {
            // Auto-organisation par l'IA si une entité est liée
            if (input.entity_id) {
              try {
                console.log('🤖 [Create Task] Auto-organizing with AI...');
                const organizeResponse = await fetch('/api/tasks/auto-organize', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ taskId: data.id }),
                });

                if (organizeResponse.ok) {
                  const organizeData = await organizeResponse.json();
                  console.log('✅ [Create Task] Auto-organized:', organizeData);
                }
              } catch (organizeError) {
                console.error('⚠️ [Create Task] Auto-organize failed (non-critical):', organizeError);
              }
            }

            setTasks(prev => {
              const updated = [...prev, data];
              saveToLocalStorage(STORAGE_KEY, updated);
              
              // Auto-création de tâches complémentaires
              setTimeout(async () => {
                try {
                  const autoCreateResponse = await fetch('/api/tasks/auto-create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      taskTitle: input.title,
                      taskType: type,
                      taskPercentage: percentage,
                      taskCompleted: false,
                      allTasks: updated,
                      eventStart: input.event_start,
                    }),
                  });

                  if (autoCreateResponse.ok) {
                    const autoData = await autoCreateResponse.json();
                    if (autoData.tasks && autoData.tasks.length > 0) {
                      console.log('🤖 [Auto-Create] Suggested tasks:', autoData.tasks);
                      // Dispatcher un événement pour afficher les suggestions
                      window.dispatchEvent(new CustomEvent('tasks-auto-suggested', {
                        detail: { originalTask: data, suggestedTasks: autoData.tasks }
                      }));
                    }
                  }
                } catch (err) {
                  console.error('⚠️ [Auto-Create] Error:', err);
                }
              }, 500);
              
              return updated;
            });
            return data;
          }
        } catch (dbError) {
          console.log('Supabase unavailable, using localStorage');
        }
      }

      // Fallback: create task locally
      const newTask: Task = {
        id: `local-${Date.now()}`,
        title: input.title,
        completed: false,
        percentage,
        type,
        ...(input.event_start && { event_start: input.event_start }),
        ...(eventId && { event_id: eventId }),
        ...(input.entity_id && { entity_id: input.entity_id }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setTasks(prev => {
        const updated = [...prev, newTask];
        saveToLocalStorage(STORAGE_KEY, updated);
        return updated;
      });
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  };

  // Update task
  const updateTask = async (input: UpdateTaskInput): Promise<void> => {
    console.log('🔧 [updateTask] Updating task:', input);
    
    try {
      if (!supabase) {
        // Fallback localStorage
        const updatedTasks = tasks.map(task => {
          if (task.id === input.id) {
            const updated = {
              ...task,
              ...(input.title && { title: input.title }),
              ...(input.completed !== undefined && { completed: input.completed }),
              ...(input.percentage !== undefined && { percentage: input.percentage }),
              ...(input.type && { type: input.type }),
              ...(input.folder_id !== undefined && { folder_id: input.folder_id }),
              ...(input.order_index !== undefined && { order_index: input.order_index }),
              ...(input.event_id !== undefined && { event_id: input.event_id }),
              ...(input.event_start !== undefined && { event_start: input.event_start }),
              ...(input.archived !== undefined && { archived: input.archived }),
              ...(input.blocked !== undefined && { blocked: input.blocked }),
              ...(input.block_reason !== undefined && { block_reason: input.block_reason }),
              updated_at: new Date().toISOString(),
            };
            console.log('✅ [updateTask] Task updated in state:', updated);
            return updated;
          }
          return task;
        });
        
        setTasks(updatedTasks);
        saveToLocalStorage(STORAGE_KEY, updatedTasks);
        console.log('💾 [updateTask] Saved to localStorage');
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...(input.title && { title: input.title }),
          ...(input.completed !== undefined && { completed: input.completed }),
          ...(input.percentage !== undefined && { percentage: input.percentage }),
          ...(input.type && { type: input.type }),
          ...(input.folder_id !== undefined && { folder_id: input.folder_id }),
          ...(input.order_index !== undefined && { order_index: input.order_index }),
          ...(input.event_id !== undefined && { event_id: input.event_id }),
          ...(input.event_start !== undefined && { event_start: input.event_start }),
          ...(input.archived !== undefined && { archived: input.archived }),
          ...(input.blocked !== undefined && { blocked: input.blocked }),
          ...(input.block_reason !== undefined && { block_reason: input.block_reason }),
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTasks(prev => {
          const updated = prev.map(task => task.id === input.id ? data : task);
          saveToLocalStorage(STORAGE_KEY, updated);
          return updated;
        });
      }
      } catch (error) {
        console.error('Error updating task:', error);
        
        // Fallback: update locally
        const updatedTasks = tasks.map(task => {
          if (task.id === input.id) {
            return {
              ...task,
              ...(input.title && { title: input.title }),
              ...(input.completed !== undefined && { completed: input.completed }),
              ...(input.percentage !== undefined && { percentage: input.percentage }),
              ...(input.type && { type: input.type }),
              ...(input.folder_id !== undefined && { folder_id: input.folder_id }),
              ...(input.order_index !== undefined && { order_index: input.order_index }),
              ...(input.event_id !== undefined && { event_id: input.event_id }),
              ...(input.event_start !== undefined && { event_start: input.event_start }),
              ...(input.archived !== undefined && { archived: input.archived }),
              ...(input.blocked !== undefined && { blocked: input.blocked }),
              ...(input.block_reason !== undefined && { block_reason: input.block_reason }),
              updated_at: new Date().toISOString(),
            };
          }
          return task;
        });
        
        setTasks(updatedTasks);
        saveToLocalStorage(STORAGE_KEY, updatedTasks);
      }
    };

  // Delete task
  const deleteTask = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
      const filteredTasks = tasks.filter(task => task.id !== id);
      saveToLocalStorage(STORAGE_KEY, filteredTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
      
      // Fallback: delete locally
      setTasks(prev => prev.filter(task => task.id !== id));
    }
  };

  // Toggle task completion
  const toggleTask = async (id: string): Promise<void> => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const wasCompleted = task.completed;
      const willBeCompleted = !task.completed;
      await updateTask({ id, completed: willBeCompleted });
      
      // Si tâche complétée → auto-créer les suivantes (follow-up, livraison, etc.)
      if (!wasCompleted && willBeCompleted) {
        setTimeout(async () => {
          try {
            // Récupérer les tâches actuelles depuis le localStorage
            const storedTasks = localStorage.getItem(STORAGE_KEY);
            const currentTasks = storedTasks ? JSON.parse(storedTasks) : [];

            const autoCreateResponse = await fetch('/api/tasks/auto-create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                taskTitle: task.title,
                taskType: task.type,
                taskPercentage: task.percentage,
                taskCompleted: true, // Indique que c'est une tâche complétée
                allTasks: currentTasks,
                eventStart: task.event_start,
              }),
            });

            if (autoCreateResponse.ok) {
              const autoData = await autoCreateResponse.json();
              if (autoData.tasks && autoData.tasks.length > 0) {
                console.log('🤖 [Auto-Create] Follow-up tasks:', autoData.tasks);
                window.dispatchEvent(new CustomEvent('tasks-auto-suggested', {
                  detail: { originalTask: task, suggestedTasks: autoData.tasks, isFollowUp: true }
                }));
              }
            }
          } catch (err) {
            console.error('⚠️ [Auto-Create] Error:', err);
          }
        }, 500);
      }
    }
  };

  // Duplicate task
  const duplicateTask = async (id: string): Promise<Task | null> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    const duplicatedInput: CreateTaskInput = {
      title: `${task.title} (copie)`,
      type: task.type,
      event_start: task.event_start,
    };

    return await createTask(duplicatedInput);
  };

  // Archive task
  const archiveTask = async (id: string): Promise<void> => {
    await updateTask({ id, archived: true });
  };

  // Block task
  const blockTask = async (id: string, reason: string): Promise<void> => {
    await updateTask({ id, blocked: true, block_reason: reason });
  };

  // Unblock task
  const unblockTask = async (id: string): Promise<void> => {
    await updateTask({ id, blocked: false, block_reason: undefined });
  };

  // Filtered tasks based on current filter
  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    if (filter === 'archived') return task.archived;
    // Par défaut, ne pas afficher les tâches archivées
    if (filter === 'all') return !task.archived;
    return true;
  });

  // Auto-group tasks intelligently
  const suggestAutoGroup = async (): Promise<any[]> => {
    try {
      const response = await fetch('/api/tasks/auto-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: filteredTasks }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.groups || [];
      }
    } catch (error) {
      console.error('Error auto-grouping:', error);
    }
    return [];
  };

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    loading,
    filter,
    setFilter,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    duplicateTask,
    archiveTask,
    blockTask,
    unblockTask,
    refetch: fetchTasks,
    suggestAutoGroup,
  };
}


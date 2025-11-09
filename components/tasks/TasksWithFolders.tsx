'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, DragStartEvent } from '@dnd-kit/core';
import { Task, Folder } from '@/types';
import { DraggableTaskItem } from './DraggableTaskItem';
import { TaskItem } from './TaskItem';
import { AnimatePresence } from 'framer-motion';
import { useFolders } from '@/hooks/useFolders';
import { logger } from '@/lib/logger';

interface TasksWithFoldersProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTask: (taskId: string, folderId: string | null) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onBlock?: (id: string, reason: string) => void;
  onRefetch?: () => Promise<void>;
  onCreateTask?: (task: any) => Promise<any>;
  onSendToAI?: (taskTitle: string) => void;
  onAddToFolder?: (taskId: string, folderId: string) => void;
  folders?: any[];
}

export function TasksWithFolders({ 
  tasks, 
  onToggle, 
  onDelete, 
  onUpdateTask,
  onDuplicate,
  onArchive,
  onBlock,
  onRefetch,
  onCreateTask,
  onSendToAI,
  onAddToFolder,
  folders = [],
}: TasksWithFoldersProps) {
  const { 
    createFolder,
    generateFolderSummary,
  } = useFolders();
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de mouvement avant d'activer le drag
      },
    })
  );

  // Ne montrer que les tâches sans dossier (les dossiers sont dans l'overlay)
  const tasksWithoutFolder = tasks.filter(t => !t.folder_id);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'task') {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    logger.info('🎯 Drag ended:', {
      activeId: active.id,
      overId: over?.id,
      activeData: active.data.current,
      overData: over?.data.current,
    });

    if (!over) {
      logger.info('❌ No drop target');
      return;
    }

    const draggedTask = active.data.current?.task as Task;
    if (!draggedTask) {
      logger.info('❌ No dragged task');
      return;
    }

    logger.info('✅ Dragged task:', draggedTask.title);

    // Case 1: Dropped on a folder
    if (over.data.current?.type === 'folder') {
      logger.info('📁 Dropped on folder');
      const folderId = over.data.current.folderId;
      onUpdateTask(draggedTask.id, folderId);
      
      // Regenerate summary
      const folderTasks = tasks.filter(t => 
        t.folder_id === folderId || t.id === draggedTask.id
      );
      generateFolderSummary(folderId, folderTasks);
      return;
    }

    // Case 2: Dropped on another task (create folder)
    if (over.data.current?.type === 'task') {
      const targetTask = over.data.current.task as Task;
      logger.info('📋 Dropped on task:', targetTask.title);
      
      // Don't create folder if dropped on itself
      if (draggedTask.id === targetTask.id) {
        logger.info('⚠️ Dropped on itself, skipping');
        return;
      }
      
      // Don't create folder if both tasks are already in the same folder
      if (draggedTask.folder_id && draggedTask.folder_id === targetTask.folder_id) {
        logger.info('⚠️ Both tasks already in same folder, skipping');
        return;
      }

      logger.info('🆕 Creating new folder...');
      
      // Create new folder
      const newFolder = await createFolder({
        name: `${draggedTask.title.slice(0, 20)}...`,
      });

      logger.info('📁 New folder created:', newFolder);

      if (newFolder) {
        // Add both tasks to the folder
        logger.info('➕ Adding tasks to folder...');
        await onUpdateTask(draggedTask.id, newFolder.id);
        if (!targetTask.folder_id) {
          await onUpdateTask(targetTask.id, newFolder.id);
        }
        
        // Generate summary
        logger.info('🤖 Generating summary...');
        generateFolderSummary(newFolder.id, [draggedTask, targetTask]);
      } else {
        logger.error('❌ Failed to create folder');
      }
      return;
    }

    logger.info('🔄 Dropped on empty space');
    // Case 3: Dropped on empty space (remove from folder)
    if (draggedTask.folder_id) {
      logger.info('📤 Removing task from folder');
      onUpdateTask(draggedTask.id, null);
    }
  };


  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-2 pt-2">
        {/* Render tasks without folder (folders are in overlay) */}
        <AnimatePresence mode="popLayout">
          {tasksWithoutFolder.map((task) => (
            <DraggableTaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onArchive={onArchive}
              onBlock={onBlock}
              onRefetch={onRefetch}
              onSendToAI={onSendToAI}
              onAddToFolder={onAddToFolder}
              folders={folders}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeTask && (
          <div className="opacity-80">
            <TaskItem
              task={activeTask}
              onToggle={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}


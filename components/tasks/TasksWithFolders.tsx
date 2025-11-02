'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, DragStartEvent } from '@dnd-kit/core';
import { Task, Folder } from '@/types';
import { DraggableTaskItem } from './DraggableTaskItem';
import { FolderItem } from '@/components/folders/FolderItem';
import { TaskItem } from './TaskItem';
import { AnimatePresence } from 'framer-motion';
import { useFolders } from '@/hooks/useFolders';

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
}: TasksWithFoldersProps) {
  const { 
    folders, 
    generatingSummary,
    updateFolder, 
    deleteFolder, 
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

  // Séparer les tâches : celles dans des dossiers et celles sans dossier
  const tasksWithoutFolder = tasks.filter(t => !t.folder_id);
  const tasksInFolders = folders.map(folder => ({
    folder,
    tasks: tasks.filter(t => t.folder_id === folder.id),
  }));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'task') {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    console.log('🎯 Drag ended:', {
      activeId: active.id,
      overId: over?.id,
      activeData: active.data.current,
      overData: over?.data.current,
    });

    if (!over) {
      console.log('❌ No drop target');
      return;
    }

    const draggedTask = active.data.current?.task as Task;
    if (!draggedTask) {
      console.log('❌ No dragged task');
      return;
    }

    console.log('✅ Dragged task:', draggedTask.title);

    // Case 1: Dropped on a folder
    if (over.data.current?.type === 'folder') {
      console.log('📁 Dropped on folder');
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
      console.log('📋 Dropped on task:', targetTask.title);
      
      // Don't create folder if dropped on itself
      if (draggedTask.id === targetTask.id) {
        console.log('⚠️ Dropped on itself, skipping');
        return;
      }
      
      // Don't create folder if both tasks are already in the same folder
      if (draggedTask.folder_id && draggedTask.folder_id === targetTask.folder_id) {
        console.log('⚠️ Both tasks already in same folder, skipping');
        return;
      }

      console.log('🆕 Creating new folder...');
      
      // Create new folder
      const newFolder = await createFolder({
        name: `${draggedTask.title.slice(0, 20)}...`,
      });

      console.log('📁 New folder created:', newFolder);

      if (newFolder) {
        // Add both tasks to the folder
        console.log('➕ Adding tasks to folder...');
        await onUpdateTask(draggedTask.id, newFolder.id);
        if (!targetTask.folder_id) {
          await onUpdateTask(targetTask.id, newFolder.id);
        }
        
        // Generate summary
        console.log('🤖 Generating summary...');
        generateFolderSummary(newFolder.id, [draggedTask, targetTask]);
      } else {
        console.error('❌ Failed to create folder');
      }
      return;
    }

    console.log('🔄 Dropped on empty space');
    // Case 3: Dropped on empty space (remove from folder)
    if (draggedTask.folder_id) {
      console.log('📤 Removing task from folder');
      onUpdateTask(draggedTask.id, null);
    }
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    updateFolder({ id: folderId, name: newName });
  };

  const handleDeleteFolder = (folderId: string) => {
    // Remove folder_id from all tasks in this folder
    const tasksInFolder = tasks.filter(t => t.folder_id === folderId);
    tasksInFolder.forEach(task => {
      onUpdateTask(task.id, null);
    });
    
    deleteFolder(folderId);
  };

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-2 pt-2">
        {/* Render folders with their tasks */}
        {tasksInFolders.map(({ folder, tasks: folderTasks }) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            tasks={folderTasks}
            onRename={handleRenameFolder}
            onDelete={handleDeleteFolder}
            onToggleTask={onToggle}
            onDeleteTask={onDelete}
            onDuplicateTask={onDuplicate}
            onArchiveTask={onArchive}
            onBlockTask={onBlock}
            onGenerateSummary={generateFolderSummary}
            isGeneratingSummary={generatingSummary === folder.id}
            onRefetch={onRefetch}
            onUpdateFolder={(id, updates) => updateFolder({ id, ...updates })}
          />
        ))}

        {/* Render tasks without folder */}
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


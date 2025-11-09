'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Folder, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFolders } from '@/hooks/useFolders';
import { FolderItem } from './FolderItem';
import { Task, Folder as FolderType } from '@/types';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, DragStartEvent } from '@dnd-kit/core';
import { TaskItem } from '@/components/tasks/TaskItem';

interface FoldersOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (taskId: string, folderId: string | null) => void;
  onDuplicateTask?: (id: string) => void;
  onArchiveTask?: (id: string) => void;
  onBlockTask?: (id: string, reason: string) => void;
  onRefetch?: () => Promise<void>;
}

export function FoldersOverlay({
  isOpen,
  onClose,
  tasks,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onDuplicateTask,
  onArchiveTask,
  onBlockTask,
  onRefetch,
}: FoldersOverlayProps) {
  const {
    folders,
    generatingSummary,
    createFolder,
    updateFolder,
    deleteFolder,
    generateFolderSummary,
  } = useFolders();

  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Créer le dossier "Tâches faites" s'il n'existe pas
  useEffect(() => {
    if (isOpen) {
      const completedFolder = folders.find(f => f.name === 'Tâches faites');
      if (!completedFolder) {
        createFolder({ name: 'Tâches faites' });
      }
    }
  }, [isOpen, folders, createFolder]);

  const tasksInFolders = folders.map(folder => ({
    folder,
    tasks: tasks.filter(t => t.folder_id === folder.id),
  }));

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    setIsCreatingFolder(true);
    await createFolder({ name: newFolderName.trim() });
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'task') {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const draggedTask = active.data.current?.task as Task;
    if (!draggedTask) return;

    // Case 1: Dropped on a folder
    if (over.data.current?.type === 'folder') {
      const folderId = over.data.current.folderId;
      onUpdateTask(draggedTask.id, folderId);
      
      const folderTasks = tasks.filter(t => 
        t.folder_id === folderId || t.id === draggedTask.id
      );
      generateFolderSummary(folderId, folderTasks);
      return;
    }

    // Case 2: Dropped on another task (create folder)
    if (over.data.current?.type === 'task') {
      const targetTask = over.data.current.task as Task;
      
      if (draggedTask.id === targetTask.id) return;
      if (draggedTask.folder_id && draggedTask.folder_id === targetTask.folder_id) return;

      const newFolder = await createFolder({
        name: `${draggedTask.title.slice(0, 20)}...`,
      });

      if (newFolder) {
        await onUpdateTask(draggedTask.id, newFolder.id);
        if (!targetTask.folder_id) {
          await onUpdateTask(targetTask.id, newFolder.id);
        }
        generateFolderSummary(newFolder.id, [draggedTask, targetTask]);
      }
      return;
    }

    // Case 3: Dropped on empty space (remove from folder)
    if (draggedTask.folder_id) {
      onUpdateTask(draggedTask.id, null);
    }
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    updateFolder({ id: folderId, name: newName });
  };

  const handleDeleteFolder = (folderId: string) => {
    const tasksInFolder = tasks.filter(t => t.folder_id === folderId);
    tasksInFolder.forEach(task => {
      onUpdateTask(task.id, null);
    });
    deleteFolder(folderId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />

          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-12 lg:inset-24 bg-black/95 border border-white/10 rounded-lg z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-white/60" />
                <h2 className="text-sm font-medium text-white/90">Dossiers</h2>
                <span className="text-xs text-white/40">({folders.length})</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="h-4 w-4 text-white/60" />
              </Button>
            </div>

            {/* Create Folder Input */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateFolder();
                    }
                  }}
                  placeholder="Nom du nouveau dossier..."
                  className="flex-1 bg-white/5 border-white/10 text-xs"
                />
                <Button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || isCreatingFolder}
                  size="sm"
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Créer
                </Button>
              </div>
            </div>

            {/* Folders List */}
            <div className="flex-1 overflow-y-auto p-4">
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-3">
                  {tasksInFolders.map(({ folder, tasks: folderTasks }) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      tasks={folderTasks}
                      onRename={handleRenameFolder}
                      onDelete={handleDeleteFolder}
                      onToggleTask={onToggleTask}
                      onDeleteTask={onDeleteTask}
                      onDuplicateTask={onDuplicateTask}
                      onArchiveTask={onArchiveTask}
                      onBlockTask={onBlockTask}
                      onGenerateSummary={generateFolderSummary}
                      isGeneratingSummary={generatingSummary === folder.id}
                      onRefetch={onRefetch}
                      onUpdateFolder={(id, updates) => updateFolder({ id, ...updates })}
                    />
                  ))}
                </div>

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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


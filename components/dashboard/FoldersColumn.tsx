'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFolders } from '@/hooks/useFolders';
import { FolderItem } from '@/components/folders/FolderItem';
import { Task, Folder as FolderType } from '@/types';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, DragStartEvent } from '@dnd-kit/core';
import { TaskItem } from '@/components/tasks/TaskItem';

interface FoldersColumnProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (taskId: string, folderId: string | null) => void;
  onDuplicateTask?: (id: string) => void;
  onArchiveTask?: (id: string) => void;
  onBlockTask?: (id: string, reason: string) => void;
  onRefetch?: () => Promise<void>;
}

export function FoldersColumn({
  tasks,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onDuplicateTask,
  onArchiveTask,
  onBlockTask,
  onRefetch,
}: FoldersColumnProps) {
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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      await createFolder({ name: newFolderName.trim() });
      setNewFolderName('');
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleRenameFolder = async (id: string, newName: string) => {
    await updateFolder({ id, name: newName });
  };

  const handleDeleteFolder = async (id: string) => {
    await deleteFolder(id);
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

    if (over.data.current?.type === 'folder') {
      const folderId = over.data.current.folderId;
      await onUpdateTask(draggedTask.id, folderId);
      
      // Generate summary if folder has tasks
      const folderTasks = tasks.filter(t => t.folder_id === folderId);
      if (folderTasks.length > 0) {
        const folder = folders.find(f => f.id === folderId);
        if (folder && !folder.summary) {
          generateFolderSummary(folderId, folderTasks);
        }
      }
    } else if (over.id === 'remove-from-folder') {
      await onUpdateTask(draggedTask.id, null);
    }
  };

  // Group tasks by folder
  const tasksByFolder = folders.reduce((acc, folder) => {
    acc[folder.id] = tasks.filter(t => t.folder_id === folder.id);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-xs text-white/40">Dossiers</h2>
        </div>

        {/* Create Folder Input */}
        <div className="mb-4 shrink-0">
          <div className="flex gap-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                }
              }}
              placeholder="Nouveau dossier..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
            <Button
              onClick={handleCreateFolder}
              disabled={isCreatingFolder || !newFolderName.trim()}
              size="sm"
              className="bg-white/10 hover:bg-white/20"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Folders List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {folders.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-sm">
                Aucun dossier
              </div>
            ) : (
              folders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  tasks={tasksByFolder[folder.id] || []}
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
              ))
            )}
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
      </div>
    </DndContext>
  );
}


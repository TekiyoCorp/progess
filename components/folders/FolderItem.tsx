'use client';

import { useState, useEffect } from 'react';
import { Folder, Task } from '@/types';
import { FolderHeader } from './FolderHeader';
import { FolderSummary } from './FolderSummary';
import { TaskItem } from '@/components/tasks/TaskItem';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';

interface FolderItemProps {
  folder: Folder;
  tasks: Task[];
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDuplicateTask?: (id: string) => void;
  onArchiveTask?: (id: string) => void;
  onBlockTask?: (id: string, reason: string) => void;
  onGenerateSummary: (folderId: string, tasks: Task[]) => void;
  isGeneratingSummary?: boolean;
  onRefetch?: () => Promise<void>;
  onUpdateFolder?: (id: string, updates: any) => void;
}

export function FolderItem({
  folder,
  tasks,
  onRename,
  onDelete,
  onToggleTask,
  onDeleteTask,
  onDuplicateTask,
  onArchiveTask,
  onBlockTask,
  onGenerateSummary,
  isGeneratingSummary,
  onRefetch,
  onUpdateFolder,
}: FolderItemProps) {
  // Dossiers fermés par défaut au chargement
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Setup droppable zone for this folder
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: {
      type: 'folder',
      folderId: folder.id,
    },
  });

  // Generate summary when folder is created or tasks change
  useEffect(() => {
    if (!folder.summary && tasks.length > 0) {
      onGenerateSummary(folder.id, tasks);
    }
  }, [folder.id, folder.summary, tasks.length]);

  const handleRename = (newName: string) => {
    onRename(folder.id, newName);
  };

  const handleDelete = () => {
    if (confirm(`Supprimer le dossier "${folder.name}" ? Les tâches seront conservées.`)) {
      onDelete(folder.id);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`border border-white/10 rounded-lg p-2 mb-3 transition-colors ${
        isOver ? 'border-pink-400/50 bg-pink-400/5' : ''
      }`}
    >
      {/* Folder Header */}
      <FolderHeader
        folder={folder}
        name={folder.name}
        isExpanded={isExpanded}
        taskCount={tasks.length}
        onToggle={() => setIsExpanded(!isExpanded)}
        onRename={handleRename}
        onDelete={handleDelete}
        onUpdatePrice={onUpdateFolder ? (price) => onUpdateFolder(folder.id, { price }) : undefined}
      />

      {/* Folder Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-6 mt-1">
              {/* Folder Summary */}
              <FolderSummary 
                summary={folder.summary} 
                isGenerating={isGeneratingSummary}
              />

              {/* Tasks in folder */}
              <div className="space-y-1">
                {tasks.length === 0 ? (
                  <p className="text-xs text-white/30 py-2">
                    Glissez des tâches ici
                  </p>
                ) : (
                  tasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onDelete={onDeleteTask}
                      onDuplicate={onDuplicateTask}
                      onArchive={onArchiveTask}
                      onBlock={onBlockTask}
                      onRefetch={onRefetch}
                    />
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}



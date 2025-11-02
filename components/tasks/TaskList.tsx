'use client';

import { Task } from '@/types';
import { TaskItem } from './TaskItem';
import { AnimatePresence } from 'framer-motion';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onBlock?: (id: string, reason: string) => void;
  onRefetch?: () => Promise<void>;
}

export function TaskList({ tasks, onToggle, onDelete, onDuplicate, onArchive, onBlock, onRefetch }: TaskListProps) {
  return (
    <div className="space-y-0.5 pt-2">
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => (
          <TaskItem
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
  );
}


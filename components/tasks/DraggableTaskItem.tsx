'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';
import { TaskItem } from './TaskItem';

interface DraggableTaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onBlock?: (id: string, reason: string) => void;
  onRefetch?: () => Promise<void>;
}

export function DraggableTaskItem({ task, onToggle, onDelete, onDuplicate, onArchive, onBlock, onRefetch }: DraggableTaskItemProps) {
  // Make task draggable
  const { attributes, listeners, setNodeRef: setDragNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: {
      type: 'task',
      task,
    },
  });

  // Make task droppable (to create folders)
  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: `task-drop-${task.id}`,
    data: {
      type: 'task',
      task,
    },
  });

  // Combine refs
  const setRefs = (element: HTMLDivElement | null) => {
    setDragNodeRef(element);
    setDropNodeRef(element);
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setRefs} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={`touch-none transition-all duration-200 rounded ${
        isOver && !isDragging ? 'ring-2 ring-pink-400/50 bg-pink-400/5 scale-[1.02]' : ''
      }`}
    >
      <TaskItem 
        task={task} 
        onToggle={onToggle} 
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onArchive={onArchive}
        onBlock={onBlock}
        onRefetch={onRefetch}
      />
    </div>
  );
}


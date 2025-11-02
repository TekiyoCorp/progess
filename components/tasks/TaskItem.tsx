'use client';

import { Task } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { TaskContextMenu } from './TaskContextMenu';
import { TaskAttachmentUploader } from './TaskAttachmentUploader';
import { AttachmentViewer } from './AttachmentViewer';
import { TaskTimeSuggestions } from './TaskTimeSuggestions';
import { TaskAttachment } from '@/types';
import { Link as LinkIcon, FileText } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onBlock?: (id: string, reason: string) => void;
  onRefetch?: () => Promise<void>;
}

export function TaskItem({ task, onToggle, onDelete, onDuplicate, onArchive, onBlock, onRefetch }: TaskItemProps) {
  const { updateTask } = useTasks();
  const [showTip, setShowTip] = useState(false);
  const [tip, setTip] = useState(() => {
    const tips = JSON.parse(localStorage.getItem('task_tips') || '{}');
    return tips[task.id] || '';
  });
  const [loading, setLoading] = useState(false);
  const [displayedTip, setDisplayedTip] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  
  // Attachment viewer
  const [viewingAttachment, setViewingAttachment] = useState<TaskAttachment | null>(null);
  
  // Utiliser useCallback pour stabiliser la fonction et éviter les re-renders
  const handleAttachmentAdded = useCallback(async () => {
    // Refetch immédiatement pour mettre à jour l'UI
    if (onRefetch) {
      await onRefetch();
    }
  }, [onRefetch]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Debug: log si la tâche a une date
  useEffect(() => {
    if (task.event_start) {
      console.log('📅 [TaskItem] Task with date:', task.title, '→', task.event_start);
    }
  }, [task.event_start, task.title]);

  // Effet de typing lettre par lettre
  useEffect(() => {
    if (!showTip || !tip) return;

    setIsTyping(true);
    setDisplayedTip('');
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < tip.length) {
        setDisplayedTip(tip.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 20); // 20ms entre chaque lettre

    return () => clearInterval(typingInterval);
  }, [tip, showTip]);

  const getTip = async () => {
    // Si on a déjà un conseil, toggle l'affichage
    if (tip) {
      setShowTip(!showTip);
      return;
    }

    // Sinon, charger depuis l'API
    setLoading(true);
    try {
      const res = await fetch('/api/solve-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: `Conseil pour: ${task.title}`,
          createTask: false, // Ne pas créer de tâche pour un conseil
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        let newTip = data.solution;
        
        // Nettoyer le texte : enlever **Action**: et tous les préfixes similaires
        newTip = newTip
          .replace(/\*\*Action\*\*:\s*/gi, '')           // **Action**:
          .replace(/\*\*Action\*\*/gi, '')               // **Action**
          .replace(/Action:\s*/gi, '')                   // Action:
          .replace(/^\*\*[^*]+\*\*:\s*/gm, '')          // **Autre**:
          .replace(/^\d+\.\s*\*\*Action\*\*:\s*/gm, '') // 1. **Action**:
          .replace(/^[-•]\s*\*\*Action\*\*:\s*/gm, '')  // - **Action**:
          .trim();
        
        // Sauvegarder
        const tips = JSON.parse(localStorage.getItem('task_tips') || '{}');
        tips[task.id] = newTip;
        localStorage.setItem('task_tips', JSON.stringify(tips));
        
        setTip(newTip);
        setShowTip(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  // État pour l'édition de la date
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editedDate, setEditedDate] = useState('');

  // Format date for display: 12/04 - 13h45
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month} - ${hours}h${minutes}`;
  };

  // Parse date from "12/04 - 13h45" format
  const parseEditedDate = (dateStr: string): string | null => {
    const match = dateStr.match(/(\d{2})\/(\d{2})\s*-\s*(\d{2})h(\d{2})/);
    if (!match) return null;
    
    const [, day, month, hours, minutes] = match;
    const year = new Date().getFullYear();
    const date = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    
    return date.toISOString();
  };

  const handleDateClick = () => {
    if (task.event_start) {
      setEditedDate(formatEventDate(task.event_start));
      setIsEditingDate(true);
    }
  };

  const handleDateSave = async () => {
    const newDateISO = parseEditedDate(editedDate);
    if (newDateISO) {
      // TODO: Mettre à jour la date dans la DB
      console.log('📅 Nouvelle date:', newDateISO);
      // await onUpdateDate(task.id, newDateISO);
    }
    setIsEditingDate(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`py-1.5 space-y-2 group ${task.blocked ? 'opacity-50' : ''}`}
        onContextMenu={handleContextMenu}
      >
        {/* Badge bloquée */}
        {task.blocked && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-red-500 font-medium">
              Bloquée
            </span>
            {task.block_reason && (
              <span className="text-[10px] text-white/40">
                • {task.block_reason}
              </span>
            )}
          </div>
        )}

        {/* Ligne principale : checkbox + titre + date + boutons */}
        <div className="flex items-center gap-2">
        <Checkbox
          id={task.id}
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="shrink-0"
          data-slot="checkbox"
          aria-label={`Marquer la tâche "${task.title}" comme ${task.completed ? 'non complétée' : 'complétée'}`}
        />
        
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          <label
            htmlFor={task.id}
            className={`text-xs cursor-pointer break-words ${
              task.completed ? 'line-through text-white/30' : 'text-white/70'
            }`}
          >
            {task.title}
          </label>
          {task.event_start && (
            <div className="flex items-center gap-1">
              {isEditingDate ? (
                <input
                  type="text"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  onBlur={handleDateSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDateSave();
                    if (e.key === 'Escape') setIsEditingDate(false);
                  }}
                  className="text-[10px] bg-white/5 border border-white/20 rounded px-1 py-0.5 text-white/70 w-24"
                  placeholder="12/04 - 13h45"
                  autoFocus
                />
              ) : (
                <span 
                  onClick={handleDateClick}
                  className="text-[10px] text-white/40 hover:text-white/60 cursor-pointer transition-colors"
                >
                  {formatEventDate(task.event_start)}
                </span>
              )}
            </div>
          )}
          {!task.event_start && (
            <TaskTimeSuggestions
              taskId={task.id}
              taskTitle={task.title}
              taskType={task.type || 'other'}
              taskPercentage={task.percentage}
              onSelectTime={async (datetime) => {
                await updateTask({
                  id: task.id,
                  event_start: datetime,
                });
                if (onRefetch) await onRefetch();
              }}
            />
          )}
        </div>

        {/* Bouton IA */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 opacity-0 group-hover:opacity-100 h-5 w-5"
          onClick={getTip}
          disabled={loading}
        >
          {loading ? (
            <div className="w-3 h-3 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Image src="/star.svg" alt="" width={12} height={12} />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 opacity-0 group-hover:opacity-100 h-5 w-5"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-3 w-3 text-white/40" />
        </Button>
        
        <TaskAttachmentUploader 
          taskId={task.id} 
          onAttachmentAdded={handleAttachmentAdded}
        />
      </div>
      
      {/* Attachments */}
      {(() => {
        const attachments = Array.isArray(task.attachments) ? task.attachments : [];
        if (attachments.length === 0) return null;
        
        return (
        <div className="flex items-center gap-1 flex-wrap mt-1">
          {attachments.map((attachment) => (
            <button
              key={attachment.id}
              onClick={() => setViewingAttachment(attachment)}
              className="relative w-8 h-8 rounded-[8px] overflow-hidden border border-white/10 hover:border-white/30 transition-colors group/att"
              aria-label={`View ${attachment.name}`}
            >
              {attachment.type === 'image' && (
                <div className="relative w-full h-full">
                  <Image
                    src={attachment.url}
                    alt={attachment.name}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      console.error('❌ [TaskItem] Image load error:', attachment.url);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('✅ [TaskItem] Image loaded:', attachment.url);
                    }}
                  />
                </div>
              )}
              {attachment.type === 'pdf' && (
                <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-red-700/20 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-red-400" />
                </div>
              )}
              {attachment.type === 'link' && (
                <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-blue-700/20 flex items-center justify-center">
                  <LinkIcon className="h-4 w-4 text-blue-400" />
                </div>
              )}
            </button>
          ))}
        </div>
        );
      })()}

        {/* Conseil IA en dessous */}
        <AnimatePresence>
          {showTip && displayedTip && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2">
                <Image src="/star.svg" alt="" width={12} height={12} className="shrink-0 mt-0.5" />
                <p 
                  className="text-xs leading-relaxed flex-1 break-words"
                  style={{
                    background: 'linear-gradient(to right, rgb(244, 114, 182), rgb(168, 85, 247), rgb(96, 165, 250))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {displayedTip}
                  {isTyping && <span className="animate-pulse">▋</span>}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <TaskContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={handleCloseContextMenu}
            onDuplicate={() => onDuplicate?.(task.id)}
            onArchive={() => onArchive?.(task.id)}
            onBlock={(reason) => onBlock?.(task.id, reason)}
          />
        )}
      </AnimatePresence>
      
      {/* Attachment Viewer */}
      <AttachmentViewer
        attachment={viewingAttachment}
        isOpen={!!viewingAttachment}
        onClose={() => setViewingAttachment(null)}
      />
    </>
  );
}


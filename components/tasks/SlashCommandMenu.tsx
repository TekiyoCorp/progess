'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sparkles, FolderPlus, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export type SlashCommand = 
  | 'add-to-calendar'
  | 'generate-from-event'
  | 'create-folder'
  | 'solve-problem';

interface SlashCommandOption {
  id: SlashCommand;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface SlashCommandMenuProps {
  isOpen: boolean;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

const commands: SlashCommandOption[] = [
  {
    id: 'add-to-calendar',
    label: 'Ajouter au Calendar',
    description: 'Créer un événement Google Calendar',
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    id: 'generate-from-event',
    label: 'Tâches depuis événement',
    description: 'Générer des tâches depuis un événement',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 'create-folder',
    label: 'Créer un dossier',
    description: 'Organiser les tâches dans un dossier',
    icon: <FolderPlus className="h-4 w-4" />,
  },
  {
    id: 'solve-problem',
    label: 'Résoudre un problème',
    description: 'Ajouter dans la colonne Problèmes',
    icon: <AlertCircle className="h-4 w-4" />,
  },
];

export function SlashCommandMenu({ isOpen, onSelect, onClose, position }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % commands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(commands[selectedIndex].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className="absolute z-50 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl overflow-hidden"
        style={{
          top: position?.top || 0,
          left: position?.left || 0,
          minWidth: '280px',
        }}
      >
        <div className="p-1">
          {commands.map((command, index) => (
            <button
              key={command.id}
              onClick={() => onSelect(command.id)}
              className={`w-full flex items-start gap-3 px-3 py-2 rounded transition-colors text-left ${
                index === selectedIndex
                  ? 'bg-white/10'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="shrink-0 mt-0.5 text-white/60">
                {command.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/90 font-medium">
                  {command.label}
                </p>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {command.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}



'use client';

import { motion } from 'framer-motion';
import { Entity } from '@/types';
import { Plus, Briefcase, Code, Users, Building2 } from 'lucide-react';

interface MentionDropdownProps {
  entities: Entity[];
  onSelect: (entity: Entity | null) => void;
  position: { top: number; left: number };
}

const getEntityIcon = (type: string) => {
  switch (type) {
    case 'project':
      return Briefcase;
    case 'developer':
      return Code;
    case 'colleague':
      return Users;
    case 'client':
      return Building2;
    default:
      return Briefcase;
  }
};

export function MentionDropdown({ entities, onSelect, position }: MentionDropdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed z-[9999] bg-black/95 border border-white/20 rounded-lg p-2 min-w-[250px] max-w-[350px] backdrop-blur-sm max-h-[300px] overflow-y-auto shadow-2xl"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        transform: 'translateY(8px)'
      }}
    >
      {entities.length > 0 && (
        <div className="space-y-0.5 mb-2">
          {entities.map((entity) => {
            const Icon = getEntityIcon(entity.type);
            return (
              <button
                key={entity.id}
                onClick={() => onSelect(entity)}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-white/10 transition-colors group flex items-center gap-2"
              >
                <Icon className="h-3 w-3 text-white/40 group-hover:text-white/60" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/70 group-hover:text-white/90 truncate">
                    {entity.name}
                  </div>
                  <div className="text-[10px] text-white/40 capitalize">
                    {entity.type}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      
      <div className="border-t border-white/10 pt-2">
        <button
          onClick={() => onSelect(null)}
          className="w-full text-left px-2 py-1.5 rounded hover:bg-white/10 transition-colors group flex items-center gap-2"
        >
          <Plus className="h-3 w-3 text-white/40 group-hover:text-white/60" />
          <span className="text-xs text-white/70 group-hover:text-white/90">
            Créer une nouvelle entité
          </span>
        </button>
      </div>
    </motion.div>
  );
}


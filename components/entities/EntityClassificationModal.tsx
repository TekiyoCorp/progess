'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DarkVeilWrapper } from '@/components/DarkVeilWrapper';
import { X, Briefcase, Code, Users, Building2 } from 'lucide-react';

interface EntityClassificationModalProps {
  isOpen: boolean;
  entityName: string;
  onClassify: (type: 'project' | 'developer' | 'colleague' | 'client', description?: string) => void;
  onClose: () => void;
}

const entityTypes = [
  { value: 'project' as const, label: 'Projet', icon: Briefcase, description: 'Un projet ou une mission' },
  { value: 'developer' as const, label: 'Développeur', icon: Code, description: 'Un développeur externe' },
  { value: 'colleague' as const, label: 'Collègue', icon: Users, description: 'Un collègue ou collaborateur' },
  { value: 'client' as const, label: 'Client', icon: Building2, description: 'Un client ou prospect' },
];

export function EntityClassificationModal({ isOpen, entityName, onClassify, onClose }: EntityClassificationModalProps) {
  const [selectedType, setSelectedType] = useState<'project' | 'developer' | 'colleague' | 'client' | null>(null);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (selectedType) {
      onClassify(selectedType, description || undefined);
      setSelectedType(null);
      setDescription('');
    }
  };

  if (!isOpen) return null;

  return (
    <DarkVeilWrapper onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-black/90 border border-white/10 rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-white/90">Nouvelle entité</h3>
            <p className="text-xs text-white/50 mt-1">
              <span className="text-white/70 font-medium">{entityName}</span> — Qu'est-ce que c'est ?
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 text-white/40 hover:text-white/80"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Type Selection */}
        <div className="space-y-2 mb-4">
          {entityTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                  isSelected
                    ? 'bg-white/10 border-white/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <Icon className={`h-4 w-4 mt-0.5 ${isSelected ? 'text-white/90' : 'text-white/50'}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium ${isSelected ? 'text-white/90' : 'text-white/70'}`}>
                    {type.label}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">
                    {type.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Description (optional) */}
        {selectedType && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-4"
          >
            <label className="text-xs text-white/60 mb-1.5 block">
              Description (optionnel)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ajouter une description..."
              className="text-xs bg-white/5 border-white/20 text-white/90"
            />
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 text-xs text-white/60 hover:text-white/90"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedType}
            className="flex-1 text-xs bg-white/10 hover:bg-white/20 text-white/90 disabled:opacity-30"
          >
            Créer
          </Button>
        </div>
      </motion.div>
    </DarkVeilWrapper>
  );
}


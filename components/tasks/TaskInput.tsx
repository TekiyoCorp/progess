'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { SlashCommandMenu, SlashCommand } from './SlashCommandMenu';
import { TaskSuggestions } from './TaskSuggestions';
import { MentionDropdown } from './MentionDropdown';
import { EntityClassificationModal } from '@/components/entities/EntityClassificationModal';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEntities } from '@/hooks/useEntities';
import { TaskSuggestion, Entity } from '@/types';
import { AnimatePresence } from 'framer-motion';

interface TaskInputProps {
  onAdd: (title: string, eventStart?: string, entityId?: string) => Promise<void>;
  onSlashCommand?: (command: SlashCommand, value: string) => void;
}

export function TaskInput({ onAdd, onSlashCommand }: TaskInputProps) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<string>('09');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [showCalendar, setShowCalendar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Autocomplétion
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestTimeout, setSuggestTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Mentions
  const { entities, createEntity, searchEntities } = useEntities();
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  
  // Formatter la date pour l'affichage
  const formatDisplayDate = () => {
    if (!selectedDate) return null;
    return `${format(selectedDate, 'dd/MM', { locale: fr })} - ${selectedHour}h${selectedMinute}`;
  };

  // Fetch suggestions from AI
  const fetchSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch('/api/tasks/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Détecter le "/"
    if (newValue === '/') {
      setShowSlashMenu(true);
      setShowSuggestions(false);
      setShowMentions(false);
      
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom,
          left: rect.left,
        });
      }
      return;
    } else {
      setShowSlashMenu(false);
    }

    // Détecter le "<" (équivalent de @)
    const atMatch = newValue.match(/<(\w*)$/);
    if (atMatch) {
      const search = atMatch[1];
      setMentionSearch(search);
      setShowMentions(true);
      setShowSuggestions(false);
      
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom,
          left: rect.left,
        });
      }
      return;
    } else {
      setShowMentions(false);
    }

    // Autocomplétion intelligente (après 3 caractères, avec debounce)
    if (newValue.length >= 3 && !newValue.includes('<') && !newValue.includes('/')) {
      if (suggestTimeout) {
        clearTimeout(suggestTimeout);
      }
      
      const timeout = setTimeout(() => {
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          setMenuPosition({
            top: rect.bottom,
            left: rect.left,
          });
        }
        fetchSuggestions(newValue);
        setShowSuggestions(true);
      }, 800);
      
      setSuggestTimeout(timeout);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSlashCommand = (command: SlashCommand) => {
    setShowSlashMenu(false);
    setValue('');
    
    if (onSlashCommand) {
      onSlashCommand(command, value.slice(1));
    }
  };

  const handleSelectSuggestion = (title: string) => {
    setValue(title);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSelectEntity = (entity: Entity | null) => {
    if (entity) {
      // Entité existante sélectionnée
      const beforeAt = value.substring(0, value.lastIndexOf('<'));
      setValue(`${beforeAt}<${entity.name} `);
      setSelectedEntity(entity);
      setShowMentions(false);
    } else {
      // Créer une nouvelle entité
      const atMatch = value.match(/<(\w+)$/);
      if (atMatch) {
        setNewEntityName(atMatch[1]);
        setShowEntityModal(true);
        setShowMentions(false);
      }
    }
  };

  const handleCreateEntity = async (
    type: 'project' | 'developer' | 'colleague' | 'client',
    description?: string
  ) => {
    const entity = await createEntity({
      name: newEntityName,
      type,
      description,
    });

    if (entity) {
      const beforeAt = value.substring(0, value.lastIndexOf('<'));
      setValue(`${beforeAt}<${entity.name} `);
      setSelectedEntity(entity);
    }

    setShowEntityModal(false);
    setNewEntityName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value.trim() || loading || value === '/' || value.includes('<')) return;

    setLoading(true);
    try {
      let eventStart: string | undefined = undefined;
      
      if (selectedDate) {
        const dateWithTime = new Date(selectedDate);
        dateWithTime.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);
        eventStart = dateWithTime.toISOString();
      }
      
      await onAdd(value.trim(), eventStart, selectedEntity?.id);
      setValue('');
      setSelectedDate(undefined);
      setSelectedHour('09');
      setSelectedMinute('00');
      setSelectedEntity(null);
      setSuggestions([]);
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les entités pour les mentions
  const filteredEntities = mentionSearch
    ? searchEntities(mentionSearch)
    : entities.slice(0, 5);

  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-1.5 items-center relative">
        {loading ? (
          <Loader2 className="h-3 w-3 text-white/40 shrink-0 animate-spin" />
        ) : (
          <Plus className="h-3 w-3 text-white/40 shrink-0" />
        )}
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          placeholder="Dis-moi ou tape ce que tu veux faire..."
          disabled={loading}
          className="flex-1 !bg-transparent border-none text-xs h-6 px-0 focus-visible:ring-0 text-white/60 placeholder:text-white/30 shadow-none"
          aria-label="Titre de la nouvelle tâche"
        />
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0 opacity-60 hover:opacity-100"
            >
              <CalendarIcon className="h-3 w-3 text-white/40" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-3 bg-black/95 border-white/10" 
            align="end"
            side="top"
            sideOffset={4}
          >
            <div className="space-y-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                disabled={(date) => false}
              />
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <span className="text-xs text-white/60 shrink-0">Heure:</span>
                <div className="flex items-center gap-1">
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(e.target.value)}
                    className="text-xs bg-white/5 border border-white/20 rounded px-1.5 py-1 text-white/70 focus:outline-none focus:ring-1 focus:ring-white/40 cursor-pointer"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-white/40">:</span>
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(e.target.value)}
                    className="text-xs bg-white/5 border border-white/20 rounded px-1.5 py-1 text-white/70 focus:outline-none focus:ring-1 focus:ring-white/40 cursor-pointer"
                  >
                    {Array.from({ length: 60 }, (_, i) => i).filter(i => i % 15 === 0).map((i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalendar(false)}
                  className="text-xs h-6 px-2 ml-auto text-white/60 hover:text-white/90"
                >
                  OK
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {formatDisplayDate() && (
          <span className="text-[10px] text-white/40 shrink-0">
            {formatDisplayDate()}
          </span>
        )}
        {selectedEntity && (
          <span className="text-[10px] text-purple-400 shrink-0">
            &lt;{selectedEntity.name}
          </span>
        )}
      </form>

      {/* Slash Commands */}
      <SlashCommandMenu
        isOpen={showSlashMenu}
        onSelect={handleSlashCommand}
        onClose={() => setShowSlashMenu(false)}
        position={menuPosition}
      />

      {/* Suggestions intelligentes */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <TaskSuggestions
            suggestions={suggestions}
            onSelect={handleSelectSuggestion}
            position={menuPosition}
          />
        )}
      </AnimatePresence>

      {/* Mentions dropdown */}
      <AnimatePresence>
        {showMentions && (
          <MentionDropdown
            entities={filteredEntities}
            onSelect={handleSelectEntity}
            position={menuPosition}
          />
        )}
      </AnimatePresence>

      {/* Modal de classification d'entité */}
      <EntityClassificationModal
        isOpen={showEntityModal}
        entityName={newEntityName}
        onClassify={handleCreateEntity}
        onClose={() => {
          setShowEntityModal(false);
          setNewEntityName('');
        }}
      />
    </>
  );
}

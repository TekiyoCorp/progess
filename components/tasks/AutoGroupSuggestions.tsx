'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFolders } from '@/hooks/useFolders';
import { useTasks } from '@/hooks/useTasks';

interface AutoGroup {
  name: string;
  task_ids: string[];
  reason: string;
  suggested_type: string;
}

interface AutoGroupSuggestionsProps {
  onDismiss: () => void;
}

export function AutoGroupSuggestions({ onDismiss }: AutoGroupSuggestionsProps) {
  const { allTasks, suggestAutoGroup, updateTask } = useTasks();
  const { createFolder } = useFolders();
  const [groups, setGroups] = useState<AutoGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, [allTasks]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const suggestedGroups = await suggestAutoGroup();
      setGroups(suggestedGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (group: AutoGroup) => {
    setCreating(group.name);
    try {
      // Créer le dossier
      const folder = await createFolder({
        name: group.name,
        order_index: 0,
      });

      if (folder) {
        // Déplacer les tâches dans le dossier
        for (const taskId of group.task_ids) {
          await updateTask({
            id: taskId,
            folder_id: folder.id,
          });
        }

        // Recharger les groupes
        await loadGroups();
      }
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setCreating(null);
    }
  };

  if (loading) {
    return (
      <div className="mb-3">
        <p className="text-[10px] text-white/40">Analyse des tâches...</p>
      </div>
    );
  }

  if (groups.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mb-3 group/container"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <FolderPlus className="w-3 h-3 text-white/40" />
          <span className="text-[10px] text-white/40">
            Regroupements suggérés ({groups.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 shrink-0 opacity-0 group-hover/container:opacity-100"
          onClick={onDismiss}
        >
          <X className="w-3 h-3 text-white/40" />
        </Button>
      </div>

      <div className="space-y-1">
        {groups.map((group, index) => {
          const groupTasks = allTasks.filter(t => group.task_ids.includes(t.id));
          return (
            <div
              key={index}
              className="flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-white/5 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70 truncate">
                  {group.name}
                </p>
                <p className="text-[10px] text-white/40">
                  {groupTasks.length} tâches
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-[10px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleCreateGroup(group)}
                disabled={creating === group.name}
              >
                {creating === group.name ? (
                  <div className="w-3 h-3 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Créer'
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}


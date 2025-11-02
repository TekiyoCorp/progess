'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTasks } from './useTasks';
import { useProblems } from './useProblems';
import { useFolders } from './useFolders';
import { Task, Problem, Folder, TaskFilter } from '@/types';

export type SearchResultType = 'task' | 'problem' | 'folder';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  data: Task | Problem | Folder;
  match: string; // partie du texte qui matche
}

export interface SearchFilters {
  type?: SearchResultType;
  dateRange?: { start: Date; end: Date };
  percentageRange?: { min: number; max: number };
  status?: 'all' | 'completed' | 'pending';
}

export function useSearch() {
  const { allTasks } = useTasks();
  const { problems } = useProblems();
  const { folders } = useFolders();

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selected index quand la recherche change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, filters]);

  // Fonction de recherche fuzzy simple
  const fuzzyMatch = (text: string, search: string): boolean => {
    const searchLower = search.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Recherche exacte
    if (textLower.includes(searchLower)) return true;
    
    // Recherche fuzzy (chaque lettre dans l'ordre)
    let searchIndex = 0;
    for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIndex]) {
        searchIndex++;
      }
    }
    return searchIndex === searchLower.length;
  };

  // Recherche dans les tâches
  const searchTasks = useMemo(() => {
    if (!query && !filters.type) return [];
    if (filters.type && filters.type !== 'task') return [];

    return allTasks
      .filter(task => {
        // Filtre par statut
        if (filters.status === 'completed' && !task.completed) return false;
        if (filters.status === 'pending' && task.completed) return false;
        
        // Filtre par date
        if (filters.dateRange) {
          const taskDate = new Date(task.created_at);
          if (taskDate < filters.dateRange.start || taskDate > filters.dateRange.end) {
            return false;
          }
        }
        
        // Filtre par pourcentage
        if (filters.percentageRange) {
          if (task.percentage < filters.percentageRange.min || task.percentage > filters.percentageRange.max) {
            return false;
          }
        }
        
        // Recherche textuelle
        return !query || fuzzyMatch(task.title, query);
      })
      .map(task => ({
        id: task.id,
        type: 'task' as SearchResultType,
        title: task.title,
        subtitle: `${task.percentage.toFixed(1)}% • ${task.completed ? 'Complétée' : 'En cours'}`,
        data: task,
        match: task.title,
      }));
  }, [allTasks, query, filters]);

  // Recherche dans les problèmes
  const searchProblems = useMemo(() => {
    if (!query && !filters.type) return [];
    if (filters.type && filters.type !== 'problem') return [];

    return problems
      .filter(problem => !query || fuzzyMatch(problem.title, query))
      .map(problem => ({
        id: problem.id,
        type: 'problem' as SearchResultType,
        title: problem.title,
        subtitle: problem.solved ? 'Résolu' : 'Non résolu',
        data: problem,
        match: problem.title,
      }));
  }, [problems, query, filters]);

  // Recherche dans les dossiers
  const searchFolders = useMemo(() => {
    if (!query && !filters.type) return [];
    if (filters.type && filters.type !== 'folder') return [];

    return folders
      .filter(folder => !query || fuzzyMatch(folder.name, query))
      .map(folder => ({
        id: folder.id,
        type: 'folder' as SearchResultType,
        title: folder.name,
        subtitle: folder.summary || `${folder.tasks?.length || 0} tâche(s)`,
        data: folder,
        match: folder.name,
      }));
  }, [folders, query, filters]);

  // Combiner tous les résultats
  const results: SearchResult[] = useMemo(() => {
    return [...searchTasks, ...searchProblems, ...searchFolders]
      .sort((a, b) => {
        // Trier par pertinence (exact match en premier)
        const aExact = a.title.toLowerCase() === query.toLowerCase();
        const bExact = b.title.toLowerCase() === query.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Puis par type (tasks > problems > folders)
        const typeOrder = { task: 0, problem: 1, folder: 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      });
  }, [searchTasks, searchProblems, searchFolders, query]);

  // Navigation clavier
  const selectNext = () => {
    setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
  };

  const selectPrevious = () => {
    setSelectedIndex(prev => Math.max(prev - 1, 0));
  };

  const getSelectedResult = () => {
    return results[selectedIndex] || null;
  };

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    selectedIndex,
    selectNext,
    selectPrevious,
    getSelectedResult,
  };
}


'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Problem, CreateProblemInput } from '@/types';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';

const STORAGE_KEY = 'tekiyo_problems';

export function useProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState<string | null>(null);
  const solveProblemWithAIRef = useRef<((id: string) => Promise<void>) | null>(null);
  const pendingAutoSolveRef = useRef<string | null>(null);
  const previousProblemsLengthRef = useRef(0);

  // Fetch problems from Supabase
  const fetchProblems = useCallback(async () => {
    try {
      // Check if supabase is available
      if (!supabase) {
        console.log('Using localStorage for problems');
        const localProblems = loadFromLocalStorage<Problem[]>(STORAGE_KEY, []);
        setProblems(localProblems);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setProblems(data);
        saveToLocalStorage(STORAGE_KEY, data);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
      // Fallback to localStorage
      const localProblems = loadFromLocalStorage<Problem[]>(STORAGE_KEY, []);
      setProblems(localProblems);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + Realtime subscription
  useEffect(() => {
    fetchProblems();
    
    // Supabase Realtime subscription
    if (supabase) {
      console.log('📡 [Problems] Setting up Realtime subscription...');
      
      const channel = supabase
        .channel('public:problems')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'problems' },
          (payload: any) => {
            console.log('🔥 [Problems] Realtime event:', payload.eventType, payload.new);
            fetchProblems();
          }
        )
        .subscribe((status: any) => {
          console.log('📡 [Problems] Subscription status:', status);
        });
      
      return () => {
        console.log('🔌 [Problems] Cleaning up Realtime subscription...');
        supabase.removeChannel(channel);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchProblems est stable (useCallback avec []), pas besoin de dépendance

  // Auto-solve quand un nouveau problème est créé et présent dans le state
  useEffect(() => {
    // Ne se déclencher que si un nouveau problème a été ajouté (length augmente)
    const hasNewProblem = problems.length > previousProblemsLengthRef.current;
    previousProblemsLengthRef.current = problems.length;
    
    if (pendingAutoSolveRef.current && solveProblemWithAIRef.current && hasNewProblem) {
      const problemId = pendingAutoSolveRef.current;
      
      // Vérifier que le problème existe vraiment dans le state ET qu'il n'est pas déjà résolu
      const problem = problems.find(p => p.id === problemId);
      
      if (problem && !problem.solved) {
        console.log('🤖 [Problems] Problem found in state, auto-solving...', problemId);
        pendingAutoSolveRef.current = null; // Clear le flag AVANT d'appeler (éviter double appel)
        
        // Petit délai pour laisser React finir son cycle de render
        setTimeout(() => {
          if (solveProblemWithAIRef.current) {
            solveProblemWithAIRef.current(problemId);
          }
        }, 100);
      }
    }
  }, [problems.length]); // Seulement quand la longueur change, pas tout le tableau

  // Create problem
  const createProblem = useCallback(async (input: CreateProblemInput): Promise<Problem | null> => {
    try {
      console.log('➕ [Problems] Creating problem:', input.title);
      let newProblem: Problem | null = null;

      // Try Supabase first
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('problems')
            .insert({
              title: input.title,
              solved: false,
            })
            .select()
            .single();

          if (!error && data) {
            newProblem = data;
            console.log('✅ [Problems] Problem created in Supabase:', data.id);
            // Mettre à jour l'état avec le problème
            setProblems(prev => {
              const updated = [...prev, data];
              saveToLocalStorage(STORAGE_KEY, updated);
              return updated;
            });
          }
        } catch (dbError) {
          console.log('⚠️ [Problems] Supabase unavailable, using localStorage');
        }
      }

      // Fallback: create problem locally
      if (!newProblem) {
        newProblem = {
          id: `local-${Date.now()}`,
          title: input.title,
          solved: false,
          created_at: new Date().toISOString(),
        };
        
        console.log('💾 [Problems] Problem created locally:', newProblem.id);
        
        setProblems(prev => {
          const updated = [...prev, newProblem!];
          saveToLocalStorage(STORAGE_KEY, updated);
          return updated;
        });
      }

      // Marquer le problème pour auto-solve (sera résolu par useEffect)
      if (newProblem) {
        console.log('📝 [Problems] Marking problem for auto-solve:', newProblem.id);
        pendingAutoSolveRef.current = newProblem.id;
      }

      return newProblem;
    } catch (error) {
      console.error('❌ [Problems] Error creating problem:', error);
      return null;
    }
  }, []);

  // Update problem (juste pour la base de données)
  const updateProblem = useCallback(async (input: Partial<Problem> & { id: string }): Promise<void> => {
    console.log('💾 [Problems] Saving to Supabase:', input.id);
    
    if (!supabase) return;
    
    try {
      const { error } = await supabase
        .from('problems')
        .update({
          ...(input.title && { title: input.title }),
          ...(input.solution !== undefined && { solution: input.solution }),
          ...(input.solved !== undefined && { solved: input.solved }),
        })
        .eq('id', input.id);

      if (error) throw error;
      console.log('✅ [Problems] Saved to Supabase');
    } catch (error) {
      console.error('❌ [Problems] Supabase error:', error);
    }
  }, []);

  // Delete problem
  const deleteProblem = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('problems')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProblems(prev => {
        const filtered = prev.filter(problem => problem.id !== id);
        saveToLocalStorage(STORAGE_KEY, filtered);
        return filtered;
      });
    } catch (error) {
      console.error('Error deleting problem:', error);
      
      // Fallback: delete locally
      setProblems(prev => {
        const filtered = prev.filter(problem => problem.id !== id);
        saveToLocalStorage(STORAGE_KEY, filtered);
        return filtered;
      });
    }
  }, []);

  // Solve problem with AI
  const solveProblemWithAI = useCallback(async (id: string): Promise<void> => {
    console.log('🔍 [Problems] Looking for problem:', id);
    setSolving(id);

    try {
      // Lire le problème depuis localStorage (source de vérité)
      const storedProblems = loadFromLocalStorage<Problem[]>(STORAGE_KEY, []);
      const problem = storedProblems.find(p => p.id === id);
      
      if (!problem) {
        console.error('❌ [Problems] Problem not found:', id);
        setSolving(null);
        return;
      }

      console.log('🤖 [Problems] Solving problem:', problem.title);

      const response = await fetch('/api/solve-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: problem.title,
          problemId: id,
          createTask: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to solve problem');

      const { solution, taskCreated } = await response.json();
      
      console.log('✅ [Problems] Solution received:', solution.substring(0, 50) + '...');

      // FORCER un nouveau tableau et un nouvel objet pour que React détecte le changement
      setProblems(prevProblems => {
        let found = false;
        const updatedProblems = prevProblems.map(p => {
          if (p.id === id) {
            found = true;
            console.log('🎯 [Problems] Updating problem:', p.title);
            // Créer un NOUVEL objet pour forcer le re-render (nouvelle référence)
            return {
              ...p,
              solution: solution, // Explicit pour être sûr
              solved: true,
              updated_at: new Date().toISOString(),
            };
          }
          return p; // Garder les autres comme ils sont (même référence = pas de re-render inutile)
        });
        
        // SOLUTION 2 : FALLBACK - Si le problème n'est pas dans prevProblems
        if (!found) {
          console.warn('⚠️ [Problems] Problem not found in state, loading from localStorage and adding...', id);
          
          // Charger depuis localStorage (source de vérité)
          const storedProblems = loadFromLocalStorage<Problem[]>(STORAGE_KEY, []);
          const problemFromStorage = storedProblems.find(p => p.id === id);
          
          if (problemFromStorage) {
            console.log('✅ [Problems] Found in localStorage, adding to state:', problemFromStorage.title);
            // Ajouter le problème depuis localStorage et le mettre à jour
            const updatedWithNew = [...prevProblems, {
              ...problemFromStorage,
              solution: solution,
              solved: true,
              updated_at: new Date().toISOString(),
            }];
            
            saveToLocalStorage(STORAGE_KEY, updatedWithNew);
            return updatedWithNew;
          } else {
            console.error('❌ [Problems] Problem not found anywhere:', id);
            return prevProblems; // Impossible de mettre à jour, garder l'état actuel
          }
        }
        
        console.log('🔄 [Problems] Updated', updatedProblems.length, 'problems');
        saveToLocalStorage(STORAGE_KEY, updatedProblems);
        
        // Sauvegarder en base (async, ne pas attendre)
        if (supabase) {
          updateProblem({
            id,
            solution,
            solved: true,
          }).catch(err => console.error('❌ [Problems] Failed to save to Supabase:', err));
        }
        
        if (taskCreated) {
          console.log('✅ [Problems] Task created to apply solution');
          // Realtime s'occupera de la mise à jour automatique
        }
        
        return updatedProblems;
      });
      
      setSolving(null);
    } catch (error) {
      console.error('❌ [Problems] Error solving problem:', error);
      setSolving(null);
    }
  }, [updateProblem]);

  // Stocker la référence pour createProblem
  solveProblemWithAIRef.current = solveProblemWithAI;

  return {
    problems,
    loading,
    solving,
    createProblem,
    updateProblem,
    deleteProblem,
    solveProblemWithAI,
    refetch: fetchProblems,
  };
}


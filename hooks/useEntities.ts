import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Entity, CreateEntityInput, UpdateEntityInput } from '@/types';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';

const STORAGE_KEY = 'tekiyo_entities';

export function useEntities() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch entities
  const fetchEntities = useCallback(async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('entities')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('⚠️ [Entities] Table may not exist yet:', error.message);
          // Utiliser localStorage en fallback
          const localData = loadFromLocalStorage<Entity[]>(STORAGE_KEY, []);
          setEntities(localData);
          setLoading(false);
          return;
        }

        setEntities(data || []);
        saveToLocalStorage(STORAGE_KEY, data || []);
      } else {
        const localData = loadFromLocalStorage<Entity[]>(STORAGE_KEY, []);
        setEntities(localData);
      }
    } catch (error) {
      console.warn('⚠️ [Entities] Fetch failed, using localStorage:', error);
      const localData = loadFromLocalStorage<Entity[]>(STORAGE_KEY, []);
      setEntities(localData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  // Create entity
  const createEntity = async (input: CreateEntityInput): Promise<Entity | null> => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('entities')
          .insert(input)
          .select()
          .single();

        if (error) throw error;

        await fetchEntities();
        return data;
      } else {
        const newEntity: Entity = {
          id: crypto.randomUUID(),
          ...input,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const updated = [newEntity, ...entities];
        setEntities(updated);
        saveToLocalStorage(STORAGE_KEY, updated);
        return newEntity;
      }
    } catch (error) {
      console.error('Error creating entity:', error);
      return null;
    }
  };

  // Update entity
  const updateEntity = async (input: UpdateEntityInput): Promise<void> => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('entities')
          .update(input)
          .eq('id', input.id);

        if (error) throw error;

        await fetchEntities();
      } else {
        const updated = entities.map(e =>
          e.id === input.id ? { ...e, ...input } : e
        );
        setEntities(updated);
        saveToLocalStorage(STORAGE_KEY, updated);
      }
    } catch (error) {
      console.error('Error updating entity:', error);
    }
  };

  // Delete entity
  const deleteEntity = async (id: string): Promise<void> => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('entities')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await fetchEntities();
      } else {
        const updated = entities.filter(e => e.id !== id);
        setEntities(updated);
        saveToLocalStorage(STORAGE_KEY, updated);
      }
    } catch (error) {
      console.error('Error deleting entity:', error);
    }
  };

  // Search entities
  const searchEntities = (query: string): Entity[] => {
    const lowerQuery = query.toLowerCase();
    return entities.filter(e =>
      e.name.toLowerCase().includes(lowerQuery)
    );
  };

  return {
    entities,
    loading,
    createEntity,
    updateEntity,
    deleteEntity,
    searchEntities,
    refetch: fetchEntities,
  };
}


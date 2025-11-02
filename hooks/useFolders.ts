'use client';

import { useState, useEffect } from 'react';
import { Folder, CreateFolderInput, UpdateFolderInput, Task } from '@/types';
import { supabase } from '@/lib/supabase';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(null);

  // Initial fetch + Realtime subscription
  useEffect(() => {
    fetchFolders();
    
    // Supabase Realtime subscription
    if (supabase) {
      console.log('📡 [Folders] Setting up Realtime subscription...');
      
      const channel = supabase
        .channel('public:folders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'folders' },
          (payload: any) => {
            console.log('🔥 [Folders] Realtime event:', payload.eventType, payload.new);
            fetchFolders();
          }
        )
        .subscribe((status: any) => {
          console.log('📡 [Folders] Subscription status:', status);
        });
      
      return () => {
        console.log('🔌 [Folders] Cleaning up Realtime subscription...');
        supabase.removeChannel(channel);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchFolders n'a pas de dépendances

  const fetchFolders = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        // Fallback localStorage
        const storedFolders = localStorage.getItem('folders');
        if (storedFolders) {
          setFolders(JSON.parse(storedFolders));
        }
        return;
      }

      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      // Fallback localStorage
      const storedFolders = localStorage.getItem('folders');
      if (storedFolders) {
        setFolders(JSON.parse(storedFolders));
      }
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (input: CreateFolderInput): Promise<Folder | null> => {
    try {
      const newFolder: Folder = {
        id: crypto.randomUUID(),
        name: input.name,
        order_index: input.order_index || folders.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (!supabase) {
        // Fallback localStorage
        const updatedFolders = [...folders, newFolder];
        setFolders(updatedFolders);
        localStorage.setItem('folders', JSON.stringify(updatedFolders));
        return newFolder;
      }

      const { data, error } = await supabase
        .from('folders')
        .insert([{
          name: input.name,
          order_index: input.order_index || folders.length,
        }])
        .select()
        .single();

      if (error) throw error;

      setFolders([...folders, data]);
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  };

  const updateFolder = async (input: UpdateFolderInput): Promise<void> => {
    try {
      console.log('💰 [Folders] Updating folder:', input);
      
      if (!supabase) {
        // Fallback localStorage
        const updatedFolders = folders.map(f =>
          f.id === input.id
            ? { ...f, ...input, updated_at: new Date().toISOString() }
            : f
        );
        setFolders(updatedFolders);
        localStorage.setItem('folders', JSON.stringify(updatedFolders));
        console.log('💰 [Folders] Updated in localStorage:', updatedFolders.find(f => f.id === input.id));
        return;
      }

      // Construire l'objet update sans champs undefined
      const updates: any = { updated_at: new Date().toISOString() };
      if (input.name !== undefined) updates.name = input.name;
      if (input.summary !== undefined) updates.summary = input.summary;
      if (input.order_index !== undefined) updates.order_index = input.order_index;
      if (input.price !== undefined) updates.price = input.price;

      console.log('💰 [Folders] Supabase update object:', updates);

      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', input.id)
        .select();

      if (error) {
        console.error('❌ [Folders] Supabase error:', error);
        throw error;
      }

      console.log('✅ [Folders] Supabase updated:', data);

      setFolders(folders.map(f =>
        f.id === input.id ? { ...f, ...input, updated_at: new Date().toISOString() } : f
      ));
      
      // Force localStorage sync
      const updatedFolders = folders.map(f =>
        f.id === input.id ? { ...f, ...input } : f
      );
      localStorage.setItem('folders', JSON.stringify(updatedFolders));
      console.log('💾 [Folders] Synced to localStorage');
    } catch (error) {
      console.error('❌ [Folders] Error updating folder:', error instanceof Error ? error.message : error);
    }
  };

  const deleteFolder = async (id: string): Promise<void> => {
    try {
      if (!supabase) {
        // Fallback localStorage
        const updatedFolders = folders.filter(f => f.id !== id);
        setFolders(updatedFolders);
        localStorage.setItem('folders', JSON.stringify(updatedFolders));
        return;
      }

      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFolders(folders.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  const generateFolderSummary = async (folderId: string, tasks: Task[]): Promise<void> => {
    if (tasks.length === 0) return;

    setGeneratingSummary(folderId);
    try {
      const response = await fetch('/api/folder-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const { summary } = await response.json();

      await updateFolder({ id: folderId, summary });
    } catch (error) {
      console.error('Error generating folder summary:', error);
    } finally {
      setGeneratingSummary(null);
    }
  };

  return {
    folders,
    loading,
    generatingSummary,
    createFolder,
    updateFolder,
    deleteFolder,
    generateFolderSummary,
    refetchFolders: fetchFolders,
  };
}



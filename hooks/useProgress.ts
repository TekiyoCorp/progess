// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';
import { getCurrentMonth, getCurrentYear, calculateTotalProgress, estimateAmount } from '@/lib/utils';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';

const STORAGE_KEY = 'tekiyo_progress';
const MONTHLY_GOAL = 50000;

export function useProgress(tasks: Task[]) {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Calculate current progress from completed tasks
  const currentPercentage = calculateTotalProgress(tasks);
  const currentAmount = estimateAmount(currentPercentage, MONTHLY_GOAL);
  
  // Fetch or create current month's progress
  const fetchProgress = useCallback(async () => {
    try {
      const month = getCurrentMonth();
      const year = getCurrentYear();

      if (!supabase) {
        // Fallback to localStorage
        const localProgress = loadFromLocalStorage<any>(STORAGE_KEY, null);
        if (!localProgress) {
          const newProgress = {
            id: crypto.randomUUID(),
            month,
            year,
            total_percentage: 0,
            amount_generated: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProgress(newProgress);
          saveToLocalStorage(STORAGE_KEY, newProgress);
        } else {
          setProgress(localProgress);
        }
        return;
      }

      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [Progress] Error fetching progress:', error);
        throw error;
      }

      if (data) {
        setProgress(data);
        saveToLocalStorage(STORAGE_KEY, data);
      } else {
        // Create progress record for current month
        const { data: newData, error: createError } = await supabase
          .from('progress')
          .insert({
            month,
            year,
            total_percentage: 0,
            amount_generated: 0,
          })
          .select()
          .single();

        if (createError) throw createError;

        if (newData) {
          setProgress(newData);
          saveToLocalStorage(STORAGE_KEY, newData);
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Fallback to localStorage
      const localProgress = loadFromLocalStorage<any>(STORAGE_KEY, null);
      setProgress(localProgress);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update progress in database
  const updateProgress = useCallback(async (percentage: number, amount: number) => {
    if (!progress) return;

    try {
      if (!supabase) {
        // Fallback localStorage
        const updatedProgress = { ...progress, total_percentage: percentage, amount_generated: amount };
        setProgress(updatedProgress);
        saveToLocalStorage(STORAGE_KEY, updatedProgress);
        return;
      }

      const { data, error } = await supabase
        .from('progress')
        .update({
          total_percentage: percentage,
          amount_generated: amount,
        })
        .eq('id', progress.id)
        .select()
        .single();

      if (error) {
        console.error('❌ [Progress] Supabase error:', error);
        // Fallback to localStorage if Supabase fails
        const updatedProgress = { ...progress, total_percentage: percentage, amount_generated: amount };
        setProgress(updatedProgress);
        saveToLocalStorage(STORAGE_KEY, updatedProgress);
        return;
      }

      if (data) {
        setProgress(data);
        saveToLocalStorage(STORAGE_KEY, data);
      }
    } catch (error) {
      console.error('❌ [Progress] Error updating progress:', error instanceof Error ? error.message : JSON.stringify(error));
      // Fallback to localStorage on any error
      if (progress) {
        const updatedProgress = { ...progress, total_percentage: percentage, amount_generated: amount };
        setProgress(updatedProgress);
        saveToLocalStorage(STORAGE_KEY, updatedProgress);
      }
    }
  }, [progress]);

  // Initial fetch
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Update progress whenever tasks change
  useEffect(() => {
    if (!loading && progress) {
      updateProgress(currentPercentage, currentAmount);
    }
  }, [currentPercentage, currentAmount, loading, progress, updateProgress]);

  // Archive current month and reset
  const archiveAndReset = async () => {
    try {
      if (!progress) return;

      if (!supabase) {
        console.warn('⚠️ [Progress] Supabase not available, skipping archive');
        return;
      }

      const completedTasksCount = tasks.filter(t => t.completed).length;

      // Create archive
      await supabase.from('monthly_archives').insert({
        month: progress.month,
        year: progress.year,
        final_percentage: currentPercentage,
        amount: currentAmount,
        tasks_count: tasks.length,
        completed_tasks_count: completedTasksCount,
      });

      // Create new progress for next month
      const month = getCurrentMonth();
      const year = getCurrentYear();

      const { data, error } = await supabase
        .from('progress')
        .insert({
          month,
          year,
          total_percentage: 0,
          amount_generated: 0,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProgress(data);
        saveToLocalStorage(STORAGE_KEY, data);
      }
    } catch (error) {
      console.error('Error archiving progress:', error);
    }
  };

  return {
    progress,
    loading,
    currentPercentage,
    currentAmount,
    monthlyGoal: MONTHLY_GOAL,
    refetch: fetchProgress,
    archiveAndReset,
  };
}



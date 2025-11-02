import { supabase } from './supabase';
import { getCurrentMonth, getCurrentYear } from './utils';

export async function checkAndResetIfNeeded(): Promise<boolean> {
  try {
    const currentMonth = getCurrentMonth();
    const currentYear = getCurrentYear();

    // Check if there's a progress record for current month
    const { data: currentProgress, error } = await supabase
      .from('progress')
      .select('*')
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no progress for current month, we need to reset
    if (!currentProgress) {
      // Get last month's data
      let lastMonth = currentMonth - 1;
      let lastYear = currentYear;
      
      if (lastMonth === 0) {
        lastMonth = 12;
        lastYear = currentYear - 1;
      }

      const { data: lastProgress } = await supabase
        .from('progress')
        .select('*')
        .eq('month', lastMonth)
        .eq('year', lastYear)
        .maybeSingle();

      // Get all tasks from last month
      const { data: lastMonthTasks } = await supabase
        .from('tasks')
        .select('*');

      const completedTasks = lastMonthTasks?.filter((t: any) => t.completed) || [];
      const totalTasks = lastMonthTasks?.length || 0;

      // Archive last month if it exists
      if (lastProgress) {
        await supabase.from('monthly_archives').insert({
          month: lastMonth,
          year: lastYear,
          final_percentage: lastProgress.total_percentage,
          amount: lastProgress.amount_generated,
          tasks_count: totalTasks,
          completed_tasks_count: completedTasks.length,
        });
      }

      // Create new progress for current month
      await supabase.from('progress').insert({
        month: currentMonth,
        year: currentYear,
        total_percentage: 0,
        amount_generated: 0,
      });

      // Optional: Archive or clear old tasks
      // For now, we keep tasks visible but you could add logic to hide/archive them

      return true; // Reset was performed
    }

    return false; // No reset needed
  } catch (error) {
    console.error('Error checking/resetting monthly progress:', error);
    return false;
  }
}

export async function getMonthlyArchives(limit: number = 12) {
  try {
    const { data, error } = await supabase
      .from('monthly_archives')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching monthly archives:', error);
    return [];
  }
}

export function getMonthName(monthNumber: number): string {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[monthNumber - 1] || '';
}


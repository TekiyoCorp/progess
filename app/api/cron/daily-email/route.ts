import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateRevenueFromFolders } from '@/lib/revenue';

// Cette route peut être appelée par Vercel Cron Jobs ou un service externe
// Pour Vercel: ajouter dans vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/daily-email",
//     "schedule": "0 9 * * *"
//   }]
// }

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification (header secret pour sécurité)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Récupérer les données depuis Supabase
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Fetch tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('completed', false);

    if (tasksError) throw tasksError;

    // Fetch folders
    const { data: folders, error: foldersError } = await supabase
      .from('folders')
      .select('*');

    if (foldersError) throw foldersError;

    // Fetch progress
    const { data: progress, error: progressError } = await supabase
      .from('progress')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (progressError && progressError.code !== 'PGRST116') throw progressError;

    // Calculer le CA réel depuis les dossiers
    const currentAmount = calculateRevenueFromFolders(folders || [], tasks || []);
    const monthlyGoal = parseInt(process.env.MONTHLY_GOAL || '50000');

    // Appeler la route d'email
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/daily-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: tasks || [],
        folders: folders || [],
        currentAmount,
        monthlyGoal,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Email API error: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Daily email sent',
      emailId: emailData.messageId,
      tasksCount: tasks?.length || 0,
    });
  } catch (error) {
    console.error('Error in daily email cron:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send daily email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}


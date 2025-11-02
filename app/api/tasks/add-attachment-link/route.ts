import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TaskAttachment } from '@/types';

// Créer un client Supabase avec service_role key pour contourner RLS côté serveur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Fallback sur anon key si service_role n'est pas disponible
const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, url, name } = body;

    if (!taskId || !url) {
      return NextResponse.json(
        { error: 'taskId and url are required' },
        { status: 400 }
      );
    }

    // Créer l'attachment pour le lien
    const attachment: TaskAttachment = {
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'link',
      url: url,
      name: name || new URL(url).hostname,
      created_at: new Date().toISOString(),
    };

    // Récupérer la tâche actuelle
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('attachments')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('❌ [Link] Task fetch error:', taskError);
      return NextResponse.json(
        { error: 'Failed to fetch task' },
        { status: 500 }
      );
    }

    // Ajouter l'attachment à la liste
    const currentAttachments = (task.attachments || []) as TaskAttachment[];
    const updatedAttachments = [...currentAttachments, attachment];

    // Mettre à jour la tâche
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ attachments: updatedAttachments })
      .eq('id', taskId);

    if (updateError) {
      console.error('❌ [Link] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attachment });
  } catch (error) {
    console.error('❌ [Link] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


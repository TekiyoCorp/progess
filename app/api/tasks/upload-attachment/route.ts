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

// Log pour debug (seulement en dev)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 [Upload] Supabase config:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    usingServiceKey: !!supabaseServiceKey,
    supabaseClientCreated: !!supabase,
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 [Upload] Received request');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const taskId = formData.get('taskId') as string;
    const type = formData.get('type') as 'image' | 'pdf';

    console.log('📋 [Upload] File info:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      taskId,
      type,
    });

    if (!file || !taskId) {
      console.error('❌ [Upload] Missing file or taskId');
      return NextResponse.json(
        { error: 'File and taskId are required' },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${taskId}/${Date.now()}.${fileExt}`;

    console.log('📁 [Upload] Generated filename:', fileName);

    // Convertir File en Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload vers Supabase Storage
    if (!supabase) {
      console.error('❌ [Upload] Supabase not configured:', {
        url: supabaseUrl ? 'present' : 'missing',
        serviceKey: supabaseServiceKey ? 'present' : 'missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
      });
      return NextResponse.json(
        { 
          error: 'Supabase not configured', 
          details: 'Supabase client is null. Please check your .env.local file and ensure SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is set.',
          config: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          }
        },
        { status: 500 }
      );
    }

    console.log('☁️ [Upload] Uploading to Supabase Storage...');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ [Upload] Storage error:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError,
      });
      
      // Si le bucket n'existe pas, donner une erreur claire
      if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
        return NextResponse.json(
          { 
            error: 'Bucket not found', 
            details: 'The storage bucket "task-attachments" does not exist. Please create it in Supabase Dashboard → Storage.' 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    console.log('✅ [Upload] File uploaded successfully:', uploadData.path);

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(fileName);

    // Créer l'attachment
    const attachment: TaskAttachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as 'image' | 'pdf',
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
      created_at: new Date().toISOString(),
    };

    // Récupérer la tâche actuelle
    console.log('📋 [Upload] Fetching task:', taskId);
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('attachments')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('❌ [Upload] Task fetch error:', {
        message: taskError.message,
        code: taskError.code,
        details: taskError,
      });
      
      // Si la colonne n'existe pas, donner une erreur claire
      if (taskError.message?.includes('column') && taskError.message?.includes('attachments')) {
        return NextResponse.json(
          { 
            error: 'Column not found',
            details: 'The "attachments" column does not exist in the "tasks" table. Please run the migration SQL script: supabase-attachments-migration.sql'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch task', details: taskError.message },
        { status: 500 }
      );
    }

    console.log('✅ [Upload] Task found, current attachments:', task.attachments?.length || 0);

    // Ajouter l'attachment à la liste
    const currentAttachments = (task.attachments || []) as TaskAttachment[];
    const updatedAttachments = [...currentAttachments, attachment];

    console.log('💾 [Upload] Updating task with', updatedAttachments.length, 'attachments');

    // Mettre à jour la tâche
    // Utiliser upsert pour éviter les problèmes de RLS si nécessaire
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        attachments: updatedAttachments,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('❌ [Upload] Update error:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError,
      });
      return NextResponse.json(
        { error: 'Failed to update task', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ [Upload] Task updated successfully');

    return NextResponse.json({ attachment });
  } catch (error) {
    console.error('❌ [Upload] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}


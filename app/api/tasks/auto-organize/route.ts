import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json();

    if (!taskId || !supabase) {
      return NextResponse.json({ success: false });
    }

    // Récupérer la tâche
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*, entity:entities(*)')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      console.error('Task not found:', taskError);
      return NextResponse.json({ success: false });
    }

    // Si la tâche n'a pas d'entité, ne rien faire
    if (!task.entity_id) {
      return NextResponse.json({ success: false, reason: 'no_entity' });
    }

    // Récupérer toutes les tâches de la même entité
    const { data: relatedTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('entity_id', task.entity_id);

    // Récupérer tous les dossiers existants
    const { data: folders } = await supabase
      .from('folders')
      .select('*');

    // Utiliser l'IA pour décider de l'organisation
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es l'assistant de Zak (Tekiyo). Ta mission: organiser automatiquement les tâches en dossiers intelligents.

Tâche actuelle:
- Titre: ${task.title}
- Entité: ${task.entity?.name} (${task.entity?.type})

Tâches liées à cette entité (${relatedTasks?.length || 0}):
${relatedTasks?.map(t => `- ${t.title}`).join('\n') || 'Aucune'}

Dossiers existants (${folders?.length || 0}):
${folders?.map(f => `- ${f.name}`).join('\n') || 'Aucun'}

Décide:
1. Faut-il créer un nouveau dossier ?
2. Si oui, quel nom ?
3. Sinon, dans quel dossier existant mettre la tâche ?
4. Quelles autres tâches doivent être dans ce dossier ?

Réponds UNIQUEMENT en JSON:
{
  "action": "create_folder" | "use_existing" | "no_folder",
  "folder_name": "Nom du dossier" (si create_folder ou use_existing),
  "folder_id": "id" (si use_existing),
  "task_ids": ["id1", "id2"] (tâches à mettre dans ce dossier)
}`,
        },
        {
          role: 'user',
          content: 'Organise cette tâche intelligemment.',
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ success: false });
    }

    const decision = JSON.parse(content);
    console.log('📁 AI Organization Decision:', decision);

    let folderId: string | null = null;

    // Exécuter la décision
    if (decision.action === 'create_folder' && decision.folder_name) {
      // Créer un nouveau dossier
      const { data: newFolder, error: folderError } = await supabase
        .from('folders')
        .insert({ name: decision.folder_name })
        .select()
        .single();

      if (!folderError && newFolder) {
        folderId = newFolder.id;
        console.log('✅ Created folder:', newFolder.name);
      }
    } else if (decision.action === 'use_existing' && decision.folder_id) {
      folderId = decision.folder_id;
    }

    // Mettre les tâches dans le dossier
    if (folderId && decision.task_ids && decision.task_ids.length > 0) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ folder_id: folderId })
        .in('id', decision.task_ids);

      if (!updateError) {
        console.log(`✅ Organized ${decision.task_ids.length} tasks into folder`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      action: decision.action,
      folder_name: decision.folder_name,
      task_count: decision.task_ids?.length || 0,
    });
  } catch (error) {
    console.error('Error in auto-organize:', error);
    return NextResponse.json({ success: false, error: String(error) });
  }
}


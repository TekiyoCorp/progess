import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Command required' }, { status: 400 });
    }

    console.log('🤖 [AI Command] Received:', command);

    // Récupérer le contexte (tâches, problèmes, dossiers)
    let tasks: any[] = [];
    let problems: any[] = [];
    let folders: any[] = [];

    if (supabase) {
      const [tasksRes, problemsRes, foldersRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('problems').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('folders').select('*'),
      ]);

      tasks = tasksRes.data || [];
      problems = problemsRes.data || [];
      folders = foldersRes.data || [];
    }

    // Analyser la commande avec GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es l'assistant intelligent de Zak (Tekiyo, agence web premium).

Contexte actuel:
- ${tasks.length} tâches (${tasks.filter((t: any) => !t.completed).length} en cours)
- ${problems.length} problèmes
- ${folders.length} dossiers

Tâches récentes:
${tasks.slice(0, 10).map((t: any) => `- ${t.title} (${t.percentage}%) ${t.completed ? '✓' : ''}`).join('\n')}

Ta mission: analyser la commande utilisateur et décider quelle action effectuer.

Actions possibles:
1. create_task - Créer une tâche
2. create_problem - Ajouter un problème
3. create_folder - Créer un dossier
4. prioritize_tasks - Réorganiser par priorité
5. create_routine - Créer une routine automatique
6. info - Donner des informations

Réponds UNIQUEMENT en JSON:
{
  "action": "create_task" | "create_problem" | "create_folder" | "prioritize_tasks" | "create_routine" | "info",
  "data": {
    // Selon l'action
    // create_task: { "title": "...", "date": "2024-01-01T10:00:00Z" }
    // create_problem: { "title": "..." }
    // create_folder: { "name": "..." }
    // prioritize_tasks: {}
    // create_routine: { "pattern": "daily|weekly", "time": "09:00", "task_title": "..." }
    // info: { "message": "..." }
  }
}`,
        },
        {
          role: 'user',
          content: command,
        },
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    const result = JSON.parse(content);
    console.log('🎯 [AI Command] Action:', result);

    // Exécuter l'action
    let response: any = { success: true, action: result.action };

    switch (result.action) {
      case 'create_task':
        if (supabase && result.data?.title) {
          // Score la tâche avec l'IA
          const scoreRes = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/score-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: result.data.title }),
          });

          let percentage = 1;
          let type = 'other';
          
          if (scoreRes.ok) {
            const scoreData = await scoreRes.json();
            percentage = scoreData.percentage || 1;
            type = scoreData.type || 'other';
          }

          const { data, error } = await supabase
            .from('tasks')
            .insert({
              title: result.data.title,
              percentage,
              type,
              completed: false,
              ...(result.data.date && { event_start: result.data.date }),
            })
            .select()
            .single();

          if (error) throw error;
          response.task = data;
        }
        break;

      case 'create_problem':
        if (supabase && result.data?.title) {
          const { data, error } = await supabase
            .from('problems')
            .insert({ title: result.data.title })
            .select()
            .single();

          if (error) throw error;
          response.problem = data;
        }
        break;

      case 'create_folder':
        if (supabase && result.data?.name) {
          const { data, error } = await supabase
            .from('folders')
            .insert({ name: result.data.name })
            .select()
            .single();

          if (error) throw error;
          response.folder = data;
        }
        break;

      case 'prioritize_tasks':
        // Appeler l'API de priorisation
        const prioritizeRes = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/prioritize-tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (prioritizeRes.ok) {
          const prioritizeData = await prioritizeRes.json();
          response.message = `✅ ${prioritizeData.reordered} tâches réorganisées. ${prioritizeData.reasoning}`;
        }
        break;

      case 'create_routine':
        // Détecter les routines automatiquement
        const routinesRes = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/detect-routines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (routinesRes.ok) {
          const routinesData = await routinesRes.json();
          response.routines = routinesData.routines;
          response.message = `🔄 ${routinesData.routines.length} routines détectées automatiquement !`;
        }
        break;

      case 'info':
        response.message = result.data.message;
        break;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [AI Command] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process command', details: String(error) },
      { status: 500 }
    );
  }
}


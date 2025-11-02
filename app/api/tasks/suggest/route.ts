import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

// OpenAI instance will be created in POST handler

export async function POST(request: NextRequest) {
  try {
        // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

const { input } = await request.json();

    if (!input || input.trim().length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    // Récupérer les tâches existantes
    let allTasks: any[] = [];
    
    if (supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        allTasks = data;
      }
    }

    // Si pas assez de tâches, pas de suggestions
    if (allTasks.length < 5) {
      return NextResponse.json({ suggestions: [] });
    }

    // Utiliser l'IA pour suggérer des tâches similaires
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es l'assistant de Zak (Tekiyo, agence web). Analyse l'input utilisateur et suggère 3 tâches similaires basées sur l'historique. 

Historique des tâches:
${allTasks.slice(0, 50).map((t: any) => `- ${t.title}`).join('\n')}

Réponds UNIQUEMENT en JSON:
{
  "suggestions": [
    { "title": "Tâche suggérée 1", "similarity": 0.9 },
    { "title": "Tâche suggérée 2", "similarity": 0.8 },
    { "title": "Tâche suggérée 3", "similarity": 0.7 }
  ]
}`,
        },
        {
          role: 'user',
          content: `Input utilisateur: "${input}"`,
        },
      ],
      max_tokens: 300,
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ suggestions: [] });
    }

    const parsed = JSON.parse(content);
    return NextResponse.json({ suggestions: parsed.suggestions || [] });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json({ suggestions: [] });
  }
}


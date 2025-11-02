import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [Routines] Detecting patterns...');

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Récupérer toutes les tâches complétées des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('completed', true)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error || !tasks || tasks.length < 5) {
      console.log('⚠️ [Routines] Not enough data to detect patterns (min 5 tasks)');
      return NextResponse.json({ routines: [] });
    }

    console.log(`📋 [Routines] Analyzing ${tasks.length} completed tasks`);

    // Utiliser GPT-4 pour détecter les patterns
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es l'assistant de Zak (Tekiyo). Analyse ses tâches complétées et détecte les ROUTINES RÉCURRENTES.

Tâches des 30 derniers jours:
${tasks.slice(0, 100).map(t => `- ${t.title} (${new Date(t.created_at).toLocaleDateString('fr-FR')})`).join('\n')}

Détecte les patterns:
1. Tâches qui reviennent régulièrement (ex: "Check emails", "Facturation", "Réunion équipe")
2. Activités quotidiennes/hebdomadaires/mensuelles
3. Workflows répétitifs

Réponds UNIQUEMENT en JSON:
{
  "routines": [
    {
      "title": "Titre de la routine",
      "frequency": "daily" | "weekly" | "monthly",
      "suggested_time": "09:00" (HH:MM),
      "type": "call" | "content" | "dev" | "other",
      "confidence": 0.8 (0-1, confiance dans la détection)
    }
  ]
}

Ne suggère QUE des routines avec confidence > 0.7.`,
        },
        {
          role: 'user',
          content: 'Détecte mes routines récurrentes.',
        },
      ],
      max_tokens: 800,
      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ routines: [] });
    }

    const result = JSON.parse(content);
    console.log(`🤖 [Routines] Detected ${result.routines.length} routines`);

    // Sauvegarder les routines détectées dans localStorage via le client
    // (pas de table routines dans Supabase pour l'instant)

    return NextResponse.json({
      routines: result.routines.filter((r: any) => r.confidence > 0.7),
    });
  } catch (error) {
    console.error('❌ [Routines] Error:', error);
    return NextResponse.json(
      { error: 'Failed to detect routines', details: String(error) },
      { status: 500 }
    );
  }
}


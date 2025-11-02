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

console.log('🎯 [Prioritize] Starting smart prioritization...');

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Récupérer toutes les tâches non complétées
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('completed', false)
      .order('created_at', { ascending: false });

    if (error || !tasks || tasks.length === 0) {
      console.log('⚠️ [Prioritize] No tasks to prioritize');
      return NextResponse.json({ success: true, reordered: 0 });
    }

    console.log(`📋 [Prioritize] Found ${tasks.length} tasks to prioritize`);

    // Utiliser GPT-4 pour analyser et prioriser
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es l'assistant de Zak (Tekiyo, agence web premium). Objectif: 50k€/mois.

Analyse ces tâches et réorganise-les par priorité absolue en fonction de:
1. **Urgence** - Deadlines imminentes (event_start proche)
2. **Impact CA** - Plus le % est élevé = plus gros CA potentiel
3. **Blocages** - Les tâches bloquées sont moins prioritaires
4. **Type** - call > dev > content > other

Tâches à analyser:
${tasks.map((t: any) => `
ID: ${t.id}
Titre: ${t.title}
CA Impact: ${t.percentage}%
Type: ${t.type}
Date: ${t.event_start || 'Aucune'}
Bloquée: ${t.blocked ? 'Oui' : 'Non'}
`).join('\n---\n')}

Réponds UNIQUEMENT en JSON avec les IDs dans l'ordre de priorité (du plus au moins prioritaire):
{
  "priority_order": ["id1", "id2", "id3", ...],
  "reasoning": "Explication courte de la logique"
}`,
        },
        {
          role: 'user',
          content: 'Priorise ces tâches intelligemment.',
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No AI response' }, { status: 500 });
    }

    const result = JSON.parse(content);
    console.log('🤖 [Prioritize] AI reasoning:', result.reasoning);

    // Mettre à jour l'ordre des tâches
    const updates = result.priority_order.map((id: string, index: number) => 
      supabase
        .from('tasks')
        .update({ order_index: index })
        .eq('id', id)
    );

    await Promise.all(updates);

    console.log(`✅ [Prioritize] ${result.priority_order.length} tasks reordered`);

    return NextResponse.json({
      success: true,
      reordered: result.priority_order.length,
      reasoning: result.reasoning,
    });
  } catch (error) {
    console.error('❌ [Prioritize] Error:', error);
    return NextResponse.json(
      { error: 'Failed to prioritize tasks', details: String(error) },
      { status: 500 }
    );
  }
}


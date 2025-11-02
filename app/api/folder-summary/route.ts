import { NextRequest, NextResponse } from 'next/server';
import { Task } from '@/types';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

console.log('[folder-summary] Loading API key...');
console.log('[folder-summary] API key present:', !!apiKey);
if (apiKey) {
  console.log('[folder-summary] API key length:', apiKey.length);
}

const client = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(request: NextRequest) {
  try {
    console.log('[folder-summary] Received request');
    
    const body = await request.json();
    const { tasks } = body as { tasks: Task[] };

    if (!tasks || tasks.length === 0) {
      return NextResponse.json(
        { error: 'No tasks provided' },
        { status: 400 }
      );
    }

    if (!client || !apiKey) {
      console.error('[folder-summary] OpenAI client not initialized');
      return NextResponse.json(
        { summary: 'Résumé indisponible - clé API manquante' },
        { status: 200 }
      );
    }

    // Format tasks for AI
    const tasksList = tasks
      .map(t => `- ${t.title} (${t.percentage}%, ${t.completed ? 'complétée' : 'en cours'})`)
      .join('\n');

    console.log('[folder-summary] Calling OpenAI API...');

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es l'assistant de Zak (Tekiyo). Génère un résumé ultra-concis (15-20 mots MAX) d'un dossier de tâches.

Format: Une phrase courte et directe qui résume l'objectif du dossier.
Exemple: "Closing Naturopathe - Appel qualification, préparation devis et livraison maquette"

Sois direct et actionnable.`,
        },
        {
          role: 'user',
          content: `Résume ce dossier en 15-20 mots MAX:\n\n${tasksList}`,
        },
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    const summary = response.choices[0]?.message?.content?.trim() || 'Résumé indisponible';

    console.log('[folder-summary] Generated summary:', summary);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('[folder-summary] Error:', error);
    return NextResponse.json(
      { summary: 'Erreur lors de la génération du résumé' },
      { status: 200 }
    );
  }
}



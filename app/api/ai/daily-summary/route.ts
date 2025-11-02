import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { tasks } = await request.json();

    // Compter événements, emails, devis
    const todayTasks = tasks.filter((t: any) => {
      if (!t.event_start) return false;
      const taskDate = new Date(t.event_start);
      const today = new Date();
      return taskDate.toDateString() === today.toDateString();
    });

    const events = todayTasks.filter((t: any) => t.title.toLowerCase().includes('meet') || t.title.toLowerCase().includes('appel'));
    const emails = todayTasks.filter((t: any) => t.title.toLowerCase().includes('email') || t.title.toLowerCase().includes('mail'));
    const devis = todayTasks.filter((t: any) => t.title.toLowerCase().includes('devis') || t.title.toLowerCase().includes('quote'));

    const nextEvent = events.find((e: any) => !e.completed);

    const prompt = `Tu es un assistant intelligent. Génère un résumé naturel et concis de la journée en français.

Données:
- ${events.length} événements aujourd'hui
- ${nextEvent ? `Prochain: ${nextEvent.title}` : 'Aucun événement à venir'}
- ${emails.length} emails à envoyer
- ${devis.length} devis en attente

Génère un texte fluide, naturel, en 2-3 phrases maximum. Style conversationnel, ton amical. Ne mets pas de puces ni de numéros.

Exemple: "3 événements aujourd'hui, prochain : Meet avec Julien à 14:00, 4 emails 💌 à envoyer et 2 devis en attente d'envoi."`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant concis qui génère des résumés ultra courts et naturels.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || 'Aucune tâche prévue pour aujourd\'hui.';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}


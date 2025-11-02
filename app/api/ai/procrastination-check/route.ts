import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { tasks } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ procrastinated: [] });
    }

    // Détecter les tâches repoussées
    const now = new Date();
    const procrastinatedTasks = tasks.filter((t: any) => {
      if (t.completed) return false;
      
      const createdAt = new Date(t.created_at);
      const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Tâche créée il y a > 3 jours et pas planifiée OU importante (>5%)
      return (daysSinceCreated > 3 && !t.event_start) || (t.percentage > 5 && daysSinceCreated > 2);
    });

    if (procrastinatedTasks.length === 0) {
      return NextResponse.json({ procrastinated: [] });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es le coach business de Zak, founder de Tekiyo.

MISSION: Analyser la procrastination et proposer des solutions.

Pour chaque tâche repoussée:
1. Identifier la raison probable (peur, complexité, manque de clarté)
2. Proposer une solution concrète (décomposer, rehearsal, accountability)

Réponds en JSON:
{
  "procrastinated": [
    {
      "taskId": "id",
      "reason": "Peur de closer",
      "impact": "-15k€ potentiel",
      "solution": {
        "steps": ["Préparer le pitch (10min)", "Répéter (5min)", "Lancer le call (30min)"],
        "encouragement": "Tu es capable, lance-toi !"
      }
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Tâches repoussées:
${JSON.stringify(procrastinatedTasks, null, 2)}

Analyse la procrastination.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ procrastinated: [] });
    }

    const data = JSON.parse(content);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking procrastination:', error);
    return NextResponse.json({ procrastinated: [] });
  }
}


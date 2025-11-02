import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { taskTitle, taskType, taskPercentage } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ subtasks: [] }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es l'assistant de Zak, founder de Tekiyo.

MISSION: Décomposer une tâche complexe en micro-tâches actionnables.

RÈGLES:
1. Max 7 micro-tâches
2. Chaque tâche = 30min-2h max
3. Ordre chronologique (étape par étape)
4. % réparti proportionnellement
5. Temps estimé réaliste

Réponds en JSON:
{
  "subtasks": [
    {
      "title": "Titre court et actionnable",
      "percentage": 0.5-2,
      "estimatedTime": "30min",
      "order": 1,
      "description": "Détail de ce qu'il faut faire"
    }
  ],
  "totalPercentage": 10,
  "totalTime": "12h30"
}`,
        },
        {
          role: 'user',
          content: `Tâche à décomposer: "${taskTitle}"
Type: ${taskType}
Pourcentage: ${taskPercentage}%

Décompose cette tâche en micro-tâches actionnables.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ subtasks: [] }, { status: 500 });
    }

    const data = JSON.parse(content);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error decomposing task:', error);
    return NextResponse.json({ subtasks: [] }, { status: 500 });
  }
}


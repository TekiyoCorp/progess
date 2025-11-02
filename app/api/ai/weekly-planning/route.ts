import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { tasks, currentDate } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ plan: null, error: 'No API key' }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es l'assistant de Zak, founder de Tekiyo (agence web premium).
Objectif: 50k€/mois.

MISSION: Créer un plan de semaine optimal.

RÈGLES:
1. Distribuer les tâches sur 5 jours (Lundi-Vendredi)
2. Respecter les types et heures optimales:
   - Calls: Matin (10h-12h)
   - Design: Matin ou soir (après 18h)
   - Vidéo: Après-midi (15h-17h)
   - Email: Tôt matin (9h-10h)
3. Max 25% de progression par jour
4. Grouper tâches similaires (batch)
5. Prioriser par urgence et CA potentiel

Réponds UNIQUEMENT en JSON:
{
  "weekPlan": {
    "monday": [{ "taskId": "id", "time": "10h-12h", "reason": "..." }],
    "tuesday": [...],
    ...
  },
  "totalPercentage": 35,
  "workloadBalance": "Équilibré",
  "tips": ["conseil 1", "conseil 2"]
}`,
        },
        {
          role: 'user',
          content: `Date actuelle: ${currentDate}

Tâches à planifier:
${JSON.stringify(tasks, null, 2)}

Crée un plan de semaine optimal.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ plan: null, error: 'No response' }, { status: 500 });
    }

    const plan = JSON.parse(content);
    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error generating weekly plan:', error);
    return NextResponse.json({ plan: null, error: 'Failed to generate plan' }, { status: 500 });
  }
}


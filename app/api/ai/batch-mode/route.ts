import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

const { tasks } = await request.json();

    if (!process.env.OPENAI_API_KEY || tasks.length < 2) {
      return NextResponse.json({ batches: [] });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es l'assistant de Zak, founder de Tekiyo.

MISSION: Détecter les tâches similaires à regrouper en batch.

CRITÈRES:
- Même type (emails, calls, designs)
- Même contexte (même projet/client)
- Peut être fait d'un coup (économie de temps)

Réponds en JSON:
{
  "batches": [
    {
      "name": "Emails de suivi",
      "task_ids": ["id1", "id2"],
      "estimatedTime": "45min",
      "timeSaved": "1h15",
      "reason": "Tous des emails de suivi client"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Tâches:
${JSON.stringify(tasks, null, 2)}

Détecte les batches possibles.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ batches: [] });
    }

    const data = JSON.parse(content);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error detecting batches:', error);
    return NextResponse.json({ batches: [] });
  }
}


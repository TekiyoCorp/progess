import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const TEKIYO_CONTEXT = `Tu es l'assistant de Zak, founder de Tekiyo (agence web premium).
Objectif: 50k€/mois.

CONTEXTE PRODUCTIVITÉ:
- Heures de pic: Généralement 10h-12h et 14h-16h
- Types de tâches et horaires optimaux:
  * "call" → Matin (10h-12h) ou début après-midi (14h-15h)
  * "design" → Matin ou soir (après 18h) quand créatif
  * "video" → Après-midi (15h-17h) pour la lumière
  * "email" → Tôt matin (9h-10h) ou fin journée (17h-18h)
  * "other" → Flexible selon urgence

RÈGLES:
1. Analyser le type de tâche (call, design, video, email, other)
2. Analyser l'urgence (% de progression)
3. Analyser les mots-clés (deadline, urgent, demain, etc.)
4. Proposer 3 créneaux optimaux sur les 7 prochains jours
5. Éviter les weekends sauf si très urgent
6. Respecter les heures de bureau (9h-19h)

Format réponse JSON:
{
  "suggestions": [
    {
      "datetime": "2024-04-12T14:00:00Z",
      "label": "Aujourd'hui 14h",
      "reason": "Heure de pic, idéal pour les calls"
    },
    {
      "datetime": "2024-04-13T10:00:00Z",
      "label": "Demain 10h",
      "reason": "Matin optimal pour ce type de tâche"
    },
    {
      "datetime": "2024-04-15T15:00:00Z",
      "label": "Lundi 15h",
      "reason": "Après-midi idéal pour ce type"
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const { taskTitle, taskType, taskPercentage, currentDateTime } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      // Fallback sans IA
      const now = currentDateTime ? new Date(currentDateTime) : new Date();
      const suggestions = [
        {
          datetime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2h
          label: "Dans 2h",
          reason: "Créneau proche pour agir rapidement",
        },
        {
          datetime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // +24h
          label: "Demain 10h",
          reason: "Matin optimal",
        },
        {
          datetime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 jours
          label: "Dans 3 jours",
          reason: "Créneau flexible",
        },
      ];
      
      return NextResponse.json({ suggestions });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: TEKIYO_CONTEXT,
        },
        {
          role: 'user',
          content: `Tâche: "${taskTitle}"
Type: ${taskType || 'other'}
Pourcentage: ${taskPercentage || 1}%
Date/heure actuelle: ${currentDateTime || new Date().toISOString()}

Génère 3 créneaux optimaux pour cette tâche. Réponds UNIQUEMENT en JSON avec le format exact demandé.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    // Valider le format
    if (!Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid response format');
    }

    // Valider chaque suggestion
    const validated = parsed.suggestions.map((s: any) => ({
      datetime: s.datetime,
      label: s.label || 'Créneau proposé',
      reason: s.reason || 'Créneau optimal',
    }));

    return NextResponse.json({ suggestions: validated });
  } catch (error) {
    console.error('Error suggesting time:', error);
    
    // Fallback
    const now = new Date();
    const suggestions = [
      {
        datetime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        label: "Dans 2h",
        reason: "Créneau proche",
      },
      {
        datetime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        label: "Demain 10h",
        reason: "Matin optimal",
      },
      {
        datetime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        label: "Dans 3 jours",
        reason: "Créneau flexible",
      },
    ];
    
    return NextResponse.json({ suggestions });
  }
}


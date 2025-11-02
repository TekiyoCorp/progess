import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const TEKIYO_CONTEXT = `Tu es l'assistant de Zak, founder de Tekiyo (agence web premium).

MISSION: Regrouper intelligemment les tâches similaires dans des groupes.

CRITÈRES DE REGROUPEMENT:
1. **Même projet/client**: Toutes les tâches liées au même client/projet
   Ex: "Call Naturopathe", "Envoyer devis Naturopathe", "Relire projet Naturopathe"

2. **Même type**: Regrouper par type (calls, designs, vidéos, emails)
   Ex: "Tous tes calls", "Tous tes designs"

3. **Même deadline**: Tâches avec deadline proche
   Ex: "Deadlines cette semaine"

4. **Même contexte**: Tâches qui se complètent
   Ex: "Préparation projet X" (brainstorm + design + call)

5. **Séquences logiques**: Workflows complets
   Ex: "Workflow TikTok" (brainstorm + script + tournage + montage)

Réponds UNIQUEMENT en JSON:
{
  "groups": [
    {
      "name": "Nom du groupe",
      "task_ids": ["id1", "id2", "id3"],
      "reason": "Pourquoi ces tâches sont regroupées",
      "suggested_type": "project|type|deadline|workflow|other"
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const { tasks } = await request.json();

    if (!tasks || !Array.isArray(tasks) || tasks.length < 2) {
      return NextResponse.json({ groups: [] });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Fallback: regroupement simple par type
      const groupsByType = tasks.reduce((acc: any, task: any) => {
        const type = task.type || 'other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(task.id);
        return acc;
      }, {});

      const groups = Object.entries(groupsByType)
        .filter(([_, ids]: any) => ids.length >= 2)
        .map(([type, ids]: any) => ({
          name: `Tous les ${type}`,
          task_ids: ids,
          reason: `Regroupement par type: ${type}`,
          suggested_type: 'type',
        }));

      return NextResponse.json({ groups });
    }

    // Préparer le contexte des tâches
    const tasksContext = tasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      type: t.type || 'other',
      percentage: t.percentage || 1,
      date: t.event_start || null,
      entity: t.entity_id || null,
    }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: TEKIYO_CONTEXT,
        },
        {
          role: 'user',
          content: `Analyse ces ${tasks.length} tâches et regroupe-les intelligemment:

${JSON.stringify(tasksContext, null, 2)}

Trouve les patterns de regroupement logiques (même projet, même type, même deadline, workflow complet).

Réponds UNIQUEMENT en JSON avec le format exact.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ groups: [] });
    }

    const parsed = JSON.parse(content);
    
    // Valider le format
    if (!Array.isArray(parsed.groups)) {
      return NextResponse.json({ groups: [] });
    }

    // Valider chaque groupe
    const validated = parsed.groups
      .filter((g: any) => g.name && Array.isArray(g.task_ids) && g.task_ids.length >= 2)
      .map((g: any) => ({
        name: g.name.trim(),
        task_ids: g.task_ids.filter((id: string) => tasks.find((t: any) => t.id === id)),
        reason: g.reason || 'Regroupement logique',
        suggested_type: ['project', 'type', 'deadline', 'workflow', 'other'].includes(g.suggested_type)
          ? g.suggested_type
          : 'other',
      }))
      .filter((g: any) => g.task_ids.length >= 2); // Au moins 2 tâches

    return NextResponse.json({ groups: validated });
  } catch (error) {
    console.error('Error auto-grouping tasks:', error);
    return NextResponse.json({ groups: [] });
  }
}


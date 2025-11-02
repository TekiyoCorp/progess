import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const TEKIYO_CONTEXT = `Tu es l'assistant de Zak, founder de Tekiyo (agence web premium).
Objectif: 50k€/mois.

MISSION: Détecter les tâches manquantes et les créer automatiquement.

RÈGLES:
1. **Dépendances**: Si une tâche nécessite une autre → créer la tâche manquante
   Ex: "Envoyer devis" → créer "Préparer devis"

2. **Séquences logiques**: Détecter les patterns et compléter la séquence
   Ex: "Call client" → créer "Préparer call" (avant) + "Envoyer suivi" (après)

3. **Deadlines**: Si deadline détectée → créer tâches de préparation
   Ex: "Deadline projet 20/04" → créer "Finaliser projet" (18/04) + "Relire projet" (19/04)

4. **Follow-up**: Après un call → créer automatiquement "Envoyer suivi"
   Ex: "Call Naturopathe" (complété) → créer "Envoyer suivi Naturopathe"

5. **Créativité**: Pour vidéos/design → créer "Brainstorm" + "Révision"

Réponds UNIQUEMENT en JSON:
{
  "tasks": [
    {
      "title": "Titre de la tâche",
      "type": "call|design|video|email|other",
      "percentage": 1-10,
      "reason": "Pourquoi cette tâche est nécessaire",
      "suggested_date": "ISO datetime ou null"
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const { 
      taskTitle, 
      taskType, 
      taskPercentage, 
      taskCompleted,
      allTasks,
      eventStart 
    } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ tasks: [] });
    }

    // Context: résumé des tâches existantes pour éviter doublons
    const tasksSummary = allTasks
      ?.slice(0, 10)
      ?.map((t: any) => t.title)
      ?.join(', ') || 'Aucune tâche';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: TEKIYO_CONTEXT,
        },
        {
          role: 'user',
          content: `Tâche actuelle: "${taskTitle}"
Type: ${taskType || 'other'}
Pourcentage: ${taskPercentage || 1}%
Statut: ${taskCompleted ? 'COMPLÉTÉE' : 'NOUVELLE'}
Date: ${eventStart || 'Non planifiée'}

Tâches existantes (pour éviter doublons): ${tasksSummary}

Analyse cette tâche et crée les tâches manquantes nécessaires.
Si c'est une tâche complétée, crée les suivantes (follow-up, livraison, etc.).
Si c'est une nouvelle tâche, crée les prérequis (préparation, brainstorming, etc.).

Réponds UNIQUEMENT en JSON avec le format exact.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ tasks: [] });
    }

    const parsed = JSON.parse(content);
    
    // Valider le format
    if (!Array.isArray(parsed.tasks)) {
      return NextResponse.json({ tasks: [] });
    }

    // Valider et nettoyer chaque tâche
    const validated = parsed.tasks
      .filter((t: any) => t.title && t.title.trim())
      .map((t: any) => ({
        title: t.title.trim(),
        type: ['call', 'design', 'video', 'email', 'other'].includes(t.type) 
          ? t.type 
          : 'other',
        percentage: Math.max(1, Math.min(10, t.percentage || 1)),
        reason: t.reason || 'Tâche complémentaire',
        suggested_date: t.suggested_date || null,
      }))
      .slice(0, 5); // Max 5 tâches par batch

    return NextResponse.json({ tasks: validated });
  } catch (error) {
    console.error('Error auto-creating tasks:', error);
    return NextResponse.json({ tasks: [] });
  }
}


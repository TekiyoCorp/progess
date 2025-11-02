import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { folderId, folderName, tasks, price } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ validated: false, message: 'No API key' }, { status: 500 });
    }

    // Vérifier que toutes les tâches sont complétées
    const allCompleted = tasks.every((t: any) => t.completed);
    
    if (!allCompleted) {
      return NextResponse.json({ 
        validated: false, 
        message: 'Toutes les tâches ne sont pas complétées',
        percentage: 0
      });
    }

    // Demander à l'IA de valider la qualité du travail
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es l'assistant de Zak, founder de Tekiyo.

MISSION: Valider si un projet est complété correctement.

CRITÈRES:
1. Toutes les tâches sont complétées ✅
2. Les tâches couvrent l'ensemble du projet (design, dev, test, déploiement)
3. Aucune étape critique manquante
4. Le prix est cohérent avec le travail fourni

Si VALIDE:
- validated: true
- percentage: somme des % des tâches (à ajouter à la progress bar globale)
- message: "🎉 Projet validé !"
- revenue: prix du projet (à ajouter au CA)

Si INCOMPLET:
- validated: false
- percentage: 0
- message: "❌ Il manque X" (détail des étapes manquantes)
- revenue: 0

Réponds UNIQUEMENT en JSON:
{
  "validated": true/false,
  "percentage": 0-100,
  "message": "...",
  "revenue": 0-50000,
  "missingSteps": ["étape 1", "étape 2"] // si non validé
}`,
        },
        {
          role: 'user',
          content: `Projet: ${folderName}
Prix: ${price}€

Tâches complétées:
${JSON.stringify(tasks.map((t: any) => ({ title: t.title, percentage: t.percentage })), null, 2)}

Valide ce projet.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ validated: false, message: 'No response' }, { status: 500 });
    }

    const validation = JSON.parse(content);
    return NextResponse.json(validation);
  } catch (error) {
    console.error('Error validating folder:', error);
    return NextResponse.json({ validated: false, message: 'Error' }, { status: 500 });
  }
}


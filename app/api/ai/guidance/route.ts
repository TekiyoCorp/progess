import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { question, timezone, currentTime, problems } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ guidance: null }, { status: 500 });
    }

    // Analyser l'heure locale
    const date = new Date(currentTime);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long',
      hour12: false,
    };
    const formatter = new Intl.DateTimeFormat('fr-FR', options);
    const localTime = formatter.format(date);
    const hour = date.getHours();

    // Déterminer le moment de la journée
    let timeContext = '';
    if (hour >= 5 && hour < 9) {
      timeContext = 'Tôt le matin (5h-9h) : Énergie élevée, idéal pour tâches complexes, focus max.';
    } else if (hour >= 9 && hour < 12) {
      timeContext = 'Matinée (9h-12h) : Peak performance, parfait pour calls clients, closing deals.';
    } else if (hour >= 12 && hour < 14) {
      timeContext = 'Midi (12h-14h) : Pause déjeuner, énergie en baisse. Tâches légères recommandées.';
    } else if (hour >= 14 && hour < 17) {
      timeContext = 'Après-midi (14h-17h) : Regain d\'énergie, bon pour création contenu, design.';
    } else if (hour >= 17 && hour < 20) {
      timeContext = 'Fin d\'après-midi (17h-20h) : Emails, admin, planification du lendemain.';
    } else if (hour >= 20 && hour < 23) {
      timeContext = 'Soirée (20h-23h) : Créativité, projets perso, stratégie.';
    } else {
      timeContext = 'Nuit (23h-5h) : Repos recommandé. Si tu travailles, tâches répétitives uniquement.';
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es le coach business ultra pragmatique de Zak (Tekiyo, agence web premium).
Objectif: 50k€/mois.

CONTEXTE ACTUEL:
- Heure locale: ${localTime}
- Fuseau horaire: ${timezone}
- ${timeContext}

MISSION: Conseiller Zak sur ce qu'il doit faire MAINTENANT.

RÈGLES:
1. Analyse l'heure → Recommande des tâches adaptées à son énergie
2. Priorise par impact CA (deals > marketing > admin)
3. Si problèmes non résolus → Pousse à les résoudre d'abord
4. Sois ultra direct, 3 phrases MAX
5. Aucun bullshit, que de l'actionnable

Format de réponse:
**Action immédiate**: [1 phrase courte]
**Pourquoi maintenant**: [Lien avec l'heure/énergie]
**Impact**: [Estimation CA ou gain de temps]`,
        },
        {
          role: 'user',
          content: `Question: "${question}"

Problèmes non résolus: ${problems.length > 0 ? problems.map((p: any) => `- ${p.description}`).join('\n') : 'Aucun'}

Que dois-je faire maintenant ?`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const guidance = completion.choices[0]?.message?.content || null;
    return NextResponse.json({ guidance });
  } catch (error) {
    console.error('Error generating guidance:', error);
    return NextResponse.json({ guidance: null }, { status: 500 });
  }
}


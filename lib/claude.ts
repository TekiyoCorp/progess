import OpenAI from 'openai';
import { TaskType } from '@/types';

const apiKey = process.env.OPENAI_API_KEY || '';

if (!apiKey) {
  console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
  console.warn('   L\'IA utilisera le mode fallback (scoring automatique)');
} else {
  console.log('✅ OPENAI_API_KEY loaded successfully');
}

const client = new OpenAI({
  apiKey,
});

const TEKIYO_CONTEXT = `Tu es l'assistant de Zak, founder de Tekiyo (agence web ultra premium).

CONTEXTE BUSINESS:
- Objectif mensuel : 50 000€
- Problème principal : perfectionnisme paralysant qui bloque l'action
- Projets moyens : 5 000€ - 20 000€
- 1 TikTok = 10-20 leads potentiels
- Refuse 95% des prospects par perfectionnisme
- Besoin de gamification pour rester actif et progresser

RÈGLES DE SCORING:
Tu dois analyser chaque tâche et lui attribuer un pourcentage de progression selon l'échelle suivante:

ULTRA HIGH (8-10%):
- Signature de contrat avec gros client
- Validation finale d'un projet 15-20k€
- Closer un deal important

HIGH (4-6%):
- Call de closing avec prospect qualifié
- Envoi de devis qualifié (projet 10k€+)
- Livraison projet client
- Présentation commerciale importante

MEDIUM (2-3%):
- Proposition commerciale détaillée
- Publication TikTok (génère leads)
- Call de qualification prospect
- Création storyboard projet
- Design mockup client

LOW (1%):
- Slides Instagram
- Email de suivi prospect
- Storyboard simple
- Follow-up client
- Tâche administrative importante
- Préparation call

CRITÈRES D'ANALYSE:
1. Mots-clés action: closer, signer, call, envoyer, livrer, poster, valider
2. Montants détectés: 15k, 20k, etc.
3. Type de client: nouveau, qualifié, existant
4. Étape du funnel: prospection → qualification → proposition → closing → livraison

Réponds UNIQUEMENT avec un objet JSON contenant:
- percentage: nombre entre 0 et 10
- type: 'call', 'design', 'video', 'email', ou 'other'
- reasoning: explication courte de ton scoring (50 mots max)`;

export async function scoreTask(taskTitle: string): Promise<any> {
  try {
    if (!apiKey) {
      console.log('🔄 No API key - using keyword-based scoring');
      throw new Error('No API key available');
    }

    console.log('🤖 Calling OpenAI API to score task:', taskTitle);

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es l'assistant de Zak (Tekiyo, agence web premium). Objectif: 50k€/mois.

SCORING STRICT:
- 8-10%: Signature contrat 15k€+, closing gros deal
- 4-6%: Call closing qualifié, devis 10k€+, livraison projet
- 2-3%: Proposition détaillée, TikTok, call qualification
- 1%: Email, admin, follow-up, préparation, design basique

IMPORTANT: Sois STRICT. Les tâches basiques = 1% MAX. Seuls les vrais deals = haut %.

JSON: {"percentage": X, "type": "call|design|video|email|other", "reasoning": "court"}`,
        },
        {
          role: 'user',
          content: taskTitle,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 120,
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content) as any;

    // Validate and clamp percentage
    const percentage = Math.max(0, Math.min(10, parsed.percentage || 1));

    // Validate type
    const validTypes: TaskType[] = ['call', 'dev', 'content', 'other'];
    const type = validTypes.includes(parsed.type) ? parsed.type : 'other';

    console.log('✅ Task scored:', { percentage, type });

    return {
      percentage,
      type,
      reasoning: parsed.reasoning || 'Analyse automatique',
    };
  } catch (error) {
    console.error('❌ Error scoring task with OpenAI:');
    console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    
    // Fallback scoring based on keywords
    const titleLower = taskTitle.toLowerCase();
    let percentage = 1;
    let type: TaskType = 'other';

    if (titleLower.includes('signer') || titleLower.includes('contrat')) {
      percentage = 8;
      type = 'other';
    } else if (titleLower.includes('call') || titleLower.includes('appel')) {
      percentage = titleLower.includes('closing') ? 5 : 2;
      type = 'call';
    } else if (titleLower.includes('devis')) {
      percentage = 4;
      type = 'other';
    } else if (titleLower.includes('tiktok') || titleLower.includes('video')) {
      percentage = 3;
      type = 'content';
    } else if (titleLower.includes('design') || titleLower.includes('mockup') || titleLower.includes('dev')) {
      percentage = 2;
      type = 'dev';
    } else if (titleLower.includes('email') || titleLower.includes('mail') || titleLower.includes('content')) {
      percentage = 1;
      type = 'content';
    }

    return {
      percentage,
      type,
      reasoning: 'Scoring automatique de fallback',
    };
  }
}

export async function solveProblem(problemTitle: string): Promise<string> {
  try {
    if (!apiKey) {
      console.log('🔄 No API key - using fallback solution');
      return `**Solution rapide**\n\nPour résoudre "${problemTitle}":\n\n1. **Identifie** la première action concrète à faire\n2. **Lance-toi** sans viser la perfection\n3. **Itère** après avoir commencé\n\n💡 L'action imparfaite > la perfection paralysante`;
    }

    console.log('🤖 Calling OpenAI API to solve:', problemTitle);
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es le coach business de Zak (Tekiyo). Réponds en 3 PHRASES MAX, ultra direct et actionnable. Format: **Action**: phrase courte.`,
        },
        {
          role: 'user',
          content: problemTitle,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log('✅ OpenAI API response received');
    return content;
  } catch (error) {
    console.error('❌ Error solving problem with OpenAI:');
    console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    
    return `**Erreur lors de l'analyse**\n\nImpossible de contacter l'IA pour le moment. Essaye de reformuler le problème ou réessaye plus tard.\n\n**En attendant:**\n- Décompose le problème en petites étapes\n- Identifie l'action la plus simple à faire maintenant\n- Lance-toi sans attendre la perfection`;
  }
}

export async function analyzeCalendarEvent(eventSummary: string, eventDescription?: string): Promise<{
  tasks: Array<{ title: string; percentage: number; type: TaskType }>;
}> {
  try {
    const eventInfo = eventDescription 
      ? `${eventSummary}\n\nDescription: ${eventDescription}`
      : eventSummary;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es l'assistant de Zak, founder de Tekiyo.

Génère 1 à 3 tâches concrètes liées à un événement du calendrier, avec leur scoring.

Réponds en JSON uniquement avec cette structure:
{
  "tasks": [
    {
      "title": "Titre de la tâche",
      "percentage": 1-10,
      "type": "call" | "design" | "video" | "email" | "other"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Événement du calendrier:\n"${eventInfo}"`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing calendar event:', error);
    return {
      tasks: [
        {
          title: `Préparer: ${eventSummary}`,
          percentage: 1,
          type: 'other',
        },
      ],
    };
  }
}


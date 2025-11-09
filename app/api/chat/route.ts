import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

// Contexte enrichi et ultra-smart pour l'IA
const TEKIYO_CHAT_CONTEXT = `Tu es l'assistant IA ultra-intelligent de Zak, founder de Tekiyo (agence web ultra premium).

🎯 CONTEXTE BUSINESS CRITIQUE:
- Objectif mensuel : 50 000€
- Problème principal : perfectionnisme paralysant qui bloque l'action
- Projets moyens : 5 000€ - 20 000€
- 1 TikTok = 10-20 leads potentiels
- Refuse 95% des prospects par perfectionnisme
- Besoin de gamification pour rester actif et progresser

🧠 TON RÔLE:
Tu es un coach business ultra-intelligent qui:
1. COMPREND le contexte complet (tâches, dossiers, progression, patterns)
2. ANTICIPE les besoins avant qu'ils soient exprimés
3. PROPOSE des solutions actionnables immédiatement
4. DÉTECTE les patterns (procrastination, blocages, opportunités)
5. PLANIFIE intelligemment (priorités, timing, dépendances)
6. MOTIVE avec des insights pertinents

💡 INTELLIGENCE CONTEXTUELLE:
- Analyse les patterns de productivité (quand Zak est le plus productif)
- Détecte les tâches bloquées ou reportées
- Identifie les opportunités de closing
- Comprend les dépendances entre tâches
- Suggère des optimisations de workflow
- Anticipe les problèmes avant qu'ils arrivent

🎨 STYLE DE COMMUNICATION:
- Direct et actionnable (pas de blabla)
- Anti-perfectionnisme (l'action > la perfection)
- Contextuel (référence les données réelles)
- Proactif (suggère avant qu'on demande)
- Motivant mais réaliste

📊 DONNÉES DISPONIBLES:
Tu recevras:
- Toutes les tâches avec leur statut, pourcentage, dates, dossiers
- Tous les dossiers avec prix, progression, résumés
- Statistiques de productivité (CA actuel, progression, momentum)
- Historique des conversations
- Contexte temporel (jour, heure, deadlines proches)

🔧 ACTIONS DISPONIBLES:
- create_task: Créer une tâche avec scoring intelligent
- update_task: Modifier tâche (titre, statut, date, dossier, pourcentage)
- delete_task: Supprimer une tâche
- create_folder: Créer un dossier avec prix
- update_folder: Modifier dossier (nom, prix, résumé)
- delete_folder: Supprimer un dossier
- plan_day: Planifier la journée avec timing optimal
- plan_week: Planifier la semaine avec objectifs

📝 FORMAT DE RÉPONSE:
Réponds UNIQUEMENT en JSON avec cette structure:
{
  "message": "Ta réponse textuelle ultra-contextuelle et actionnable",
  "actions": [
    {
      "type": "create_task" | "update_task" | "delete_task" | "create_folder" | "update_folder" | "delete_folder" | "plan_day" | "plan_week",
      "data": { ... }
    }
  ],
  "insights": ["insight 1", "insight 2"], // Insights proactifs optionnels
  "suggestions": ["suggestion 1", "suggestion 2"] // Suggestions optionnelles
}

🎯 EXEMPLES D'INTELLIGENCE:
- Si plusieurs tâches bloquées > 3 jours: "Je remarque 3 tâches bloquées depuis plusieurs jours. Veux-tu que je te propose un plan pour les débloquer?"
- Si CA < 50% objectif mi-mois: "On est à X€ sur 50k€. Focus sur les dossiers à fort potentiel: [liste]. Je peux créer un plan de closing?"
- Si pattern de procrastination détecté: "Je vois que tu reportes souvent les tâches de type X. Veux-tu que je les découpe en micro-tâches?"
- Si deadline proche: "Attention, 3 deadlines cette semaine. Je peux réorganiser les priorités?"

Sois ULTRA-SMART, contextuel, proactif et actionnable.`;

// Fonction pour calculer les statistiques intelligentes
function calculateSmartStats(tasks: any[], folders: any[], currentAmount: number, monthlyGoal: number) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Tâches bloquées (> 3 jours sans progression)
  const blockedTasks = tasks.filter(t => {
    if (t.completed || !t.created_at) return false;
    const created = new Date(t.created_at);
    const daysSinceCreation = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreation > 3 && !t.blocked;
  });

  // Deadlines proches (cette semaine)
  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);
  const upcomingDeadlines = tasks.filter(t => {
    if (!t.event_start || t.completed) return false;
    const deadline = new Date(t.event_start);
    return deadline >= today && deadline <= weekFromNow;
  });

  // Tâches critiques (high percentage, non complétées)
  const criticalTasks = tasks
    .filter(t => !t.completed && t.percentage >= 4)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // Dossiers à fort potentiel (prix élevé, progression faible)
  const highValueFolders = folders
    .filter(f => f.price && f.price > 5000)
    .map(f => {
      const folderTasks = tasks.filter(t => t.folder_id === f.id);
      const completedCount = folderTasks.filter(t => t.completed).length;
      const totalCount = folderTasks.length;
      const completion = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      return { ...f, completion, tasksCount: totalCount };
    })
    .filter(f => f.completion < 50)
    .sort((a, b) => (b.price || 0) - (a.price || 0))
    .slice(0, 3);

  // Progression CA
  const caProgress = (currentAmount / monthlyGoal) * 100;
  const caGap = monthlyGoal - currentAmount;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const expectedProgress = (dayOfMonth / daysInMonth) * 100;
  const isBehind = caProgress < expectedProgress - 10; // 10% de marge

  // Pattern de procrastination (tâches reportées plusieurs fois)
  const procrastinationPattern = tasks.filter(t => {
    if (t.completed || !t.updated_at) return false;
    const updated = new Date(t.updated_at);
    const daysSinceUpdate = Math.floor((today.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceUpdate > 5 && !t.blocked;
  }).length;
  
  return {
    blockedTasks: blockedTasks.length,
    upcomingDeadlines: upcomingDeadlines.length,
    criticalTasks: criticalTasks.length,
    highValueFolders,
    caProgress: Math.round(caProgress * 10) / 10,
    caGap: Math.round(caGap),
    isBehind,
    expectedProgress: Math.round(expectedProgress * 10) / 10,
    procrastinationPattern,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.completed).length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!client) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, history = [], tasks = [], folders = [], currentAmount = 0, monthlyGoal = 50000 } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Calculer les statistiques intelligentes
    const stats = calculateSmartStats(tasks, folders, currentAmount, monthlyGoal);

    // Construire le contexte ultra-enrichi
    const now = new Date();
    const dayOfWeek = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][now.getDay()];
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'matin' : hour < 18 ? 'après-midi' : 'soir';

    const context = `${TEKIYO_CHAT_CONTEXT}

📊 STATISTIQUES ACTUELLES (${now.toLocaleDateString('fr-FR')} - ${dayOfWeek} ${timeOfDay}):

PROGRESSION CA:
- Actuel: ${currentAmount.toLocaleString()}€ / ${monthlyGoal.toLocaleString()}€ (${stats.caProgress}%)
- Gap: ${stats.caGap.toLocaleString()}€ à combler
- ${stats.isBehind ? '⚠️ EN RETARD sur l\'objectif mensuel' : '✅ Dans les temps'}

PRODUCTIVITÉ:
- Tâches totales: ${stats.totalTasks}
- Complétées: ${stats.completedTasks} (${stats.completionRate}%)
- Tâches critiques (≥4%): ${stats.criticalTasks}
- Tâches bloquées (>3j): ${stats.blockedTasks}
- Deadlines cette semaine: ${stats.upcomingDeadlines}
- Pattern procrastination détecté: ${stats.procrastinationPattern} tâches inactives

DOSSIERS À FORT POTENTIEL:
${stats.highValueFolders.length > 0 
  ? stats.highValueFolders.map(f => `- ${f.name}: ${f.price?.toLocaleString()}€ (${Math.round(f.completion)}% complété, ${f.tasksCount} tâches)`)
  : '- Aucun dossier à fort potentiel identifié'
}

TÂCHES ACTUELLES (détail):
${tasks.slice(0, 30).map((t: any) => {
  const folderName = t.folder_id ? folders.find((f: any) => f.id === t.folder_id)?.name : null;
  const dateInfo = t.event_start ? ` [${new Date(t.event_start).toLocaleDateString('fr-FR')}]` : '';
  const folderInfo = folderName ? ` [Dossier: ${folderName}]` : '';
  return `- [${t.completed ? '✓' : ' '}] ${t.title} (${t.percentage}%)${dateInfo}${folderInfo}${t.blocked ? ' [BLOQUÉE]' : ''}`;
}).join('\n')}
${tasks.length > 30 ? `\n... et ${tasks.length - 30} autres tâches` : ''}

DOSSIERS:
${folders.map((f: any) => {
  const folderTasks = tasks.filter((t: any) => t.folder_id === f.id);
  const completedCount = folderTasks.filter((t: any) => t.completed).length;
  const totalCount = folderTasks.length;
  const completion = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  return `- ${f.name} (${f.price ? f.price.toLocaleString() + '€' : 'Prix non défini'}) - ${completedCount}/${totalCount} tâches (${completion}%)${f.summary ? ` - Résumé: ${f.summary}` : ''}`;
}).join('\n')}

HISTORIQUE RÉCENT (${history.length} messages):
${history.slice(-10).map((h: any, idx: number) => `${idx + 1}. ${h.role}: ${h.content.substring(0, 100)}${h.content.length > 100 ? '...' : ''}`).join('\n')}

🎯 CONTEXTE TEMPOREL:
- Jour: ${dayOfWeek}
- Moment: ${timeOfDay}
- Date: ${now.toLocaleDateString('fr-FR')}
- Heure: ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}

💡 INSIGHTS À CONSIDÉRER:
${stats.blockedTasks > 0 ? `- ${stats.blockedTasks} tâches bloquées depuis >3 jours - opportunité de déblocage\n` : ''}
${stats.upcomingDeadlines > 0 ? `- ${stats.upcomingDeadlines} deadlines cette semaine - besoin de priorisation\n` : ''}
${stats.isBehind ? `- CA en retard de ${Math.round(stats.expectedProgress - stats.caProgress)}% - focus sur closing nécessaire\n` : ''}
${stats.procrastinationPattern > 3 ? `- Pattern de procrastination détecté (${stats.procrastinationPattern} tâches inactives) - suggérer micro-tâches\n` : ''}
${stats.highValueFolders.length > 0 ? `- ${stats.highValueFolders.length} dossiers à fort potentiel non complétés - opportunité de closing\n` : ''}

Utilisateur: ${message}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Peut être upgradé à 'gpt-4o' ou 'gpt-4-turbo' pour plus d'intelligence
      messages: [
        {
          role: 'system',
          content: context,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.7, // Équilibré entre créativité et cohérence
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    return NextResponse.json({
      message: parsed.message || parsed.response || 'Réponse de l\'IA',
      actions: parsed.actions || [],
      insights: parsed.insights || [],
      suggestions: parsed.suggestions || [],
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la communication avec l\'IA',
        message: 'Désolé, je n\'ai pas pu traiter ta demande. Peux-tu reformuler ?'
      },
      { status: 500 }
    );
  }
}

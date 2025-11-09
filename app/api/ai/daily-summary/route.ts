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

const { tasks, folders = [], problems = [], currentAmount = 0, monthlyGoal = 50000 } = await request.json();

    // Tâches critiques (non complétées, haut pourcentage)
    const criticalTasks = tasks
      .filter((t: any) => !t.completed && t.percentage >= 4)
      .sort((a: any, b: any) => b.percentage - a.percentage)
      .slice(0, 3);

    // Tâches avec deadlines aujourd'hui ou cette semaine
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);
    
    const deadlineTasks = tasks.filter((t: any) => {
      if (!t.event_start) return false;
      const taskDate = new Date(t.event_start);
      return taskDate >= today && taskDate <= weekFromNow && !t.completed;
    }).slice(0, 5);

    // Problèmes non résolus
    const unsolvedProblems = problems.filter((p: any) => !p.solved).slice(0, 3);

    // CA actuel vs objectif
    const caProgress = ((currentAmount / monthlyGoal) * 100).toFixed(1);
    const caGap = monthlyGoal - currentAmount;

    // Dossiers en cours avec prix
    const activeFolders = folders.filter((f: any) => {
      const folderTasks = tasks.filter((t: any) => t.folder_id === f.id);
      const completedCount = folderTasks.filter((t: any) => t.completed).length;
      return folderTasks.length > 0 && completedCount < folderTasks.length;
    });

    const prompt = `Tu es l'assistant de Zak (Tekiyo). Génère un Daily Brief ultra concis et actionnable en français.

CONTEXTE:
- CA actuel: ${currentAmount.toLocaleString()}€ / ${monthlyGoal.toLocaleString()}€ (${caProgress}%)
- ${caGap > 0 ? `Gap: ${caGap.toLocaleString()}€ à combler` : 'Objectif atteint ! 🎉'}

TÂCHES CRITIQUES (${criticalTasks.length}):
${criticalTasks.map((t: any, i: number) => `${i + 1}. ${t.title} (${t.percentage}%)`).join('\n')}

DEADLINES CETTE SEMAINE (${deadlineTasks.length}):
${deadlineTasks.map((t: any) => `- ${t.title} (${new Date(t.event_start).toLocaleDateString('fr-FR')})`).join('\n')}

PROBLÈMES BLOQUANTS (${unsolvedProblems.length}):
${unsolvedProblems.map((p: any) => `- ${p.title}`).join('\n')}

DOSSIERS ACTIFS: ${activeFolders.length} dossiers en cours

Génère un résumé en 4-5 phrases max, ultra direct et actionnable. Style conversationnel mais business. Focus sur les actions prioritaires.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant concis qui génère des résumés ultra courts et naturels.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || 'Aucune tâche prévue pour aujourd\'hui.';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}


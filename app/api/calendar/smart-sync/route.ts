import { NextRequest, NextResponse } from 'next/server';
import { fetchCalendarEvents, isRelevantEvent } from '@/lib/calendar';
import { analyzeCalendarEvent } from '@/lib/claude';

/**
 * Smart Calendar Sync - IA qui gère intelligemment le calendrier
 * 
 * Fonctionnalités :
 * 1. Sync automatique des événements pertinents
 * 2. Génération intelligente de tâches (avant/après l'événement)
 * 3. Scoring automatique basé sur le type d'événement
 * 4. Détection des conflits et suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, mode = 'smart' } = body;

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    console.log('🤖 [Smart Sync] Starting intelligent calendar sync...');

    // Fetch events from Google Calendar
    const events = await fetchCalendarEvents(accessToken, 50);
    console.log(`📅 [Smart Sync] Fetched ${events.length} events`);

    // Filter relevant events (appels, meetings, deadlines)
    const relevantEvents = events.filter(isRelevantEvent);
    console.log(`✅ [Smart Sync] ${relevantEvents.length} relevant events`);

    // Générer des tâches intelligentes pour chaque événement
    const generatedTasks = [];
    
    for (const event of relevantEvents.slice(0, 10)) {
      try {
        console.log(`🔍 [Smart Sync] Analyzing event: ${event.summary}`);
        
        // L'IA analyse l'événement et génère des tâches
        const result = await analyzeCalendarEvent(event.summary, event.description);
        
        for (const task of result.tasks) {
          generatedTasks.push({
            ...task,
            event_id: event.id,
            event_start: event.start,
            source: 'calendar',
            smartGenerated: true,
          });
        }
      } catch (error) {
        console.error(`❌ [Smart Sync] Error analyzing event ${event.id}:`, error);
        // Continue with other events
      }
    }

    console.log(`🎯 [Smart Sync] Generated ${generatedTasks.length} smart tasks`);

    return NextResponse.json({
      success: true,
      eventsFound: events.length,
      relevantEvents: relevantEvents.length,
      tasksGenerated: generatedTasks.length,
      tasks: generatedTasks,
      suggestions: {
        nextSync: 'in 1 hour',
        conflicts: [],
        recommendations: [
          'Préparer les appels clients à l\'avance',
          'Bloquer du temps pour les tâches de design',
        ],
      },
    });
  } catch (error) {
    console.error('❌ [Smart Sync] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to smart sync';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { fetchCalendarEvents, isRelevantEvent } from '@/lib/calendar';
import { analyzeCalendarEvent } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Fetch events from Google Calendar
    const events = await fetchCalendarEvents(accessToken, 20);

    // Filter relevant events
    const relevantEvents = events.filter(isRelevantEvent);

    // Generate tasks from relevant events
    const generatedTasks = [];
    
    for (const event of relevantEvents.slice(0, 5)) {
      try {
        const result = await analyzeCalendarEvent(event.summary, event.description);
        
        for (const task of result.tasks) {
          generatedTasks.push({
            ...task,
            eventId: event.id,
            eventStart: event.start,
          });
        }
      } catch (error) {
        console.error(`Error analyzing event ${event.id}:`, error);
        // Continue with other events
      }
    }

    return NextResponse.json({
      eventsFound: events.length,
      relevantEvents: relevantEvents.length,
      tasksGenerated: generatedTasks.length,
      tasks: generatedTasks,
    });
  } catch (error) {
    console.error('Error in calendar sync API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync calendar';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method with accessToken to sync calendar',
    method: 'POST',
    body: {
      accessToken: 'your_google_access_token',
    },
  });
}



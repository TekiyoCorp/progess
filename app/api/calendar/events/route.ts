import { NextRequest, NextResponse } from 'next/server';
import { fetchCalendarEvents } from '@/lib/calendar';

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

    // Fetch events from Google Calendar (prochains 30 jours)
    const events = await fetchCalendarEvents(accessToken, 50);

    return NextResponse.json({
      events,
      count: events.length,
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}



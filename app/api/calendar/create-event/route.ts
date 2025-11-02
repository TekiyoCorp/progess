import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent } from '@/lib/calendar';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, title, startDateTime, endDateTime, description } = body;

    console.log('🔍 [Create Event] Request received:', {
      hasAccessToken: !!accessToken,
      title,
      startDateTime,
      endDateTime,
    });

    if (!accessToken || typeof accessToken !== 'string') {
      console.error('❌ [Create Event] Missing access token');
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    if (!title || !startDateTime) {
      console.error('❌ [Create Event] Missing title or startDateTime');
      return NextResponse.json(
        { error: 'Title and startDateTime are required' },
        { status: 400 }
      );
    }

    console.log('📅 [Create Event] Creating calendar event:', title, startDateTime);

    const event = await createCalendarEvent(
      accessToken,
      title,
      startDateTime,
      endDateTime,
      description
    );

    console.log('✅ [Create Event] Event created:', event.id);

    return NextResponse.json({
      event,
    });
  } catch (error) {
    console.error('❌ [Create Event] Error details:', error);
    console.error('❌ [Create Event] Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create calendar event';
    
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


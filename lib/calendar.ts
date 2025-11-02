import { google } from 'googleapis';
import { CalendarEvent } from '@/types';

// Google Calendar OAuth2 client setup
export function getGoogleCalendarClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Fetch upcoming events from Google Calendar
export async function fetchCalendarEvents(
  accessToken: string,
  maxResults: number = 10
): Promise<CalendarEvent[]> {
  try {
    const calendar = getGoogleCalendarClient(accessToken);

    // Limite à 30 jours max
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // +30 jours

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: maxDate.toISOString(), // Max 30 jours
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    return events.map(event => ({
      id: event.id || '',
      summary: event.summary || 'Sans titre',
      description: event.description || undefined,
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location || undefined,
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error('Failed to fetch calendar events');
  }
}

// Check if an event is relevant for task generation
export function isRelevantEvent(event: CalendarEvent): boolean {
  const summary = event.summary.toLowerCase();
  const description = (event.description || '').toLowerCase();
  const combined = `${summary} ${description}`;

  // Keywords that indicate a relevant business event
  const relevantKeywords = [
    'call',
    'appel',
    'client',
    'projet',
    'meeting',
    'réunion',
    'deadline',
    'livraison',
    'présentation',
    'demo',
    'pitch',
    'closing',
    'signature',
    'devis',
    'proposition',
  ];

  return relevantKeywords.some(keyword => combined.includes(keyword));
}

// Create a new event in Google Calendar
export async function createCalendarEvent(
  accessToken: string,
  title: string,
  startDateTime: string,
  endDateTime?: string,
  description?: string
): Promise<{ id: string; start: string; end: string }> {
  try {
    console.log('🔍 [createCalendarEvent] Starting...', { title, startDateTime });
    
    const calendar = getGoogleCalendarClient(accessToken);
    console.log('✅ [createCalendarEvent] Calendar client created');

    // Si pas d'end date, mettre 1h après le start
    if (!endDateTime) {
      const start = new Date(startDateTime);
      start.setHours(start.getHours() + 1);
      endDateTime = start.toISOString();
    }

    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: startDateTime,
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Europe/Paris',
      },
    };

    console.log('📤 [createCalendarEvent] Inserting event:', event);

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    console.log('📥 [createCalendarEvent] Response received:', response.data);

    if (!response.data.id) {
      throw new Error('Failed to create calendar event - no ID returned');
    }

    return {
      id: response.data.id,
      start: response.data.start?.dateTime || startDateTime,
      end: response.data.end?.dateTime || endDateTime,
    };
  } catch (error: any) {
    console.error('❌ [createCalendarEvent] Error:', error);
    console.error('❌ [createCalendarEvent] Error message:', error?.message);
    console.error('❌ [createCalendarEvent] Error response:', error?.response?.data);
    console.error('❌ [createCalendarEvent] Error status:', error?.response?.status);
    
    // Remonter l'erreur exacte
    if (error?.response?.data?.error) {
      throw new Error(`Google Calendar API Error: ${JSON.stringify(error.response.data.error)}`);
    }
    
    throw error;
  }
}


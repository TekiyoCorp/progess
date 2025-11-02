'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types';
import { supabase } from '@/lib/supabase';

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthAndFetchEvents();

    // Auto-refresh toutes les 5 minutes pour détecter les modifs
    const intervalId = setInterval(() => {
      console.log('🔄 [Calendar] Auto-refresh...');
      checkAuthAndFetchEvents();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  const checkAuthAndFetchEvents = async () => {
    console.log('🔍 [Calendar] Checking auth...');
    if (!supabase) {
      console.log('❌ [Calendar] No Supabase client');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔐 [Calendar] Session:', session ? 'Authenticated' : 'Not authenticated');
    console.log('🎫 [Calendar] Provider token:', session?.provider_token ? 'Present' : 'Missing');
    
    if (session?.provider_token) {
      setAccessToken(session.provider_token);
      await fetchEvents(session.provider_token);
    } else {
      console.log('⚠️ [Calendar] No provider token, events will not be fetched');
    }
  };

  const fetchEvents = async (token: string) => {
    console.log('📅 [Calendar] Fetching events...');
    setLoading(true);
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      });

      console.log('📡 [Calendar] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Calendar] API error:', errorData);
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      console.log('✅ [Calendar] Events fetched:', data.count, 'events');
      console.log('📋 [Calendar] Events:', data.events);
      setEvents(data.events || []);
    } catch (error) {
      console.error('❌ [Calendar] Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = async () => {
    if (accessToken) {
      await fetchEvents(accessToken);
    }
  };

  return {
    events,
    loading,
    isAuthenticated: !!accessToken,
    refreshEvents,
  };
}


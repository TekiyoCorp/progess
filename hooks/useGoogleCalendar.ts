'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types';
import { supabase } from '@/lib/supabase';

const TOKEN_STORAGE_KEY = 'google_calendar_token';
const TOKEN_EXPIRY_KEY = 'google_calendar_token_expiry';

export function useGoogleCalendar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check authentication status on mount and listen to auth changes
  useEffect(() => {
    checkAuthStatus();

    // Listen for auth state changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        console.log('🔐 [Calendar] Auth state changed:', _event);
        if (session?.provider_token) {
          console.log('✅ [Calendar] Got provider token from auth change');
          saveToken(session.provider_token);
          setAccessToken(session.provider_token);
          setIsAuthenticated(true);
        } else {
          console.log('⚠️ [Calendar] No provider token in auth change');
          // Check localStorage as fallback
          const savedToken = loadToken();
          if (savedToken) {
            console.log('✅ [Calendar] Using saved token from localStorage');
            setAccessToken(savedToken);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const saveToken = (token: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    // Token valide pour 1 heure par défaut
    const expiry = Date.now() + 3600 * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
  };

  const loadToken = (): string | null => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (!token || !expiry) return null;

    // Vérifier si le token n'est pas expiré
    if (Date.now() > parseInt(expiry)) {
      console.log('⚠️ [Calendar] Token expired, clearing');
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      return null;
    }

    return token;
  };

  const checkAuthStatus = async () => {
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔍 [Calendar] Checking auth status...');
    
    if (session?.provider_token) {
      console.log('✅ [Calendar] Provider token present in session');
      saveToken(session.provider_token);
      setAccessToken(session.provider_token);
      setIsAuthenticated(true);
    } else {
      console.log('⚠️ [Calendar] No provider token in session, checking localStorage');
      // Fallback to localStorage
      const savedToken = loadToken();
      if (savedToken) {
        console.log('✅ [Calendar] Using saved token from localStorage');
        setAccessToken(savedToken);
        setIsAuthenticated(true);
      } else {
        console.log('❌ [Calendar] No valid token found');
        setIsAuthenticated(false);
      }
    }
  };

  const connectGoogleCalendar = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Error connecting to Google Calendar:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const disconnectGoogleCalendar = async () => {
    if (!supabase) return;

    await supabase.auth.signOut();
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    setAccessToken(null);
    setIsAuthenticated(false);
  };

  const syncCalendar = async (onTasksCreated: (tasks: Task[]) => void) => {
    if (!accessToken) {
      console.error('No access token available');
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync calendar');
      }

      const data = await response.json();
      
      // Create tasks from calendar events
      if (data.tasks && data.tasks.length > 0) {
        onTasksCreated(data.tasks);
      }

      return data;
    } catch (error) {
      console.error('Error syncing calendar:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isAuthenticated,
    isSyncing,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncCalendar,
  };
}

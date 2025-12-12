'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Add refs to track auth state and prevent race conditions
  const isUpdatingAuth = useRef(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authListenerRef = useRef<{ subscription: { unsubscribe: () => void } } | null>(null);

  // Initialize theme
  useEffect(() => {
    // Check for saved theme preference or use light mode as default
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      // Only apply dark mode if explicitly set
      document.documentElement.classList.add('dark');
    } else {
      // Default to light mode
      document.documentElement.classList.remove('dark');
      // If no theme is set yet, save the default preference
      if (!savedTheme) {
        localStorage.setItem('theme', 'light');
      }
    }
  }, []);

  useEffect(() => {
    // Clear any existing timeouts
    const clearAuthTimeout = () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
    };

    const clearLoadingTimeout = () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };

    // Set loading timeout to prevent indefinite loading states
    const setLoadingTimeout = () => {
      clearLoadingTimeout();
      loadingTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        setError(new Error('Authentication timeout - please try refreshing the page'));
      }, 15000); // 15 second loading timeout
    };

    // Atomic auth state update function with timeout protection
    const updateAuthState = async (newSession: Session | null) => {
      // Prevent concurrent updates
      if (isUpdatingAuth.current) {
        return;
      }

      isUpdatingAuth.current = true;
      clearAuthTimeout();

      // Set timeout to prevent hanging auth updates
      authTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        isUpdatingAuth.current = false;
      }, 10000); // 10 second timeout

      try {
        setError(null);

        if (newSession) {
          // Session exists, extract user from session
          const user = newSession.user;
          setSession(newSession);
          setUser(user);
        } else {
          // No session, clear everything
          setSession(null);
          setUser(null);
        }
      } catch (err) {
        setError(err as Error);
        // On error, clear auth state
        setSession(null);
        setUser(null);
      } finally {
        clearAuthTimeout();
        clearLoadingTimeout();
        setLoading(false);
        isUpdatingAuth.current = false;
      }
    };

    // Initialize auth state by getting current session with retry logic
    const initializeAuth = async (retryCount = 0) => {
      const maxRetries = 3;

      try {
        setLoading(true);
        setLoadingTimeout(); // Set loading timeout

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {

          // Retry on network errors
          if (retryCount < maxRetries && (error.message.includes('network') || error.message.includes('timeout'))) {
            setTimeout(() => initializeAuth(retryCount + 1), (retryCount + 1) * 1000);
            return;
          }

          setError(error);
          setLoading(false);
          return;
        }

        await updateAuthState(session);
      } catch (err) {

        // Retry on unexpected errors
        if (retryCount < maxRetries) {
          setTimeout(() => initializeAuth(retryCount + 1), (retryCount + 1) * 1000);
          return;
        }

        setError(err as Error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes with proper error handling
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {

        try {
          await updateAuthState(newSession);
        } catch (err) {
          setError(err as Error);
        }
      }
    );

    // Store listener reference for cleanup
    authListenerRef.current = authListener;

    // Cleanup function with proper resource cleanup
    return () => {
      clearAuthTimeout();
      clearLoadingTimeout();

      if (authListenerRef.current?.subscription) {
        authListenerRef.current.subscription.unsubscribe();
        authListenerRef.current = null;
      }

      // Reset auth update flag
      isUpdatingAuth.current = false;
    };
  }, []);

  const value = {
    session,
    user,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


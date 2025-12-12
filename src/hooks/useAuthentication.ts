'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, signOut, checkConnection } from '@/lib/auth';

// Connection retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  timeoutMs: 30000 // 30 seconds
};

// Network error detection
function isNetworkError(error: Error): boolean {
  const networkErrorMessages = [
    'network',
    'timeout',
    'connection',
    'fetch',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT'
  ];

  return networkErrorMessages.some(msg =>
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
}

// Exponential backoff delay calculation
function calculateDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

export function useAuthentication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Retry wrapper with exponential backoff
  const withRetry = async <T>(
    operation: () => Promise<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _operationName: string
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        setRetryCount(attempt);

        if (attempt > 1) {
          setIsRetrying(true);
          const delay = calculateDelay(attempt - 1);
          await new Promise(res => setTimeout(res, delay));
        }

        // Create abort controller for timeout
        abortControllerRef.current = new AbortController();
        const timeoutId = setTimeout(() => {
          abortControllerRef.current?.abort();
        }, RETRY_CONFIG.timeoutMs);

        const result = await operation();

        clearTimeout(timeoutId);
        setIsRetrying(false);
        setRetryCount(0);

        return result;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on authentication errors (invalid credentials, etc.)
        if (!isNetworkError(lastError)) {
          setIsRetrying(false);
          setRetryCount(0);
          throw lastError;
        }

        if (attempt === RETRY_CONFIG.maxRetries) {
          setIsRetrying(false);
          setRetryCount(0);
          break;
        }
      }
    }

    throw lastError!;
  };

  // Handle login with retry logic
  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check connection health before attempting login
      await checkConnection();

      const result = await withRetry(async () => {
        const { user, error: signInError } = await signIn(email, password);

        if (signInError) {
          throw new Error(signInError.message);
        }

        return { user };
      }, 'login');

      if (result.user) {
        // Check if there's a redirect path stored
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        const targetPath = redirectPath || '/dashboard';

        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterLogin');
        }

        router.push(targetPath);
      }
    } catch (err) {
      const error = err as Error;

      // Provide user-friendly error messages
      let userMessage = error.message;
      if (isNetworkError(error)) {
        userMessage = 'Connection issue. Please check your internet connection and try again.';
      } else if (error.message.includes('Invalid login credentials')) {
        userMessage = 'Invalid email or password. Please try again.';
      } else if (error.message.includes('Email not confirmed')) {
        userMessage = 'Please check your email and confirm your account before signing in.';
      }

      setError(userMessage);
    } finally {
      setLoading(false);
      setIsRetrying(false);
      setRetryCount(0);

      // Clean up abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    }
  };

  // Handle registration
  const handleRegister = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    airline: string,
    position: 'CCM' | 'SCCM',
    nationality?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Sign up the user with Supabase Auth
      const { user, error: signUpError } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        airline,
        position,
        nationality
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (user) {
        // No need to manually create a profile - it's created by the database trigger

        // Redirect to dashboard or confirmation page
        router.push('/dashboard');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: signOutError } = await signOut();

      if (signOutError) {
        throw new Error(signOutError.message);
      }

      // Redirect to home page
      router.push('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    isRetrying,
    retryCount,
    handleLogin,
    handleRegister,
    handleLogout
  };
}

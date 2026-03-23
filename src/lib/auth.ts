import { supabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AuthError,
  Session,
  User
} from '@supabase/supabase-js';

// Connection health check
export async function checkConnection(
  client: SupabaseClient = supabase
): Promise<{
  healthy: boolean;
  error?: string;
}> {
  try {
    // Simple health check by attempting to get session
    const { error } = await client.auth.getSession();

    if (error) {
      return {
        healthy: false,
        error: error.message
      };
    }

    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
}

// Retry wrapper for auth operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on authentication errors (invalid credentials, etc.)
      if (error instanceof Error && (
        error.message.includes('Invalid login credentials') ||
        error.message.includes('Email not confirmed') ||
        error.message.includes('User not found')
      )) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

// Sign up a new user
export async function signUp(
  email: string,
  password: string,
  metadata: {
    first_name: string;
    last_name: string;
    airline: string;
    position: 'CCM' | 'SCCM';
    username: string;
    nationality?: string;
  },
  client: SupabaseClient = supabase
): Promise<{
  user: User | null;
  error: AuthError | null;
  session: Session | null
}> {
  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    return {
      user: data?.user || null,
      session: data?.session || null,
      error
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error as AuthError
    };
  }
}

// Sign in a user with retry logic
export async function signIn(
  email: string,
  password: string,
  client: SupabaseClient = supabase
): Promise<{
  user: User | null;
  error: AuthError | null;
  session: Session | null
}> {
  try {
    // Check connection health first
    const healthCheck = await checkConnection(client);
    if (!healthCheck.healthy) {
    }

    const result = await withRetry(async () => {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      return {
        user: data?.user || null,
        session: data?.session || null,
        error: null
      };
    });

    return result;
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error as AuthError
    };
  }
}

// Sign out a user
export async function signOut(
  client: SupabaseClient = supabase
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await client.auth.signOut();
    return { error };
  } catch (error) {
    return { error: error as AuthError };
  }
}

// Get the current session with validation
export async function getSession(
  client: SupabaseClient = supabase
): Promise<{
  session: Session | null;
  error: AuthError | null
}> {
  try {
    const { data, error } = await client.auth.getSession();

    if (error) {
      return { session: null, error };
    }

    const session = data?.session;

    // Validate session if it exists
    if (session) {
      const isValid = await validateSession(session, client);
      if (!isValid) {
        const refreshResult = await refreshSession(client);
        return refreshResult;
      }
    }

    return {
      session: session || null,
      error: null
    };
  } catch (error) {
    return {
      session: null,
      error: error as AuthError
    };
  }
}

// Get the current user
export async function getUser(
  client: SupabaseClient = supabase
): Promise<{
  user: User | null;
  error: AuthError | null
}> {
  try {
    const { data, error } = await client.auth.getUser();
    return {
      user: data?.user || null,
      error
    };
  } catch (error) {
    return {
      user: null,
      error: error as AuthError
    };
  }
}

// Reset password
export async function resetPassword(
  email: string,
  client: SupabaseClient = supabase
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await client.auth.resetPasswordForEmail(email);
    return { error };
  } catch (error) {
    return { error: error as AuthError };
  }
}

// Update password
export async function updatePassword(
  password: string,
  client: SupabaseClient = supabase
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await client.auth.updateUser({
      password
    });
    return { error };
  } catch (error) {
    return { error: error as AuthError };
  }
}

// Validate session expiry and integrity
export async function validateSession(
  session: Session,
  client: SupabaseClient = supabase
): Promise<boolean> {
  try {
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;

    if (!expiresAt || now >= expiresAt) {
      return false;
    }

    // Check if session expires within next 5 minutes (300 seconds)
    // This allows for proactive refresh
    const refreshThreshold = 300;
    if (now >= (expiresAt - refreshThreshold)) {
      return false;
    }

    // Validate session integrity by checking if user still exists
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Refresh the current session
export async function refreshSession(
  client: SupabaseClient = supabase
): Promise<{
  session: Session | null;
  error: AuthError | null;
}> {
  try {
    const { data, error } = await client.auth.refreshSession();

    if (error) {
      return { session: null, error };
    }

    const session = data?.session;
    if (session) {
    }

    return {
      session: session || null,
      error: null
    };
  } catch (error) {
    return {
      session: null,
      error: error as AuthError
    };
  }
}

// Update user metadata
export async function updateUserMetadata(
  metadata: Record<string, unknown>,
  client: SupabaseClient = supabase
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await client.auth.updateUser({
      data: metadata
    });
    return { error };
  } catch (error) {
    return { error: error as AuthError };
  }
}

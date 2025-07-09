import { supabase } from './supabase';
import {
  AuthError,
  Session,
  User,
  AuthResponse
} from '@supabase/supabase-js';

// Connection health check
export async function checkConnection(): Promise<{
  healthy: boolean;
  error?: string;
}> {
  try {
    // Simple health check by attempting to get session
    const { error } = await supabase.auth.getSession();

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

      console.log(`Auth operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
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
    nationality?: string;
  }
): Promise<{
  user: User | null;
  error: AuthError | null;
  session: Session | null
}> {
  try {
    const { data, error } = await supabase.auth.signUp({
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
    console.error('Error signing up:', error);
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
  password: string
): Promise<{
  user: User | null;
  error: AuthError | null;
  session: Session | null
}> {
  try {
    // Check connection health first
    const healthCheck = await checkConnection();
    if (!healthCheck.healthy) {
      console.warn('Connection health check failed:', healthCheck.error);
    }

    const result = await withRetry(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
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
    console.error('Error signing in:', error);
    return {
      user: null,
      session: null,
      error: error as AuthError
    };
  }
}

// Sign out a user
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error: error as AuthError };
  }
}

// Get the current session with validation
export async function getSession(): Promise<{
  session: Session | null;
  error: AuthError | null
}> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { session: null, error };
    }

    const session = data?.session;

    // Validate session if it exists
    if (session) {
      const isValid = await validateSession(session);
      if (!isValid) {
        console.log('Session invalid, attempting refresh...');
        const refreshResult = await refreshSession();
        return refreshResult;
      }
    }

    return {
      session: session || null,
      error: null
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return {
      session: null,
      error: error as AuthError
    };
  }
}

// Get the current user
export async function getUser(): Promise<{
  user: User | null;
  error: AuthError | null
}> {
  try {
    const { data, error } = await supabase.auth.getUser();
    return {
      user: data?.user || null,
      error
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return {
      user: null,
      error: error as AuthError
    };
  }
}

// Reset password
export async function resetPassword(
  email: string
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { error: error as AuthError };
  }
}

// Update password
export async function updatePassword(
  password: string
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password
    });
    return { error };
  } catch (error) {
    console.error('Error updating password:', error);
    return { error: error as AuthError };
  }
}

// Validate session expiry and integrity
export async function validateSession(session: Session): Promise<boolean> {
  try {
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;

    if (!expiresAt || now >= expiresAt) {
      console.log('Session expired');
      return false;
    }

    // Check if session expires within next 5 minutes (300 seconds)
    // This allows for proactive refresh
    const refreshThreshold = 300;
    if (now >= (expiresAt - refreshThreshold)) {
      console.log('Session expires soon, should refresh');
      return false;
    }

    // Validate session integrity by checking if user still exists
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.log('Session user validation failed:', error?.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
}

// Refresh the current session
export async function refreshSession(): Promise<{
  session: Session | null;
  error: AuthError | null;
}> {
  try {
    console.log('Attempting to refresh session...');
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Session refresh failed:', error);
      return { session: null, error };
    }

    const session = data?.session;
    if (session) {
      console.log('Session refreshed successfully');
    }

    return {
      session: session || null,
      error: null
    };
  } catch (error) {
    console.error('Error refreshing session:', error);
    return {
      session: null,
      error: error as AuthError
    };
  }
}

// Update user metadata
export async function updateUserMetadata(
  metadata: Record<string, any>
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      data: metadata
    });
    return { error };
  } catch (error) {
    console.error('Error updating user metadata:', error);
    return { error: error as AuthError };
  }
}

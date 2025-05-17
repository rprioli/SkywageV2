import { supabase } from './supabase';
import { 
  AuthError, 
  Session, 
  User, 
  AuthResponse 
} from '@supabase/supabase-js';

// Sign up a new user
export async function signUp(
  email: string, 
  password: string, 
  metadata: { 
    first_name: string; 
    last_name: string; 
    airline: string; 
    position: 'CCM' | 'SCCM' 
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

// Sign in a user
export async function signIn(
  email: string, 
  password: string
): Promise<{ 
  user: User | null; 
  error: AuthError | null; 
  session: Session | null 
}> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return {
      user: data?.user || null,
      session: data?.session || null,
      error
    };
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

// Get the current session
export async function getSession(): Promise<{ 
  session: Session | null; 
  error: AuthError | null 
}> {
  try {
    const { data, error } = await supabase.auth.getSession();
    return {
      session: data?.session || null,
      error
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

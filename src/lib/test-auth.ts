/**
 * Test authentication utilities for development
 * This provides a way to authenticate as the test user for CSV upload testing
 */

import { supabase } from './supabase';

export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_USER_EMAIL = 'test-user@skywage.dev';

/**
 * Signs in as the test user for development testing
 * This bypasses normal authentication for CSV upload testing
 */
export async function signInAsTestUser(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // For development, we'll create a session manually
    // In a real app, this would be done through proper authentication
    
    // First, check if we're already signed in as the test user
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user?.id === TEST_USER_ID) {
      return { success: true };
    }

    // For now, we'll use a simple approach - sign in with email/password
    // Note: This requires the test user to exist in auth.users with a password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: 'test-password-123' // This should match what we set in the database
    });

    if (error) {
      console.error('Test user sign in error:', error);
      return { 
        success: false, 
        error: `Failed to sign in as test user: ${error.message}` 
      };
    }

    if (data.user?.id !== TEST_USER_ID) {
      return {
        success: false,
        error: 'Signed in user ID does not match expected test user ID'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Test authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown authentication error'
    };
  }
}

/**
 * Signs out the current user
 */
export async function signOut(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown sign out error'
    };
  }
}

/**
 * Gets the current authenticated user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: session } = await supabase.auth.getSession();
    return session?.session?.user?.id || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

/**
 * Checks if the current user is the test user
 */
export async function isTestUser(): Promise<boolean> {
  const userId = await getCurrentUserId();
  return userId === TEST_USER_ID;
}

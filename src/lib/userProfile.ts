/**
 * User profile utilities for Skywage
 * Used to update user metadata in Supabase Auth
 */

import { supabase } from './supabase';
import { updateProfile } from './db';

/**
 * Updates the user's avatar URL in their profile
 * @param avatarUrl The URL of the uploaded avatar
 * @param userId The user ID (optional, will get current user if not provided)
 * @returns An object with success status and error message if failed
 */
export async function updateUserAvatar(avatarUrl: string, userId?: string): Promise<{ success: boolean; error: string | null }> {
  try {
    let user_id = userId;

    // If no user ID provided, get current user
    if (!user_id) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      user_id = user.id;
    }

    // Update profiles table (this is the source of truth for avatar_url)
    const { error: profileError } = await updateProfile(user_id, { avatar_url: avatarUrl });

    if (profileError) {
      throw new Error(profileError.message || 'Failed to update profile table');
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unknown error occurred while updating profile'
    };
  }
}

/**
 * Updates the user's nationality in both Auth metadata and profile table
 * @param nationality The nationality to set
 * @param userId The user ID (optional, will get current user if not provided)
 * @returns An object with success status and error message if failed
 */
export async function updateUserNationality(nationality: string, userId?: string): Promise<{ success: boolean; error: string | null }> {
  try {
    let user_id = userId;

    // If no user ID provided, get current user
    if (!user_id) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      user_id = user.id;
    }

    // Skip auth metadata update - it causes session corruption
    // We read from database anyway, so auth metadata is not needed

    // Update profiles table (this is the critical update)
    const { error: profileError } = await updateProfile(user_id, { nationality });

    if (profileError) {
      throw new Error(profileError.message || 'Failed to update profile table');
    }

    return { success: true, error: null };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred while updating nationality'
    };
  }
}

/**
 * Updates the user's position in both Auth metadata and profile table
 * @param position The position to set ('CCM' or 'SCCM')
 * @param userId The user ID (optional, will get current user if not provided)
 * @returns An object with success status and error message if failed
 */
export async function updateUserPosition(position: 'CCM' | 'SCCM', userId?: string): Promise<{ success: boolean; error: string | null }> {
  try {
    let user_id = userId;

    // If no user ID provided, get current user
    if (!user_id) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      user_id = user.id;
    }

    // Skip auth metadata update - it causes session corruption
    // We read from database anyway, so auth metadata is not needed

    // Update profiles table (this is the critical update)
    const { error: profileError } = await updateProfile(user_id, { position });

    if (profileError) {
      throw new Error(profileError.message || 'Failed to update profile table');
    }

    return { success: true, error: null };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred while updating position'
    };
  }
}

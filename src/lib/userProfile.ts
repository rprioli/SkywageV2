/**
 * User profile utilities for Skywage
 * Used to update user metadata in Supabase Auth
 */

import { supabase } from './supabase';

/**
 * Updates the user's avatar URL in their metadata
 * @param avatarUrl The URL of the uploaded avatar
 * @returns An object with success status and error message if failed
 */
export async function updateUserAvatar(avatarUrl: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl }
    });

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating user avatar:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred while updating profile' 
    };
  }
}

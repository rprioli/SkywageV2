/**
 * User profile utilities for Skywage
 * Used to update user metadata in Supabase Auth
 */

import { supabase } from './supabase';
import { updateProfile } from './db';

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

/**
 * Updates the user's nationality in their profile table
 * @param nationality The nationality to set
 * @returns An object with success status and error message if failed
 */
export async function updateUserNationality(nationality: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User authentication failed:', userError);
      throw new Error('User not authenticated');
    }

    // Update profiles table using the existing function
    const { data: profileData, error: profileError } = await updateProfile(user.id, { nationality });

    if (profileError) {
      console.error('Profile table update failed:', profileError);
      throw new Error(profileError.message || 'Failed to update profile');
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating user nationality:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred while updating nationality'
    };
  }
}

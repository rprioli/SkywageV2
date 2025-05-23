/**
 * Storage setup utilities for Skywage
 * Used to set up storage buckets in Supabase Storage
 */

import { supabase } from './supabase';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from './fileValidation';

/**
 * Checks if the avatars bucket exists in Supabase Storage
 * @returns An object with success status and error message if failed
 */
export async function setupAvatarsBucket(): Promise<{ success: boolean; error: string | null }> {
  try {
    // Try to access the avatars bucket directly instead of listing all buckets
    // This approach works better with the anon key which may not have permission to list all buckets
    const { data: objects, error: listObjectsError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1 }); // Just try to list one object to check access

    if (listObjectsError) {
      console.error('Error accessing avatars bucket:', listObjectsError);

      // Check if the error is because the bucket doesn't exist
      if (listObjectsError.message.includes('not found') || listObjectsError.message.includes('does not exist')) {
        return {
          success: false,
          error: 'The avatars storage bucket does not exist. Please contact the administrator to set it up.'
        };
      }

      // Check if the error is related to permissions/policies
      if (listObjectsError.message.includes('policy')) {
        return {
          success: false,
          error: 'Missing storage permissions. The avatars bucket exists but lacks the necessary security policies.'
        };
      }

      // Generic error
      return {
        success: false,
        error: `Unable to access avatars bucket: ${listObjectsError.message}`
      };
    }

    // If we get here, the bucket exists and we have permission to access it
    console.log('Avatars bucket is accessible');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error setting up avatars bucket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred while setting up storage'
    };
  }
}

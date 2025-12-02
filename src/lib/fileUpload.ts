/**
 * File upload utilities for Skywage
 * Used to upload files to Supabase Storage
 */

import { supabase } from './supabase';
import { validateImageFile } from './fileValidation';

/**
 * Uploads an avatar image to Supabase Storage
 * @param file The file to upload
 * @returns An object with the URL of the uploaded file or an error message
 */
export async function uploadAvatar(file: File): Promise<{ url: string | null; error: string | null }> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { url: null, error: validation.error || 'Invalid file' };
    }

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      // Check for specific error types
      if (uploadError.message.includes('policy')) {
        return {
          url: null,
          error: 'Permission denied: Missing storage policies. Please contact the administrator.'
        };
      }

      return {
        url: null,
        error: `Upload failed: ${uploadError.message}`
      };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      return { url: null, error: 'Failed to get URL for uploaded image' };
    }

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error
      ? `Upload error: ${error.message}`
      : 'An unknown error occurred during upload';
    return { url: null, error: errorMessage };
  }
}

/**
 * Gets the public URL for a file in Supabase Storage
 * @param bucket The bucket name
 * @param path The file path
 * @returns The public URL of the file
 */
export function getFileUrl(bucket: string, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

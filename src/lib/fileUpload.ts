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
      console.log('File validation failed:', validation.error);
      return { url: null, error: validation.error || 'Invalid file' };
    }

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log(`Attempting to upload file to avatars/${filePath}`, {
      fileName,
      fileType: file.type,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`
    });

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', {
        message: uploadError.message,
        details: uploadError.details,
        hint: uploadError.hint,
        code: uploadError.code
      });

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

    console.log('File uploaded successfully:', uploadData);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to get public URL for uploaded file');
      return { url: null, error: 'Failed to get URL for uploaded image' };
    }

    console.log('Generated public URL:', urlData.publicUrl);
    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    const errorMessage = error instanceof Error
      ? `Upload error: ${error.message}`
      : 'An unknown error occurred during upload';
    console.error('Error message:', errorMessage);
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

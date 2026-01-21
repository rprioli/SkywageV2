'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/contexts/ProfileProvider';
import { uploadAvatar } from '@/lib/fileUpload';
import { updateUserAvatar } from '@/lib/userProfile';
import { validateImageFile, ALLOWED_FILE_TYPES } from '@/lib/fileValidation';
import { setupAvatarsBucket } from '@/lib/setupStorage';
import { getProfile } from '@/lib/db';
import { Upload } from 'lucide-react';

// Default avatar as a data URL (simple user silhouette)
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS11c2VyIj48cGF0aCBkPSJNMTkgMjFhNyA3IDAgMSAwLTE0IDB2LTFhNyA3IDAgMCAxIDE0IDB2MSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjQiLz48L3N2Zz4=';

interface AvatarUploadProps {
  onUploadComplete?: (url: string) => void;
  size?: number;
}

export function AvatarUpload({ onUploadComplete, size = 150 }: AvatarUploadProps) {
  const { user } = useAuth();
  const { profile, setProfile } = useProfile();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    // Load avatar URL from database profile (source of truth)
    const loadAvatar = async () => {
      if (user?.id) {
        try {
          const { data: profile, error } = await getProfile(user.id);
          if (profile && !error) {
            setAvatarUrl(profile.avatar_url || null);
          }
        } catch {
          // Fallback to auth metadata if database fails
          setAvatarUrl(user?.user_metadata?.avatar_url || null);
        }
      }
    };

    loadAvatar();
  }, [user?.id, user?.user_metadata?.avatar_url]);

  // Create a preview when a file is selected
  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    // Free memory when component unmounts or when selectedFile changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);

    if (!event.target.files || event.target.files.length === 0) {
      setSelectedFile(null);
      return;
    }

    const file = event.target.files[0];

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.id) return;

    setUploading(true);
    setError(null);

    try {
      // Check if avatars bucket is set up
      const { success: bucketReady, error: bucketError } = await setupAvatarsBucket();

      if (!bucketReady) {
        throw new Error(bucketError || 'Storage is not properly configured');
      }

      // Upload the file with user-scoped path
      const { url, error: uploadError } = await uploadAvatar(selectedFile, user.id);

      if (uploadError) {
        throw new Error(uploadError);
      }

      if (!url) {
        throw new Error('Failed to get URL for uploaded image');
      }

      // Update profile table (source of truth)
      const { success, error: updateError } = await updateUserAvatar(url, user.id);

      if (!success || updateError) {
        throw new Error(updateError || 'Failed to update profile');
      }

      // Update local state
      setAvatarUrl(url);
      setSelectedFile(null);
      setPreview(null);

      // Update shared profile state so changes propagate across the app
      if (profile) {
        setProfile({ ...profile, avatar_url: url });
      }

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-4">
        <div
          className="rounded-full overflow-hidden bg-muted"
          style={{ width: size, height: size }}
        >
          <img
            src={preview || avatarUrl || DEFAULT_AVATAR}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
            }}
          />
        </div>

        <label
          htmlFor="avatar-upload"
          className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
          aria-label="Upload profile picture"
        >
          <Upload size={20} />
          <span className="sr-only">Upload profile picture</span>
        </label>

        <input
          id="avatar-upload"
          type="file"
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {error && (
        <div className="text-destructive text-sm mb-4 max-w-md">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
          {error.includes('policy') && (
            <p className="mt-2 text-xs">
              This is likely due to missing storage permissions. Please contact the administrator to set up the necessary storage policies.
            </p>
          )}
        </div>
      )}

      {selectedFile && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            aria-label={uploading ? 'Uploading profile picture' : 'Upload profile picture'}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            onClick={handleCancel}
            disabled={uploading}
            className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/90 transition-colors disabled:opacity-50"
            aria-label="Cancel upload"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

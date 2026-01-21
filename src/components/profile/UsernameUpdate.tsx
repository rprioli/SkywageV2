'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/contexts/ProfileProvider';
import { Input } from '@/components/ui/input';
import { getProfile, updateProfile } from '@/lib/db';

export function UsernameUpdate() {
  const { user, loading: authLoading } = useAuth();
  const { profile, setProfile } = useProfile();
  const [username, setUsername] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load username from database profile (source of truth)
  useEffect(() => {
    const loadUsername = async () => {
      if (user?.id) {
        try {
          const { data: profile, error } = await getProfile(user.id);
          if (profile && !error) {
            setUsername(profile.username || '');
          }
        } catch {
          setUsername('');
        }
      }
    };

    loadUsername();
  }, [user?.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleUsernameChange = (value: string) => {
    // Enforce lowercase and format in real-time
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized);
  };

  const handleSave = async () => {
    if (!username) {
      setError('Username is required');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError('Username must be between 3 and 20 characters');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setError('Username can only contain lowercase letters, numbers, and underscores');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      setUpdateSuccess(false);

      const { data, error: updateError } = await updateProfile(user?.id || '', { username });

      if (updateError) {
        // Check for unique constraint violation
        if (updateError.message?.includes('unique') || updateError.code === '23505') {
          throw new Error('Username already taken. Please choose another.');
        }
        throw new Error(updateError.message || 'Failed to update username');
      }

      // Update shared profile state immediately so changes propagate across the app
      if (data) {
        setProfile(data);
      }

      setUpdateSuccess(true);
      setIsEditing(false);

      // Auto-hide success message after 3 seconds
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    // Reset to original value from database
    if (user?.id) {
      try {
        const { data: profile, error } = await getProfile(user.id);
        if (profile && !error) {
          setUsername(profile.username || '');
        }
      } catch {
        setUsername('');
      }
    }
    setIsEditing(false);
    setError(null);
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground">Username</p>

      {isEditing ? (
        <div className="mt-1">
          <Input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="username"
            className="w-full mb-2"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground mb-2">
            3-20 characters, lowercase letters, numbers, and underscores only
          </p>

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="px-3 py-1 text-sm bg-muted text-foreground rounded-md hover:bg-muted/90 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className="font-medium">
            {authLoading ? 'Loading...' : (username || 'Not set')}
          </p>
          <button
            onClick={() => {
              setIsEditing(true);
              setUpdateSuccess(false);
              if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
              }
            }}
            className="text-xs text-primary hover:underline"
            disabled={authLoading}
          >
            {username ? 'Change' : 'Set'}
          </button>

          {updateSuccess && (
            <span className="text-xs text-accent">Updated successfully!</span>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/contexts/ProfileProvider';
import { Input } from '@/components/ui/input';
import { getProfile, updateProfile } from '@/lib/db';
import { ProfileSettingsRow } from './ProfileSettingsRow';
import { Button } from '@/components/ui/button';

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
    <ProfileSettingsRow
      label="Username"
      value={authLoading ? 'Loading...' : (username || 'Not set')}
      action={{
        label: 'Edit',
        onClick: () => setIsEditing(true),
        disabled: authLoading
      }}
      isEditing={isEditing}
    >
      <div className="space-y-4">
        <div>
          <Input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="username"
            className="w-full max-w-md"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground mt-1">
            3-20 characters, lowercase letters, numbers, and underscores only
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            size="sm"
          >
            {isUpdating ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUpdating}
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    </ProfileSettingsRow>
  );
}

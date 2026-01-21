'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/contexts/ProfileProvider';
import { Input } from '@/components/ui/input';
import { getProfile, updateProfile } from '@/lib/db';

export function NameUpdate() {
  const { user, loading: authLoading } = useAuth();
  const { profile, setProfile } = useProfile();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load name from database profile (source of truth)
  useEffect(() => {
    const loadName = async () => {
      if (user?.id) {
        try {
          const { data: profile, error } = await getProfile(user.id);
          if (profile && !error) {
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
          }
        } catch {
          setFirstName('');
          setLastName('');
        }
      }
    };

    loadName();
  }, [user?.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Both first and last name are required');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      setUpdateSuccess(false);

      const { data, error: updateError } = await updateProfile(user?.id || '', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update name');
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
    // Reset to original values from database
    if (user?.id) {
      try {
        const { data: profile, error } = await getProfile(user.id);
        if (profile && !error) {
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
        }
      } catch {
        setFirstName('');
        setLastName('');
      }
    }
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {isEditing ? (
        <div className="col-span-1 md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">First Name</label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Last Name</label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-2">
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
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm text-muted-foreground mb-1">First Name</p>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {authLoading ? 'Loading...' : (firstName || 'N/A')}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Last Name</p>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {authLoading ? 'Loading...' : (lastName || 'N/A')}
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
                Change
              </button>
              {updateSuccess && (
                <span className="text-xs text-accent">Updated successfully!</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { CountrySelect } from '@/components/ui/CountrySelect';
import { updateUserNationality } from '@/lib/userProfile';
import { getProfile } from '@/lib/db';
import { getCountryName } from '@/lib/countryUtils';

export function NationalityUpdate() {
  const { user, loading: authLoading } = useAuth();
  const [nationality, setNationality] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load nationality from database profile (source of truth)
  useEffect(() => {
    const loadNationality = async () => {
      if (user?.id) {
        try {
          const { data: profile, error } = await getProfile(user.id);
          if (profile && !error) {
            setNationality(profile.nationality || '');
          }
        } catch {
          // Fallback to auth metadata if database fails
          setNationality(user?.user_metadata?.nationality || '');
        }
      }
    };

    loadNationality();
  }, [user?.id, user?.user_metadata?.nationality]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleNationalityChange = (value: string) => {
    setNationality(value);
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      setUpdateSuccess(false);

      const result = await updateUserNationality(nationality, user?.id);

      if (!result.success || result.error) {
        throw new Error(result.error || 'Failed to update nationality');
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
          setNationality(profile.nationality || '');
        }
      } catch {
        // Fallback to auth metadata if database fails
        setNationality(user?.user_metadata?.nationality || '');
      }
    }
    setIsEditing(false);
    setError(null);
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground">Nationality</p>

      {isEditing ? (
        <div className="mt-1">
          <CountrySelect
            value={nationality}
            onValueChange={handleNationalityChange}
            placeholder="Select your nationality"
            className="w-full mb-2"
          />

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
            {authLoading ? 'Loading...' : getCountryName(nationality)}
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
            {nationality ? 'Change' : 'Add'}
          </button>

          {updateSuccess && (
            <span className="text-xs text-accent">Updated successfully!</span>
          )}
        </div>
      )}
    </div>
  );
}

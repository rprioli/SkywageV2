'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { CountrySelect } from '@/components/ui/CountrySelect';
import { updateUserNationality } from '@/lib/userProfile';
import { getProfile } from '@/lib/db';
import { getCountryName } from '@/lib/countryUtils';
import { ProfileSettingsRow } from './ProfileSettingsRow';
import { Button } from '@/components/ui/button';

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
    <ProfileSettingsRow
      label="Nationality"
      value={authLoading ? 'Loading...' : getCountryName(nationality)}
      action={{
        label: 'Edit',
        onClick: () => setIsEditing(true),
        disabled: authLoading
      }}
      isEditing={isEditing}
    >
      <div className="space-y-4">
        <div className="max-w-md">
          <CountrySelect
            value={nationality}
            onValueChange={handleNationalityChange}
            placeholder="Select your nationality"
            className="w-full"
          />
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

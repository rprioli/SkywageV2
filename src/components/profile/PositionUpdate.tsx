'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { PositionSelect } from '@/components/ui/PositionSelect';
import { updateUserPosition } from '@/lib/userProfile';
import { getProfile } from '@/lib/db';
import { getPositionName } from '@/lib/positionUtils';

export function PositionUpdate() {
  const { user, loading: authLoading } = useAuth();
  const [position, setPosition] = useState<'CCM' | 'SCCM' | ''>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load position from database profile (source of truth)
  useEffect(() => {
    const loadPosition = async () => {
      if (user?.id) {
        try {
          const { data: profile, error } = await getProfile(user.id);
          if (profile && !error) {
            setPosition(profile.position || '');
          }
        } catch (err) {
          console.warn('Failed to load position from profile:', err);
          // Fallback to auth metadata if database fails
          setPosition(user?.user_metadata?.position || '');
        }
      }
    };

    loadPosition();
  }, [user?.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handlePositionChange = (value: 'CCM' | 'SCCM') => {
    setPosition(value);
  };

  const handleSave = async () => {
    if (!position || (position !== 'CCM' && position !== 'SCCM')) {
      setError('Please select a valid position');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      setUpdateSuccess(false);

      const { success, error } = await updateUserPosition(position, user?.id);

      if (!success || error) {
        throw new Error(error || 'Failed to update position');
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
      console.error('Error updating position:', err);
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
          setPosition(profile.position || '');
        }
      } catch {
        // Fallback to auth metadata if database fails
        setPosition(user?.user_metadata?.position || '');
      }
    }
    setIsEditing(false);
    setError(null);
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground">Position</p>

      {isEditing ? (
        <div className="mt-1">
          <PositionSelect
            value={position}
            onValueChange={handlePositionChange}
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
            {authLoading ? 'Loading...' : getPositionName(position)}
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
            {position ? 'Change' : 'Add'}
          </button>

          {updateSuccess && (
            <span className="text-xs text-accent">Updated successfully!</span>
          )}
        </div>
      )}
    </div>
  );
}

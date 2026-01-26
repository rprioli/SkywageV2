'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { PositionSelect } from '@/components/ui/PositionSelect';
import { updateUserPosition } from '@/lib/userProfile';
import { getProfile } from '@/lib/db';
import { getPositionName } from '@/lib/positionUtils';
import { recalculateMonthlyTotals } from '@/lib/salary-calculator/recalculation-engine';
import { getAllMonthlyCalculations } from '@/lib/database/calculations';
import { Position } from '@/types/salary-calculator';
import { ProfileSettingsRow } from './ProfileSettingsRow';
import { Button } from '@/components/ui/button';

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
        } catch {
          // Fallback to auth metadata if database fails
          setPosition(user?.user_metadata?.position || '');
        }
      }
    };

    loadPosition();
  }, [user?.id, user?.user_metadata?.position]);

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

  // Recalculate all existing data after position change
  const recalculateAllData = async (newPosition: Position) => {
    if (!user?.id) return;

    try {
      // Get all months with existing calculations
      const { data: monthlyCalculations, error } = await getAllMonthlyCalculations(user.id);

      if (error || !monthlyCalculations) {
        return;
      }

      // Recalculate each month with the new position
      const recalculationPromises = monthlyCalculations.map(calc =>
        recalculateMonthlyTotals(user.id, calc.month, calc.year, newPosition)
      );

      await Promise.allSettled(recalculationPromises);

    } catch {
      // Silently handle bulk recalculation errors
    }
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

      // Trigger recalculation of all existing data with new position
      await recalculateAllData(position as Position);

      setUpdateSuccess(true);
      setIsEditing(false);

      // Notify other components that position has been updated
      window.dispatchEvent(new CustomEvent('userPositionUpdated'));

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
    <ProfileSettingsRow
      label="Position"
      value={authLoading ? 'Loading...' : getPositionName(position)}
      action={{
        label: 'Edit',
        onClick: () => setIsEditing(true),
        disabled: authLoading
      }}
      isEditing={isEditing}
    >
      <div className="space-y-4">
        <div className="max-w-md">
          <PositionSelect
            value={position}
            onValueChange={handlePositionChange}
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

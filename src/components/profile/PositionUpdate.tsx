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

  // Recalculate all existing data after position change
  const recalculateAllData = async (newPosition: Position) => {
    if (!user?.id) return;

    try {
      // Get all months with existing calculations
      const { data: monthlyCalculations, error } = await getAllMonthlyCalculations(user.id);

      if (error || !monthlyCalculations) {
        console.warn('No existing calculations found to recalculate');
        return;
      }

      // Recalculate each month with the new position
      const recalculationPromises = monthlyCalculations.map(calc =>
        recalculateMonthlyTotals(user.id, calc.month, calc.year, newPosition)
      );

      const results = await Promise.allSettled(recalculationPromises);

      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const calc = monthlyCalculations[index];
          console.error(`Failed to recalculate ${calc.month}/${calc.year}:`, result.reason);
        }
      });

      console.log(`Recalculated ${results.length} months with new position: ${newPosition}`);

    } catch (error) {
      console.error('Error during bulk recalculation:', error);
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

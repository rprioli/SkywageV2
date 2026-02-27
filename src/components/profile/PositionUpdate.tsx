'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { ProfileSettingsRow } from './ProfileSettingsRow';
import { AddPositionChangeForm } from './AddPositionChangeForm';
import { PositionHistoryTimeline } from './PositionHistoryTimeline';
import {
  getUserPositionTimeline,
  addPositionChange,
  updatePositionChange,
  deletePositionChange,
  getAffectedMonthsFrom,
  getPreviousMonth,
  PositionHistoryEntry,
} from '@/lib/user-position-history';
import { recalculateMonthlyTotals } from '@/lib/salary-calculator/recalculation-engine';
import { getPositionName } from '@/lib/positionUtils';
import { Position } from '@/types/salary-calculator';
import { MIN_SUPPORTED_YEAR } from '@/lib/constants/dates';
import { Plus } from 'lucide-react';

const CONCURRENCY_LIMIT = 3;

/** Run async tasks with a concurrency cap to avoid overwhelming the DB. */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  for (let i = 0; i < tasks.length; i += limit) {
    const chunk = tasks.slice(i, i + limit).map((t) => t());
    const chunkResults = await Promise.allSettled(chunk);
    results.push(...chunkResults);
  }
  return results;
}

export function PositionUpdate() {
  const { user, loading: authLoading } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [timeline, setTimeline] = useState<PositionHistoryEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentPosition = timeline[timeline.length - 1]?.position ?? '';

  const loadTimeline = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await getUserPositionTimeline(user.id);
    if (!error) setTimeline(data);
  }, [user?.id]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  /**
   * Recalculates months >= effectiveYear/Month (and the month before for layover pairing).
   * Uses concurrency limit to avoid overwhelming the DB.
   */
  const recalculateAffected = useCallback(
    async (effectiveYear: number, effectiveMonth: number): Promise<string[]> => {
      if (!user?.id) return [];

      const affected = await getAffectedMonthsFrom(user.id, effectiveYear, effectiveMonth);

      // Also recalculate the month before the effective month for cross-month layovers
      const prev = getPreviousMonth(effectiveYear, effectiveMonth);
      const allMonths = prev.year >= MIN_SUPPORTED_YEAR
        ? [prev, ...affected]
        : affected;

      if (allMonths.length === 0) return [];

      if (allMonths.length >= 4) {
        showInfo(`Recalculating ${allMonths.length} months of data...`);
      }

      const tasks = allMonths.map(
        ({ month, year }) =>
          () => recalculateMonthlyTotals(user.id!, month, year)
      );

      const results = await runWithConcurrency(tasks, CONCURRENCY_LIMIT);
      const failures = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));

      return failures.length > 0
        ? [`${failures.length} month(s) failed to recalculate`]
        : [];
    },
    [user?.id, showInfo]
  );

  const handleAddPositionChange = async (position: Position, year: number, month: number) => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const result = await addPositionChange(user.id, position, year, month);
      if (!result.success) {
        showError(result.error ?? 'Failed to add position change.');
        return;
      }

      const warnings = await recalculateAffected(year, month);

      await loadTimeline();
      setShowAddForm(false);

      window.dispatchEvent(new CustomEvent('userPositionUpdated'));

      if (warnings.length > 0) {
        showError(`Saved, but: ${warnings.join(', ')}`);
      } else {
        showSuccess(`${position} effective from ${month}/${year} — calculations updated.`);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePositionChange = async (id: string, position: Position, year: number, month: number) => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const result = await updatePositionChange(id, user.id, { position, effectiveFromYear: year, effectiveFromMonth: month });
      if (!result.success) {
        showError(result.error ?? 'Failed to update.');
        return;
      }

      const warnings = await recalculateAffected(year, month);

      await loadTimeline();
      window.dispatchEvent(new CustomEvent('userPositionUpdated'));

      if (warnings.length > 0) {
        showError(`Saved, but: ${warnings.join(', ')}`);
      } else {
        showSuccess('Position history updated and calculations refreshed.');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePositionChange = async (id: string) => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      // Find the effective date of the entry being deleted so we know what to recalculate
      const entry = timeline.find((e) => e.id === id);
      const result = await deletePositionChange(id, user.id);
      if (!result.success) {
        showError(result.error ?? 'Failed to delete.');
        return;
      }

      const warnings = entry
        ? await recalculateAffected(entry.effectiveFromYear, entry.effectiveFromMonth)
        : [];

      await loadTimeline();
      window.dispatchEvent(new CustomEvent('userPositionUpdated'));

      if (warnings.length > 0) {
        showError(`Deleted, but: ${warnings.join(', ')}`);
      } else {
        showSuccess('Position history updated and calculations refreshed.');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const displayValue = authLoading
    ? 'Loading...'
    : currentPosition
    ? getPositionName(currentPosition)
    : 'Not set';

  return (
    <ProfileSettingsRow
      label="Position"
      value={displayValue}
      action={{
        label: isEditing ? 'Close' : 'Edit',
        onClick: () => { setIsEditing((v) => !v); setShowAddForm(false); },
        disabled: authLoading,
      }}
      isEditing={isEditing}
    >
      <div className="space-y-4">
        {/* Timeline */}
        <PositionHistoryTimeline
          entries={timeline}
          onUpdate={handleUpdatePositionChange}
          onDelete={handleDeletePositionChange}
          isLoading={isLoading}
        />

        {/* Add new position change */}
        {showAddForm ? (
          <AddPositionChangeForm
            onAdd={handleAddPositionChange}
            onCancel={() => setShowAddForm(false)}
            isLoading={isLoading}
          />
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(true)}
            disabled={isLoading}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Add position change
          </Button>
        )}
      </div>
    </ProfileSettingsRow>
  );
}

/**
 * useDataRefresh Hook
 *
 * Consolidated data refresh logic for the dashboard.
 * Replaces 4 duplicated refresh functions with a single reusable hook.
 *
 * Handles:
 * - Refresh after single flight deletion
 * - Refresh after bulk flight deletion
 * - Refresh after roster upload
 * - Refresh after manual entry
 *
 * Position is no longer a parameter — recalculateMonthlyTotals resolves it
 * internally from the user's position history timeline.
 */

import { FlightDuty } from '@/types/salary-calculator';
import { recalculateMonthlyTotals } from '@/lib/salary-calculator/recalculation-engine';
import { useState, useCallback } from 'react';

interface UseDataRefreshOptions {
  userId: string;
  selectedMonth: number; // 0-based month (0 = January)
  selectedYear: number;
  onCalculationsUpdate: () => Promise<void>;
  onFlightDutiesUpdate: () => Promise<void>;
  onError: (title: string, description: string) => void;
}

interface UseDataRefreshReturn {
  // Refresh after deleting a single flight (uses selected month/year)
  refreshAfterDelete: () => Promise<void>;

  // Refresh after bulk delete (determines months from deleted flights)
  refreshAfterBulkDelete: (deletedFlights: FlightDuty[]) => Promise<void>;

  // Refresh after roster upload (refreshes all data)
  refreshAfterUpload: () => Promise<void>;

  // Refresh after manual entry (uses selected month/year, with delay)
  refreshAfterManualEntry: () => Promise<void>;

  // Loading state
  isRefreshing: boolean;
}

export function useDataRefresh(options: UseDataRefreshOptions): UseDataRefreshReturn {
  const {
    userId,
    selectedMonth,
    selectedYear,
    onCalculationsUpdate,
    onError,
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Convert 0-based month to 1-based for database queries
  const selectedMonthOneBased = selectedMonth + 1;

  /**
   * Core refresh logic - calls update callbacks to refetch data
   */
  const fetchAndUpdateData = useCallback(
    async () => {
      try {
        await onCalculationsUpdate();
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
    [onCalculationsUpdate]
  );

  /**
   * Refresh after single flight deletion
   * - Recalculates the selected month (position resolved internally)
   * - Updates all data for selected month
   */
  const refreshAfterDelete = useCallback(async () => {
    if (!userId) return;

    setIsRefreshing(true);

    try {
      // Position is resolved from user_position_history inside recalculateMonthlyTotals
      const recalcResult = await recalculateMonthlyTotals(
        userId,
        selectedMonthOneBased,
        selectedYear
      );

      if (!recalcResult.success) {
        onError(
          'Recalculation Failed',
          `Failed to recalculate monthly totals: ${recalcResult.errors.join(', ')}`
        );
        return;
      }

      await fetchAndUpdateData();
    } catch (error) {
      onError(
        'Refresh Failed',
        error instanceof Error ? error.message : 'Unknown error occurred during refresh'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [userId, selectedMonthOneBased, selectedYear, onError, fetchAndUpdateData]);

  /**
   * Refresh after bulk deletion
   * - Recalculates all affected months (position resolved per-month internally)
   * - Updates data for currently selected month
   */
  const refreshAfterBulkDelete = useCallback(
    async (deletedFlights: FlightDuty[]) => {
      if (!userId) return;

      setIsRefreshing(true);

      try {
        // Collect unique months/years from deleted flights
        const affectedMonths = new Map<string, { month: number; year: number }>();
        deletedFlights.forEach((flight) => {
          const key = `${flight.month}-${flight.year}`;
          affectedMonths.set(key, { month: flight.month, year: flight.year });
        });

        // Recalculate all affected months in parallel
        const recalcPromises = Array.from(affectedMonths.values()).map(({ month, year }) =>
          recalculateMonthlyTotals(userId, month, year)
        );

        const recalcResults = await Promise.all(recalcPromises);

        const failures = recalcResults.filter((result) => !result.success);
        if (failures.length > 0) {
          const errorMessages = failures.map((result) => result.errors.join(', ')).join('; ');
          onError(
            'Recalculation Failed',
            `Failed to recalculate ${failures.length} month(s): ${errorMessages}`
          );
        }

        await fetchAndUpdateData();
      } catch (error) {
        onError(
          'Refresh Failed',
          error instanceof Error ? error.message : 'Unknown error occurred during refresh'
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [userId, onError, fetchAndUpdateData]
  );

  /**
   * Refresh after roster upload
   * - No recalculation needed (already done by upload processor)
   * - Only refreshes displayed data
   */
  const refreshAfterUpload = useCallback(
    async () => {
      if (!userId) return;

      setIsRefreshing(true);

      try {
        await fetchAndUpdateData();
      } catch (error) {
        onError(
          'Refresh Failed',
          error instanceof Error ? error.message : 'Unknown error occurred during refresh'
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [userId, onError, fetchAndUpdateData]
  );

  /**
   * Refresh after manual entry
   * - No recalculation needed (already done by manual entry processor)
   * - Includes 500ms delay to ensure database updates are complete
   */
  const refreshAfterManualEntry = useCallback(async () => {
    if (!userId) return;

    setIsRefreshing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await fetchAndUpdateData();
    } catch (error) {
      onError(
        'Refresh Failed',
        error instanceof Error ? error.message : 'Unknown error occurred during refresh'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [userId, onError, fetchAndUpdateData]);

  return {
    refreshAfterDelete,
    refreshAfterBulkDelete,
    refreshAfterUpload,
    refreshAfterManualEntry,
    isRefreshing,
  };
}

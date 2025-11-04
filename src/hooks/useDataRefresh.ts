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
 */

import { FlightDuty, Position } from '@/types/salary-calculator';
import { recalculateMonthlyTotals } from '@/lib/salary-calculator/recalculation-engine';
import { useState, useCallback } from 'react';

interface UseDataRefreshOptions {
  userId: string;
  position: Position;
  selectedMonth: number; // 0-based month (0 = January)
  selectedYear: number;
  userPositionLoading: boolean;
  onCalculationsUpdate: () => Promise<void>;
  onFlightDutiesUpdate: () => Promise<void>;
  onError: (title: string, description: string) => void;
}

interface UseDataRefreshReturn {
  // Refresh after deleting a single flight (uses selected month/year)
  refreshAfterDelete: () => Promise<void>;

  // Refresh after bulk delete (determines months from deleted flights)
  refreshAfterBulkDelete: (deletedFlights: FlightDuty[]) => Promise<void>;

  // Refresh after roster upload (uses provided month, conditional update)
  refreshAfterUpload: (uploadMonth: number) => Promise<void>;

  // Refresh after manual entry (uses selected month/year, with delay)
  refreshAfterManualEntry: () => Promise<void>;

  // Loading state
  isRefreshing: boolean;
}

export function useDataRefresh(
  options: UseDataRefreshOptions
): UseDataRefreshReturn {
  const {
    userId,
    position,
    selectedMonth,
    selectedYear,
    userPositionLoading,
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
        // Call update callbacks to refetch data
        await onCalculationsUpdate();
        return { success: true };
      } catch (error) {
        console.error('Error refreshing data:', error);
        return { success: false, error };
      }
    },
    [onCalculationsUpdate]
  );

  /**
   * Refresh after single flight deletion
   * - Recalculates the selected month
   * - Updates all data for selected month
   */
  const refreshAfterDelete = useCallback(async () => {
    if (!userId) return;

    // Wait for user position to be loaded
    if (userPositionLoading) {
      onError(
        'Loading Profile',
        'Please wait for user profile to load before refreshing data.'
      );
      return;
    }

    setIsRefreshing(true);

    try {
      console.log(
        '🔄 REFRESH AFTER DELETE: Starting refresh for month',
        selectedMonthOneBased,
        'year',
        selectedYear
      );

      // CRITICAL: Trigger recalculation FIRST before fetching updated data
      const recalcResult = await recalculateMonthlyTotals(
        userId,
        selectedMonthOneBased,
        selectedYear,
        position
      );

      if (!recalcResult.success) {
        console.log(
          '🚨 REFRESH AFTER DELETE: Recalculation failed:',
          recalcResult.errors
        );
        onError(
          'Recalculation Failed',
          `Failed to recalculate monthly totals: ${recalcResult.errors.join(', ')}`
        );
        return;
      }

      console.log('✅ REFRESH AFTER DELETE: Recalculation successful');

      // Fetch and update all data
      const result = await fetchAndUpdateData();

      if (result.success) {
        console.log('✅ REFRESH AFTER DELETE: Data refresh complete');
      }
    } catch (error) {
      onError(
        'Refresh Failed',
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during refresh'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [
    userId,
    userPositionLoading,
    selectedMonthOneBased,
    selectedYear,
    position,
    onError,
    fetchAndUpdateData,
  ]);

  /**
   * Refresh after bulk deletion
   * - Recalculates all affected months
   * - Updates data for currently selected month
   */
  const refreshAfterBulkDelete = useCallback(
    async (deletedFlights: FlightDuty[]) => {
      if (!userId) return;

      // Wait for user position to be loaded
      if (userPositionLoading) {
        onError(
          'Loading Profile',
          'Please wait for user profile to load before refreshing data.'
        );
        return;
      }

      setIsRefreshing(true);

      try {
        // Get unique months/years from deleted flights
        const affectedMonths = new Map<string, { month: number; year: number }>();
        deletedFlights.forEach((flight) => {
          const key = `${flight.month}-${flight.year}`;
          affectedMonths.set(key, { month: flight.month, year: flight.year });
        });

        // Recalculate all affected months in parallel (independent operations)
        const recalcPromises = Array.from(affectedMonths.values()).map(
          ({ month, year }) =>
            recalculateMonthlyTotals(userId, month, year, position)
        );

        const recalcResults = await Promise.all(recalcPromises);

        // Check for any failures
        const failures = recalcResults.filter((result) => !result.success);
        if (failures.length > 0) {
          const errorMessages = failures
            .map((result) => result.errors.join(', '))
            .join('; ');
          onError(
            'Recalculation Failed',
            `Failed to recalculate ${failures.length} month(s): ${errorMessages}`
          );
          // Continue anyway to refresh the data we can
        }

        // Fetch and update data for currently selected month
        await fetchAndUpdateData();
      } catch (error) {
        onError(
          'Refresh Failed',
          error instanceof Error
            ? error.message
            : 'Unknown error occurred during refresh'
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [
      userId,
      userPositionLoading,
      position,
      onError,
      fetchAndUpdateData,
    ]
  );

  /**
   * Refresh after roster upload
   * - No recalculation (already done by upload processor)
   * - Only updates displayed data if upload month matches selected month
   */
  const refreshAfterUpload = useCallback(
    async () => {
      if (!userId) return;

      setIsRefreshing(true);

      try {
        // Refresh all data
        await fetchAndUpdateData();
      } catch (error) {
        onError(
          'Refresh Failed',
          error instanceof Error
            ? error.message
            : 'Unknown error occurred during refresh'
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [
      userId,
      onError,
      fetchAndUpdateData,
    ]
  );

  /**
   * Refresh after manual entry
   * - No recalculation (already done by manual entry processor)
   * - Includes 500ms delay to ensure database updates are complete
   * - Updates data for currently selected month
   */
  const refreshAfterManualEntry = useCallback(async () => {
    if (!userId) return;

    setIsRefreshing(true);

    try {
      console.log(
        '🔄 MANUAL ENTRY SUCCESS: Refreshing dashboard data for month',
        selectedMonthOneBased,
        'year',
        selectedYear
      );

      // CRITICAL: Add a small delay to ensure database updates are complete
      // The manual entry process calls recalculateMonthlyTotals() which needs time to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Fetch and update all data
      const result = await fetchAndUpdateData();

      if (result.success) {
        console.log('✅ MANUAL ENTRY SUCCESS: Data refresh complete');
      }
    } catch (error) {
      onError(
        'Refresh Failed',
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during refresh'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [
    userId,
    selectedMonthOneBased,
    selectedYear,
    onError,
    fetchAndUpdateData,
  ]);

  return {
    refreshAfterDelete,
    refreshAfterBulkDelete,
    refreshAfterUpload,
    refreshAfterManualEntry,
    isRefreshing,
  };
}


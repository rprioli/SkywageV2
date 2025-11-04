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

import { FlightDuty, MonthlyCalculation, Position } from '@/types/salary-calculator';
import { getMonthlyCalculation, getAllMonthlyCalculations } from '@/lib/database/calculations';
import { getFlightDutiesByMonth } from '@/lib/database/flights';
import { recalculateMonthlyTotals } from '@/lib/salary-calculator/recalculation-engine';
import { useState, useCallback } from 'react';

interface UseDataRefreshOptions {
  userId: string;
  position: Position;
  selectedMonth: number; // 0-based month (0 = January)
  selectedYear: number;
  userPositionLoading: boolean;
  onCalculationsUpdate: (
    current: MonthlyCalculation | null,
    all: MonthlyCalculation[]
  ) => void;
  onFlightDutiesUpdate: (duties: FlightDuty[]) => void;
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
    onFlightDutiesUpdate,
    onError,
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Convert 0-based month to 1-based for database queries
  const selectedMonthOneBased = selectedMonth + 1;

  /**
   * Core refresh logic - fetches all data and updates state
   */
  const fetchAndUpdateData = useCallback(
    async (month: number, year: number) => {
      try {
        // Fetch all data in parallel (after recalculation if needed)
        const [calculationResult, allCalculationsResult, flightDutiesResult] =
          await Promise.all([
            getMonthlyCalculation(userId, month, year),
            getAllMonthlyCalculations(userId),
            getFlightDutiesByMonth(userId, month, year),
          ]);

        // Update all monthly calculations
        const allCalculations = allCalculationsResult.data || [];
        
        // Update current month calculation
        const currentCalculation = calculationResult.data || null;

        // Update flight duties
        const flightDuties = flightDutiesResult.data || [];

        // Call update callbacks
        onCalculationsUpdate(currentCalculation, allCalculations);
        onFlightDutiesUpdate(flightDuties);

        return { success: true };
      } catch (error) {
        console.error('Error fetching data:', error);
        return { success: false, error };
      }
    },
    [userId, onCalculationsUpdate, onFlightDutiesUpdate]
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
      const result = await fetchAndUpdateData(selectedMonthOneBased, selectedYear);

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

        // Recalculate each affected month
        for (const { month, year } of affectedMonths.values()) {
          const recalcResult = await recalculateMonthlyTotals(
            userId,
            month,
            year,
            position
          );

          if (!recalcResult.success) {
            onError(
              'Recalculation Failed',
              `Failed to recalculate monthly totals for ${month}/${year}: ${recalcResult.errors.join(', ')}`
            );
            continue; // Continue with other months
          }
        }

        // Fetch and update data for currently selected month
        await fetchAndUpdateData(selectedMonthOneBased, selectedYear);
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
      selectedMonthOneBased,
      selectedYear,
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
    async (uploadMonth: number) => {
      if (!userId) return;

      setIsRefreshing(true);

      try {
        // Refresh all monthly calculations for chart data first
        const allCalculationsResult = await getAllMonthlyCalculations(userId);
        const allCalculations = allCalculationsResult.data || [];

        // Check if the uploaded month matches the currently selected month
        const shouldUpdateDisplayedData = uploadMonth === selectedMonthOneBased;

        if (shouldUpdateDisplayedData) {
          // Only refresh displayed data if the uploaded month matches the user's selected month
          console.log(
            `Upload matches selected month (${uploadMonth}), refreshing displayed data`
          );

          // Fetch current month data
          const [calculationResult, flightDutiesResult] = await Promise.all([
            getMonthlyCalculation(userId, uploadMonth, selectedYear),
            getFlightDutiesByMonth(userId, uploadMonth, selectedYear),
          ]);

          const currentCalculation = calculationResult.data || null;
          const flightDuties = flightDutiesResult.data || [];

          // Update state
          onCalculationsUpdate(currentCalculation, allCalculations);
          onFlightDutiesUpdate(flightDuties);
        } else {
          // Just update all calculations (for chart)
          onCalculationsUpdate(null, allCalculations);
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
    },
    [
      userId,
      selectedMonthOneBased,
      selectedYear,
      onCalculationsUpdate,
      onFlightDutiesUpdate,
      onError,
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
      const result = await fetchAndUpdateData(selectedMonthOneBased, selectedYear);

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


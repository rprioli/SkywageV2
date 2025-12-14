/**
 * Statistics Data Hook
 * Manages fetching, caching, and refreshing of statistics data
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { getAllMonthlyCalculations } from '@/lib/database/calculations';
import { getFlightDutiesByYear } from '@/lib/database/flights';
import { calculateStatistics } from '@/lib/statistics/calculations';
import {
  StatisticsCalculationResult,
  UseStatisticsDataReturn
} from '@/types/statistics';

/**
 * Hook for managing statistics data
 * Automatically refreshes when user data changes
 * Provides loading states and error handling
 */
export function useStatisticsData(selectedYear?: number): UseStatisticsDataReturn {
  const { user } = useAuth();
  const [data, setData] = useState<StatisticsCalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  /**
   * Fetch and calculate statistics data
   */
  const fetchStatisticsData = useCallback(async () => {
    if (!user?.id) {
      setData(null);
      setLoading(false);
      setAvailableYears([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all monthly calculations
      const calculationsResult = await getAllMonthlyCalculations(user.id);
      
      if (calculationsResult.error) {
        throw new Error(calculationsResult.error);
      }

      const monthlyCalculations = calculationsResult.data || [];

      // Extract available years from data
      const years = [...new Set(monthlyCalculations.map(calc => calc.year))].sort((a, b) => b - a);
      setAvailableYears(years);

      // Use selectedYear or default to current year
      const currentYear = new Date().getFullYear();
      const yearToUse = selectedYear || currentYear;

      // Filter calculations for selected year
      const filteredCalculations = monthlyCalculations.filter(calc => calc.year === yearToUse);

      // Fetch flight duties for selected year to get accurate duty type stats
      const flightsResult = await getFlightDutiesByYear(user.id, yearToUse);
      const flightDuties = flightsResult.data || [];

      // Calculate statistics for selected year with flight data
      const statisticsResult = calculateStatistics(filteredCalculations, yearToUse, flightDuties);
      
      setData(statisticsResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedYear]);

  /**
   * Refresh statistics data
   */
  const refresh = useCallback(async () => {
    await fetchStatisticsData();
  }, [fetchStatisticsData]);

  // Initial data fetch
  useEffect(() => {
    fetchStatisticsData();
  }, [fetchStatisticsData]);

  // Listen for dashboard data updates (when user makes changes)
  useEffect(() => {
    const handleDataUpdate = () => {
      // Refresh statistics when dashboard data changes
      fetchStatisticsData();
    };

    // Listen for custom events from dashboard
    window.addEventListener('dashboardDataUpdated', handleDataUpdate);
    window.addEventListener('flightDataUpdated', handleDataUpdate);
    window.addEventListener('calculationUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('dashboardDataUpdated', handleDataUpdate);
      window.removeEventListener('flightDataUpdated', handleDataUpdate);
      window.removeEventListener('calculationUpdated', handleDataUpdate);
    };
  }, [fetchStatisticsData]);

  return {
    data,
    loading,
    error,
    refresh,
    availableYears
  };
}


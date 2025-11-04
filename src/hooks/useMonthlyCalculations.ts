/**
 * useMonthlyCalculations Hook
 * 
 * Manages monthly calculations data fetching and state.
 * Fetches both current month calculation and all calculations for chart data.
 * Extracted from dashboard page to reduce complexity and improve reusability.
 */

import { useState, useEffect, useCallback } from 'react';
import { MonthlyCalculation } from '@/types/salary-calculator';
import { getMonthlyCalculation, getAllMonthlyCalculations } from '@/lib/database/calculations';

interface UseMonthlyCalculationsOptions {
  userId: string;
  month: number; // 0-based month (0 = January)
  year: number;
  enabled?: boolean; // Allow disabling the hook
}

interface UseMonthlyCalculationsReturn {
  currentCalculation: MonthlyCalculation | null;
  allCalculations: MonthlyCalculation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refetchCurrent: () => Promise<void>; // Only refetch current month
  refetchAll: () => Promise<void>; // Only refetch all calculations
}

export function useMonthlyCalculations({
  userId,
  month,
  year,
  enabled = true,
}: UseMonthlyCalculationsOptions): UseMonthlyCalculationsReturn {
  const [currentCalculation, setCurrentCalculation] = useState<MonthlyCalculation | null>(null);
  const [allCalculations, setAllCalculations] = useState<MonthlyCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert 0-based month to 1-based for database queries
  const monthOneBased = month + 1;

  // Fetch only current month calculation (silent, no loading state)
  const fetchCurrentCalculation = useCallback(async () => {
    if (!userId || !enabled) return;

    try {
      setError(null);
      const currentResult = await getMonthlyCalculation(userId, monthOneBased, year);

      if (currentResult.error) {
        setError(currentResult.error);
        setCurrentCalculation(null);
      } else {
        setCurrentCalculation(currentResult.data || null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setCurrentCalculation(null);
      console.error('Error fetching current calculation:', err);
    }
  }, [userId, monthOneBased, year, enabled]);

  // Fetch only all calculations (silent, no loading state)
  const fetchAllCalculations = useCallback(async () => {
    if (!userId || !enabled) return;

    try {
      setError(null);
      const allResult = await getAllMonthlyCalculations(userId);

      if (allResult.error) {
        setError(allResult.error);
        setAllCalculations([]);
      } else {
        setAllCalculations(allResult.data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setAllCalculations([]);
      console.error('Error fetching all calculations:', err);
    }
  }, [userId, enabled]);

  // Fetch both (with loading state) - used on initial load
  const fetchCalculations = useCallback(async () => {
    if (!userId || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch both current and all calculations in parallel
      const [currentResult, allResult] = await Promise.all([
        getMonthlyCalculation(userId, monthOneBased, year),
        getAllMonthlyCalculations(userId),
      ]);

      // Handle current calculation
      if (currentResult.error) {
        setError(currentResult.error);
        setCurrentCalculation(null);
      } else {
        setCurrentCalculation(currentResult.data || null);
      }

      // Handle all calculations
      if (allResult.error) {
        setError(allResult.error);
        setAllCalculations([]);
      } else {
        setAllCalculations(allResult.data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setCurrentCalculation(null);
      setAllCalculations([]);
      console.error('Error fetching monthly calculations:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, monthOneBased, year, enabled]);

  // Fetch on mount and when userId/year/enabled changes (NOT when month changes)
  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      await fetchCalculations();
    };

    if (!cancelled) {
      fetch();
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, year, enabled]); // Only depend on userId, year, enabled - NOT fetchCalculations or month

  // Update current calculation when month changes (from allCalculations)
  useEffect(() => {
    if (allCalculations.length > 0) {
      const selectedMonthData = allCalculations.find(
        calc => calc.month === monthOneBased && calc.year === year
      );
      setCurrentCalculation(selectedMonthData || null);
    }
  }, [month, year, allCalculations, monthOneBased]);

  return {
    currentCalculation,
    allCalculations,
    loading,
    error,
    refetch: fetchCalculations, // Full refetch with loading state
    refetchCurrent: fetchCurrentCalculation, // Silent refetch of current month only
    refetchAll: fetchAllCalculations, // Silent refetch of all calculations
  };
}


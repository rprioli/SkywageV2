/**
 * Hook for fetching layover rest periods for a specific month
 */

import { useState, useEffect } from 'react';
import { LayoverRestPeriod } from '@/types/salary-calculator';
import { getLayoverRestPeriods } from '@/lib/database/calculations';

interface UseLayoverRestPeriodsResult {
  layoverRestPeriods: LayoverRestPeriod[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLayoverRestPeriods(
  userId: string | null,
  month: number,
  year: number
): UseLayoverRestPeriodsResult {
  const [layoverRestPeriods, setLayoverRestPeriods] = useState<LayoverRestPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLayoverRestPeriods = async () => {
    if (!userId) {
      setLayoverRestPeriods([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getLayoverRestPeriods(userId, month, year);
      
      if (result.error) {
        setError(result.error);
        setLayoverRestPeriods([]);
      } else {
        setLayoverRestPeriods(result.data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch layover rest periods';
      setError(errorMessage);
      setLayoverRestPeriods([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLayoverRestPeriods();
  }, [userId, month, year]);

  return {
    layoverRestPeriods,
    isLoading,
    error,
    refetch: fetchLayoverRestPeriods
  };
}


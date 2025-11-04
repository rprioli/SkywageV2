/**
 * useFlightDuties Hook
 * 
 * Manages flight duties data fetching and state for a specific month/year.
 * Extracted from dashboard page to reduce complexity and improve reusability.
 */

import { useState, useEffect, useCallback } from 'react';
import { FlightDuty } from '@/types/salary-calculator';
import { getFlightDutiesByMonth } from '@/lib/database/flights';

interface UseFlightDutiesOptions {
  userId: string;
  month: number; // 0-based month (0 = January)
  year: number;
  enabled?: boolean; // Allow disabling the hook
}

interface UseFlightDutiesReturn {
  flightDuties: FlightDuty[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFlightDuties({
  userId,
  month,
  year,
  enabled = true,
}: UseFlightDutiesOptions): UseFlightDutiesReturn {
  const [flightDuties, setFlightDuties] = useState<FlightDuty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert 0-based month to 1-based for database queries
  const monthOneBased = month + 1;

  const fetchFlightDuties = useCallback(async () => {
    if (!userId || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getFlightDutiesByMonth(userId, monthOneBased, year);

      if (result.error) {
        setError(result.error);
        setFlightDuties([]);
      } else if (result.data) {
        setFlightDuties(result.data);
      } else {
        setFlightDuties([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setFlightDuties([]);
      console.error('Error fetching flight duties:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, monthOneBased, year, enabled]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      await fetchFlightDuties();
    };

    if (!cancelled) {
      fetch();
    }

    return () => {
      cancelled = true;
    };
  }, [fetchFlightDuties]);

  return {
    flightDuties,
    loading,
    error,
    refetch: fetchFlightDuties,
  };
}


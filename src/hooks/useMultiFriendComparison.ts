'use client';

/**
 * useMultiFriendComparison Hook
 * Fetches and manages multi-friend roster comparison data
 * Phase 4b - Multi-friend comparison feature
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/contexts/ProfileProvider';
import { FriendWithProfile, getFriendDisplayName, getFriendInitial } from '@/lib/database/friends';
import {
  MultiMonthGridData,
  ComparedPerson,
  createMultiMonthGrid,
} from '@/lib/roster-comparison';
import { FlightDuty } from '@/types/salary-calculator';
import { MIN_SUPPORTED_YEAR } from '@/lib/constants/dates';

/** Response shape from the batch API endpoint */
interface BatchCompareResponse {
  myRoster: SerializableFlightDuty[];
  friends: Array<{
    friendId: string;
    roster: SerializableFlightDuty[];
    rosterHidden: boolean;
  }>;
  month: number;
  year: number;
}

/** FlightDuty with serialized dates (from JSON) */
interface SerializableFlightDuty
  extends Omit<FlightDuty, 'date' | 'lastEditedAt' | 'createdAt' | 'updatedAt'> {
  date?: string | Date;
  lastEditedAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface UseMultiFriendComparisonReturn {
  /** Grid data with all days and duties for all people */
  gridData: MultiMonthGridData | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Current month (1-12) */
  month: number;
  /** Current year */
  year: number;
  /** Navigate to previous month */
  goToPreviousMonth: () => void;
  /** Navigate to next month */
  goToNextMonth: () => void;
  /** Refetch data */
  refetch: () => void;
}

/**
 * Hook for fetching and managing multi-friend roster comparison data
 * @param selectedFriends - Array of selected friends to compare
 */
export function useMultiFriendComparison(
  selectedFriends: FriendWithProfile[]
): UseMultiFriendComparisonReturn {
  const { session, user } = useAuth();
  const { profile } = useProfile();

  // Initialize to current month/year
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [year, setYear] = useState(Math.max(now.getFullYear(), MIN_SUPPORTED_YEAR));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<BatchCompareResponse | null>(null);

  // Build the list of ComparedPerson (user + friends) for the grid
  const people = useMemo<ComparedPerson[]>(() => {
    if (!user) return [];

    // User is always first
    const userPerson: ComparedPerson = {
      id: user.id,
      displayName: profile?.first_name
        ? `${profile.first_name} ${profile.last_name || ''}`.trim()
        : user.email || 'You',
      initial: profile?.first_name?.charAt(0).toUpperCase()
        || user.user_metadata?.first_name?.charAt(0).toUpperCase()
        || user.email?.charAt(0).toUpperCase()
        || 'Y',
      avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url,
      isUser: true,
      rosterHidden: false,
    };

    // Add friends in selection order
    const friendPeople: ComparedPerson[] = selectedFriends.map((friend) => {
      // Find if this friend's roster is hidden from the raw data
      const friendData = rawData?.friends.find((f) => f.friendId === friend.userId);
      
      return {
        id: friend.userId,
        displayName: getFriendDisplayName(friend),
        initial: getFriendInitial(friend),
        avatarUrl: friend.avatarUrl,
        isUser: false,
        rosterHidden: friendData?.rosterHidden || false,
      };
    });

    return [userPerson, ...friendPeople];
  }, [user, profile, selectedFriends, rawData]);

  // Build rosters map from raw data
  const rostersByPersonId = useMemo<Record<string, FlightDuty[]>>(() => {
    if (!rawData || !user) return {};

    const result: Record<string, FlightDuty[]> = {};

    // Normalize dates from JSON
    const normalizeDuty = (duty: SerializableFlightDuty): FlightDuty => ({
      ...duty,
      date: duty.date ? new Date(duty.date) : new Date(),
      lastEditedAt: duty.lastEditedAt ? new Date(duty.lastEditedAt) : undefined,
      createdAt: duty.createdAt ? new Date(duty.createdAt) : undefined,
      updatedAt: duty.updatedAt ? new Date(duty.updatedAt) : undefined,
    });

    // User's roster
    result[user.id] = (rawData.myRoster || []).map(normalizeDuty);

    // Friends' rosters
    for (const friendData of rawData.friends) {
      result[friendData.friendId] = (friendData.roster || []).map(normalizeDuty);
    }

    return result;
  }, [rawData, user]);

  // Build the grid data
  const gridData = useMemo<MultiMonthGridData | null>(() => {
    if (!rawData || people.length === 0) return null;

    return createMultiMonthGrid(year, month, people, rostersByPersonId);
  }, [rawData, year, month, people, rostersByPersonId]);

  // Fetch data from batch endpoint
  const fetchData = useCallback(async () => {
    if (!session?.access_token || selectedFriends.length === 0) {
      setRawData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const friendIds = selectedFriends.map((f) => f.userId).join(',');
      const response = await fetch(
        `/api/friends/compare-roster-batch?friendIds=${friendIds}&month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch roster data');
      }

      const data: BatchCompareResponse = await response.json();
      setRawData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRawData(null);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, selectedFriends, month, year]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Month navigation
  const goToPreviousMonth = useCallback(() => {
    if (month === 1) {
      const newYear = year - 1;
      if (newYear < MIN_SUPPORTED_YEAR) return;
      setMonth(12);
      setYear(newYear);
    } else {
      setMonth(month - 1);
    }
  }, [month, year]);

  const goToNextMonth = useCallback(() => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }, [month, year]);

  return {
    gridData,
    loading,
    error,
    month,
    year,
    goToPreviousMonth,
    goToNextMonth,
    refetch: fetchData,
  };
}

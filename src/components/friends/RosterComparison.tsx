'use client';

/**
 * Roster Comparison Component - Redesigned
 * Calendar-style grid comparing user and friend rosters
 * Phase 4 - Design alignment with Dashboard page
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Search, Calendar, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FlightDuty } from '@/types/salary-calculator';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/contexts/ProfileProvider';
import { FriendWithProfile, getFriendDisplayName, getFriendInitial, getAvatarColor } from '@/lib/database/friends';
import { createMonthGrid, MonthGridData } from '@/lib/roster-comparison';
import { DayGrid, LoadingSkeleton } from './roster-comparison';
import { MIN_SUPPORTED_YEAR } from '@/lib/constants/dates';

interface RosterComparisonProps {
  friend: FriendWithProfile;
  onClose: () => void;
}

interface RosterData {
  myRoster: FlightDuty[];
  friendRoster: FlightDuty[];
  friendRosterHidden: boolean;
  month: number;
  year: number;
}

interface SerializableFlightDuty
  extends Omit<FlightDuty, 'date' | 'lastEditedAt' | 'createdAt' | 'updatedAt'> {
  date?: string | Date;
  lastEditedAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export function RosterComparison({ friend, onClose }: RosterComparisonProps) {
  const { session, user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rosterData, setRosterData] = useState<RosterData | null>(null);
  const [gridData, setGridData] = useState<MonthGridData | null>(null);

  // Initialize to current month/year (clamped to MIN_SUPPORTED_YEAR)
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(
    Math.max(now.getFullYear(), MIN_SUPPORTED_YEAR)
  );

  const friendDisplayName = getFriendDisplayName(friend);
  const friendInitial = getFriendInitial(friend);

  // Fetch roster data when month/year changes
  // Note: Using session?.access_token instead of session object to avoid
  // unnecessary refetches on tab focus (session object reference changes)
  useEffect(() => {
    fetchRosterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, friend.userId, session?.access_token]);

  // Generate grid data when roster data changes
  useEffect(() => {
    if (rosterData) {
      const grid = createMonthGrid(
        rosterData.year,
        rosterData.month,
        rosterData.myRoster,
        rosterData.friendRoster
      );
      setGridData(grid);
    }
  }, [rosterData]);

  const fetchRosterData = async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/friends/compare-roster?friendId=${friend.userId}&month=${selectedMonth}&year=${selectedYear}`,
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

      const rawData = await response.json();

      const normalizeDuty = (duty: SerializableFlightDuty): FlightDuty => {
        return {
          ...duty,
          date: duty.date ? new Date(duty.date) : new Date(),
          lastEditedAt: duty.lastEditedAt ? new Date(duty.lastEditedAt) : undefined,
          createdAt: duty.createdAt ? new Date(duty.createdAt) : undefined,
          updatedAt: duty.updatedAt ? new Date(duty.updatedAt) : undefined,
        };
      };

      const myRoster = (rawData.myRoster || []).map(normalizeDuty);
      const friendRoster = (rawData.friendRoster || []).map(normalizeDuty);

      setRosterData({
        myRoster,
        friendRoster,
        friendRosterHidden: rawData.friendRosterHidden || false,
        month: rawData.month,
        year: rawData.year,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Month navigation (with MIN_SUPPORTED_YEAR restriction)
  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      const newYear = selectedYear - 1;
      // Don't allow navigation before MIN_SUPPORTED_YEAR
      if (newYear < MIN_SUPPORTED_YEAR) return;
      setSelectedMonth(12);
      setSelectedYear(newYear);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Get user initial from profile (DB source of truth) with fallback to auth metadata
  const getUserInitial = () => {
    if (profile?.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'Y';
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 card-responsive-padding pb-3">
        {/* Top row: Back button and title */}
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-responsive-sm font-medium text-gray-600 hover:text-[#4C49ED] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Compare Roster</span>
          </button>
        </div>

        {/* Search bar with selected friend chip */}
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <div className="inline-flex items-center gap-2 rounded-2xl bg-[#4C49ED]/10 px-3 py-1.5">
            <span className="text-responsive-sm text-[#4C49ED] font-medium">{friendDisplayName}</span>
            <button
              onClick={onClose}
              className="rounded-full p-0.5 text-[#4C49ED]/60 hover:bg-[#4C49ED]/20 hover:text-[#4C49ED] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousMonth}
            disabled={loading}
            className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-responsive-base font-bold text-brand-ink">
            {gridData?.monthName || ''} {selectedYear}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            disabled={loading}
            className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Avatar headers - sticky column headers, responsive grid */}
      <div className="flex-shrink-0 bg-gray-50/50">
        <div className="grid grid-cols-[50px_1fr_1fr] sm:grid-cols-[70px_1fr_1fr] gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3">
          {/* Empty space for date column */}
          <div />

          {/* User avatar column */}
          <div className="flex flex-col items-center">
            {(profile?.avatar_url || user?.user_metadata?.avatar_url) ? (
              <img
                src={profile?.avatar_url || user?.user_metadata?.avatar_url || ''}
                alt="You"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
              />
            ) : (
              <div className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center",
                getAvatarColor(user?.id || '')
              )}>
                <span className="text-base sm:text-lg font-semibold text-white">{getUserInitial()}</span>
              </div>
            )}
            <span className="mt-1 sm:mt-1.5 text-responsive-xs font-medium text-gray-600">You</span>
          </div>

          {/* Friend avatar column */}
          <div className="flex flex-col items-center">
            {friend.avatarUrl ? (
              <img
                src={friend.avatarUrl}
                alt={friendDisplayName}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
              />
            ) : (
              <div className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center",
                getAvatarColor(friend.userId)
              )}>
                <span className="text-base sm:text-lg font-semibold text-white">{friendInitial}</span>
              </div>
            )}
            <span className="mt-1 sm:mt-1.5 text-responsive-xs font-medium text-gray-600 truncate max-w-full">{friend.firstName || friendDisplayName}</span>
          </div>
        </div>
      </div>

      {/* Grid content - responsive layout */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-2 sm:px-4 py-2">
            <LoadingSkeleton />
          </div>
        )}

        {error && (
          <div className="mx-2 sm:mx-4 my-4 rounded-2xl bg-red-50 p-4 text-responsive-sm text-red-700">
            {error}
          </div>
        )}

        {/* Friend has hidden their roster */}
        {!loading && !error && rosterData?.friendRosterHidden && (
          <div className="mx-2 sm:mx-4 my-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <EyeOff className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-responsive-sm font-medium text-amber-800">
                {friendDisplayName} has hidden their roster
              </p>
              <p className="text-responsive-xs text-amber-700 mt-1">
                This user has enabled privacy settings that hide their roster from friends.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && gridData && (
          <DayGrid days={gridData.days} />
        )}

        {!loading && !error && gridData && gridData.userDutyCount === 0 && gridData.friendDutyCount === 0 && (
          <div className="px-4 py-8 md:py-12 text-center">
            <Calendar className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-responsive-base font-bold text-brand-ink">No roster data</p>
            <p className="text-responsive-sm text-gray-500 mt-1">
              No duties found for this month
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


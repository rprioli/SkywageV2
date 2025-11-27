'use client';

/**
 * Roster Comparison Component - Redesigned
 * Calendar-style grid comparing user and friend rosters
 * Phase 4c - Friends Feature
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlightDuty } from '@/types/salary-calculator';
import { useAuth } from '@/contexts/AuthProvider';
import { FriendWithProfile, getFriendDisplayName, getFriendInitial } from '@/lib/database/friends';
import { createMonthGrid, MonthGridData, DayWithDuties } from '@/lib/roster-comparison';
import { DutyTile } from './roster-tiles';
import { cn } from '@/lib/utils';

interface RosterComparisonProps {
  friend: FriendWithProfile;
  onClose: () => void;
}

interface RosterData {
  myRoster: FlightDuty[];
  friendRoster: FlightDuty[];
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rosterData, setRosterData] = useState<RosterData | null>(null);
  const [gridData, setGridData] = useState<MonthGridData | null>(null);

  // Initialize to current month/year
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const friendDisplayName = getFriendDisplayName(friend);
  const friendInitial = getFriendInitial(friend);

  // Fetch roster data when month/year changes
  useEffect(() => {
    fetchRosterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, friend.userId, session]);

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
        month: rawData.month,
        year: rawData.year,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Month navigation
  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
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

  // Get user initial
  const getUserInitial = () => {
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'Y';
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
        {/* Top row: Back button and title */}
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Compare Roster</span>
          </button>
        </div>

        {/* Selected friend chip */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
            <span className="text-sm text-gray-700">{friendDisplayName}</span>
            <button
              onClick={onClose}
              className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-gray-700">
            {gridData?.monthName || ''} {selectedYear}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Avatar headers - sticky column headers */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="grid grid-cols-[80px_1fr_1fr] gap-2 px-4 py-3">
          {/* Empty space for date column */}
          <div />

          {/* User avatar column */}
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#4C49ED] to-[#6DDC91] flex items-center justify-center">
              <span className="text-lg font-semibold text-white">{getUserInitial()}</span>
            </div>
            <span className="mt-1 text-xs font-medium text-gray-600">You</span>
          </div>

          {/* Friend avatar column */}
          <div className="flex flex-col items-center">
            {friend.avatarUrl ? (
              <img
                src={friend.avatarUrl}
                alt={friendDisplayName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#4C49ED] to-[#6DDC91] flex items-center justify-center">
                <span className="text-lg font-semibold text-white">{friendInitial}</span>
              </div>
            )}
            <span className="mt-1 text-xs font-medium text-gray-600">{friend.firstName || friendDisplayName}</span>
          </div>
        </div>
      </div>

      {/* Grid content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-gray-500">Loading rosters...</div>
          </div>
        )}

        {error && (
          <div className="mx-4 my-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && gridData && (
          <div className="px-4 py-2">
            {gridData.days.map((dayData) => (
              <DayRow key={dayData.day.dayNumber} dayData={dayData} />
            ))}
          </div>
        )}

        {!loading && !error && gridData && gridData.userDutyCount === 0 && gridData.friendDutyCount === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No roster data for this month
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Day Row Component
 * Renders a single day with date column + user/friend duty tiles
 */
interface DayRowProps {
  dayData: DayWithDuties;
}

function DayRow({ dayData }: DayRowProps) {
  const { day, userDuty, friendDuty } = dayData;

  return (
    <div
      className={cn(
        'grid grid-cols-[80px_1fr_1fr] gap-2 py-1',
        day.isWeekend && 'bg-gray-50/50'
      )}
    >
      {/* Date column */}
      <div className="flex flex-col items-center justify-center py-2">
        <span className="text-xs font-medium text-gray-500">{day.dayName}</span>
        <span className="text-2xl font-bold text-gray-900">{day.dayNumber}</span>
        <span className="text-xs text-gray-400">{day.monthAbbrev}</span>
      </div>

      {/* User duty tile */}
      <div className="min-h-[60px]">
        <DutyTile tile={userDuty} />
      </div>

      {/* Friend duty tile */}
      <div className="min-h-[60px]">
        <DutyTile tile={friendDuty} />
      </div>
    </div>
  );
}

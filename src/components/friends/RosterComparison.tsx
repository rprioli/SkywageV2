'use client';

/**
 * Roster Comparison Component - Redesigned
 * Calendar-style grid comparing user and friend rosters
 * Phase 4 - Design alignment with Dashboard page
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlightDuty } from '@/types/salary-calculator';
import { useAuth } from '@/contexts/AuthProvider';
import { FriendWithProfile, getFriendDisplayName, getFriendInitial } from '@/lib/database/friends';
import { createMonthGrid, MonthGridData, DayWithDuties } from '@/lib/roster-comparison';
import { DutyTile } from './roster-tiles';
import { DutyTileData } from '@/lib/roster-comparison';
import { DutyType } from '@/types/salary-calculator';
import { cn } from '@/lib/utils';

/**
 * Connection category for determining which rows should connect without gaps
 * - 'work': Flight duties and ground duties connect with each other
 * - 'off': Days off connect only with other days off
 * - 'rest': Rest never connects (always isolated)
 * - 'annual_leave': Annual leave connects only with other annual leave
 * - 'empty': No duty (never connects)
 */
type ConnectionCategory = 'work' | 'off' | 'rest' | 'annual_leave' | 'empty';

/**
 * Get the connection category for a duty type
 */
function getConnectionCategory(duty: DutyTileData | null): ConnectionCategory {
  if (!duty) return 'empty';
  
  const dutyType: DutyType = duty.dutyType;
  
  switch (dutyType) {
    // Work duties - flights and ground duties connect with each other
    case 'turnaround':
    case 'layover':
    case 'asby':
    case 'sby':
    case 'recurrent':
    case 'business_promotion':
      return 'work';
    
    // Days off - connect only with other days off
    case 'off':
      return 'off';
    
    // Rest - never connects
    case 'rest':
      return 'rest';
    
    // Annual leave - connects only with other annual leave
    case 'annual_leave':
      return 'annual_leave';
    
    default:
      return 'empty';
  }
}

/**
 * Check if two duties should connect (same connection category)
 * Rest and empty never connect
 */
function shouldConnect(currentDuty: DutyTileData | null, previousDuty: DutyTileData | null): boolean {
  const currentCategory = getConnectionCategory(currentDuty);
  const previousCategory = getConnectionCategory(previousDuty);
  
  // Rest and empty never connect
  if (currentCategory === 'rest' || currentCategory === 'empty') return false;
  if (previousCategory === 'rest' || previousCategory === 'empty') return false;
  
  // Connect if same category
  return currentCategory === previousCategory;
}

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
          <span className="min-w-[140px] text-center text-responsive-base font-bold" style={{ color: '#3A3780' }}>
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
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#4C49ED] to-[#6DDC91] flex items-center justify-center">
              <span className="text-base sm:text-lg font-semibold text-white">{getUserInitial()}</span>
            </div>
            <span className="mt-1 sm:mt-1.5 text-responsive-xs font-medium text-gray-600">You</span>
          </div>

          {/* Friend avatar column */}
          <div className="flex flex-col items-center">
            {friend.avatarUrl ? (
              <img
                src={friend.avatarUrl}
                alt={friendDisplayName}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-cover"
              />
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#4C49ED] to-[#6DDC91] flex items-center justify-center">
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

        {!loading && !error && gridData && (
          <div className="px-2 sm:px-4 py-2">
            {gridData.days.map((dayData, index) => (
              <DayRow 
                key={dayData.day.dayNumber} 
                dayData={dayData}
                previousDayData={index > 0 ? gridData.days[index - 1] : null}
              />
            ))}
          </div>
        )}

        {!loading && !error && gridData && gridData.userDutyCount === 0 && gridData.friendDutyCount === 0 && (
          <div className="px-4 py-8 md:py-12 text-center">
            <Calendar className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-responsive-base font-bold" style={{ color: '#3A3780' }}>No roster data</p>
            <p className="text-responsive-sm text-gray-500 mt-1">
              No duties found for this month
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Day Row Component
 * Renders a single day with date column + user/friend duty tiles
 * Handles multi-day flight connections and consecutive duty connections
 */
interface DayRowProps {
  dayData: DayWithDuties;
  previousDayData: DayWithDuties | null;
}

function DayRow({ dayData, previousDayData }: DayRowProps) {
  const { day, userDuty, friendDuty } = dayData;

  // Check if this row is part of a multi-day flight (for tile padding adjustments)
  const userIsMultiDayEnd = userDuty?.isMultiDay && userDuty?.position === 'end';
  const userIsMultiDayStart = userDuty?.isMultiDay && userDuty?.position === 'start';
  const userIsMultiDayMiddle = userDuty?.isMultiDay && userDuty?.position === 'middle';
  const friendIsMultiDayEnd = friendDuty?.isMultiDay && friendDuty?.position === 'end';
  const friendIsMultiDayStart = friendDuty?.isMultiDay && friendDuty?.position === 'start';
  const friendIsMultiDayMiddle = friendDuty?.isMultiDay && friendDuty?.position === 'middle';

  // Check if this row should connect to the previous row based on connection categories
  // User duties connect if same category (work-work, off-off, leave-leave)
  const userConnectsToPrevious = previousDayData 
    ? shouldConnect(userDuty, previousDayData.userDuty)
    : false;
  
  // Friend duties connect if same category
  const friendConnectsToPrevious = previousDayData
    ? shouldConnect(friendDuty, previousDayData.friendDuty)
    : false;

  // Row should have no padding if either column connects to previous
  const isMultiDayConnected = userIsMultiDayStart || userIsMultiDayMiddle || userIsMultiDayEnd || 
                              friendIsMultiDayStart || friendIsMultiDayMiddle || friendIsMultiDayEnd;
  const isConsecutiveConnected = userConnectsToPrevious || friendConnectsToPrevious;
  const isConnectedRow = isMultiDayConnected || isConsecutiveConnected;

  return (
    <div
      className={cn(
        'grid grid-cols-[50px_1fr_1fr] sm:grid-cols-[70px_1fr_1fr] gap-1 sm:gap-2',
        isConnectedRow ? 'py-0' : 'py-0.5 sm:py-1',
        day.isWeekend && 'bg-gray-50/50'
      )}
    >
      {/* Date column - compact on mobile */}
      <div className="flex flex-col items-center justify-center py-1 sm:py-2">
        <span className="text-[10px] sm:text-xs font-medium text-gray-500">{day.dayName}</span>
        <span className="text-lg sm:text-2xl font-bold text-gray-900">{day.dayNumber}</span>
        <span className="text-[10px] sm:text-xs text-gray-400">{day.monthAbbrev}</span>
      </div>

      {/* User duty tile */}
      <div className={cn(
        'min-h-[48px] sm:min-h-[60px]',
        userIsMultiDayStart && 'pb-0',
        userIsMultiDayMiddle && 'py-0',
        userIsMultiDayEnd && 'pt-0'
      )}>
        <DutyTile tile={userDuty} />
      </div>

      {/* Friend duty tile */}
      <div className={cn(
        'min-h-[48px] sm:min-h-[60px]',
        friendIsMultiDayStart && 'pb-0',
        friendIsMultiDayMiddle && 'py-0',
        friendIsMultiDayEnd && 'pt-0'
      )}>
        <DutyTile tile={friendDuty} />
      </div>
    </div>
  );
}

/**
 * Loading Skeleton
 * Shows placeholder rows while data is loading
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-0.5 sm:space-y-1">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="grid grid-cols-[50px_1fr_1fr] sm:grid-cols-[70px_1fr_1fr] gap-1 sm:gap-2 py-0.5 sm:py-1">
          {/* Date skeleton */}
          <div className="flex flex-col items-center justify-center py-1 sm:py-2">
            <div className="h-2.5 sm:h-3 w-4 sm:w-8 animate-pulse rounded-lg bg-gray-100" />
            <div className="mt-1 h-5 sm:h-7 w-5 sm:w-6 animate-pulse rounded-lg bg-gray-100" />
            <div className="mt-1 h-2.5 sm:h-3 w-6 sm:w-8 animate-pulse rounded-lg bg-gray-100" />
          </div>
          {/* User tile skeleton */}
          <div className="min-h-[48px] sm:min-h-[60px] animate-pulse rounded-xl bg-gray-100" />
          {/* Friend tile skeleton */}
          <div className="min-h-[48px] sm:min-h-[60px] animate-pulse rounded-xl bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

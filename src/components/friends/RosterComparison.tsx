'use client';

/**
 * Roster Comparison Component - Redesigned
 * Calendar-style grid comparing user and friend rosters
 * Phase 4 - Design alignment with Dashboard page
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlightDuty } from '@/types/salary-calculator';
import { useAuth } from '@/contexts/AuthProvider';
import { FriendWithProfile, getFriendDisplayName, getFriendInitial } from '@/lib/database/friends';
import { createMonthGrid, MonthGridData, DayWithDuties, TilePosition } from '@/lib/roster-comparison';
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
 * Check if a category can connect (rest and empty never connect)
 */
function canConnect(category: ConnectionCategory): boolean {
  return category !== 'rest' && category !== 'empty';
}

/**
 * Processed day data with pre-calculated group positions
 */
interface ProcessedDayData extends DayWithDuties {
  userGroupPosition: TilePosition;
  friendGroupPosition: TilePosition;
}

/**
 * Calculate group positions for consecutive duties in the same category
 * This enables seamless tile connections like multi-day layovers
 */
function calculateGroupPositions(days: DayWithDuties[]): ProcessedDayData[] {
  return days.map((dayData, index) => {
    const prevDay = index > 0 ? days[index - 1] : null;
    const nextDay = index < days.length - 1 ? days[index + 1] : null;
    
    // Calculate user group position
    const userGroupPosition = calculatePositionForDuty(
      dayData.userDuty,
      prevDay?.userDuty ?? null,
      nextDay?.userDuty ?? null
    );
    
    // Calculate friend group position
    const friendGroupPosition = calculatePositionForDuty(
      dayData.friendDuty,
      prevDay?.friendDuty ?? null,
      nextDay?.friendDuty ?? null
    );
    
    return {
      ...dayData,
      userGroupPosition,
      friendGroupPosition,
    };
  });
}

/**
 * Calculate the position of a duty within a consecutive group
 * Handles both regular duties and multi-day layovers that need to connect
 * with adjacent work duties
 */
function calculatePositionForDuty(
  current: DutyTileData | null,
  prev: DutyTileData | null,
  next: DutyTileData | null
): TilePosition {
  const currentCategory = getConnectionCategory(current);
  
  // If current can't connect, it's always single
  if (!canConnect(currentCategory)) {
    return 'single';
  }
  
  const prevCategory = getConnectionCategory(prev);
  const nextCategory = getConnectionCategory(next);
  
  const connectsToPrev = canConnect(prevCategory) && currentCategory === prevCategory;
  const connectsToNext = canConnect(nextCategory) && currentCategory === nextCategory;
  
  // For multi-day duties (layovers), combine their native position
  // with potential connections to adjacent days in the same category
  if (current?.isMultiDay) {
    const nativePosition = current.position || 'single';
    
    switch (nativePosition) {
      case 'start':
        // Layover starts here - check if prev day should also connect
        return connectsToPrev ? 'middle' : 'start';
      
      case 'end':
        // Layover ends here - check if next day should also connect
        return connectsToNext ? 'middle' : 'end';
      
      case 'middle':
        return 'middle';
      
      default:
        // Edge case: single-day multi-day duty
        if (connectsToPrev && connectsToNext) return 'middle';
        if (connectsToPrev) return 'end';
        if (connectsToNext) return 'start';
        return 'single';
    }
  }
  
  // Non-multi-day duties: normal connection logic
  if (connectsToPrev && connectsToNext) {
    return 'middle';
  } else if (connectsToPrev && !connectsToNext) {
    return 'end';
  } else if (!connectsToPrev && connectsToNext) {
    return 'start';
  }
  
  return 'single';
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
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="You"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-[#4C49ED] to-[#6DDC91] flex items-center justify-center">
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
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-[#4C49ED] to-[#6DDC91] flex items-center justify-center">
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
          <DayGrid days={gridData.days} />
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
 * Day Grid Component
 * Pre-calculates group positions and renders all day rows
 */
interface DayGridProps {
  days: DayWithDuties[];
}

function DayGrid({ days }: DayGridProps) {
  // Memoize the processed days with group positions
  const processedDays = useMemo(() => calculateGroupPositions(days), [days]);
  
  return (
    <div className="px-2 sm:px-4 py-2">
      {processedDays.map((dayData) => (
        <DayRow 
          key={dayData.day.dayNumber} 
          dayData={dayData}
        />
      ))}
    </div>
  );
}

/**
 * Day Row Component
 * Renders a single day with date column + user/friend duty tiles
 * Uses pre-calculated group positions for seamless tile connections
 */
interface DayRowProps {
  dayData: ProcessedDayData;
}

function DayRow({ dayData }: DayRowProps) {
  const { day, userDuty, friendDuty, userGroupPosition, friendGroupPosition } = dayData;

  // Helper to get container margin classes based on position
  // Each container handles its own vertical spacing INDEPENDENTLY
  // - 'single': Has margin top AND bottom (for gaps with neighbors)
  // - 'start': Has margin top (gap above), NO margin bottom (connects to next)
  // - 'middle': NO margins (connects both ways)
  // - 'end': NO margin top (connects to prev), HAS margin bottom (gap below)
  const getContainerMargin = (position: TilePosition) => {
    switch (position) {
      case 'single':
        return 'my-0.5 sm:my-1'; // Gap above and below
      case 'start':
        return 'mt-0.5 sm:mt-1 mb-0'; // Gap above, connects below
      case 'middle':
        return 'my-0'; // Connects both ways
      case 'end':
        return 'mt-0 mb-0.5 sm:mb-1'; // Connects above, gap below
      default:
        return 'my-0.5 sm:my-1';
    }
  };

  // Negative margin for overlap - applied per container when connecting to previous
  const getContainerOverlap = (position: TilePosition) => {
    if (position === 'middle' || position === 'end') {
      return '-mt-[1px]'; // Overlap to hide seam with previous tile
    }
    return '';
  };

  return (
    <div
      className={cn(
        'grid grid-cols-[50px_1fr_1fr] sm:grid-cols-[70px_1fr_1fr] gap-1 sm:gap-2',
        day.isWeekend && 'bg-gray-50/50'
      )}
    >
      {/* Date column - compact on mobile */}
      <div className="flex flex-col items-center justify-center py-1 sm:py-2">
        <span className="text-[10px] sm:text-xs font-medium text-gray-500">{day.dayName}</span>
        <span className="text-lg sm:text-2xl font-bold text-gray-900">{day.dayNumber}</span>
        <span className="text-[10px] sm:text-xs text-gray-400">{day.monthAbbrev}</span>
      </div>

      {/* User duty tile - container margin based on its own position */}
      <div className={cn(
        'min-h-[48px] sm:min-h-[60px]',
        getContainerMargin(userGroupPosition),
        getContainerOverlap(userGroupPosition)
      )}>
        <DutyTile tile={userDuty} groupPosition={userGroupPosition} />
      </div>

      {/* Friend duty tile - container margin based on its own position */}
      <div className={cn(
        'min-h-[48px] sm:min-h-[60px]',
        getContainerMargin(friendGroupPosition),
        getContainerOverlap(friendGroupPosition)
      )}>
        <DutyTile tile={friendDuty} groupPosition={friendGroupPosition} />
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

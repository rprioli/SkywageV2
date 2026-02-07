'use client';

/**
 * Multi-Friend Roster Comparison Component
 * Grid layout: rows = people (user + friends), columns = days of month
 * Phase 4b - Multi-friend comparison feature
 */

import React, { useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, EyeOff, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/contexts/ProfileProvider';
import { getAvatarColor } from '@/lib/database/friends';
import {
  MultiMonthGridData,
  ComparedPerson,
  PersonDutyData,
  CalendarDay,
  TilePosition,
} from '@/lib/roster-comparison';
import { CompactDutyTile } from './multi-roster/CompactDutyTile';

interface MultiRosterComparisonProps {
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
  onPreviousMonth: () => void;
  /** Navigate to next month */
  onNextMonth: () => void;
}

export function MultiRosterComparison({
  gridData,
  loading,
  error,
  month,
  year,
  onPreviousMonth,
  onNextMonth,
}: MultiRosterComparisonProps) {
  const { user } = useAuth();
  const { profile } = useProfile();

  // Get user initial for avatar fallback
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

  // Month name for display
  const monthName = gridData?.monthName || '';

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header with Month Navigation */}
      <div className="flex-shrink-0 card-responsive-padding pb-3 border-b border-gray-100">
        <div className="flex items-center justify-center mb-3">
          {/* Month navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreviousMonth}
              disabled={loading}
              className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-responsive-base font-bold text-brand-ink">
              {monthName} {year}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextMonth}
              disabled={loading}
              className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mx-4 my-4 rounded-2xl bg-red-50 p-4 text-responsive-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSkeleton />
        </div>
      )}

      {/* Grid Content */}
      {!loading && !error && gridData && (
        <div className="flex-1 overflow-auto">
          <ComparisonGrid
            gridData={gridData}
            userInitial={getUserInitial()}
            userAvatarUrl={profile?.avatar_url || user?.user_metadata?.avatar_url}
            userId={user?.id || ''}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && (!gridData || gridData.people.length === 0) && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-responsive-base font-bold text-brand-ink">No data available</p>
            <p className="text-responsive-sm text-gray-500 mt-1">
              Select friends to compare rosters
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface ComparisonGridProps {
  gridData: MultiMonthGridData;
  userInitial: string;
  userAvatarUrl?: string;
  userId: string;
}

/**
 * Main comparison grid with horizontal scrolling
 * Layout: rows = people, columns = days
 * 
 * Mobile sticky behavior:
 * - Day headers row: sticky at top
 * - User's row: sticky below day headers
 * - Person info column: sticky on left
 */
function ComparisonGrid({ gridData, userInitial, userAvatarUrl, userId }: ComparisonGridProps) {
  const { days, people } = gridData;
  const daysInMonth = days.length;

  // CSS Grid template for columns: [person info] + [day columns]
  // Increased sizes for better desktop readability: 90px person col + 64px day cols
  const gridTemplateColumns = `90px repeat(${daysInMonth}, minmax(64px, 1fr))`;

  // Height of the day headers row (for sticky offset calculation)
  const dayHeaderHeight = 60; // increased from 50 to 60

  return (
    <div 
      className="min-w-max relative"
      style={{ 
        display: 'grid',
        gridTemplateColumns,
      }}
    >
      {/* Day Headers Row - sticky on mobile */}
      <DayHeadersRow days={days.map(d => d.day)} />
      
      {/* Person Rows */}
      {people.map((person, personIndex) => (
        <PersonRow
          key={person.id}
          person={person}
          days={days}
          personIndex={personIndex}
          userInitial={person.isUser ? userInitial : person.initial}
          userAvatarUrl={person.isUser ? userAvatarUrl : person.avatarUrl}
          userId={userId}
          isUserRow={person.isUser}
          dayHeaderHeight={dayHeaderHeight}
        />
      ))}
    </div>
  );
}

interface DayHeadersRowProps {
  days: CalendarDay[];
}

/**
 * Top row showing day headers (weekday + date)
 * Sticky at top (z-40) so it stays visible during vertical scroll
 */
function DayHeadersRow({ days }: DayHeadersRowProps) {
  return (
    <>
      {/* Empty cell for person column - sticky both top and left - Highest Z-Index */}
      <div 
        className={cn(
          'border-b border-gray-200 p-2 min-h-[60px]',
          'bg-gray-50',
          // Sticky left always for horizontal scroll
          'sticky left-0 z-50',
          // Sticky top always for vertical scroll
          'sticky top-0'
        )}
      />
      
      {/* Day header cells - sticky top */}
      {days.map((day) => (
        <div
          key={day.dayNumber}
          className={cn(
            'flex flex-col items-center justify-center p-1 border-b border-gray-200 min-h-[60px]',
            day.isWeekend ? 'bg-gray-100' : 'bg-gray-50',
            day.isToday && 'bg-[#4C49ED]/10',
            // Sticky top always
            'sticky top-0 z-40'
          )}
        >
          <span className={cn(
            'text-[10px] font-medium uppercase',
            day.isToday ? 'text-[#4C49ED]' : 'text-gray-500'
          )}>
            {day.dayName}
          </span>
          <span className={cn(
            'text-lg font-medium', // Reduced from font-bold to font-medium
            day.isToday ? 'text-[#4C49ED]' : 'text-gray-900'
          )}>
            {day.dayNumber}
          </span>
        </div>
      ))}
    </>
  );
}

interface PersonRowProps {
  person: ComparedPerson;
  days: { day: CalendarDay; duties: PersonDutyData[] }[];
  personIndex: number;
  userInitial: string;
  userAvatarUrl?: string;
  userId: string;
  isUserRow: boolean;
  dayHeaderHeight: number;
}

/**
 * Single person's row with avatar and all day tiles
 * User's row is sticky below day headers
 */
function PersonRow({ 
  person, 
  days, 
  personIndex, 
  userInitial, 
  userAvatarUrl, 
  userId,
  isUserRow,
  dayHeaderHeight,
}: PersonRowProps) {
  // Find this person's duty data for each day
  const personDuties = useMemo(() => {
    return days.map(dayData => {
      const dutyData = dayData.duties.find(d => d.personId === person.id);
      return dutyData || { personId: person.id, duty: null, groupPosition: 'single' as TilePosition };
    });
  }, [days, person.id]);

  const avatarColor = getAvatarColor(person.id);
  
  // Get first name only (full first name, no truncation)
  const firstName = isUserRow ? 'You' : person.displayName.split(' ')[0];

  /**
   * Reduce horizontal gaps so consecutive same-category tiles can visually connect.
   * We keep vertical padding consistent, and only adjust left/right padding.
   */
  const getDayCellPaddingClasses = (position: TilePosition, hasRenderableDuty: boolean) => {
    if (!hasRenderableDuty) {
      return 'px-0.5 py-0.5';
    }

    switch (position) {
      case 'start':
        return 'pl-0.5 pr-0 py-0.5';
      case 'middle':
        return 'px-0 py-0.5';
      case 'end':
        return 'pl-0 pr-0.5 py-0.5';
      case 'single':
      default:
        return 'px-0.5 py-0.5';
    }
  };

  return (
    <>
      {/* Person info cell (avatar + name) */}
      <div 
        className={cn(
          'flex flex-col items-center justify-center gap-1 p-2 border-b border-gray-100',
          // IMPORTANT: sticky cells must be fully opaque to prevent tiles showing through
          'bg-white',
          // Sticky left always for horizontal scroll
          'sticky left-0',
          // User row: sticky top (below day headers)
          // Z-Index hierarchy: Header > User Row > Friend Row
          isUserRow ? 'z-30' : 'z-20'
        )}
        style={isUserRow ? { 
          // Sticky top offset
          top: `${dayHeaderHeight}px` 
        } : undefined}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {userAvatarUrl && (isUserRow || person.avatarUrl) ? (
            <div className="w-10 h-10 rounded-full overflow-hidden relative shadow-sm">
              <Image
                src={isUserRow ? userAvatarUrl : person.avatarUrl}
                alt={person.displayName}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-lg shadow-sm",
              avatarColor
            )}>
              {userInitial}
            </div>
          )}
        </div>
        
        {/* Name - below avatar */}
        <div className="w-full text-center">
          <p className={cn(
            'text-xs font-medium truncate px-1', // Changed font-semibold to font-medium
            isUserRow ? 'text-[#4C49ED]' : 'text-gray-700'
          )}>
            {firstName}
          </p>
        </div>
      </div>

      {/* Duty cells for each day */}
      {personDuties.map((dutyData, dayIndex) => {
        const day = days[dayIndex].day;
        const isHidden = person.rosterHidden && !person.isUser;
        const hasRenderableDuty = Boolean(dutyData.duty) && !isHidden;

        return (
          <div
            key={`${person.id}-${day.dayNumber}`}
            className={cn(
              'border-b border-gray-100 min-h-[80px]', // Increased row height
              day.isWeekend && 'bg-gray-50/50',
              // IMPORTANT: sticky rows must be fully opaque too
              isUserRow && 'bg-white',
              // User row duty cells: sticky top (below day headers)
              // Z-Index: below headers (z-40) and sticky column (z-30), above normal cells
              isUserRow && 'sticky z-10',
              getDayCellPaddingClasses(dutyData.groupPosition, hasRenderableDuty)
            )}
            style={isUserRow ? { top: `${dayHeaderHeight}px` } : undefined}
          >
            {isHidden ? (
              <HiddenRosterCell />
            ) : (
              <CompactDutyTile
                duty={dutyData.duty}
                groupPosition={dutyData.groupPosition}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

/**
 * Cell shown when a friend has hidden their roster
 */
function HiddenRosterCell() {
  return (
    <div className="flex h-full min-h-[76px] items-center justify-center rounded bg-gray-100">
      <EyeOff className="h-4 w-4 text-gray-400" />
    </div>
  );
}

/**
 * Loading skeleton for the grid
 */
function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="w-12 h-12 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
      {[1, 2, 3].map((row) => (
        <div key={row} className="flex gap-2">
          <div className="w-16 h-12 bg-gray-100 rounded animate-pulse" />
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-12 h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

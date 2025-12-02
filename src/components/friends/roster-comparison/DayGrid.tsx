'use client';

/**
 * Day Grid Component
 * Renders the calendar grid with pre-calculated group positions
 */

import { useMemo } from 'react';
import { DayWithDuties, TilePosition } from '@/lib/roster-comparison';
import { DutyTile } from '../roster-tiles';
import { cn } from '@/lib/utils';
import { calculateGroupPositions, ProcessedDayData } from './utils';

interface DayGridProps {
  days: DayWithDuties[];
}

export function DayGrid({ days }: DayGridProps) {
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
 */
interface DayRowProps {
  dayData: ProcessedDayData;
}

function DayRow({ dayData }: DayRowProps) {
  const { day, userDuty, friendDuty, userGroupPosition, friendGroupPosition } = dayData;

  const getContainerMargin = (position: TilePosition) => {
    switch (position) {
      case 'single':
        return 'my-0.5 sm:my-1';
      case 'start':
        return 'mt-0.5 sm:mt-1 mb-0';
      case 'middle':
        return 'my-0';
      case 'end':
        return 'mt-0 mb-0.5 sm:mb-1';
      default:
        return 'my-0.5 sm:my-1';
    }
  };

  const getContainerOverlap = (position: TilePosition) => {
    if (position === 'middle' || position === 'end') {
      return '-mt-[1px]';
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
      {/* Date column */}
      <div className="flex flex-col items-center justify-center py-1 sm:py-2">
        <span className="text-[10px] sm:text-xs font-medium text-gray-500">{day.dayName}</span>
        <span className="text-lg sm:text-2xl font-bold text-gray-900">{day.dayNumber}</span>
        <span className="text-[10px] sm:text-xs text-gray-400">{day.monthAbbrev}</span>
      </div>

      {/* User duty tile */}
      <div className={cn(
        'min-h-[48px] sm:min-h-[60px]',
        getContainerMargin(userGroupPosition),
        getContainerOverlap(userGroupPosition)
      )}>
        <DutyTile tile={userDuty} groupPosition={userGroupPosition} />
      </div>

      {/* Friend duty tile */}
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


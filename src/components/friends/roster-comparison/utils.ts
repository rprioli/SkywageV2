/**
 * Roster Comparison Utilities
 * Connection categories and group position calculations
 */

import { DutyTileData, TilePosition, DayWithDuties } from '@/lib/roster-comparison';
import { DutyType } from '@/types/salary-calculator';

/**
 * Connection category for determining which rows should connect without gaps
 * - 'work': Flight duties and ground duties connect with each other
 * - 'off': Days off connect only with other days off
 * - 'rest': Rest never connects (always isolated)
 * - 'annual_leave': Annual leave connects only with other annual leave
 * - 'empty': No duty (never connects)
 */
export type ConnectionCategory = 'work' | 'off' | 'rest' | 'annual_leave' | 'empty';

/**
 * Get the connection category for a duty type
 */
export function getConnectionCategory(duty: DutyTileData | null): ConnectionCategory {
  if (!duty) return 'empty';
  
  const dutyType: DutyType = duty.dutyType;
  
  switch (dutyType) {
    case 'turnaround':
    case 'layover':
    case 'asby':
    case 'sby':
    case 'recurrent':
    case 'business_promotion':
      return 'work';
    case 'off':
      return 'off';
    case 'rest':
      return 'rest';
    case 'annual_leave':
      return 'annual_leave';
    default:
      return 'empty';
  }
}

/**
 * Check if a category can connect (rest and empty never connect)
 */
export function canConnect(category: ConnectionCategory): boolean {
  return category !== 'rest' && category !== 'empty';
}

/**
 * Processed day data with pre-calculated group positions
 */
export interface ProcessedDayData extends DayWithDuties {
  userGroupPosition: TilePosition;
  friendGroupPosition: TilePosition;
}

/**
 * Calculate the position of a duty within a consecutive group
 */
export function calculatePositionForDuty(
  current: DutyTileData | null,
  prev: DutyTileData | null,
  next: DutyTileData | null
): TilePosition {
  const currentCategory = getConnectionCategory(current);
  
  if (!canConnect(currentCategory)) {
    return 'single';
  }
  
  const prevCategory = getConnectionCategory(prev);
  const nextCategory = getConnectionCategory(next);
  
  const connectsToPrev = canConnect(prevCategory) && currentCategory === prevCategory;
  const connectsToNext = canConnect(nextCategory) && currentCategory === nextCategory;
  
  if (current?.isMultiDay) {
    const nativePosition = current.position || 'single';
    
    switch (nativePosition) {
      case 'start':
        return connectsToPrev ? 'middle' : 'start';
      case 'end':
        return connectsToNext ? 'middle' : 'end';
      case 'middle':
        return 'middle';
      default:
        if (connectsToPrev && connectsToNext) return 'middle';
        if (connectsToPrev) return 'end';
        if (connectsToNext) return 'start';
        return 'single';
    }
  }
  
  if (connectsToPrev && connectsToNext) return 'middle';
  if (connectsToPrev && !connectsToNext) return 'end';
  if (!connectsToPrev && connectsToNext) return 'start';
  
  return 'single';
}

/**
 * Calculate group positions for consecutive duties in the same category
 */
export function calculateGroupPositions(days: DayWithDuties[]): ProcessedDayData[] {
  return days.map((dayData, index) => {
    const prevDay = index > 0 ? days[index - 1] : null;
    const nextDay = index < days.length - 1 ? days[index + 1] : null;
    
    const userGroupPosition = calculatePositionForDuty(
      dayData.userDuty,
      prevDay?.userDuty ?? null,
      nextDay?.userDuty ?? null
    );
    
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


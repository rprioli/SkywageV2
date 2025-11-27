/**
 * Types for Roster Comparison Grid
 * Phase 4a - Friends Feature
 */

import { FlightDuty, DutyType } from '@/types/salary-calculator';

/**
 * Day information for the calendar grid
 */
export interface CalendarDay {
  date: Date;
  dayNumber: number;
  dayName: string; // Mon, Tue, Wed, etc.
  monthAbbrev: string; // JAN, FEB, etc.
  isToday: boolean;
  isWeekend: boolean;
}

/**
 * Visual tile type for rendering
 */
export type TileType = 'flight' | 'off' | 'standby' | 'empty';

/**
 * Position in a multi-day tile span
 */
export type TilePosition = 'single' | 'start' | 'middle' | 'end';

/**
 * Data needed to render a duty tile
 */
export interface DutyTileData {
  id: string;
  type: TileType;
  dutyType: DutyType;
  
  // Flight-specific data
  airportCode?: string; // Destination airport (e.g., "VIE", "DXB")
  flightNumber?: string; // e.g., "6127"
  sectors?: string[]; // Full sector info (e.g., ["DXB-VIE"])
  
  // Multi-day handling
  isMultiDay: boolean;
  position: TilePosition;
  spanDays: number; // How many days this duty spans
  groupId?: string; // Links tiles that belong to the same multi-day duty
  
  // Original duty reference
  originalDuty: FlightDuty;
}

/**
 * A day with its mapped duties for both user and friend
 */
export interface DayWithDuties {
  day: CalendarDay;
  userDuty: DutyTileData | null;
  friendDuty: DutyTileData | null;
}

/**
 * Result of mapping duties to a month grid
 */
export interface MonthGridData {
  year: number;
  month: number;
  monthName: string;
  days: DayWithDuties[];
  userDutyCount: number;
  friendDutyCount: number;
}

/**
 * Maps duty types to their visual tile type
 */
export function getDutyTileType(dutyType: DutyType): TileType {
  switch (dutyType) {
    case 'turnaround':
    case 'layover':
      return 'flight';
    case 'off':
      return 'off';
    case 'asby':
    case 'sby':
      return 'standby';
    case 'recurrent':
    case 'business_promotion':
      return 'flight'; // Treat as flight-like duties
    default:
      return 'empty';
  }
}

/**
 * Extract destination airport from sectors
 * For sectors like ["DXB-VIE", "VIE-DXB"], returns the final destination
 */
export function getDestinationAirport(sectors: string[]): string | undefined {
  if (!sectors || sectors.length === 0) return undefined;
  
  // Get the last sector and extract destination
  const lastSector = sectors[sectors.length - 1];
  const parts = lastSector.split('-');
  
  if (parts.length >= 2) {
    return parts[parts.length - 1]; // Return destination of last sector
  }
  
  return undefined;
}

/**
 * Extract first flight number from array
 */
export function getDisplayFlightNumber(flightNumbers: string[]): string | undefined {
  if (!flightNumbers || flightNumbers.length === 0) return undefined;
  
  // Extract just the number portion (remove "FZ" or similar prefix)
  const firstFlight = flightNumbers[0];
  const match = firstFlight.match(/\d+/);
  return match ? match[0] : firstFlight;
}


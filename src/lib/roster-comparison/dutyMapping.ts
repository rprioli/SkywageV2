/**
 * Duty-to-Day mapping utilities for Roster Comparison Grid
 * Phase 4a - Friends Feature
 * 
 * Maps FlightDuty data to per-day tiles, handling:
 * - Multi-day flights (layovers that span 2+ days)
 * - Off days
 * - Various duty types
 */

import { FlightDuty } from '@/types/salary-calculator';
import { identifyLayoverPairs } from '@/lib/salary-calculator/card-data-mapper';
import {
  CalendarDay,
  DutyTileData,
  DayWithDuties,
  MonthGridData,
  TilePosition,
  getDutyTileType,
  getDestinationAirport,
  getDisplayFlightNumber,
  // Multi-friend types
  PersonDutyData,
  MultiDayWithDuties,
  ComparedPerson,
  MultiMonthGridData,
} from './types';
import { generateMonthDays, formatDateKey, getMonthName } from './dayUtils';

/**
 * Represents a layover pair (outbound + inbound flights)
 */
interface LayoverPair {
  outbound: FlightDuty;
  inbound: FlightDuty;
}

/**
 * Create a unique group ID for multi-day duties
 */
function createGroupId(duty: FlightDuty): string {
  return `group-${duty.id || formatDateKey(duty.date)}-${duty.flightNumbers.join('-')}`;
}

/**
 * Convert a FlightDuty to a DutyTileData for a single day
 */
function createTileFromDuty(
  duty: FlightDuty,
  position: TilePosition = 'single',
  spanDays: number = 1,
  groupId?: string
): DutyTileData {
  const tileType = getDutyTileType(duty.dutyType);
  
  return {
    id: duty.id || `tile-${formatDateKey(duty.date)}`,
    type: tileType,
    dutyType: duty.dutyType,
    airportCode: getDestinationAirport(duty.sectors),
    flightNumber: getDisplayFlightNumber(duty.flightNumbers),
    sectors: duty.sectors,
    isMultiDay: spanDays > 1,
    position,
    spanDays,
    groupId,
    originalDuty: duty,
  };
}

/**
 * Build a map of date -> duties for quick lookup
 */
function buildDutyDateMap(duties: FlightDuty[]): Map<string, FlightDuty[]> {
  const dateMap = new Map<string, FlightDuty[]>();
  
  for (const duty of duties) {
    const dateKey = formatDateKey(duty.date);
    const existing = dateMap.get(dateKey) || [];
    existing.push(duty);
    dateMap.set(dateKey, existing);
  }
  
  return dateMap;
}

/**
 * Process layover pairs to create multi-day tile data
 * Returns a map of date -> DutyTileData for layover duties
 */
function processLayoverPairs(
  duties: FlightDuty[]
): Map<string, DutyTileData> {
  const layoverTiles = new Map<string, DutyTileData>();
  const layoverPairs = identifyLayoverPairs(duties) as LayoverPair[];
  
  for (const pair of layoverPairs) {
    const { outbound, inbound } = pair;
    const groupId = createGroupId(outbound);
    
    // Calculate span (typically 2 days for layover)
    const outboundDate = new Date(outbound.date);
    const inboundDate = new Date(inbound.date);
    const spanDays = Math.max(1, Math.ceil(
      (inboundDate.getTime() - outboundDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1);
    
    // Create tile for outbound (start of multi-day)
    const outboundKey = formatDateKey(outboundDate);
    layoverTiles.set(outboundKey, createTileFromDuty(
      outbound,
      'start',
      spanDays,
      groupId
    ));
    
    // Create tile for inbound (end of multi-day)
    const inboundKey = formatDateKey(inboundDate);
    layoverTiles.set(inboundKey, createTileFromDuty(
      inbound,
      'end',
      spanDays,
      groupId
    ));
    
    // If span is more than 2 days, fill middle days
    if (spanDays > 2) {
      const currentDate = new Date(outboundDate);
      currentDate.setDate(currentDate.getDate() + 1);
      
      while (currentDate < inboundDate) {
        const middleKey = formatDateKey(currentDate);
        // Create a "middle" tile that shows the layover continues
        layoverTiles.set(middleKey, {
          id: `middle-${middleKey}-${groupId}`,
          type: 'flight',
          dutyType: 'layover',
          airportCode: getDestinationAirport(outbound.sectors),
          flightNumber: getDisplayFlightNumber(outbound.flightNumbers),
          isMultiDay: true,
          position: 'middle',
          spanDays,
          groupId,
          originalDuty: outbound,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  }
  
  return layoverTiles;
}

/**
 * Get the set of duty IDs that are part of layover pairs
 */
function getLayoverDutyIds(duties: FlightDuty[]): Set<string> {
  const layoverPairs = identifyLayoverPairs(duties) as LayoverPair[];
  const ids = new Set<string>();
  
  for (const pair of layoverPairs) {
    if (pair.outbound.id) ids.add(pair.outbound.id);
    if (pair.inbound.id) ids.add(pair.inbound.id);
  }
  
  return ids;
}

/**
 * Map duties to calendar days for a single person
 * @param duties - Array of FlightDuty for the month
 * @param days - Array of CalendarDay for the month
 * @returns Map of date key -> DutyTileData
 */
export function mapDutiesPerDay(
  duties: FlightDuty[],
  days: CalendarDay[]
): Map<string, DutyTileData> {
  const result = new Map<string, DutyTileData>();
  
  if (!duties || duties.length === 0) {
    return result;
  }
  
  // First, process layover pairs (they need special multi-day handling)
  const layoverTiles = processLayoverPairs(duties);
  const layoverDutyIds = getLayoverDutyIds(duties);
  
  // Add all layover tiles
  layoverTiles.forEach((tile, key) => {
    result.set(key, tile);
  });
  
  // Build date map for non-layover duties
  const dutyDateMap = buildDutyDateMap(duties);
  
  // Process each day
  for (const day of days) {
    const dateKey = formatDateKey(day.date);
    
    // Skip if we already have a tile from layover processing
    if (result.has(dateKey)) {
      continue;
    }
    
    // Get duties for this day
    const dayDuties = dutyDateMap.get(dateKey) || [];
    
    // Filter out duties that are part of layover pairs (already processed)
    const nonLayoverDuties = dayDuties.filter(
      d => !d.id || !layoverDutyIds.has(d.id)
    );
    
    if (nonLayoverDuties.length > 0) {
      // Take the first duty for this day (typically there's only one)
      const duty = nonLayoverDuties[0];
      result.set(dateKey, createTileFromDuty(duty));
    }
  }
  
  return result;
}

/**
 * Create the full month grid with both user and friend duties
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12)
 * @param userDuties - User's flight duties for the month
 * @param friendDuties - Friend's flight duties for the month
 * @returns MonthGridData with all days and mapped duties
 */
export function createMonthGrid(
  year: number,
  month: number,
  userDuties: FlightDuty[],
  friendDuties: FlightDuty[]
): MonthGridData {
  // Generate all days for the month
  const days = generateMonthDays(year, month);
  
  // Map duties for both user and friend
  const userTileMap = mapDutiesPerDay(userDuties, days);
  const friendTileMap = mapDutiesPerDay(friendDuties, days);
  
  // Combine into DayWithDuties array
  const daysWithDuties: DayWithDuties[] = days.map(day => {
    const dateKey = formatDateKey(day.date);
    return {
      day,
      userDuty: userTileMap.get(dateKey) || null,
      friendDuty: friendTileMap.get(dateKey) || null,
    };
  });
  
  // Count non-empty duty days
  let userDutyCount = 0;
  let friendDutyCount = 0;
  
  for (const dwd of daysWithDuties) {
    if (dwd.userDuty) userDutyCount++;
    if (dwd.friendDuty) friendDutyCount++;
  }
  
  return {
    year,
    month,
    monthName: getMonthName(month),
    days: daysWithDuties,
    userDutyCount,
    friendDutyCount,
  };
}

/**
 * Get display info for a duty tile
 * Returns formatted strings for rendering
 */
export function getDutyDisplayInfo(tile: DutyTileData): {
  label: string;
  sublabel?: string;
  showAirplane: boolean;
  showHouse: boolean;
} {
  switch (tile.type) {
    case 'flight':
      return {
        label: tile.airportCode || 'FLT',
        sublabel: tile.flightNumber,
        showAirplane: true,
        showHouse: false,
      };
    case 'off':
      // Provide more specific labels based on dutyType
      const offLabel = tile.dutyType === 'rest' ? 'REST' 
        : tile.dutyType === 'annual_leave' ? 'LEAVE' 
        : 'OFF';
      return {
        label: offLabel,
        sublabel: undefined,
        showAirplane: false,
        showHouse: true,
      };
    case 'standby':
      return {
        label: tile.dutyType === 'asby' ? 'ASBY' : 'SBY',
        sublabel: undefined,
        showAirplane: false,
        showHouse: false,
      };
    default:
      return {
        label: '',
        sublabel: undefined,
        showAirplane: false,
        showHouse: false,
      };
  }
}

// ============================================================================
// Multi-Friend Comparison Functions (Phase 4b)
// ============================================================================

/**
 * Connection category for determining which tiles should connect without gaps
 */
type ConnectionCategory = 'work' | 'off' | 'rest' | 'annual_leave' | 'empty';

/**
 * Get the connection category for a duty
 */
function getConnectionCategory(duty: DutyTileData | null): ConnectionCategory {
  if (!duty) return 'empty';
  
  switch (duty.dutyType) {
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
function canConnect(category: ConnectionCategory): boolean {
  return category !== 'rest' && category !== 'empty';
}

/**
 * Calculate the position of a duty within a consecutive group
 */
function calculatePositionForDuty(
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
 * Calculate group positions for a single person's duties across all days
 * @param duties - Map of dateKey -> DutyTileData for this person
 * @param days - Array of CalendarDay for the month
 * @returns Array of TilePosition for each day (same order as days)
 */
function calculatePersonGroupPositions(
  duties: Map<string, DutyTileData>,
  days: CalendarDay[]
): TilePosition[] {
  return days.map((day, index) => {
    const dateKey = formatDateKey(day.date);
    const current = duties.get(dateKey) || null;
    
    const prevDay = index > 0 ? days[index - 1] : null;
    const nextDay = index < days.length - 1 ? days[index + 1] : null;
    
    const prev = prevDay ? duties.get(formatDateKey(prevDay.date)) || null : null;
    const next = nextDay ? duties.get(formatDateKey(nextDay.date)) || null : null;
    
    return calculatePositionForDuty(current, prev, next);
  });
}

/**
 * Create a multi-friend month grid with all duties and pre-calculated positions
 * @param year - Year (e.g., 2026)
 * @param month - Month (1-12)
 * @param people - Array of ComparedPerson (user first, then friends)
 * @param rostersByPersonId - Map of personId -> FlightDuty[] for each person
 * @returns MultiMonthGridData with all days, people, and mapped duties
 */
export function createMultiMonthGrid(
  year: number,
  month: number,
  people: ComparedPerson[],
  rostersByPersonId: Record<string, FlightDuty[]>
): MultiMonthGridData {
  // Generate all days for the month
  const days = generateMonthDays(year, month);
  
  // Build duty tile maps for each person
  const tileMapsByPersonId: Record<string, Map<string, DutyTileData>> = {};
  for (const person of people) {
    const duties = rostersByPersonId[person.id] || [];
    tileMapsByPersonId[person.id] = mapDutiesPerDay(duties, days);
  }
  
  // Calculate group positions for each person
  const positionsByPersonId: Record<string, TilePosition[]> = {};
  for (const person of people) {
    positionsByPersonId[person.id] = calculatePersonGroupPositions(
      tileMapsByPersonId[person.id],
      days
    );
  }
  
  // Build the combined days array with all person duties
  const daysWithDuties: MultiDayWithDuties[] = days.map((day, dayIndex) => {
    const dateKey = formatDateKey(day.date);
    
    const duties: PersonDutyData[] = people.map((person) => ({
      personId: person.id,
      duty: tileMapsByPersonId[person.id].get(dateKey) || null,
      groupPosition: positionsByPersonId[person.id][dayIndex],
    }));
    
    return {
      day,
      duties,
    };
  });
  
  // Count duties for each person
  const dutyCounts: Record<string, number> = {};
  for (const person of people) {
    let count = 0;
    const tileMap = tileMapsByPersonId[person.id];
    tileMap.forEach((tile) => {
      if (tile) count++;
    });
    dutyCounts[person.id] = count;
  }
  
  return {
    year,
    month,
    monthName: getMonthName(month),
    days: daysWithDuties,
    people,
    dutyCounts,
  };
}


/**
 * Roster Comparison utilities
 * Phase 4a - Friends Feature
 * 
 * Exports utilities for generating day grids and mapping duties to days
 */

// Types
export type {
  CalendarDay,
  TileType,
  TilePosition,
  DutyTileData,
  DayWithDuties,
  MonthGridData,
} from './types';

// Type helpers
export {
  getDutyTileType,
  getDestinationAirport,
  getDisplayFlightNumber,
} from './types';

// Day utilities
export {
  getDaysInMonth,
  getMonthName,
  generateMonthDays,
  isSameDay,
  formatDateKey,
  getDayOfYear,
  daysBetween,
} from './dayUtils';

// Duty mapping
export {
  mapDutiesPerDay,
  createMonthGrid,
  getDutyDisplayInfo,
} from './dutyMapping';


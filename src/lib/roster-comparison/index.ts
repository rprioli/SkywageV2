/**
 * Roster Comparison utilities
 * Phase 4a - Friends Feature
 * Phase 4b - Multi-Friend Comparison
 * 
 * Exports utilities for generating day grids and mapping duties to days
 */

// Types (single-friend - deprecated but kept for backward compatibility)
export type {
  CalendarDay,
  TileType,
  TilePosition,
  DutyTileData,
  DayWithDuties,
  MonthGridData,
} from './types';

// Types (multi-friend)
export type {
  PersonDutyData,
  MultiDayWithDuties,
  ComparedPerson,
  MultiMonthGridData,
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

// Duty mapping (single-friend - deprecated)
export {
  mapDutiesPerDay,
  createMonthGrid,
  getDutyDisplayInfo,
} from './dutyMapping';

// Duty mapping (multi-friend)
export {
  createMultiMonthGrid,
} from './dutyMapping';
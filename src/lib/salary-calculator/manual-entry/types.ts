/**
 * Manual Entry Module Types
 * Type definitions for manual flight entry processing
 */

import {
  FlightDuty,
  MonthlyCalculationResult
} from '@/types/salary-calculator';

// Re-export from validation module
export type { ManualFlightEntryData, FormValidationResult } from '../manual-entry-validation';

/**
 * Processing result for manual entry
 */
export interface ManualEntryResult {
  success: boolean;
  flightDuty?: FlightDuty;
  monthlyCalculation?: MonthlyCalculationResult;
  errors?: string[];
  warnings?: string[];
}

/**
 * Batch processing result
 */
export interface BatchManualEntryResult {
  success: boolean;
  processedCount: number;
  flightDuties?: FlightDuty[];
  monthlyCalculation?: MonthlyCalculationResult;
  errors?: string[];
  warnings?: string[];
}


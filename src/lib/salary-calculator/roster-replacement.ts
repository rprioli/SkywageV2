/**
 * Roster Replacement Utilities for Skywage Salary Calculator
 * Handles checking for existing data and complete replacement workflow
 * Following existing patterns and .augment-guidelines.md principles
 */

import { 
  checkExistingFlightData,
  deleteFlightDataByMonth 
} from '@/lib/database/flights';
import {
  deleteLayoverRestPeriods,
  deleteMonthlyCalculation
} from '@/lib/database/calculations';
import { MIN_SUPPORTED_YEAR, MAX_SUPPORTED_YEAR } from '@/lib/constants/dates';

// Result types for roster replacement operations
export interface ExistingDataCheck {
  exists: boolean;
  flightCount: number;
  error: string | null;
}

export interface ReplacementResult {
  success: boolean;
  deletedFlights: number;
  deletedRestPeriods: number;
  deletedCalculation: boolean;
  errors: string[];
}

/**
 * Checks if roster data exists for a specific month and year
 */
export async function checkExistingRosterData(
  userId: string,
  month: number,
  year: number
): Promise<ExistingDataCheck> {
  try {
    const flightCheck = await checkExistingFlightData(userId, month, year);
    
    if (flightCheck.error) {
      return {
        exists: false,
        flightCount: 0,
        error: flightCheck.error
      };
    }

    return {
      exists: flightCheck.exists,
      flightCount: flightCheck.count,
      error: null
    };
  } catch (error) {
    return {
      exists: false,
      flightCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Completely replaces all roster data for a specific month and year
 * This includes flights, layover rest periods, and monthly calculations
 */
export async function replaceRosterData(
  userId: string,
  month: number,
  year: number,
  reason?: string
): Promise<ReplacementResult> {
  const errors: string[] = [];
  let deletedFlights = 0;
  let deletedRestPeriods = 0;
  let deletedCalculation = false;

  try {
    const replacementReason = reason || `Roster replacement for ${month}/${year}`;

    // Step 1: Delete all flights for the month
    const flightDeletionResult = await deleteFlightDataByMonth(
      userId, 
      month, 
      year, 
      replacementReason
    );
    
    if (flightDeletionResult.error) {
      errors.push(`Failed to delete flights: ${flightDeletionResult.error}`);
    } else {
      deletedFlights = flightDeletionResult.deletedCount;
    }

    // Step 2: Delete all layover rest periods for the month
    const restPeriodDeletionResult = await deleteLayoverRestPeriods(
      userId,
      month,
      year
    );
    
    if (restPeriodDeletionResult.error) {
      errors.push(`Failed to delete rest periods: ${restPeriodDeletionResult.error}`);
    } else {
      // Note: deleteLayoverRestPeriods doesn't return count, so we assume success
      deletedRestPeriods = 1; // Placeholder - indicates successful deletion
    }

    // Step 3: Delete monthly calculation for the month
    const calculationDeletionResult = await deleteMonthlyCalculation(
      userId, 
      month, 
      year
    );
    
    if (calculationDeletionResult.error) {
      errors.push(`Failed to delete monthly calculation: ${calculationDeletionResult.error}`);
    } else {
      deletedCalculation = calculationDeletionResult.deleted;
    }

    // Dispatch event for statistics refresh if any data was deleted
    if ((deletedFlights > 0 || deletedCalculation) && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flightDataUpdated'));
    }

    return {
      success: errors.length === 0,
      deletedFlights,
      deletedRestPeriods,
      deletedCalculation,
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    errors.push(`Replacement operation failed: ${errorMessage}`);
    
    return {
      success: false,
      deletedFlights,
      deletedRestPeriods,
      deletedCalculation,
      errors
    };
  }
}

/**
 * Validates month and year parameters
 */
export function validateMonthYear(month: number, year: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { valid: false, error: 'Month must be between 1 and 12' };
  }
  
  if (!Number.isInteger(year) || year < MIN_SUPPORTED_YEAR || year > MAX_SUPPORTED_YEAR) {
    return { valid: false, error: `Year must be between ${MIN_SUPPORTED_YEAR} and ${MAX_SUPPORTED_YEAR}` };
  }
  
  return { valid: true };
}

/**
 * Formats month name for display
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
}

/**
 * Creates a user-friendly summary of what will be replaced
 */
export function createReplacementSummary(
  month: number, 
  year: number, 
  flightCount: number
): string {
  const monthName = getMonthName(month);
  
  if (flightCount === 0) {
    return `No existing data found for ${monthName} ${year}.`;
  }
  
  if (flightCount === 1) {
    return `This will replace 1 existing flight and all related data for ${monthName} ${year}.`;
  }
  
  return `This will replace ${flightCount} existing flights and all related data for ${monthName} ${year}.`;
}

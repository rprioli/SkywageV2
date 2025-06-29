/**
 * Recalculation Engine for Skywage Salary Calculator
 * Phase 5: Handles real-time recalculation when flights are edited
 * Following existing patterns from calculation-engine.ts
 */

import { 
  FlightDuty, 
  LayoverRestPeriod, 
  MonthlyCalculationResult,
  Position 
} from '@/types/salary-calculator';
import { 
  calculateMonthlySalary,
  calculateLayoverRestPeriods 
} from '@/lib/salary-calculator';
import { 
  getFlightDutiesByMonth,
  updateFlightDuty 
} from '@/lib/database/flights';
import {
  getLayoverRestPeriodsByMonth,
  createLayoverRestPeriods,
  deleteLayoverRestPeriods,
  upsertMonthlyCalculation
} from '@/lib/database/calculations';

export interface RecalculationResult {
  success: boolean;
  updatedFlights: FlightDuty[];
  updatedLayovers: LayoverRestPeriod[];
  updatedCalculation: MonthlyCalculationResult | null;
  errors: string[];
  warnings: string[];
}

/**
 * Recalculates monthly totals after a flight duty is modified
 */
export async function recalculateMonthlyTotals(
  userId: string,
  month: number,
  year: number,
  position: Position,
  modifiedFlightId?: string
): Promise<RecalculationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Get all flight duties for the month
    const flightsResult = await getFlightDutiesByMonth(userId, month, year);
    if (flightsResult.error) {
      errors.push(`Failed to fetch flights: ${flightsResult.error}`);
      return {
        success: false,
        updatedFlights: [],
        updatedLayovers: [],
        updatedCalculation: null,
        errors,
        warnings
      };
    }

    const flightDuties = flightsResult.data || [];
    if (flightDuties.length === 0) {

      // Delete existing layover rest periods for the month
      const deleteResult = await deleteLayoverRestPeriods(userId, month, year);
      if (deleteResult.error) {
        warnings.push(`Warning: Could not delete old layover periods: ${deleteResult.error}`);
      }

      // Create zero calculation for empty month
      const zeroCalculation = calculateMonthlySalary(
        [], // empty flights array
        [], // empty layover periods
        position,
        month,
        year,
        userId
      );

      // Save zero monthly calculation
      const calculationResult = await upsertMonthlyCalculation(
        zeroCalculation.monthlyCalculation,
        userId
      );
      if (calculationResult.error) {
        warnings.push(`Warning: Could not save zero monthly calculation: ${calculationResult.error}`);
      }

      return {
        success: true,
        updatedFlights: [],
        updatedLayovers: [],
        updatedCalculation: zeroCalculation,
        errors,
        warnings
      };
    }

    // Sort flights by date and time for proper layover calculation
    const sortedFlights = flightDuties.sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // If same date, sort by report time
      if (a.reportTime && b.reportTime) {
        return a.reportTime.totalMinutes - b.reportTime.totalMinutes;
      }
      return 0;
    });

    // Recalculate layover rest periods
    const layoverRestPeriods = calculateLayoverRestPeriods(sortedFlights);

    // Delete existing layover rest periods for the month
    const deleteResult = await deleteLayoverRestPeriods(userId, month, year);
    if (deleteResult.error) {
      warnings.push(`Warning: Could not delete old layover periods: ${deleteResult.error}`);
    }

    // Create new layover rest periods
    let savedLayovers: LayoverRestPeriod[] = [];
    if (layoverRestPeriods.length > 0) {
      const createResult = await createLayoverRestPeriods(layoverRestPeriods, userId);
      if (createResult.error) {
        warnings.push(`Warning: Could not save layover periods: ${createResult.error}`);
      } else {
        savedLayovers = createResult.data || [];
      }
    }

    // Calculate monthly totals
    const monthlyCalculation = calculateMonthlySalary(
      sortedFlights,
      layoverRestPeriods,
      position,
      month,
      year,
      userId
    );

    // Save monthly calculation
    const calculationResult = await upsertMonthlyCalculation(
      monthlyCalculation.monthlyCalculation,
      userId
    );
    if (calculationResult.error) {
      warnings.push(`Warning: Could not save monthly calculation: ${calculationResult.error}`);
    }

    return {
      success: true,
      updatedFlights: sortedFlights,
      updatedLayovers: savedLayovers,
      updatedCalculation: monthlyCalculation,
      errors,
      warnings
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during recalculation';
    errors.push(errorMessage);
    
    return {
      success: false,
      updatedFlights: [],
      updatedLayovers: [],
      updatedCalculation: null,
      errors,
      warnings
    };
  }
}

/**
 * Handles cascading updates when a flight is edited
 * This includes updating dependent layover calculations
 */
export async function handleFlightEdit(
  editedFlight: FlightDuty,
  userId: string,
  position: Position
): Promise<RecalculationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Recalculate for the month containing the edited flight
    const recalcResult = await recalculateMonthlyTotals(
      userId,
      editedFlight.month,
      editedFlight.year,
      position,
      editedFlight.id
    );

    if (!recalcResult.success) {
      errors.push(...recalcResult.errors);
      warnings.push(...recalcResult.warnings);
    }

    // Check if we need to recalculate adjacent months
    // This happens when a flight edit affects layover calculations
    // that span across month boundaries
    const adjacentMonthUpdates = await checkAdjacentMonthImpact(
      editedFlight,
      userId,
      position
    );

    if (adjacentMonthUpdates.warnings.length > 0) {
      warnings.push(...adjacentMonthUpdates.warnings);
    }

    return {
      success: recalcResult.success && adjacentMonthUpdates.success,
      updatedFlights: recalcResult.updatedFlights,
      updatedLayovers: recalcResult.updatedLayovers,
      updatedCalculation: recalcResult.updatedCalculation,
      errors,
      warnings
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during flight edit handling';
    errors.push(errorMessage);
    
    return {
      success: false,
      updatedFlights: [],
      updatedLayovers: [],
      updatedCalculation: null,
      errors,
      warnings
    };
  }
}

/**
 * Checks if editing a flight affects adjacent months
 * This is important for layover calculations that might span month boundaries
 */
async function checkAdjacentMonthImpact(
  editedFlight: FlightDuty,
  userId: string,
  position: Position
): Promise<{ success: boolean; warnings: string[] }> {
  const warnings: string[] = [];

  try {
    // Check if this is a layover flight that might affect adjacent months
    if (editedFlight.dutyType === 'layover') {
      const flightDate = editedFlight.date;
      
      // Check previous month if flight is early in the month
      if (flightDate.getDate() <= 3) {
        const prevMonth = flightDate.getMonth() === 0 ? 12 : flightDate.getMonth();
        const prevYear = flightDate.getMonth() === 0 ? flightDate.getFullYear() - 1 : flightDate.getFullYear();
        
        const prevMonthResult = await recalculateMonthlyTotals(userId, prevMonth, prevYear, position);
        if (!prevMonthResult.success) {
          warnings.push(`Could not recalculate previous month (${prevMonth}/${prevYear})`);
        }
      }
      
      // Check next month if flight is late in the month
      const lastDayOfMonth = new Date(flightDate.getFullYear(), flightDate.getMonth() + 1, 0).getDate();
      if (flightDate.getDate() >= lastDayOfMonth - 2) {
        const nextMonth = flightDate.getMonth() === 11 ? 1 : flightDate.getMonth() + 2;
        const nextYear = flightDate.getMonth() === 11 ? flightDate.getFullYear() + 1 : flightDate.getFullYear();
        
        const nextMonthResult = await recalculateMonthlyTotals(userId, nextMonth, nextYear, position);
        if (!nextMonthResult.success) {
          warnings.push(`Could not recalculate next month (${nextMonth}/${nextYear})`);
        }
      }
    }

    return { success: true, warnings };

  } catch (error) {
    warnings.push('Error checking adjacent month impact');
    return { success: false, warnings };
  }
}

/**
 * Validates that a flight edit won't cause calculation conflicts
 */
export function validateFlightEdit(
  originalFlight: FlightDuty,
  updatedData: Partial<FlightDuty>
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if date change affects month/year
  if (updatedData.date && originalFlight.date) {
    const originalMonth = originalFlight.date.getMonth() + 1;
    const originalYear = originalFlight.date.getFullYear();
    const newMonth = updatedData.date.getMonth() + 1;
    const newYear = updatedData.date.getFullYear();

    if (originalMonth !== newMonth || originalYear !== newYear) {
      warnings.push('Date change will move flight to different month - this will trigger recalculation of both months');
    }
  }

  // Check if duty type change affects calculation logic
  if (updatedData.dutyType && updatedData.dutyType !== originalFlight.dutyType) {
    if (originalFlight.dutyType === 'layover' || updatedData.dutyType === 'layover') {
      warnings.push('Changing duty type to/from layover will affect rest period calculations');
    }
  }

  // Check for time changes that might affect layover calculations
  if (updatedData.reportTime || updatedData.debriefTime) {
    warnings.push('Time changes may affect layover rest period calculations with adjacent flights');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

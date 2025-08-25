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
    const layoverRestPeriods = calculateLayoverRestPeriods(sortedFlights, userId, position);

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





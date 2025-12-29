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
  calculateLayoverRestPeriods,
  calculateFlightDuty
} from '@/lib/salary-calculator';
import {
  getFlightDutiesByMonth,
  getFlightDutiesByMonthWithLookahead,
  updateFlightDutyComputedValues
} from '@/lib/database/flights';
import {
  createLayoverRestPeriods,
  deleteLayoverRestPeriods,
  upsertMonthlyCalculation,
  deleteMonthlyCalculation
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
  position: Position
): Promise<RecalculationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Get all flight duties for the month (for display and duty hour totals)
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

      // Delete monthly calculation for empty month (removes bar from chart)
      const deleteCalcResult = await deleteMonthlyCalculation(userId, month, year);
      if (deleteCalcResult.error) {
        warnings.push(`Warning: Could not delete monthly calculation: ${deleteCalcResult.error}`);
      }

      return {
        success: true,
        updatedFlights: [],
        updatedLayovers: [],
        updatedCalculation: null,
        errors,
        warnings
      };
    }

    // Backfill: Recompute BP duties that may have been saved with fixed 5 hours
    // This corrects historical data when a month is recalculated
    const backfillPromises = flightDuties
      .filter(duty => duty.dutyType === 'business_promotion' && duty.id)
      .map(async (duty) => {
        // Recompute duty hours and flight pay from stored times
        const recalcResult = calculateFlightDuty(duty, position, year, month);
        const newDutyHours = recalcResult.flightDuty.dutyHours;
        const newFlightPay = recalcResult.flightDuty.flightPay;
        
        // Only update if values differ (avoid unnecessary DB writes)
        const needsUpdate = 
          Math.abs(newDutyHours - duty.dutyHours) > 0.01 ||
          Math.abs(newFlightPay - duty.flightPay) > 0.01;
        
        if (needsUpdate) {
          const updateResult = await updateFlightDutyComputedValues(
            duty.id!,
            { dutyHours: newDutyHours, flightPay: newFlightPay },
            userId,
            'System recalculation: BP rule update'
          );
          
          if (!updateResult.success) {
            warnings.push(`Warning: Could not update BP duty ${duty.id}: ${updateResult.error}`);
          } else {
            // Update the in-memory duty for subsequent calculations
            duty.dutyHours = newDutyHours;
            duty.flightPay = newFlightPay;
          }
        }
      });
    
    await Promise.all(backfillPromises);

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

    // Fetch flights with lookahead for cross-month layover pairing
    // This allows pairing outbound flights at month-end with inbound flights in early next month
    const pairingFlightsResult = await getFlightDutiesByMonthWithLookahead(userId, month, year, 3);
    if (pairingFlightsResult.error) {
      warnings.push(`Warning: Could not fetch lookahead flights for pairing: ${pairingFlightsResult.error}`);
      // Fall back to month-only flights for pairing
      var pairingFlights = sortedFlights;
    } else {
      var pairingFlights = (pairingFlightsResult.data || []).sort((a, b) => {
        const dateCompare = a.date.getTime() - b.date.getTime();
        if (dateCompare !== 0) return dateCompare;
        if (a.reportTime && b.reportTime) {
          return a.reportTime.totalMinutes - b.reportTime.totalMinutes;
        }
        return 0;
      });
    }

    // Recalculate layover rest periods using the expanded pairing window
    const allLayoverRestPeriods = calculateLayoverRestPeriods(pairingFlights, userId, position);
    
    // Filter to only rest periods attributed to the target month (outbound month)
    const layoverRestPeriods = allLayoverRestPeriods.filter(
      rp => rp.month === month && rp.year === year
    );

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





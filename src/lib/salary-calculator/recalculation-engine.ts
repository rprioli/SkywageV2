/**
 * Recalculation Engine for Skywage Salary Calculator
 *
 * Handles full monthly recalculation with effective-dated position resolution.
 * Position is resolved internally from user_position_history — callers no longer
 * need to (or should) pass a position argument.
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
import { getPositionRatesForDate } from '@/lib/salary-calculator/calculation-engine';
import { getPaymentMonth } from '@/lib/salary-calculator/time-calculator';
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
import { getUserPositionForMonth } from '@/lib/user-position-history';

export interface RecalculationResult {
  success: boolean;
  updatedFlights: FlightDuty[];
  updatedLayovers: LayoverRestPeriod[];
  updatedCalculation: MonthlyCalculationResult | null;
  errors: string[];
  warnings: string[];
}

/**
 * Recalculates monthly totals for a given user/month/year.
 *
 * Position is resolved internally from the user's position history timeline.
 * This ensures historical months always use the position effective at that time,
 * regardless of what the user's current position is.
 *
 * Per-diem note: when a layover straddles a promotion boundary (e.g., outbound
 * last day of CCM month, inbound first day of SCCM month), per diem is attributed
 * to the outbound month and uses the CCM rate. This is consistent with the
 * "attribute rest to outbound month" logic in calculateLayoverRestPeriods.
 */
export async function recalculateMonthlyTotals(
  userId: string,
  month: number,
  year: number,
  extraPairingFlights?: FlightDuty[]
): Promise<RecalculationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Resolve the position that applies to this month from the timeline.
    // This is the single source of truth — no position prop accepted.
    let position: Position;
    try {
      position = await getUserPositionForMonth(userId, year, month);
    } catch (resolveError) {
      const msg = resolveError instanceof Error ? resolveError.message : String(resolveError);
      errors.push(`Failed to resolve position for ${year}-${month}: ${msg}`);
      return { success: false, updatedFlights: [], updatedLayovers: [], updatedCalculation: null, errors, warnings };
    }

    // Derive snapshot rate values for this position + month
    const rates = getPositionRatesForDate(position, year, month);

    // Fetch all flight duties for the month
    const flightsResult = await getFlightDutiesByMonth(userId, month, year);
    if (flightsResult.error) {
      errors.push(`Failed to fetch flights: ${flightsResult.error}`);
      return { success: false, updatedFlights: [], updatedLayovers: [], updatedCalculation: null, errors, warnings };
    }

    const flightDuties = flightsResult.data || [];

    if (flightDuties.length === 0) {
      // Clean up stale data for an empty month
      const deleteLayoverResult = await deleteLayoverRestPeriods(userId, month, year);
      if (deleteLayoverResult.error) {
        warnings.push(`Warning: Could not delete old layover periods: ${deleteLayoverResult.error}`);
      }

      const deleteCalcResult = await deleteMonthlyCalculation(userId, month, year);
      if (deleteCalcResult.error) {
        warnings.push(`Warning: Could not delete monthly calculation: ${deleteCalcResult.error}`);
      }

      return { success: true, updatedFlights: [], updatedLayovers: [], updatedCalculation: null, errors, warnings };
    }

    // Recompute all per-flight computed values using the resolved position.
    // Previously only BP duties were backfilled; now we recompute all duties
    // so that position changes are reflected accurately across every duty type.
    const recomputePromises = flightDuties
      .filter(duty => duty.id)
      .map(async (duty) => {
        const recalcResult = calculateFlightDuty(duty, position, year, month);
        const newDutyHours = recalcResult.flightDuty.dutyHours;
        const newFlightPay = recalcResult.flightDuty.flightPay;

        const needsUpdate =
          Math.abs(newDutyHours - duty.dutyHours) > 0.01 ||
          Math.abs(newFlightPay - duty.flightPay) > 0.01;

        // Always write snapshot columns even if computed values didn't change
        const updateResult = await updateFlightDutyComputedValues(
          duty.id!,
          {
            dutyHours: needsUpdate ? newDutyHours : duty.dutyHours,
            flightPay: needsUpdate ? newFlightPay : duty.flightPay,
            positionUsed: position,
            hourlyRateUsed: rates.hourlyRate,
          },
          userId,
          'System recalculation: position-aware recompute'
        );

        if (!updateResult.success) {
          warnings.push(`Warning: Could not update duty ${duty.id}: ${updateResult.error}`);
        } else if (needsUpdate) {
          // Update in-memory for subsequent monthly total calculation
          duty.dutyHours = newDutyHours;
          duty.flightPay = newFlightPay;
        }
      });

    await Promise.all(recomputePromises);

    // Sort flights for correct layover pairing
    const sortedFlights = [...flightDuties].sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime();
      if (dateCompare !== 0) return dateCompare;
      if (a.reportTime && b.reportTime) {
        return a.reportTime.totalMinutes - b.reportTime.totalMinutes;
      }
      return 0;
    });

    // Fetch flights with lookahead for cross-month layover pairing.
    // Layovers straddling the month boundary are attributed to the outbound month
    // and use the outbound month's resolved position (this month's position).
    const pairingFlightsResult = await getFlightDutiesByMonthWithLookahead(userId, month, year, 3);
    let pairingFlights: FlightDuty[];
    if (pairingFlightsResult.error) {
      warnings.push(`Warning: Could not fetch lookahead flights for pairing: ${pairingFlightsResult.error}`);
      pairingFlights = sortedFlights;
    } else {
      pairingFlights = (pairingFlightsResult.data || []).sort((a, b) => {
        const dateCompare = a.date.getTime() - b.date.getTime();
        if (dateCompare !== 0) return dateCompare;
        if (a.reportTime && b.reportTime) {
          return a.reportTime.totalMinutes - b.reportTime.totalMinutes;
        }
        return 0;
      });
    }

    // Include any extra pairing flights (e.g., next-month inbound duties from the uploaded file
    // that aren't in the DB yet) for cross-month layover matching
    if (extraPairingFlights && extraPairingFlights.length > 0) {
      pairingFlights = [...pairingFlights, ...extraPairingFlights];
      pairingFlights.sort((a, b) => {
        const dateCompare = a.date.getTime() - b.date.getTime();
        if (dateCompare !== 0) return dateCompare;
        if (a.reportTime && b.reportTime) {
          return a.reportTime.totalMinutes - b.reportTime.totalMinutes;
        }
        return 0;
      });
    }

    // Recalculate layover rest periods using the resolved position.
    // Per-diem design: the outbound month's position drives per-diem for any
    // cross-month layover pair, preserving CCM rates even if inbound is SCCM month.
    const allLayoverRestPeriods = calculateLayoverRestPeriods(pairingFlights, userId, position);

    // Only persist rest periods attributed to this month
    const layoverRestPeriods = allLayoverRestPeriods.filter(
      rp => rp.month === month && rp.year === year
    );

    // Replace stale layover periods for this month
    const deleteLayoverResult = await deleteLayoverRestPeriods(userId, month, year);
    if (deleteLayoverResult.error) {
      warnings.push(`Warning: Could not delete old layover periods: ${deleteLayoverResult.error}`);
    }

    let savedLayovers: LayoverRestPeriod[] = [];
    if (layoverRestPeriods.length > 0) {
      const createResult = await createLayoverRestPeriods(
        layoverRestPeriods,
        userId,
        position,
        rates.perDiemRate
      );
      if (createResult.error) {
        warnings.push(`Warning: Could not save layover periods: ${createResult.error}`);
      } else {
        savedLayovers = createResult.data || [];
      }
    }

    // ── UTC payment month filtering ──
    // Duties are stored by local date, but payment is based on UTC date.
    // A duty on May 1 at 01:30 local is April 30 21:30 UTC → paid in April.
    const nonPayableTypes = new Set(['off', 'rest', 'annual_leave', 'sby', 'sick']);

    // 1. From current-month duties, exclude any whose UTC payment month differs
    const paymentEligibleFromCurrent = sortedFlights.filter(duty => {
      // Non-payable types pass through with 0 pay (they don't shift months)
      if (nonPayableTypes.has(duty.dutyType)) return true;
      if (!duty.reportTime) return true;

      const payment = getPaymentMonth(duty.date, duty.reportTime);
      return payment.month === month && payment.year === year;
    });

    // 2. From lookahead flights NOT in the current month, find those paid this month
    const lookaheadBoundaryDuties = pairingFlights.filter(duty => {
      const dutyMonth = duty.date.getUTCMonth() + 1;
      const dutyYear = duty.date.getUTCFullYear();
      // Skip if it's already in the current month
      if (dutyMonth === month && dutyYear === year) return false;
      if (nonPayableTypes.has(duty.dutyType)) return false;
      if (!duty.reportTime) return false;

      const payment = getPaymentMonth(duty.date, duty.reportTime);
      return payment.month === month && payment.year === year;
    });

    // Recompute pay for lookahead duties using this month's position
    const recomputedLookahead = lookaheadBoundaryDuties.map(duty => {
      const result = calculateFlightDuty(duty, position, year, month);
      return result.errors.length === 0 ? result.flightDuty : duty;
    });

    // Merge both sets
    const paymentEligibleFlights = [...paymentEligibleFromCurrent, ...recomputedLookahead];

    // Calculate monthly totals with the resolved position
    const monthlyCalculation = calculateMonthlySalary(
      paymentEligibleFlights,
      layoverRestPeriods,
      position,
      month,
      year,
      userId
    );

    // Persist with position snapshot
    const calculationResult = await upsertMonthlyCalculation(
      monthlyCalculation.monthlyCalculation,
      userId,
      position
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
      warnings,
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
      warnings,
    };
  }
}

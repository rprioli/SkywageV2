/**
 * Manual Entry Workflow Module
 * Processing workflows for manual flight entries.
 *
 * Position is resolved internally from user_position_history — callers
 * no longer need to pass a position argument to save functions.
 */

import { FlightDuty, Position } from '@/types/salary-calculator';
import {
  calculateMonthlySalary,
  calculateLayoverRestPeriods
} from '@/lib/salary-calculator';
import { createFlightDuties } from '@/lib/database/flights';
import {
  createLayoverRestPeriods,
  upsertMonthlyCalculation
} from '@/lib/database/calculations';
import {
  ManualFlightEntryData,
  validateManualEntry,
  FormValidationResult
} from '../manual-entry-validation';
import { ManualEntryResult, BatchManualEntryResult } from './types';
import { convertToFlightDuty } from './conversion';
import { MIN_SUPPORTED_YEAR } from '@/lib/constants/dates';
import { getUserPositionForMonth } from '@/lib/user-position-history';

/**
 * Validates manual entry data in real-time.
 * `position` is passed from the UI (resolved from the position timeline when
 * the user selects a date) — this keeps the form preview responsive without
 * an async DB call on every keystroke.
 */
export function validateManualEntryRealTime(
  data: Partial<ManualFlightEntryData>,
  position: Position,
  selectedYear: number
): FormValidationResult {
  const completeData: ManualFlightEntryData = {
    date: data.date || '',
    dutyType: data.dutyType || 'layover',
    flightNumbers: data.flightNumbers || [],
    sectors: data.sectors || [],
    reportTime: data.reportTime || '',
    debriefTime: data.debriefTime || '',
    isCrossDay: data.isCrossDay || false,
    inboundDate: data.inboundDate || '',
    reportTimeInbound: data.reportTimeInbound || '',
    debriefTimeOutbound: data.debriefTimeOutbound || '',
    isCrossDayOutbound: data.isCrossDayOutbound || false,
    isCrossDayInbound: data.isCrossDayInbound || false,
    deadheadSectors: data.deadheadSectors || [],
    deadheadDepartureTimes: data.deadheadDepartureTimes || [],
    deadheadArrivalTimes: data.deadheadArrivalTimes || [],
  };

  return validateManualEntry(completeData, position, selectedYear);
}

/**
 * Processes a single manual flight entry.
 * Position is resolved from user_position_history for the entry's month/year.
 */
export async function processManualEntry(
  data: ManualFlightEntryData,
  userId: string
): Promise<ManualEntryResult> {
  const warnings: string[] = [];

  try {
    const entryDate = data.date ? new Date(data.date) : new Date();
    const entryYear = entryDate.getFullYear();
    const entryMonth = entryDate.getMonth() + 1;

    // Resolve the position effective for this entry's month
    const position = await getUserPositionForMonth(userId, entryYear, entryMonth);

    const validation = validateManualEntry(data, position, entryYear);
    if (!validation.valid) {
      return { success: false, errors: validation.errors, warnings: validation.warnings };
    }

    warnings.push(...validation.warnings);

    const flightDuties = convertToFlightDuty(data, userId, position);
    if (!flightDuties || flightDuties.length === 0) {
      return { success: false, errors: ['Failed to convert entry to flight duty'], warnings };
    }

    const saveResult = await createFlightDuties(flightDuties, userId);
    if (saveResult.error) {
      return {
        success: false,
        errors: [`Failed to save flight duty: ${saveResult.error}`],
        warnings,
      };
    }

    // Recalculate monthly totals (position resolved internally)
    const { recalculateMonthlyTotals } = await import('@/lib/salary-calculator/recalculation-engine');
    const firstDuty = flightDuties[0];
    const recalcResult = await recalculateMonthlyTotals(userId, firstDuty.month, firstDuty.year);

    if (!recalcResult.success) {
      warnings.push('Flight saved but monthly calculation update failed');
    }

    // Also recalculate the previous month for cross-month layover pairing
    const previousMonth = firstDuty.month === 1 ? 12 : firstDuty.month - 1;
    const previousYear = firstDuty.month === 1 ? firstDuty.year - 1 : firstDuty.year;
    if (previousYear >= MIN_SUPPORTED_YEAR) {
      const previousRecalc = await recalculateMonthlyTotals(userId, previousMonth, previousYear);
      if (!previousRecalc.success) {
        warnings.push(`Previous month recalculation failed for ${previousMonth}/${previousYear}`);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('calculationUpdated'));
    }

    return {
      success: true,
      flightDuty: firstDuty,
      monthlyCalculation: recalcResult.updatedCalculation ?? undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, errors: [errorMessage], warnings };
  }
}

/**
 * Processes multiple manual flight entries as a batch.
 * Each entry's position is resolved individually for its month/year.
 */
export async function processBatchManualEntries(
  entries: ManualFlightEntryData[],
  userId: string
): Promise<BatchManualEntryResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const flightDuties: FlightDuty[] = [];

  try {
    // Validate and convert all entries, resolving position per-entry date
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const entryDate = entry.date ? new Date(entry.date) : new Date();
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth() + 1;

      const position = await getUserPositionForMonth(userId, entryYear, entryMonth);
      const validation = validateManualEntry(entry, position, entryYear);

      if (!validation.valid) {
        errors.push(`Entry ${i + 1}: ${validation.errors.join(', ')}`);
      } else {
        warnings.push(...validation.warnings.map((w) => `Entry ${i + 1}: ${w}`));
      }
    }

    if (errors.length > 0) {
      return { success: false, processedCount: 0, errors, warnings };
    }

    // Convert all entries to FlightDuty objects
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const entryDate = entry.date ? new Date(entry.date) : new Date();
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth() + 1;
      const position = await getUserPositionForMonth(userId, entryYear, entryMonth);

      const converted = convertToFlightDuty(entry, userId, position);
      if (!converted) {
        errors.push(`Entry ${i + 1}: Failed to convert to flight duty`);
      } else {
        flightDuties.push(...converted);
      }
    }

    if (errors.length > 0) {
      return { success: false, processedCount: 0, errors, warnings };
    }

    const saveResult = await createFlightDuties(flightDuties, userId);
    if (saveResult.error) {
      return {
        success: false,
        processedCount: 0,
        errors: [`Failed to save flight duties: ${saveResult.error}`],
        warnings,
      };
    }

    // Resolve position for the first flight's month for layover/monthly calculations
    const firstFlight = flightDuties[0];
    const batchPosition = await getUserPositionForMonth(userId, firstFlight.year, firstFlight.month);

    const layoverRestPeriods = calculateLayoverRestPeriods(flightDuties, userId, batchPosition);

    if (layoverRestPeriods.length > 0) {
      const restSaveResult = await createLayoverRestPeriods(layoverRestPeriods, userId);
      if (restSaveResult.error) {
        warnings.push(`Warning: Failed to save rest periods: ${restSaveResult.error}`);
      }
    }

    const monthlyCalculation = calculateMonthlySalary(
      flightDuties,
      layoverRestPeriods,
      batchPosition,
      firstFlight.month,
      firstFlight.year,
      userId
    );

    const calculationSaveResult = await upsertMonthlyCalculation(
      monthlyCalculation.monthlyCalculation,
      userId,
      batchPosition
    );
    if (calculationSaveResult.error) {
      warnings.push(`Warning: Failed to save monthly calculation: ${calculationSaveResult.error}`);
    }

    return {
      success: true,
      processedCount: flightDuties.length,
      flightDuties,
      monthlyCalculation,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, processedCount: 0, errors: [errorMessage], warnings };
  }
}

/**
 * Processes multiple manual flight entries with per-month recalculation.
 * Position is resolved per-month from user_position_history.
 */
export async function processManualEntryBatch(
  entries: ManualFlightEntryData[],
  userId: string
): Promise<BatchManualEntryResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const flightDuties: FlightDuty[] = [];

  try {
    // Validate and convert all entries
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const entryDate = entry.date ? new Date(entry.date) : new Date();
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth() + 1;

      const position = await getUserPositionForMonth(userId, entryYear, entryMonth);
      const validation = validateManualEntry(entry, position, entryYear);

      if (!validation.valid) {
        errors.push(`Entry ${i + 1}: ${validation.errors.join(', ')}`);
        continue;
      }

      warnings.push(...validation.warnings.map((w) => `Entry ${i + 1}: ${w}`));

      const entryFlightDuties = convertToFlightDuty(entry, userId, position);
      if (!entryFlightDuties || entryFlightDuties.length === 0) {
        errors.push(`Entry ${i + 1}: Failed to convert entry to flight duty`);
        continue;
      }

      flightDuties.push(...entryFlightDuties);
    }

    if (flightDuties.length === 0) {
      return {
        success: false,
        processedCount: 0,
        errors: errors.length > 0 ? errors : ['No valid flight duties to process'],
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    const saveResult = await createFlightDuties(flightDuties, userId);
    if (saveResult.error) {
      return {
        success: false,
        processedCount: 0,
        errors: [`Failed to save flight duties: ${saveResult.error}`],
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    // Group by month for per-month recalculation
    const monthlyGroups = new Map<string, FlightDuty[]>();
    flightDuties.forEach((duty) => {
      const key = `${duty.year}-${duty.month}`;
      if (!monthlyGroups.has(key)) monthlyGroups.set(key, []);
      monthlyGroups.get(key)!.push(duty);
    });

    // Recalculate for each affected month (position resolved internally per month)
    const { recalculateMonthlyTotals } = await import('@/lib/salary-calculator/recalculation-engine');
    let monthlyCalculation;

    for (const duties of monthlyGroups.values()) {
      const firstDuty = duties[0];
      const recalcResult = await recalculateMonthlyTotals(userId, firstDuty.month, firstDuty.year);

      if (!recalcResult.success) {
        warnings.push(`Monthly calculation update failed for ${firstDuty.month}/${firstDuty.year}`);
      }

      if (!monthlyCalculation) {
        monthlyCalculation = recalcResult.updatedCalculation ?? undefined;
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('calculationUpdated'));
    }

    return {
      success: true,
      processedCount: flightDuties.length,
      flightDuties,
      monthlyCalculation,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      processedCount: 0,
      errors: [errorMessage],
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

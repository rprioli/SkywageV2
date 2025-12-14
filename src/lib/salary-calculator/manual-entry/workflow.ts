/**
 * Manual Entry Workflow Module
 * Processing workflows for manual flight entries
 */

import {
  FlightDuty,
  Position
} from '@/types/salary-calculator';
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

/**
 * Validates manual entry data in real-time
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
    isCrossDayInbound: data.isCrossDayInbound || false
  };

  return validateManualEntry(completeData, position, selectedYear);
}

/**
 * Processes a single manual flight entry
 */
export async function processManualEntry(
  data: ManualFlightEntryData,
  userId: string,
  position: Position
): Promise<ManualEntryResult> {
  const warnings: string[] = [];

  try {
    const selectedYear = data.date ? new Date(data.date).getFullYear() : new Date().getFullYear();

    // Validate the entry
    const validation = validateManualEntry(data, position, selectedYear);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    warnings.push(...validation.warnings);

    // Convert to FlightDuty array
    const flightDuties = convertToFlightDuty(data, userId, position);
    if (!flightDuties || flightDuties.length === 0) {
      return {
        success: false,
        errors: ['Failed to convert entry to flight duty'],
        warnings
      };
    }

    // Save to database
    const saveResult = await createFlightDuties(flightDuties, userId);
    if (saveResult.error) {
      return {
        success: false,
        errors: [`Failed to save flight duty: ${saveResult.error}`],
        warnings
      };
    }

    // Recalculate monthly totals
    const { recalculateMonthlyTotals } = await import('@/lib/salary-calculator/recalculation-engine');
    const firstDuty = flightDuties[0];
    const recalcResult = await recalculateMonthlyTotals(
      userId,
      firstDuty.month,
      firstDuty.year,
      position
    );

    if (!recalcResult.success) {
      warnings.push('Flight saved but monthly calculation update failed');
    }

    // Dispatch event for statistics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('calculationUpdated'));
    }

    return {
      success: true,
      flightDuty: firstDuty,
      monthlyCalculation: recalcResult.updatedCalculation ?? undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      errors: [errorMessage],
      warnings
    };
  }
}

/**
 * Processes multiple manual flight entries as a batch
 */
export async function processBatchManualEntries(
  entries: ManualFlightEntryData[],
  userId: string,
  position: Position
): Promise<BatchManualEntryResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const flightDuties: FlightDuty[] = [];

  try {
    // Validate all entries first
    for (let i = 0; i < entries.length; i++) {
      const selectedYear = entries[i].date ? new Date(entries[i].date).getFullYear() : new Date().getFullYear();
      const validation = validateManualEntry(entries[i], position, selectedYear);
      if (!validation.valid) {
        errors.push(`Entry ${i + 1}: ${validation.errors.join(', ')}`);
      } else {
        warnings.push(...validation.warnings.map(w => `Entry ${i + 1}: ${w}`));
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        processedCount: 0,
        errors,
        warnings
      };
    }

    // Convert all entries to FlightDuty objects
    for (let i = 0; i < entries.length; i++) {
      const flightDuty = convertToFlightDuty(entries[i], userId, position);
      if (!flightDuty) {
        errors.push(`Entry ${i + 1}: Failed to convert to flight duty`);
      } else {
        flightDuties.push(...flightDuty);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        processedCount: 0,
        errors,
        warnings
      };
    }

    // Save all flight duties
    const saveResult = await createFlightDuties(flightDuties, userId);
    if (saveResult.error) {
      return {
        success: false,
        processedCount: 0,
        errors: [`Failed to save flight duties: ${saveResult.error}`],
        warnings
      };
    }

    // Calculate layover rest periods
    const layoverRestPeriods = calculateLayoverRestPeriods(flightDuties, userId, position);

    if (layoverRestPeriods.length > 0) {
      const restSaveResult = await createLayoverRestPeriods(layoverRestPeriods, userId);
      if (restSaveResult.error) {
        warnings.push(`Warning: Failed to save rest periods: ${restSaveResult.error}`);
      }
    }

    // Calculate monthly totals
    const firstFlight = flightDuties[0];
    const monthlyCalculation = calculateMonthlySalary(
      flightDuties,
      layoverRestPeriods,
      position,
      firstFlight.month,
      firstFlight.year,
      userId
    );

    const calculationSaveResult = await upsertMonthlyCalculation(
      monthlyCalculation.monthlyCalculation,
      userId
    );
    if (calculationSaveResult.error) {
      warnings.push(`Warning: Failed to save monthly calculation: ${calculationSaveResult.error}`);
    }

    return {
      success: true,
      processedCount: flightDuties.length,
      flightDuties,
      monthlyCalculation,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      processedCount: 0,
      errors: [errorMessage],
      warnings
    };
  }
}

/**
 * Processes multiple manual flight entries with per-month recalculation
 */
export async function processManualEntryBatch(
  entries: ManualFlightEntryData[],
  userId: string,
  position: Position
): Promise<BatchManualEntryResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const flightDuties: FlightDuty[] = [];

  try {
    // Validate and convert all entries
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const selectedYear = entry.date ? new Date(entry.date).getFullYear() : new Date().getFullYear();

      const validation = validateManualEntry(entry, position, selectedYear);
      if (!validation.valid) {
        errors.push(`Entry ${i + 1}: ${validation.errors.join(', ')}`);
        continue;
      }

      warnings.push(...validation.warnings.map(w => `Entry ${i + 1}: ${w}`));

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
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    // Save all flight duties
    const saveResult = await createFlightDuties(flightDuties, userId);
    if (saveResult.error) {
      return {
        success: false,
        processedCount: 0,
        errors: [`Failed to save flight duties: ${saveResult.error}`],
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    // Group by month for recalculation
    const monthlyGroups = new Map<string, FlightDuty[]>();
    flightDuties.forEach(duty => {
      const key = `${duty.year}-${duty.month}`;
      if (!monthlyGroups.has(key)) {
        monthlyGroups.set(key, []);
      }
      monthlyGroups.get(key)!.push(duty);
    });

    // Recalculate for each affected month
    const { recalculateMonthlyTotals } = await import('@/lib/salary-calculator/recalculation-engine');
    let monthlyCalculation;

    for (const duties of monthlyGroups.values()) {
      const firstDuty = duties[0];
      const recalcResult = await recalculateMonthlyTotals(
        userId,
        firstDuty.month,
        firstDuty.year,
        position
      );

      if (!recalcResult.success) {
        warnings.push(`Monthly calculation update failed for ${firstDuty.month}/${firstDuty.year}`);
      }

      if (!monthlyCalculation) {
        monthlyCalculation = recalcResult.updatedCalculation ?? undefined;
      }
    }

    // Dispatch event for statistics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('calculationUpdated'));
    }

    return {
      success: true,
      processedCount: flightDuties.length,
      flightDuties,
      monthlyCalculation,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      processedCount: 0,
      errors: [errorMessage],
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
}


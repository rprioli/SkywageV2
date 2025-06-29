/**
 * Manual Entry Processor for Skywage Salary Calculator
 * Phase 4: Processes manual flight entries and saves to database
 * Following existing patterns from upload-processor.ts
 */

import { 
  FlightDuty, 
  LayoverRestPeriod, 
  MonthlyCalculationResult,
  Position,
  DutyType
} from '@/types/salary-calculator';
import {
  calculateMonthlySalary,
  calculateLayoverRestPeriods,
  classifyFlightDuty,
  parseTimeString,
  calculateDuration,
  calculateFlightPay
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
} from './manual-entry-validation';
import {
  transformFlightNumbers,
  transformSectors
} from './input-transformers';

// Processing result for manual entry
export interface ManualEntryResult {
  success: boolean;
  flightDuty?: FlightDuty;
  monthlyCalculation?: MonthlyCalculationResult;
  errors?: string[];
  warnings?: string[];
}

// Batch processing result
export interface BatchManualEntryResult {
  success: boolean;
  processedCount: number;
  flightDuties?: FlightDuty[];
  monthlyCalculation?: MonthlyCalculationResult;
  errors?: string[];
  warnings?: string[];
}

/**
 * Converts manual entry data to FlightDuty object
 */
export function convertToFlightDuty(
  data: ManualFlightEntryData,
  userId: string,
  position: Position
): FlightDuty | null {
  try {
    // Parse date
    const flightDate = new Date(data.date);
    const month = flightDate.getMonth() + 1; // 1-based month
    const year = flightDate.getFullYear();

    // Parse times
    const reportTimeResult = parseTimeString(data.reportTime);
    const debriefTimeResult = parseTimeString(data.debriefTime);

    if (!reportTimeResult.success || !debriefTimeResult.success || !reportTimeResult.timeValue || !debriefTimeResult.timeValue) {
      throw new Error(`Invalid time format: ${reportTimeResult.error || debriefTimeResult.error || 'Unknown time parsing error'}`);
    }

    // Calculate duty hours
    const dutyHours = calculateDuration(reportTimeResult.timeValue, debriefTimeResult.timeValue, data.isCrossDay);

    // Calculate flight pay based on duty type and position
    let flightPay = 0;
    if (data.dutyType === 'asby') {
      // ASBY is paid at fixed 4 hours at hourly rate
      const rates = { CCM: { hourlyRate: 50, asbyHours: 4 }, SCCM: { hourlyRate: 62, asbyHours: 4 } };
      flightPay = rates[position].asbyHours * rates[position].hourlyRate;
    } else if (data.dutyType === 'recurrent') {
      // Recurrent is paid at fixed 4 hours at hourly rate
      const rates = { CCM: { hourlyRate: 50 }, SCCM: { hourlyRate: 62 } };
      flightPay = 4 * rates[position].hourlyRate;
    } else if (data.dutyType === 'turnaround' || data.dutyType === 'layover') {
      // Regular flight duties are paid at hourly rate for actual duty hours
      flightPay = calculateFlightPay(dutyHours, position);
    }
    // No pay for 'sby' or 'off' duty types

    // Transform simplified input to expected format
    const flightNumbers = transformFlightNumbers(data.flightNumbers);
    const sectors = transformSectors(data.sectors);

    // Create flight duty object
    const flightDuty: FlightDuty = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      date: flightDate,
      month,
      year,
      flightNumbers,
      sectors,
      dutyType: data.dutyType,
      reportTime: reportTimeResult.timeValue,
      debriefTime: debriefTimeResult.timeValue,
      dutyHours,
      flightPay,
      isCrossDay: data.isCrossDay,
      dataSource: 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Classify the flight duty based on flight numbers and sectors
    const dutiesString = flightNumbers.join(' ');
    const sectorsString = sectors.join(' ');
    const classification = classifyFlightDuty(dutiesString, sectorsString, data.reportTime, data.debriefTime);

    // Update duty type based on classification if needed
    if (classification.dutyType !== flightDuty.dutyType) {
      flightDuty.dutyType = classification.dutyType;
    }

    return flightDuty;
  } catch (error) {
    console.error('Error converting manual entry to flight duty:', error);
    return null;
  }
}

/**
 * Processes a single manual flight entry
 */
export async function processManualEntry(
  data: ManualFlightEntryData,
  userId: string,
  position: Position
): Promise<ManualEntryResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate the entry
    const validation = validateManualEntry(data, position);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    warnings.push(...validation.warnings);

    // Convert to FlightDuty
    const flightDuty = convertToFlightDuty(data, userId, position);
    if (!flightDuty) {
      return {
        success: false,
        errors: ['Failed to convert entry to flight duty'],
        warnings
      };
    }

    // Save to database
    const saveResult = await createFlightDuties([flightDuty], userId);
    if (saveResult.error) {
      return {
        success: false,
        errors: [`Failed to save flight duty: ${saveResult.error}`],
        warnings
      };
    }

    // Recalculate monthly totals for the entire month (not just the new flight)
    const { recalculateMonthlyTotals } = await import('@/lib/salary-calculator/recalculation-engine');
    const recalcResult = await recalculateMonthlyTotals(
      userId,
      flightDuty.month,
      flightDuty.year,
      position
    );

    if (!recalcResult.success) {
      warnings.push('Flight saved but monthly calculation update failed');
    }

    const monthlyCalculation = recalcResult.monthlyCalculation;

    return {
      success: true,
      flightDuty,
      monthlyCalculation,
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
      const validation = validateManualEntry(entries[i], position);
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
        flightDuties.push(flightDuty);
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

    // Save all flight duties to database
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
    const layoverRestPeriods = calculateLayoverRestPeriods(flightDuties);

    // Save layover rest periods if any
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

    // Save monthly calculation
    const calculationSaveResult = await upsertMonthlyCalculation(
      monthlyCalculation.calculation, 
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
 * Processes multiple manual flight entries as a batch
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

      // Validate the entry
      const validation = validateManualEntry(entry, position);
      if (!validation.valid) {
        errors.push(`Entry ${i + 1}: ${validation.errors.join(', ')}`);
        continue;
      }

      warnings.push(...validation.warnings.map(w => `Entry ${i + 1}: ${w}`));

      // Convert to FlightDuty
      const flightDuty = convertToFlightDuty(entry, userId, position);
      if (!flightDuty) {
        errors.push(`Entry ${i + 1}: Failed to convert entry to flight duty`);
        continue;
      }

      flightDuties.push(flightDuty);
    }

    // If no valid flight duties, return error
    if (flightDuties.length === 0) {
      return {
        success: false,
        processedCount: 0,
        errors: errors.length > 0 ? errors : ['No valid flight duties to process'],
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    // Save all flight duties to database
    const saveResult = await createFlightDuties(flightDuties, userId);
    if (saveResult.error) {
      return {
        success: false,
        processedCount: 0,
        errors: [`Failed to save flight duties: ${saveResult.error}`],
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    // Recalculate monthly totals for all affected months
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

    for (const [key, duties] of monthlyGroups) {
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

      // Return the calculation for the first month (most common case)
      if (!monthlyCalculation) {
        monthlyCalculation = recalcResult.monthlyCalculation;
      }
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

/**
 * Validates manual entry data in real-time
 */
export function validateManualEntryRealTime(
  data: Partial<ManualFlightEntryData>,
  position: Position
): FormValidationResult {
  // Create a complete data object with defaults for validation
  const completeData: ManualFlightEntryData = {
    date: data.date || '',
    dutyType: data.dutyType || 'layover',
    flightNumbers: data.flightNumbers || [],
    sectors: data.sectors || [],
    reportTime: data.reportTime || '',
    debriefTime: data.debriefTime || '',
    isCrossDay: data.isCrossDay || false
  };

  return validateManualEntry(completeData, position);
}

/**
 * Gets suggested flight numbers based on partial input
 */
export function getSuggestedFlightNumbers(partial: string): string[] {
  if (!partial || partial.length < 2) {
    return [];
  }

  // Simple suggestions based on Flydubai pattern
  const suggestions: string[] = [];
  const upperPartial = partial.toUpperCase();

  if (upperPartial.startsWith('FZ')) {
    const numberPart = upperPartial.substring(2);
    if (numberPart.length > 0 && /^\d+$/.test(numberPart)) {
      // Suggest common flight numbers
      const baseNumber = parseInt(numberPart);
      for (let i = 0; i < 5; i++) {
        const suggestedNumber = baseNumber + i;
        if (suggestedNumber >= 100 && suggestedNumber <= 9999) {
          suggestions.push(`FZ${suggestedNumber}`);
        }
      }
    }
  } else if (/^\d/.test(upperPartial)) {
    // If user starts with number, suggest FZ prefix
    suggestions.push(`FZ${upperPartial}`);
  }

  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

/**
 * Gets suggested sectors based on partial input
 */
export function getSuggestedSectors(partial: string): string[] {
  if (!partial || partial.length < 2) {
    return [];
  }

  // Common Flydubai destinations
  const commonSectors = [
    'DXB-CMB', 'CMB-DXB', 'DXB-CCJ', 'CCJ-DXB',
    'DXB-COK', 'COK-DXB', 'DXB-TRV', 'TRV-DXB',
    'DXB-BOM', 'BOM-DXB', 'DXB-DEL', 'DEL-DXB',
    'DXB-KTM', 'KTM-DXB', 'DXB-DAC', 'DAC-DXB'
  ];

  const upperPartial = partial.toUpperCase();
  return commonSectors.filter(sector => 
    sector.startsWith(upperPartial)
  ).slice(0, 5);
}

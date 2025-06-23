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
  calculateDuration
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
    const reportTimeObj = parseTimeString(data.reportTime);
    const debriefTimeObj = parseTimeString(data.debriefTime);

    if (!reportTimeObj || !debriefTimeObj) {
      throw new Error('Invalid time format');
    }

    // Calculate duty hours
    const dutyHours = calculateDuration(reportTimeObj, debriefTimeObj, data.isCrossDay);

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
      reportTime: data.reportTime,
      debriefTime: data.debriefTime,
      dutyHours,
      isCrossDay: data.isCrossDay,
      dataSource: 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Classify the flight duty (this will set additional properties)
    const classifiedDuty = classifyFlightDuty(flightDuty, position);

    return classifiedDuty;
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

    // Calculate monthly totals (this will include the new flight)
    // Note: In a real implementation, you might want to fetch all flights for the month
    // For now, we'll create a basic monthly calculation
    const monthlyCalculation = calculateMonthlySalary(
      [flightDuty],
      [], // No layover rest periods for single entry
      position,
      flightDuty.month,
      flightDuty.year,
      userId
    );

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

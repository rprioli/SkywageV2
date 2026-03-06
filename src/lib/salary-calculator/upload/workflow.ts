/**
 * Upload Workflow Module
 * Main upload processing workflows for CSV and Excel files.
 *
 * Position is resolved internally from user_position_history after parsing —
 * callers no longer need to pass a position argument.
 */

import { FlightDuty } from '@/types/salary-calculator';
import {
  validateCompleteCSV,
  FlydubaiCSVParser,
  calculateMonthlySalary,
  calculateLayoverRestPeriods
} from '@/lib/salary-calculator';
import { createFlightDuties } from '@/lib/database/flights';
import {
  createLayoverRestPeriods,
  upsertMonthlyCalculation
} from '@/lib/database/calculations';
import {
  checkExistingRosterData,
  replaceRosterData,
  type ReplacementResult
} from '../roster-replacement';
import {
  ProcessingResult,
  ProgressCallback
} from './types';
import { detectFileType, validateFileQuick, readFileContent } from './validation';
import { parseFileContent } from './parsing';
import { MIN_SUPPORTED_YEAR, MAX_SUPPORTED_YEAR } from '@/lib/constants/dates';
import { getUserPositionForMonth } from '@/lib/user-position-history';

/**
 * Checks for existing roster data before processing
 */
export async function checkForExistingData(userId: string, month: number, year: number) {
  return await checkExistingRosterData(userId, month, year);
}

/**
 * Processes uploaded CSV file through complete workflow
 * @deprecated Use processFileUpload instead for unified CSV/Excel support
 */
export async function processCSVUpload(
  file: File,
  userId: string,
  onProgress?: ProgressCallback,
  dryRun: boolean = false,
  targetMonth?: number,
  targetYear?: number
): Promise<ProcessingResult> {
  const warnings: string[] = [];

  try {
    onProgress?.({ step: 'validating', progress: 10, message: 'Validating CSV file...', details: 'Checking file format and content' });

    const content = await readFileContent(file);
    const validation = await validateCompleteCSV(file, content);

    if (!validation.valid) {
      return { success: false, errors: validation.errors, warnings: validation.warnings };
    }

    warnings.push(...validation.warnings);

    onProgress?.({ step: 'parsing', progress: 30, message: 'Parsing flight duties...', details: 'Extracting flight data from CSV' });

    const parser = new FlydubaiCSVParser();
    const parseResult = parser.parseFlightDuties(content, userId);

    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        errors: parseResult.errors || ['Failed to parse CSV content'],
        warnings: [...warnings, ...(parseResult.warnings || [])]
      };
    }

    let flightDuties = parseResult.data;
    warnings.push(...(parseResult.warnings || []));

    // Determine month/year from target or parsed data
    const firstFlight = flightDuties[0];
    if (!firstFlight) {
      return { success: false, errors: ['No flight duties found in CSV'], warnings };
    }

    const month = targetMonth ?? firstFlight.month;
    const year = targetYear ?? firstFlight.year;

    if (targetMonth && targetYear) {
      flightDuties.forEach((duty) => { duty.month = month; duty.year = year; });
    }

    if (!month || !year || month < 1 || month > 12 || year < MIN_SUPPORTED_YEAR || year > MAX_SUPPORTED_YEAR) {
      return {
        success: false,
        errors: [`Invalid month/year: ${month}/${year}. Expected month 1-12 and year ${MIN_SUPPORTED_YEAR}-${MAX_SUPPORTED_YEAR}.`],
        warnings
      };
    }

    // Resolve position for this month/year from history
    onProgress?.({ step: 'calculating', progress: 40, message: 'Calculating flight payments...', details: 'Computing duty hours and flight pay' });

    const position = await getUserPositionForMonth(userId, year, month);
    const { calculateFlightDuty } = await import('../calculation-engine');

    flightDuties = flightDuties.map(duty => {
      const calculationResult = calculateFlightDuty(duty, position);
      if (calculationResult.errors.length === 0) {
        warnings.push(...calculationResult.warnings);
        return calculationResult.flightDuty;
      } else {
        warnings.push(...calculationResult.errors);
        warnings.push(...calculationResult.warnings);
        return duty;
      }
    });

    onProgress?.({ step: 'calculating', progress: 55, message: 'Calculating layover periods...', details: 'Computing rest times and per diem' });

    const layoverRestPeriods = calculateLayoverRestPeriods(flightDuties, userId, position);

    if (dryRun) {
      onProgress?.({ step: 'complete', progress: 100, message: 'Validation complete!', details: `Successfully validated ${flightDuties.length} flight duties` });
      return {
        success: true,
        monthlyCalculation: undefined,
        flightDuties,
        layoverRestPeriods,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    return await saveUploadData(flightDuties, layoverRestPeriods, userId, month, year, warnings, onProgress);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    onProgress?.({ step: 'error', progress: 0, message: 'Processing failed', details: errorMessage });
    return { success: false, errors: [errorMessage], warnings };
  }
}

/**
 * Unified file upload processor for both CSV and Excel files.
 * Position is resolved internally from user_position_history.
 */
export async function processFileUpload(
  file: File,
  userId: string,
  onProgress?: ProgressCallback,
  dryRun: boolean = false,
  targetMonth?: number,
  targetYear?: number
): Promise<ProcessingResult> {
  const warnings: string[] = [];
  const fileType = detectFileType(file);

  try {
    onProgress?.({ step: 'validating', progress: 10, message: `Validating ${fileType.toUpperCase()} file...`, details: 'Checking file format and content' });

    if (fileType === 'excel') {
      const validation = validateFileQuick(file);
      if (!validation.valid) {
        return { success: false, errors: validation.errors, warnings: validation.warnings };
      }
      warnings.push(...validation.warnings);
    } else {
      const content = await readFileContent(file);
      const validation = await validateCompleteCSV(file, content);
      if (!validation.valid) {
        return { success: false, errors: validation.errors, warnings: validation.warnings };
      }
      warnings.push(...validation.warnings);
    }

    onProgress?.({ step: 'parsing', progress: 30, message: 'Parsing flight duties...', details: `Extracting flight data from ${fileType.toUpperCase()}` });

    const parseResult = await parseFileContent(file, userId, targetMonth, targetYear);

    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        errors: parseResult.errors || [`Failed to parse ${fileType.toUpperCase()} content`],
        warnings: [...warnings, ...(parseResult.warnings || [])]
      };
    }

    let flightDuties = parseResult.data;
    const rawBoundaryDuties = parseResult.boundaryDuties || [];
    const rawNextMonthDuties = parseResult.nextMonthDuties || [];
    warnings.push(...(parseResult.warnings || []));

    // Determine month/year
    let month: number;
    let year: number;

    if (targetMonth && targetYear) {
      month = targetMonth;
      year = targetYear;
    } else if (parseResult.month && parseResult.year) {
      month = parseResult.month;
      year = parseResult.year;
    } else {
      const firstFlight = flightDuties[0];
      if (firstFlight) {
        month = firstFlight.month;
        year = firstFlight.year;
      } else {
        return {
          success: false,
          errors: ['No flight duties found in file and unable to determine month/year'],
          warnings
        };
      }
    }

    if (targetMonth && targetYear) {
      flightDuties.forEach((duty) => { duty.month = month; duty.year = year; });
    }

    if (!month || !year || month < 1 || month > 12 || year < MIN_SUPPORTED_YEAR || year > MAX_SUPPORTED_YEAR) {
      return {
        success: false,
        errors: [`Invalid month/year: ${month}/${year}. Expected month 1-12 and year ${MIN_SUPPORTED_YEAR}-${MAX_SUPPORTED_YEAR}.`],
        warnings
      };
    }

    // Resolve position for this month/year from history
    onProgress?.({ step: 'calculating', progress: 40, message: 'Calculating flight payments...', details: 'Computing duty hours and flight pay' });

    const position = await getUserPositionForMonth(userId, year, month);
    const { calculateFlightDuty } = await import('../calculation-engine');

    flightDuties = flightDuties.map(duty => {
      const calculationResult = calculateFlightDuty(duty, position);
      if (calculationResult.errors.length === 0) {
        warnings.push(...calculationResult.warnings);
        return calculationResult.flightDuty;
      } else {
        warnings.push(...calculationResult.errors);
        warnings.push(...calculationResult.warnings);
        return duty;
      }
    });

    // Calculate flight pay for boundary duties (paid in this month but from adjacent month's local date)
    const calculatedBoundaryDuties = rawBoundaryDuties.map(duty => {
      const calcResult = calculateFlightDuty(duty, position, year, month);
      return calcResult.errors.length === 0 ? calcResult.flightDuty : duty;
    });

    onProgress?.({ step: 'calculating', progress: 60, message: 'Calculating layover rest periods...', details: 'Computing rest time between flights' });

    // Include boundary and next-month duties in the pairing pool so cross-month
    // layovers (e.g., outbound Jan 31 + inbound Feb 1) can be matched
    const pairingPool = [...flightDuties, ...calculatedBoundaryDuties, ...rawNextMonthDuties];
    const layoverRestPeriods = calculateLayoverRestPeriods(pairingPool, userId, position);

    if (dryRun) {
      onProgress?.({ step: 'complete', progress: 100, message: 'Validation complete!', details: `Successfully validated ${flightDuties.length} flight duties` });
      return {
        success: true,
        monthlyCalculation: undefined,
        flightDuties,
        layoverRestPeriods,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    return await saveUploadData(
      flightDuties, layoverRestPeriods, userId, month, year, warnings, onProgress,
      calculatedBoundaryDuties.length > 0 ? calculatedBoundaryDuties : undefined,
      rawNextMonthDuties.length > 0 ? rawNextMonthDuties : undefined
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    onProgress?.({ step: 'error', progress: 0, message: 'Processing failed', details: errorMessage });
    return { success: false, errors: [errorMessage], warnings };
  }
}

/**
 * Processes CSV upload with roster replacement if needed
 * @deprecated Use processFileUploadWithReplacement instead
 */
export async function processCSVUploadWithReplacement(
  file: File,
  userId: string,
  month: number,
  year: number,
  onProgress?: ProgressCallback,
  performReplacement: boolean = false
): Promise<ProcessingResult> {
  return processFileUploadWithReplacement(file, userId, month, year, onProgress, performReplacement);
}

/**
 * Unified file upload processor with roster replacement.
 * Position is resolved internally for the target month/year.
 */
export async function processFileUploadWithReplacement(
  file: File,
  userId: string,
  month: number,
  year: number,
  onProgress?: ProgressCallback,
  performReplacement: boolean = false
): Promise<ProcessingResult> {
  let replacementResult: ReplacementResult | undefined;
  const fileType = detectFileType(file);

  try {
    if (performReplacement) {
      onProgress?.({
        step: 'validating',
        progress: 5,
        message: 'Validating new roster data...',
        details: `Processing new ${fileType.toUpperCase()} file before replacement`
      });

      // Step 1: Process new data first (dry run)
      const newDataResult = await processFileUpload(file, userId, onProgress, true, month, year);

      if (!newDataResult.success) {
        return {
          success: false,
          errors: [`Cannot replace data - new file processing failed: ${newDataResult.errors?.join(', ')}`],
          replacementPerformed: false,
          replacementResult: undefined
        };
      }

      onProgress?.({
        step: 'validating',
        progress: 50,
        message: 'Replacing existing data...',
        details: 'New data validated - removing existing flights and calculations'
      });

      replacementResult = await replaceRosterData(
        userId,
        month,
        year,
        `Roster replacement via ${fileType.toUpperCase()} upload - ${file.name}`
      );

      if (!replacementResult.success) {
        return {
          success: false,
          errors: [`Failed to replace existing data: ${replacementResult.errors.join(', ')}`],
          replacementPerformed: false,
          replacementResult
        };
      }

      onProgress?.({
        step: 'saving',
        progress: 75,
        message: 'Saving new roster data...',
        details: 'Creating new flights and calculations'
      });

      const finalResult = await processFileUpload(file, userId, onProgress, false, month, year);

      if (!finalResult.success) {
        return {
          success: false,
          errors: [`CRITICAL: Existing data was deleted but new data failed to save: ${finalResult.errors?.join(', ')}`],
          replacementPerformed: true,
          replacementResult
        };
      }

      return { ...finalResult, replacementPerformed: performReplacement, replacementResult };
    } else {
      const result = await processFileUpload(file, userId, onProgress, false, month, year);
      return { ...result, replacementPerformed: false, replacementResult: undefined };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      errors: [`Roster replacement failed with exception: ${errorMessage}`],
      replacementPerformed: false,
      replacementResult
    };
  }
}

/**
 * Internal helper to save upload data to database.
 * Position is resolved internally by recalculateMonthlyTotals.
 */
async function saveUploadData(
  flightDuties: FlightDuty[],
  layoverRestPeriods: import('@/types/salary-calculator').LayoverRestPeriod[],
  userId: string,
  month: number,
  year: number,
  warnings: string[],
  onProgress?: ProgressCallback,
  boundaryDuties?: FlightDuty[],
  nextMonthDuties?: FlightDuty[]
): Promise<ProcessingResult> {
  onProgress?.({ step: 'saving', progress: 70, message: 'Saving to database...', details: 'Storing flight duties and calculations' });

  const flightSaveResult = await createFlightDuties(flightDuties, userId);
  if (flightSaveResult.error) {
    return {
      success: false,
      errors: [`Failed to save flight duties: ${flightSaveResult.error}`],
      warnings
    };
  }

  const savedFlightDuties = flightSaveResult.data || [];

  // Save next-month inbound layover flights so the FK on layover_rest_periods is satisfied
  // for cross-month layover pairing. These are saved with their actual date/month.
  let savedNextMonthDuties: FlightDuty[] | undefined;
  if (nextMonthDuties && nextMonthDuties.length > 0) {
    // Set correct month/year from the flight's actual date
    const correctedDuties = nextMonthDuties.map(d => ({
      ...d,
      month: d.date.getUTCMonth() + 1,
      year: d.date.getUTCFullYear()
    }));
    const nextMonthSaveResult = await createFlightDuties(correctedDuties, userId);
    if (nextMonthSaveResult.error) {
      warnings.push(`Warning: Could not save next-month flights for layover pairing: ${nextMonthSaveResult.error}`);
    } else {
      savedNextMonthDuties = nextMonthSaveResult.data || undefined;
    }
  }

  // Recalculate using the engine (position resolved internally per month)
  onProgress?.({ step: 'calculating', progress: 85, message: 'Calculating monthly totals...', details: 'Computing final salary breakdown with cross-month layover pairing' });

  const { recalculateMonthlyTotals } = await import('@/lib/salary-calculator/recalculation-engine');
  const recalcResult = await recalculateMonthlyTotals(userId, month, year);

  if (!recalcResult.success) {
    return {
      success: false,
      errors: [`Failed to calculate monthly totals: ${recalcResult.errors.join(', ')}`],
      warnings: [...warnings, ...recalcResult.warnings]
    };
  }

  // Augment monthly totals with boundary duties (paid in this month but not saved as this month's duties).
  // This is a temporary augmentation — gets corrected when the adjacent month is uploaded and triggers recalculation.
  if (boundaryDuties && boundaryDuties.length > 0 && recalcResult.updatedCalculation) {
    const calc = recalcResult.updatedCalculation.monthlyCalculation;
    const extraFlightPay = boundaryDuties.reduce((sum, d) => sum + d.flightPay, 0);
    const extraDutyHours = boundaryDuties.reduce((sum, d) => sum + d.dutyHours, 0);

    calc.flightPay += extraFlightPay;
    calc.totalDutyHours += extraDutyHours;
    calc.totalVariable = calc.flightPay + calc.perDiemPay;
    calc.totalSalary = calc.totalFixed + calc.totalVariable;

    const persistResult = await upsertMonthlyCalculation(calc, userId);
    if (persistResult.error) {
      warnings.push(`Warning: Could not persist boundary duty augmentation: ${persistResult.error}`);
    } else {
      warnings.push(
        `Boundary duty augmentation: added ${extraDutyHours.toFixed(1)}h / ${extraFlightPay.toFixed(0)} AED from ${boundaryDuties.length} ${boundaryDuties.length === 1 ? 'duty' : 'duties'}`
      );
    }
  }

  // Also recalculate the previous month for cross-month layover pairing
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  if (previousYear >= MIN_SUPPORTED_YEAR) {
    const previousRecalc = await recalculateMonthlyTotals(userId, previousMonth, previousYear);
    if (!previousRecalc.success) {
      warnings.push(
        `Warning: Uploaded month calculated, but failed to update previous month (${previousMonth}/${previousYear}): ${previousRecalc.errors.join(', ')}`
      );
    }
  }

  onProgress?.({ step: 'complete', progress: 100, message: 'Processing complete!', details: `Successfully processed ${flightDuties.length} flight duties` });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dashboardDataUpdated'));
  }

  return {
    success: true,
    monthlyCalculation: recalcResult.updatedCalculation ?? undefined,
    flightDuties: savedFlightDuties,
    layoverRestPeriods: recalcResult.updatedLayovers,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

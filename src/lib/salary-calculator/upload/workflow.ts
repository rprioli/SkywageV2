/**
 * Upload Workflow Module
 * Main upload processing workflows for CSV and Excel files
 */

import {
  FlightDuty,
  Position
} from '@/types/salary-calculator';
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

/**
 * Checks for existing roster data before processing
 */
export async function checkForExistingData(
  userId: string,
  month: number,
  year: number
) {
  return await checkExistingRosterData(userId, month, year);
}

/**
 * Processes uploaded CSV file through complete workflow
 * @deprecated Use processFileUpload instead for unified CSV/Excel support
 */
export async function processCSVUpload(
  file: File,
  userId: string,
  position: Position,
  onProgress?: ProgressCallback,
  dryRun: boolean = false,
  targetMonth?: number,
  targetYear?: number
): Promise<ProcessingResult> {
  const warnings: string[] = [];

  try {
    // Step 1: File validation
    onProgress?.({
      step: 'validating',
      progress: 10,
      message: 'Validating CSV file...',
      details: 'Checking file format and content'
    });

    const content = await readFileContent(file);
    const validation = await validateCompleteCSV(file, content);
    
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    warnings.push(...validation.warnings);

    // Step 2: CSV parsing
    onProgress?.({
      step: 'parsing',
      progress: 30,
      message: 'Parsing flight duties...',
      details: 'Extracting flight data from CSV'
    });

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

    // Step 3: Calculate duty hours and flight pay
    onProgress?.({
      step: 'calculating',
      progress: 40,
      message: 'Calculating flight payments...',
      details: 'Computing duty hours and flight pay'
    });

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

    // Step 4: Calculate layover rest periods
    onProgress?.({
      step: 'calculating',
      progress: 55,
      message: 'Calculating layover periods...',
      details: 'Computing rest times and per diem'
    });

    const layoverRestPeriods = calculateLayoverRestPeriods(flightDuties, userId, position);

    // Extract month and year
    const firstFlight = flightDuties[0];
    if (!firstFlight) {
      return {
        success: false,
        errors: ['No flight duties found in CSV'],
        warnings
      };
    }

    let month: number;
    let year: number;

    if (targetMonth && targetYear) {
      month = targetMonth;
      year = targetYear;
      flightDuties.forEach((duty) => {
        duty.month = month;
        duty.year = year;
      });
    } else {
      month = firstFlight.month;
      year = firstFlight.year;
    }

    if (!month || !year || month < 1 || month > 12 || year < 2020 || year > 2100) {
      return {
        success: false,
        errors: [`Invalid month/year: ${month}/${year}. Expected month 1-12 and year 2020-2100.`],
        warnings
      };
    }

    // Step 5: Save to database (skip if dry run)
    if (dryRun) {
      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Validation complete!',
        details: `Successfully validated ${flightDuties.length} flight duties`
      });

      return {
        success: true,
        monthlyCalculation: undefined,
        flightDuties,
        layoverRestPeriods,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    return await saveUploadData(
      flightDuties,
      layoverRestPeriods,
      userId,
      position,
      month,
      year,
      warnings,
      onProgress
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    onProgress?.({
      step: 'error',
      progress: 0,
      message: 'Processing failed',
      details: errorMessage
    });

    return {
      success: false,
      errors: [errorMessage],
      warnings
    };
  }
}

/**
 * Unified file upload processor for both CSV and Excel files
 */
export async function processFileUpload(
  file: File,
  userId: string,
  position: Position,
  onProgress?: ProgressCallback,
  dryRun: boolean = false,
  targetMonth?: number,
  targetYear?: number
): Promise<ProcessingResult> {
  const warnings: string[] = [];
  const fileType = detectFileType(file);

  try {
    // Step 1: File validation
    onProgress?.({
      step: 'validating',
      progress: 10,
      message: `Validating ${fileType.toUpperCase()} file...`,
      details: 'Checking file format and content'
    });

    if (fileType === 'excel') {
      const validation = validateFileQuick(file);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }
      warnings.push(...validation.warnings);
    } else {
      const content = await readFileContent(file);
      const validation = await validateCompleteCSV(file, content);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }
      warnings.push(...validation.warnings);
    }

    // Step 2: File parsing
    onProgress?.({
      step: 'parsing',
      progress: 30,
      message: 'Parsing flight duties...',
      details: `Extracting flight data from ${fileType.toUpperCase()}`
    });

    const parseResult = await parseFileContent(file, userId, targetMonth, targetYear);

    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        errors: parseResult.errors || [`Failed to parse ${fileType.toUpperCase()} content`],
        warnings: [...warnings, ...(parseResult.warnings || [])]
      };
    }

    let flightDuties = parseResult.data;
    warnings.push(...(parseResult.warnings || []));

    // Step 3: Calculate duty hours and flight pay
    onProgress?.({
      step: 'calculating',
      progress: 40,
      message: 'Calculating flight payments...',
      details: 'Computing duty hours and flight pay'
    });

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

    // Step 4: Calculate layover rest periods
    onProgress?.({
      step: 'calculating',
      progress: 60,
      message: 'Calculating layover rest periods...',
      details: 'Computing rest time between flights'
    });

    const layoverRestPeriods = calculateLayoverRestPeriods(flightDuties, userId, position);

    // Extract month and year
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
      flightDuties.forEach((duty) => {
        duty.month = month;
        duty.year = year;
      });
    }

    if (!month || !year || month < 1 || month > 12 || year < 2020 || year > 2100) {
      return {
        success: false,
        errors: [`Invalid month/year: ${month}/${year}. Expected month 1-12 and year 2020-2100.`],
        warnings
      };
    }

    // Step 5: Save to database (skip if dry run)
    if (dryRun) {
      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Validation complete!',
        details: `Successfully validated ${flightDuties.length} flight duties`
      });

      return {
        success: true,
        monthlyCalculation: undefined,
        flightDuties,
        layoverRestPeriods,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    return await saveUploadData(
      flightDuties,
      layoverRestPeriods,
      userId,
      position,
      month,
      year,
      warnings,
      onProgress
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    onProgress?.({
      step: 'error',
      progress: 0,
      message: 'Processing failed',
      details: errorMessage
    });

    return {
      success: false,
      errors: [errorMessage],
      warnings
    };
  }
}

/**
 * Processes CSV upload with roster replacement if needed
 */
export async function processCSVUploadWithReplacement(
  file: File,
  userId: string,
  position: Position,
  month: number,
  year: number,
  onProgress?: ProgressCallback,
  performReplacement: boolean = false
): Promise<ProcessingResult> {
  return processFileUploadWithReplacement(
    file,
    userId,
    position,
    month,
    year,
    onProgress,
    performReplacement
  );
}

/**
 * Unified file upload processor with roster replacement
 */
export async function processFileUploadWithReplacement(
  file: File,
  userId: string,
  position: Position,
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
      const newDataResult = await processFileUpload(file, userId, position, onProgress, true, month, year);

      if (!newDataResult.success) {
        return {
          success: false,
          errors: [`Cannot replace data - new file processing failed: ${newDataResult.errors?.join(', ')}`],
          replacementPerformed: false,
          replacementResult: undefined
        };
      }

      // Step 2: Delete existing data
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

      // Step 3: Save new data
      onProgress?.({
        step: 'saving',
        progress: 75,
        message: 'Saving new roster data...',
        details: 'Creating new flights and calculations'
      });

      const finalResult = await processFileUpload(file, userId, position, onProgress, false, month, year);

      if (!finalResult.success) {
        return {
          success: false,
          errors: [`CRITICAL: Existing data was deleted but new data failed to save: ${finalResult.errors?.join(', ')}`],
          replacementPerformed: true,
          replacementResult
        };
      }

      return {
        ...finalResult,
        replacementPerformed: performReplacement,
        replacementResult
      };
    } else {
      const result = await processFileUpload(file, userId, position, onProgress, false, month, year);
      return {
        ...result,
        replacementPerformed: false,
        replacementResult: undefined
      };
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
 * Internal helper to save upload data to database
 */
async function saveUploadData(
  flightDuties: FlightDuty[],
  layoverRestPeriods: import('@/types/salary-calculator').LayoverRestPeriod[],
  userId: string,
  position: Position,
  month: number,
  year: number,
  warnings: string[],
  onProgress?: ProgressCallback
): Promise<ProcessingResult> {
  onProgress?.({
    step: 'saving',
    progress: 70,
    message: 'Saving to database...',
    details: 'Storing flight duties and calculations'
  });

  // Save flight duties
  const flightSaveResult = await createFlightDuties(flightDuties, userId);
  if (flightSaveResult.error) {
    return {
      success: false,
      errors: [`Failed to save flight duties: ${flightSaveResult.error}`],
      warnings
    };
  }

  const savedFlightDuties = flightSaveResult.data || [];

  // Recalculate layover rest periods with saved flight duties
  const updatedLayoverRestPeriods = calculateLayoverRestPeriods(savedFlightDuties, userId, position);

  // Save layover rest periods
  if (updatedLayoverRestPeriods.length > 0) {
    const validRestPeriods = updatedLayoverRestPeriods.filter(period =>
      period.outboundFlightId && period.inboundFlightId
    );

    if (validRestPeriods.length > 0) {
      const restSaveResult = await createLayoverRestPeriods(validRestPeriods, userId);
      if (restSaveResult.error) {
        warnings.push(`Warning: Failed to save rest periods: ${restSaveResult.error}`);
      }
    } else {
      warnings.push('Warning: No layover rest periods could be saved due to missing flight IDs');
    }
  }

  // Calculate monthly totals
  onProgress?.({
    step: 'calculating',
    progress: 85,
    message: 'Calculating monthly totals...',
    details: 'Computing final salary breakdown'
  });

  const monthlyCalculation = calculateMonthlySalary(
    savedFlightDuties,
    updatedLayoverRestPeriods,
    position,
    month,
    year,
    userId
  );

  // Save monthly calculation
  const calculationSaveResult = await upsertMonthlyCalculation(monthlyCalculation.monthlyCalculation, userId);
  if (calculationSaveResult.error) {
    return {
      success: false,
      errors: [`Failed to save monthly calculation: ${calculationSaveResult.error}`],
      warnings
    };
  }

  // Complete
  onProgress?.({
    step: 'complete',
    progress: 100,
    message: 'Processing complete!',
    details: `Successfully processed ${flightDuties.length} flight duties`
  });

  return {
    success: true,
    monthlyCalculation,
    flightDuties: savedFlightDuties,
    layoverRestPeriods: updatedLayoverRestPeriods,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}


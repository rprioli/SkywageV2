/**
 * CSV Upload Processor for Skywage Salary Calculator
 * Phase 3: Handles complete CSV upload and processing workflow
 * Following existing patterns and using Phase 1 & 2 utilities
 */

import {
  FlightDuty,
  LayoverRestPeriod,
  MonthlyCalculationResult,
  Position,
  ValidationResult
} from '@/types/salary-calculator';
import {
  validateCompleteCSV,
  FlydubaiCSVParser,
  parseFlydubaiExcelFile,
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
  type ExistingDataCheck,
  type ReplacementResult
} from './roster-replacement';

// Re-export types that are used by consumers
export type { ExistingDataCheck, ReplacementResult };

// Processing status for real-time feedback
export interface ProcessingStatus {
  step: 'validating' | 'parsing' | 'calculating' | 'saving' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  details?: string;
}

// Processing result
export interface ProcessingResult {
  success: boolean;
  monthlyCalculation?: MonthlyCalculationResult;
  flightDuties?: FlightDuty[];
  layoverRestPeriods?: LayoverRestPeriod[];
  errors?: string[];
  warnings?: string[];
  replacementPerformed?: boolean;
  replacementResult?: ReplacementResult;
}

// Progress callback type
export type ProgressCallback = (status: ProcessingStatus) => void;

// File type detection
export type FileType = 'csv' | 'excel';

// Unified parse result (compatible with both CSV and Excel)
export interface UnifiedParseResult {
  success: boolean;
  data?: FlightDuty[];
  errors?: string[];
  warnings?: string[];
  totalRows?: number;
  processedRows?: number;
  month?: number;
  year?: number;
}

/**
 * Processes uploaded CSV file through complete workflow
 * @param dryRun - If true, validates and processes data without saving to database
 * @param targetMonth - Optional user-selected month (1-12) to override CSV-detected month
 * @param targetYear - Optional user-selected year to override CSV-detected year
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

    // Step 3: Calculate duty hours and flight pay for each flight duty
    onProgress?.({
      step: 'calculating',
      progress: 40,
      message: 'Calculating flight payments...',
      details: 'Computing duty hours and flight pay'
    });

    // Import calculation functions
    const { calculateFlightDuty } = await import('./calculation-engine');

    // Calculate duty hours and flight pay for each flight duty
    flightDuties = flightDuties.map(duty => {
      const calculationResult = calculateFlightDuty(duty, position);
      if (calculationResult.errors.length === 0) {
        // Calculation successful, use the updated flight duty
        warnings.push(...calculationResult.warnings);
        return calculationResult.flightDuty;
      } else {
        // Calculation failed, add errors to warnings and return original
        console.warn('Failed to calculate flight duty:', calculationResult.errors);
        warnings.push(...calculationResult.errors);
        warnings.push(...calculationResult.warnings);
        return duty; // Return original if calculation fails
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

    // Extract month and year from first flight duty for later use
    const firstFlight = flightDuties[0];
    if (!firstFlight) {
      console.log('Upload Processor - Error: No flight duties found');
      return {
        success: false,
        errors: ['No flight duties found in CSV'],
        warnings
      };
    }

    // Use target month/year if provided, otherwise use CSV-detected values
    let month: number;
    let year: number;

    if (targetMonth && targetYear) {
      month = targetMonth;
      year = targetYear;

      // Override month/year for all flight duties (preserve original dates for display)
      flightDuties.forEach((duty) => {
        // Keep original date for display purposes, only change month/year for calculations and database organization
        duty.month = month;
        duty.year = year;
      });
    } else {
      month = firstFlight.month;
      year = firstFlight.year;
    }

    // Validate month and year before proceeding
    if (!month || !year || month < 1 || month > 12 || year < 2020 || year > 2100) {
      return {
        success: false,
        errors: [`Invalid month/year: ${month}/${year}. Expected month 1-12 and year 2020-2100.`],
        warnings
      };
    }

    // Step 5: Save to database (skip if dry run)
    if (dryRun) {
      // For dry run, just validate that we got this far successfully
      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Validation complete!',
        details: `Successfully validated ${flightDuties.length} flight duties`
      });

      return {
        success: true,
        monthlyCalculation: undefined, // Don't calculate for dry run
        flightDuties,
        layoverRestPeriods,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    onProgress?.({
      step: 'saving',
      progress: 70,
      message: 'Saving to database...',
      details: 'Storing flight duties and calculations'
    });

    // Save flight duties first to get database IDs
    const flightSaveResult = await createFlightDuties(flightDuties, userId);
    if (flightSaveResult.error) {
      return {
        success: false,
        errors: [`Failed to save flight duties: ${flightSaveResult.error}`],
        warnings
      };
    }

    // Update flight duties with database IDs for layover calculation
    const savedFlightDuties = flightSaveResult.data || [];





    // Recalculate layover rest periods with saved flight duties (which have IDs)
    const updatedLayoverRestPeriods = calculateLayoverRestPeriods(savedFlightDuties, userId, position);



    // Save layover rest periods
    if (updatedLayoverRestPeriods.length > 0) {
      // Validate that all rest periods have valid flight IDs before attempting to save
      const validRestPeriods = updatedLayoverRestPeriods.filter(period =>
        period.outboundFlightId && period.inboundFlightId
      );

      if (validRestPeriods.length > 0) {


        // Verify flight IDs exist in saved flights
        const savedFlightIds = savedFlightDuties.map(f => f.id);

        validRestPeriods.forEach((period) => {
          const outboundExists = savedFlightIds.includes(period.outboundFlightId);
          const inboundExists = savedFlightIds.includes(period.inboundFlightId);

          if (!outboundExists) {
            console.error(`Outbound flight ID not found: ${period.outboundFlightId}`);
          }
          if (!inboundExists) {
            console.error(`Inbound flight ID not found: ${period.inboundFlightId}`);
          }
        });

        const restSaveResult = await createLayoverRestPeriods(validRestPeriods, userId);
        if (restSaveResult.error) {
          warnings.push(`Warning: Failed to save rest periods: ${restSaveResult.error}`);
        }
      } else {
        warnings.push('Warning: No layover rest periods could be saved due to missing flight IDs');
      }
    }

    // Step 6: Calculate monthly totals with saved data
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

    // Step 7: Complete
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
 * Reads file content as text
 */
async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file content'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Detects file type based on extension
 */
export function detectFileType(file: File): FileType {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xlsm')) {
    return 'excel';
  } else if (fileName.endsWith('.csv')) {
    return 'csv';
  } else {
    // Default to CSV for backward compatibility
    return 'csv';
  }
}

/**
 * Unified file validation for both CSV and Excel files
 */
export function validateFileQuick(file: File): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fileType = detectFileType(file);

  // Check file type
  if (fileType === 'csv') {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      errors.push('File must be a CSV file (.csv extension)');
    }
  } else if (fileType === 'excel') {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xlsm')) {
      errors.push('File must be an Excel file (.xlsx or .xlsm extension)');
    }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`);
  }

  // Check if file is empty
  if (file.size === 0) {
    errors.push('File is empty');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}



/**
 * Unified file parsing for both CSV and Excel files
 */
export async function parseFileContent(
  file: File,
  userId: string,
  targetMonth?: number,
  targetYear?: number
): Promise<UnifiedParseResult> {
  const fileType = detectFileType(file);

  try {
    if (fileType === 'excel') {
      // Parse Excel file
      const excelResult = await parseFlydubaiExcelFile(file, targetMonth, targetYear);

      return {
        success: excelResult.success,
        data: excelResult.data as FlightDuty[] | undefined,
        errors: excelResult.errors,
        warnings: excelResult.warnings,
        totalRows: excelResult.totalRows,
        processedRows: excelResult.processedRows,
        month: excelResult.month,
        year: excelResult.year
      };
    } else {
      // Parse CSV file with target month/year for boundary filtering
      const content = await readFileContent(file);
      const parser = new FlydubaiCSVParser();
      const csvResult = parser.parseFlightDuties(content, userId, targetMonth, targetYear);

      // Extract month/year from CSV content for fallback
      const monthExtraction = parser.extractMonth(content);

      return {
        success: csvResult.success,
        data: csvResult.data,
        errors: csvResult.errors,
        warnings: csvResult.warnings,
        totalRows: csvResult.totalRows,
        processedRows: csvResult.processedRows,
        month: csvResult.month || monthExtraction?.month,
        year: csvResult.year || monthExtraction?.year
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    return {
      success: false,
      errors: [errorMessage],
      warnings: []
    };
  }
}

/**
 * Checks for existing roster data before processing
 */
export async function checkForExistingData(
  userId: string,
  month: number,
  year: number
): Promise<ExistingDataCheck> {
  return await checkExistingRosterData(userId, month, year);
}

/**
 * Processes CSV upload with roster replacement if needed
 * SAFE VERSION: Validates and processes new data BEFORE deleting existing data
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
  let replacementResult: ReplacementResult | undefined;

  try {
    if (performReplacement) {


      // CRITICAL FIX: Process new data FIRST to ensure it's valid
      onProgress?.({
        step: 'validating',
        progress: 5,
        message: 'Validating new roster data...',
        details: 'Processing new CSV file before replacement'
      });


      // Step 1: Process the new CSV data first (without saving to database yet)
      const newDataResult = await processCSVUpload(file, userId, position, onProgress, true, month, year); // dry run with target month/year

      if (!newDataResult.success) {

        return {
          success: false,
          errors: [`Cannot replace data - new CSV processing failed: ${newDataResult.errors?.join(', ')}`],
          replacementPerformed: false,
          replacementResult: undefined
        };
      }

      // Step 2: Only if new data is valid, then delete existing data
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
        `Roster replacement via CSV upload - ${file.name}`
      );

      if (!replacementResult.success) {
        return {
          success: false,
          errors: [`Failed to replace existing data: ${replacementResult.errors.join(', ')}`],
          replacementPerformed: false,
          replacementResult
        };
      }

      // Step 3: Now process and save the new data (for real this time)
      onProgress?.({
        step: 'saving',
        progress: 75,
        message: 'Saving new roster data...',
        details: 'Creating new flights and calculations'
      });

      const finalResult = await processCSVUpload(file, userId, position, onProgress, false, month, year); // real save with target month/year

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
      // Normal processing without replacement
      const result = await processCSVUpload(file, userId, position, onProgress, false, month, year);

      return {
        ...result,
        replacementPerformed: false,
        replacementResult: undefined
      };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Roster replacement failed with exception:', error);
    return {
      success: false,
      errors: [`Roster replacement failed with exception: ${errorMessage}`],
      replacementPerformed: false,
      replacementResult
    };
  }
}

/**
 * Unified file upload processor for both CSV and Excel files
 * @param dryRun - If true, validates and processes data without saving to database
 * @param targetMonth - Optional user-selected month (1-12) to override file-detected month
 * @param targetYear - Optional user-selected year to override file-detected year
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

    // Use appropriate validation based on file type
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
      // CSV validation (existing logic)
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

    // Step 3: Calculate duty hours and flight pay for each flight duty
    onProgress?.({
      step: 'calculating',
      progress: 40,
      message: 'Calculating flight payments...',
      details: 'Computing duty hours and flight pay'
    });

    // Import calculation functions
    const { calculateFlightDuty } = await import('./calculation-engine');

    // Calculate duty hours and flight pay for each flight duty
    flightDuties = flightDuties.map(duty => {
      const calculationResult = calculateFlightDuty(duty, position);
      if (calculationResult.errors.length === 0) {
        // Calculation successful, use the updated flight duty
        warnings.push(...calculationResult.warnings);
        return calculationResult.flightDuty;
      } else {
        // Calculation failed, add errors to warnings and return original
        console.warn('Failed to calculate flight duty:', calculationResult.errors);
        warnings.push(...calculationResult.errors);
        warnings.push(...calculationResult.warnings);
        return duty; // Return original if calculation fails
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

    // Extract month and year from parse result or first flight duty
    let month: number;
    let year: number;

    if (targetMonth && targetYear) {
      month = targetMonth;
      year = targetYear;
    } else if (parseResult.month && parseResult.year) {
      month = parseResult.month;
      year = parseResult.year;
    } else {
      // Fallback to first flight duty
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

    // Override month/year for all flight duties if using target values
    if (targetMonth && targetYear) {
      flightDuties.forEach((duty) => {
        // Keep original date for display purposes, only change month/year for calculations and database organization
        duty.month = month;
        duty.year = year;
      });
    }

    // Validate month and year before proceeding
    if (!month || !year || month < 1 || month > 12 || year < 2020 || year > 2100) {
      return {
        success: false,
        errors: [`Invalid month/year: ${month}/${year}. Expected month 1-12 and year 2020-2100.`],
        warnings
      };
    }

    // Step 5: Save to database (skip if dry run)
    if (dryRun) {
      // For dry run, just validate that we got this far successfully
      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Validation complete!',
        details: `Successfully validated ${flightDuties.length} flight duties`
      });

      return {
        success: true,
        monthlyCalculation: undefined, // Don't calculate for dry run
        flightDuties,
        layoverRestPeriods,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    // Continue with database saving logic (same as existing processCSVUpload)
    onProgress?.({
      step: 'saving',
      progress: 70,
      message: 'Saving to database...',
      details: 'Storing flight duties and calculations'
    });

    // Save flight duties first to get database IDs
    const flightSaveResult = await createFlightDuties(flightDuties, userId);
    if (flightSaveResult.error) {
      return {
        success: false,
        errors: [`Failed to save flight duties: ${flightSaveResult.error}`],
        warnings
      };
    }

    const savedFlightDuties = flightSaveResult.data || [];






    // Recalculate layover rest periods with saved flight duties (which have correct IDs)
    const updatedLayoverRestPeriods = calculateLayoverRestPeriods(savedFlightDuties, userId, position);





    // Save layover rest periods
    if (updatedLayoverRestPeriods.length > 0) {
      // Validate that all rest periods have valid flight IDs before attempting to save
      const validRestPeriods = updatedLayoverRestPeriods.filter(period =>
        period.outboundFlightId && period.inboundFlightId
      );

      if (validRestPeriods.length > 0) {


        // Verify flight IDs exist in saved flights
        const savedFlightIds = savedFlightDuties.map(f => f.id);

        validRestPeriods.forEach((period) => {
          const outboundExists = savedFlightIds.includes(period.outboundFlightId);
          const inboundExists = savedFlightIds.includes(period.inboundFlightId);

          if (!outboundExists) {
            console.error(`Outbound flight ID not found: ${period.outboundFlightId}`);
          }
          if (!inboundExists) {
            console.error(`Inbound flight ID not found: ${period.inboundFlightId}`);
          }
        });

        const restSaveResult = await createLayoverRestPeriods(validRestPeriods, userId);
        if (restSaveResult.error) {
          warnings.push(`Warning: Failed to save rest periods: ${restSaveResult.error}`);
        }
      } else {
        warnings.push('Warning: No layover rest periods could be saved due to missing flight IDs');
      }
    }

    // Step 6: Calculate monthly totals with saved data
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

    // Step 7: Complete
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
 * Unified file upload processor with roster replacement for both CSV and Excel files
 * SAFE VERSION: Validates and processes new data BEFORE deleting existing data
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


      // CRITICAL FIX: Process new data FIRST to ensure it's valid
      onProgress?.({
        step: 'validating',
        progress: 5,
        message: 'Validating new roster data...',
        details: `Processing new ${fileType.toUpperCase()} file before replacement`
      });


      // Step 1: Process the new file data first (without saving to database yet)
      const newDataResult = await processFileUpload(file, userId, position, onProgress, true, month, year); // dry run with target month/year

      if (!newDataResult.success) {
        return {
          success: false,
          errors: [`Cannot replace data - new ${fileType.toUpperCase()} processing failed: ${newDataResult.errors?.join(', ')}`],
          replacementPerformed: false,
          replacementResult: undefined
        };
      }

      // Step 2: Only if new data is valid, then delete existing data
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
          errors: replacementResult.errors.length > 0 ? replacementResult.errors : ['Failed to delete existing data'],
          replacementPerformed: false,
          replacementResult: undefined
        };
      }

      // Step 3: Now process and save the new data (for real this time)
      onProgress?.({
        step: 'saving',
        progress: 75,
        message: 'Saving new roster data...',
        details: 'Creating new flights and calculations'
      });

      const finalResult = await processFileUpload(file, userId, position, onProgress, false, month, year); // real save with target month/year

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
      // Normal processing without replacement
      const result = await processFileUpload(file, userId, position, onProgress, false, month, year);

      return {
        ...result,
        replacementPerformed: false,
        replacementResult: undefined
      };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Roster replacement failed with exception:', error);
    return {
      success: false,
      errors: [`Roster replacement failed with exception: ${errorMessage}`],
      replacementPerformed: false,
      replacementResult
    };
  }
}

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
  calculateMonthlySalary,
  calculateLayoverRestPeriods 
} from '@/lib/salary-calculator';
import { createFlightDuties } from '@/lib/database/flights';
import {
  createLayoverRestPeriods,
  upsertMonthlyCalculation
} from '@/lib/database/calculations';

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
}

// Progress callback type
export type ProgressCallback = (status: ProcessingStatus) => void;

/**
 * Processes uploaded CSV file through complete workflow
 */
export async function processCSVUpload(
  file: File,
  userId: string,
  position: Position,
  onProgress?: ProgressCallback
): Promise<ProcessingResult> {
  const errors: string[] = [];
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

    console.log('Upload Processor - Success condition passed, extracting flight duties...');
    let flightDuties = parseResult.data;
    console.log('Upload Processor - Flight duties extracted:', flightDuties.length, 'duties');
    warnings.push(...(parseResult.warnings || []));

    console.log('Upload Processor - About to start Step 3 - calculating flight payments...');

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

    console.log('Upload Processor - Flight duties calculated, sample:', {
      id: flightDuties[0]?.id,
      dutyHours: flightDuties[0]?.dutyHours,
      flightPay: flightDuties[0]?.flightPay
    });

    // Step 4: Calculate layover rest periods
    onProgress?.({
      step: 'calculating',
      progress: 55,
      message: 'Calculating layover periods...',
      details: 'Computing rest times and per diem'
    });

    console.log('Upload Processor - Progress update sent, starting layover calculation...');
    const layoverRestPeriods = calculateLayoverRestPeriods(flightDuties, userId, position);
    console.log('Upload Processor - Layover calculation complete:', layoverRestPeriods.length, 'periods');

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
    const month = firstFlight.month;
    const year = firstFlight.year;

    // Validate month and year before proceeding
    if (!month || !year || month < 1 || month > 12 || year < 2020 || year > 2100) {
      return {
        success: false,
        errors: [`Invalid month/year extracted from CSV: ${month}/${year}. Expected month 1-12 and year 2020-2100.`],
        warnings
      };
    }

    // Step 5: Save to database
    onProgress?.({
      step: 'saving',
      progress: 70,
      message: 'Saving to database...',
      details: 'Storing flight duties and calculations'
    });

    // Save flight duties first to get database IDs
    console.log('Upload Processor - Starting flight duties save...');
    console.log('Upload Processor - Flight duties to save:', flightDuties.length, 'duties');
    console.log('Upload Processor - Sample flight duty:', flightDuties[0]);

    const flightSaveResult = await createFlightDuties(flightDuties, userId);
    console.log('Upload Processor - Flight duties save result:', flightSaveResult);
    if (flightSaveResult.error) {
      console.log('Upload Processor - Flight duties save failed:', flightSaveResult.error);
      return {
        success: false,
        errors: [`Failed to save flight duties: ${flightSaveResult.error}`],
        warnings
      };
    }

    // Update flight duties with database IDs for layover calculation
    const savedFlightDuties = flightSaveResult.data || [];

    // Recalculate layover rest periods with saved flight duties (which have IDs)
    console.log('Upload Processor - Recalculating layover periods with saved flight IDs...');
    const updatedLayoverRestPeriods = calculateLayoverRestPeriods(savedFlightDuties, userId, position);
    console.log('Upload Processor - Updated layover calculation complete:', updatedLayoverRestPeriods.length, 'periods');

    // Save layover rest periods
    if (updatedLayoverRestPeriods.length > 0) {
      console.log('Upload Processor - Starting rest periods save...');
      const restSaveResult = await createLayoverRestPeriods(updatedLayoverRestPeriods, userId);
      console.log('Upload Processor - Rest periods save result:', restSaveResult);
      if (restSaveResult.error) {
        console.log('Upload Processor - Rest periods save failed:', restSaveResult.error);
        warnings.push(`Warning: Failed to save rest periods: ${restSaveResult.error}`);
      }
    }

    // Step 6: Calculate monthly totals with saved data
    onProgress?.({
      step: 'calculating',
      progress: 85,
      message: 'Calculating monthly totals...',
      details: 'Computing final salary breakdown'
    });

    console.log('Upload Processor - Starting monthly calculation for:', month, year);
    const monthlyCalculation = calculateMonthlySalary(
      savedFlightDuties,
      updatedLayoverRestPeriods,
      position,
      month,
      year,
      userId
    );
    console.log('Upload Processor - Monthly calculation complete:', monthlyCalculation);

    // Save monthly calculation
    console.log('Upload Processor - Starting monthly calculation save...');
    const calculationSaveResult = await upsertMonthlyCalculation(monthlyCalculation.monthlyCalculation, userId);
    console.log('Upload Processor - Monthly calculation save result:', calculationSaveResult);
    if (calculationSaveResult.error) {
      console.log('Upload Processor - Monthly calculation save failed:', calculationSaveResult.error);
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
 * Validates CSV file before processing
 */
export function validateCSVFileQuick(file: File): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  if (!file.name.toLowerCase().endsWith('.csv')) {
    errors.push('File must be a CSV file (.csv extension)');
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

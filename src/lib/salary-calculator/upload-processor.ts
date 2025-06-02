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

    if (!parseResult.success || !parseResult.flightDuties) {
      return {
        success: false,
        errors: parseResult.errors || ['Failed to parse CSV content'],
        warnings: [...warnings, ...(parseResult.warnings || [])]
      };
    }

    const flightDuties = parseResult.flightDuties;
    warnings.push(...(parseResult.warnings || []));

    // Step 3: Calculate layover rest periods
    onProgress?.({
      step: 'calculating',
      progress: 50,
      message: 'Calculating salary components...',
      details: 'Processing layovers and rest periods'
    });

    const layoverRestPeriods = calculateLayoverRestPeriods(flightDuties);

    // Step 4: Calculate monthly totals
    onProgress?.({
      step: 'calculating',
      progress: 70,
      message: 'Calculating monthly totals...',
      details: 'Computing final salary breakdown'
    });

    // Extract month and year from first flight duty
    const firstFlight = flightDuties[0];
    if (!firstFlight) {
      return {
        success: false,
        errors: ['No flight duties found in CSV'],
        warnings
      };
    }

    const monthlyCalculation = calculateMonthlySalary(
      flightDuties,
      layoverRestPeriods,
      position,
      firstFlight.month,
      firstFlight.year,
      userId
    );

    // Step 5: Save to database
    onProgress?.({
      step: 'saving',
      progress: 85,
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

    // Save layover rest periods
    if (layoverRestPeriods.length > 0) {
      const restSaveResult = await createLayoverRestPeriods(layoverRestPeriods, userId);
      if (restSaveResult.error) {
        warnings.push(`Warning: Failed to save rest periods: ${restSaveResult.error}`);
      }
    }

    // Save monthly calculation
    const calculationSaveResult = await upsertMonthlyCalculation(monthlyCalculation.calculation, userId);
    if (calculationSaveResult.error) {
      return {
        success: false,
        errors: [`Failed to save monthly calculation: ${calculationSaveResult.error}`],
        warnings
      };
    }

    // Step 6: Complete
    onProgress?.({
      step: 'complete',
      progress: 100,
      message: 'Processing complete!',
      details: `Successfully processed ${flightDuties.length} flight duties`
    });

    return {
      success: true,
      monthlyCalculation,
      flightDuties,
      layoverRestPeriods,
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

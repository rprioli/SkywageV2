/**
 * CSV validation utilities for Skywage Salary Calculator
 * Validates CSV files according to airline-specific rules
 * Following existing validation patterns in the codebase
 */

import { ValidationResult } from '@/types/salary-calculator';

/**
 * Validates basic CSV file structure
 */
export function validateCSVFile(file: File): ValidationResult {
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

/**
 * Validates CSV content structure
 */
export function validateCSVContent(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push('CSV content is empty');
    return { valid: false, errors, warnings };
  }

  // Split into lines
  const lines = content.split('\n').map(line => line.trim());
  
  if (lines.length < 5) {
    errors.push('CSV file must have at least 5 lines (header + data)');
  }

  // Check for minimum required columns
  const firstLine = lines[0];
  if (!firstLine) {
    errors.push('CSV file has no header row');
  } else {
    const columns = firstLine.split(',').length;
    if (columns < 5) {
      warnings.push(`CSV has only ${columns} columns, expected at least 5 (Date, Duties, Details, Report, Debrief)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates Flydubai-specific CSV format
 */
export function validateFlydubaiCSV(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = content.split('\n').map(line => line.trim());
  
  // Check A1 cell (first cell) contains "flydubai"
  if (lines.length > 0) {
    const firstCell = lines[0].split(',')[0]?.toLowerCase().trim();
    if (!firstCell?.includes('flydubai')) {
      errors.push('A1 cell must contain "flydubai" to validate as Flydubai roster');
    }
  }

  // Check C2 cell (third cell of second row) for month information
  if (lines.length > 1) {
    const secondRow = lines[1].split(',');
    if (secondRow.length < 3) {
      warnings.push('C2 cell not found - month extraction may fail');
    } else {
      const c2Cell = secondRow[2]?.trim();
      if (!c2Cell) {
        warnings.push('C2 cell is empty - month extraction may fail');
      }
    }
  }

  // Look for data section (typically starts around row 5)
  let dataStartFound = false;
  for (let i = 4; i < Math.min(lines.length, 10); i++) {
    const row = lines[i].split(',');
    if (row.length >= 5) {
      // Check if this looks like a data row
      const dateCell = row[0]?.trim();
      if (dateCell && /\d/.test(dateCell)) {
        dataStartFound = true;
        break;
      }
    }
  }

  if (!dataStartFound) {
    warnings.push('Could not locate data section in CSV - parsing may fail');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates individual CSV row data
 */
export function validateCSVRow(
  row: string[],
  rowIndex: number,
  expectedColumns: number = 5
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Convert column count mismatch to warning instead of error to be more lenient
  if (row.length < expectedColumns) {
    warnings.push(`Row ${rowIndex + 1}: Expected at least ${expectedColumns} columns, found ${row.length}`);
  }

  // Check for completely empty rows
  if (row.every(cell => !cell || cell.trim() === '')) {
    warnings.push(`Row ${rowIndex + 1}: Row is completely empty`);
  }

  // Validate date format in first column (if present)
  const dateCell = row[0]?.trim();
  if (dateCell && dateCell !== '') {
    // Updated regex to handle dates with day names like "03/04/2025 Thu"
    const dateWithDayPattern = /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i;
    const basicDatePattern = /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/;

    if (!dateWithDayPattern.test(dateCell) && !basicDatePattern.test(dateCell)) {
      warnings.push(`Row ${rowIndex + 1}: Date format "${dateCell}" may not be recognized`);
    }
  }

  // Validate time formats in report/debrief columns (columns 4 and 5)
  // Updated regex to handle special characters like ♦, ?♦, ¹, ?¹, �, ?�, etc.
  const timeFormatRegex = /^\d{1,2}:\d{2}(\?[¹²³⁴⁵⁶⁷⁸⁹♦◆�]|[¹²³⁴⁵⁶⁷⁸⁹♦◆�])*$/;

  if (row.length >= 4) {
    const reportTime = row[3]?.trim();
    if (reportTime && reportTime !== '' && !timeFormatRegex.test(reportTime)) {
      warnings.push(`Row ${rowIndex + 1}: Report time format "${reportTime}" may not be recognized`);
    }
  }

  if (row.length >= 5) {
    const debriefTime = row[4]?.trim();
    if (debriefTime && debriefTime !== '' && !timeFormatRegex.test(debriefTime)) {
      warnings.push(`Row ${rowIndex + 1}: Debrief time format "${debriefTime}" may not be recognized`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates flight number format
 */
export function validateFlightNumbers(duties: string, rowIndex: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!duties || duties.trim() === '') {
    return { valid: true, errors, warnings }; // Empty is valid (might be off day)
  }

  // Extract potential flight numbers
  // Supports 1-4 digit flight numbers to handle short Flydubai flights (e.g., FZ43, FZ59)
  const flightPattern = /\b[A-Z]{2}\d{1,4}\b/g;
  const matches = duties.match(flightPattern);

  if (matches) {
    for (const flightNumber of matches) {
      // Validate Flydubai flight numbers (FZ prefix)
      if (!flightNumber.startsWith('FZ')) {
        warnings.push(`Row ${rowIndex + 1}: Flight number "${flightNumber}" is not a Flydubai flight (FZ prefix expected)`);
      }
    }
  } else {
    // Check for special duty types and non-duty entries
    const dutiesUpper = String(duties || '').toUpperCase();
    const isNonDutyEntry =
      dutiesUpper.includes('ASBY') ||
      dutiesUpper.includes('SBY') ||
      dutiesUpper.includes('OFF') ||
      dutiesUpper.includes('DAY OFF') ||
      dutiesUpper.includes('REST DAY') ||
      dutiesUpper.includes('ADDITIONAL DAY OFF') ||
      dutiesUpper === 'X';

    if (!isNonDutyEntry) {
      warnings.push(`Row ${rowIndex + 1}: No valid flight numbers or duty types found in "${duties}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates sector format
 */
export function validateSectors(details: string, rowIndex: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!details || details.trim() === '') {
    return { valid: true, errors, warnings }; // Empty is valid for non-flight duties
  }

  // Check if this is a non-duty entry that shouldn't have sectors
  const detailsUpper = details.toUpperCase().trim();
  const isNonDutyEntry =
    detailsUpper.includes('DAY OFF') ||
    detailsUpper.includes('REST DAY') ||
    detailsUpper.includes('ADDITIONAL DAY OFF') ||
    detailsUpper.includes('OFF') ||
    detailsUpper === 'X';

  // Skip sector validation for non-duty entries
  if (isNonDutyEntry) {
    return { valid: true, errors, warnings };
  }

  // Extract potential sectors
  const sectorPattern = /\b[A-Z]{3}\s*-\s*[A-Z]{3}\b/g;
  const matches = details.match(sectorPattern);

  if (!matches || matches.length === 0) {
    warnings.push(`Row ${rowIndex + 1}: No valid sectors found in "${details}"`);
  } else {
    for (const sector of matches) {
      const airports = sector.split('-').map(airport => airport.trim());
      for (const airport of airports) {
        if (airport.length !== 3) {
          warnings.push(`Row ${rowIndex + 1}: Airport code "${airport}" should be 3 characters`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Comprehensive CSV validation combining all checks
 */
export function validateCompleteCSV(file: File, content: string): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // File validation
    const fileValidation = validateCSVFile(file);
    allErrors.push(...fileValidation.errors);
    allWarnings.push(...fileValidation.warnings);

    // Content validation
    const contentValidation = validateCSVContent(content);
    allErrors.push(...contentValidation.errors);
    allWarnings.push(...contentValidation.warnings);

    // Flydubai-specific validation
    const flydubaiValidation = validateFlydubaiCSV(content);
    allErrors.push(...flydubaiValidation.errors);
    allWarnings.push(...flydubaiValidation.warnings);

    resolve({
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    });
  });
}

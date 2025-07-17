/**
 * Excel Validator for Flydubai Roster Files
 * Enhanced validation with specific error reporting
 * Optimized for small files (<25KB typical size)
 */

import * as XLSX from 'xlsx';
import {
  ExcelValidationResult,
  ExcelParsingConfig,
  ExcelErrorType,
  ExcelError,
  DEFAULT_EXCEL_CONFIG
} from '@/types/excel-config';
import {
  getCellValue,
  parseExcelDateRange,
  parseEmployeeInfo,
  createExcelError,
  hasWorksheetData
} from './excel-parser';

/**
 * Comprehensive Excel file validation
 */
export function validateExcelFileComprehensive(
  file: File,
  config: ExcelParsingConfig = DEFAULT_EXCEL_CONFIG
): ExcelValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic file validation
  const basicValidation = validateBasicFile(file, config);
  errors.push(...basicValidation.errors);
  warnings.push(...basicValidation.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fileInfo: basicValidation.fileInfo
  };
}

/**
 * Validate Excel content structure and data integrity
 */
export function validateExcelStructure(
  worksheet: XLSX.WorkSheet,
  config: ExcelParsingConfig = DEFAULT_EXCEL_CONFIG
): ExcelValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check if worksheet has any data
    if (!hasWorksheetData(worksheet)) {
      errors.push('Excel worksheet appears to be empty');
      return { valid: false, errors, warnings };
    }

    // Validate Flydubai-specific structure
    const flydubaiValidation = validateFlydubaiStructure(worksheet, config);
    errors.push(...flydubaiValidation.errors);
    warnings.push(...flydubaiValidation.warnings);

    // Validate data integrity
    const dataValidation = validateDataIntegrity(worksheet, config);
    errors.push(...dataValidation.errors);
    warnings.push(...dataValidation.warnings);

    // Validate sample data rows
    const sampleValidation = validateSampleDataRows(worksheet, config);
    warnings.push(...sampleValidation.warnings);
    // Don't add sample validation errors to main errors (they're warnings)

  } catch (error) {
    errors.push(`Structure validation failed: ${(error as Error).message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Basic file validation (size, format, etc.)
 */
function validateBasicFile(
  file: File,
  config: ExcelParsingConfig
): ExcelValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file extension
  const fileName = file.name.toLowerCase();
  const isValidFormat = config.supportedFormats.some(format => 
    fileName.endsWith(`.${format}`)
  );

  if (!isValidFormat) {
    errors.push(`File must be one of: ${config.supportedFormats.map(f => `.${f}`).join(', ')}`);
  }

  // Check file size
  if (file.size > config.maxFileSize) {
    errors.push(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(config.maxFileSize / 1024 / 1024).toFixed(2)}MB)`
    );
  }

  // Check if file is empty
  if (file.size === 0) {
    errors.push('File is empty');
  }

  // Warn about very small files (might be corrupted)
  if (file.size < 1024) { // Less than 1KB
    warnings.push('File is very small and might be corrupted or incomplete');
  }

  // Warn about very large files (unusual for roster files)
  if (file.size > 100 * 1024) { // More than 100KB
    warnings.push('File is larger than typical roster files (>100KB)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fileInfo: {
      format: fileName.endsWith('.xlsm') ? 'xlsm' : 'xlsx',
      size: file.size,
      sheetCount: 0, // Will be determined after reading
      hasData: file.size > 0
    }
  };
}

/**
 * Validate Flydubai-specific structure
 */
function validateFlydubaiStructure(
  worksheet: XLSX.WorkSheet,
  config: ExcelParsingConfig
): ExcelValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check A1 cell contains "flydubai"
  const airlineCell = getCellValue(worksheet, config.airlineValidationCell);
  if (!airlineCell.value) {
    errors.push(`Cell ${config.airlineValidationCell} is empty - cannot validate as Flydubai roster`);
  } else if (!airlineCell.value.toString().toLowerCase().includes('flydubai')) {
    errors.push(`Cell ${config.airlineValidationCell} must contain "flydubai" to validate as Flydubai roster`);
  }

  // Check for date range in G4
  const dateRangeCell = getCellValue(worksheet, config.dateRangeCell);
  if (!dateRangeCell.value) {
    warnings.push(`No date range found in cell ${config.dateRangeCell}`);
  } else {
    try {
      parseExcelDateRange(dateRangeCell.value.toString());
    } catch (error) {
      warnings.push(`Invalid date range format in cell ${config.dateRangeCell}: ${(error as Error).message}`);
    }
  }

  // Check for employee info in A6
  const employeeCell = getCellValue(worksheet, config.employeeInfoCell);
  if (!employeeCell.value) {
    warnings.push(`No employee information found in cell ${config.employeeInfoCell}`);
  } else {
    try {
      parseEmployeeInfo(employeeCell.value.toString());
    } catch (error) {
      warnings.push(`Invalid employee info format in cell ${config.employeeInfoCell}: ${(error as Error).message}`);
    }
  }

  // Check for schedule header
  const scheduleHeaderCell = getCellValue(worksheet, `A${config.scheduleHeaderRow}`);
  if (!scheduleHeaderCell.value || !scheduleHeaderCell.value.toString().includes('Schedule Details')) {
    warnings.push(`Expected "Schedule Details" header in row ${config.scheduleHeaderRow}`);
  }

  // Check for column headers
  const dateHeaderCell = getCellValue(worksheet, `A${config.columnHeaderRow}`);
  if (!dateHeaderCell.value || !dateHeaderCell.value.toString().toLowerCase().includes('date')) {
    warnings.push(`Expected date column header in cell A${config.columnHeaderRow}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate data integrity in key cells
 */
function validateDataIntegrity(
  worksheet: XLSX.WorkSheet,
  config: ExcelParsingConfig
): ExcelValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if there's any data in the expected data area
  let hasAnyData = false;
  const sampleRows = [config.dataStartRow, config.dataStartRow + 1, config.dataStartRow + 2];

  for (const row of sampleRows) {
    const dateCell = getCellValue(worksheet, `A${row}`);
    const dutiesCell = getCellValue(worksheet, `C${row}`);
    
    if (dateCell.value || dutiesCell.value) {
      hasAnyData = true;
      break;
    }
  }

  if (!hasAnyData) {
    warnings.push(`No data found in expected data area starting from row ${config.dataStartRow}`);
  }

  // Check for common data patterns
  let validDataRowCount = 0;
  for (let row = config.dataStartRow; row < config.dataStartRow + 10; row++) {
    const dateCell = getCellValue(worksheet, `A${row}`);
    
    if (dateCell.value) {
      const dateStr = dateCell.value.toString();
      
      // Check if it looks like a date
      if (dateStr.match(/\d{2}\/\d{2}\/\d{4}/)) {
        validDataRowCount++;
      }
    }
  }

  if (validDataRowCount === 0) {
    warnings.push('No valid date entries found in the first 10 data rows');
  } else if (validDataRowCount < 3) {
    warnings.push(`Only ${validDataRowCount} valid date entries found in the first 10 data rows`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate sample data rows for common issues
 */
function validateSampleDataRows(
  worksheet: XLSX.WorkSheet,
  config: ExcelParsingConfig
): ExcelValidationResult {
  const warnings: string[] = [];

  // Check first few data rows for common issues
  for (let row = config.dataStartRow; row < config.dataStartRow + 5; row++) {
    const dateCell = getCellValue(worksheet, `A${row}`);
    const dutiesCell = getCellValue(worksheet, `C${row}`);
    const reportTimeCell = getCellValue(worksheet, `L${row}`);
    const debriefTimeCell = getCellValue(worksheet, `Q${row}`);

    if (dateCell.value) {
      const dateStr = String(dateCell.value);
      
      // Check date format
      if (!dateStr.match(/\d{2}\/\d{2}\/\d{4}/)) {
        warnings.push(`Row ${row}: Date format may be invalid - "${dateStr}"`);
      }

      // Check for duties
      if (!dutiesCell.value) {
        warnings.push(`Row ${row}: No duties found for date "${dateStr}"`);
      }

      // Check for times when duties are present
      if (dutiesCell.value && String(dutiesCell.value).trim()) {
        const dutiesStr = String(dutiesCell.value).toUpperCase();
        
        // If it's a flight duty, should have times
        if (!dutiesStr.includes('OFF') && !dutiesStr.includes('SBY')) {
          if (!reportTimeCell.value) {
            warnings.push(`Row ${row}: Missing report time for duty "${dutiesStr}"`);
          }
          if (!debriefTimeCell.value) {
            warnings.push(`Row ${row}: Missing debrief time for duty "${dutiesStr}"`);
          }
        }
      }
    }
  }

  return {
    valid: true, // Sample validation only produces warnings
    errors: [],
    warnings
  };
}

/**
 * Create detailed validation error
 */
export function createValidationError(
  type: ExcelErrorType,
  message: string,
  cellReference?: string,
  rowNumber?: number
): ExcelError {
  return createExcelError(type, message, cellReference, rowNumber);
}

/**
 * Validate specific cell content
 */
export function validateCellContent(
  worksheet: XLSX.WorkSheet,
  cellAddress: string,
  expectedPattern?: RegExp,
  required: boolean = false
): { valid: boolean; error?: string; warning?: string } {
  const cell = getCellValue(worksheet, cellAddress);
  
  if (!cell.value) {
    if (required) {
      return { valid: false, error: `Cell ${cellAddress} is required but empty` };
    } else {
      return { valid: true, warning: `Cell ${cellAddress} is empty` };
    }
  }

  if (expectedPattern && !expectedPattern.test(String(cell.value))) {
    return { 
      valid: false, 
      error: `Cell ${cellAddress} content "${cell.value}" does not match expected pattern` 
    };
  }

  return { valid: true };
}

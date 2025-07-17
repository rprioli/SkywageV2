/**
 * Excel Parser Utilities for Skywage Salary Calculator
 * Basic Excel file reading and cell extraction utilities
 * Following existing patterns from csv-parser.ts
 */

import * as XLSX from 'xlsx';
import {
  ExcelParsingConfig,
  ExcelValidationResult,
  ExcelCellReference,
  ExcelTimeParseResult,
  ExcelDateRangeResult,
  ExcelEmployeeInfo,
  ExcelErrorType,
  ExcelError,
  DEFAULT_EXCEL_CONFIG,
  FlexibleExcelStructure
} from '@/types/excel-config';
import { Position } from '@/types/salary-calculator';

/**
 * Reads Excel file and returns workbook
 */
export function readExcelFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook);
      } catch (error) {
        reject(new Error(`Failed to read Excel file: ${(error as Error).message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Gets the first worksheet from workbook
 */
export function getFirstWorksheet(workbook: XLSX.WorkBook): XLSX.WorkSheet {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('No worksheets found in Excel file');
  }
  
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Worksheet "${sheetName}" not found`);
  }
  
  return worksheet;
}

/**
 * Gets cell value with error handling
 */
export function getCellValue(
  worksheet: XLSX.WorkSheet, 
  cellAddress: string
): ExcelCellReference {
  try {
    const cell = worksheet[cellAddress];
    
    return {
      address: cellAddress,
      value: cell?.v || null,
      formattedValue: cell?.w || null,
      type: cell?.t || 'string'
    };
  } catch {
    return {
      address: cellAddress,
      value: null,
      formattedValue: null,
      type: 'string'
    };
  }
}

/**
 * Validates Excel file format and basic structure
 */
export function validateExcelFile(
  file: File, 
  config: ExcelParsingConfig = DEFAULT_EXCEL_CONFIG
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
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(config.maxFileSize / 1024 / 1024).toFixed(2)}MB)`);
  }
  
  // Check if file is empty
  if (file.size === 0) {
    errors.push('File is empty');
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
 * Validates Excel content structure (Flydubai-specific)
 */
export function validateExcelContent(
  worksheet: XLSX.WorkSheet,
  config: ExcelParsingConfig = DEFAULT_EXCEL_CONFIG
): ExcelValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Check A1 cell contains "flydubai"
    const airlineCell = getCellValue(worksheet, config.airlineValidationCell);
    if (!airlineCell.value || !airlineCell.value.toString().toLowerCase().includes('flydubai')) {
      errors.push(`Cell ${config.airlineValidationCell} must contain "flydubai" to validate as Flydubai roster`);
    }
    
    // Check for date range in G4
    const dateRangeCell = getCellValue(worksheet, config.dateRangeCell);
    if (!dateRangeCell.value) {
      warnings.push(`No date range found in cell ${config.dateRangeCell}`);
    }
    
    // Check for employee info in A6
    const employeeCell = getCellValue(worksheet, config.employeeInfoCell);
    if (!employeeCell.value) {
      warnings.push(`No employee information found in cell ${config.employeeInfoCell}`);
    }
    
    // Check for schedule header
    const scheduleHeaderCell = getCellValue(worksheet, `A${config.scheduleHeaderRow}`);
    if (!scheduleHeaderCell.value || !scheduleHeaderCell.value.toString().includes('Schedule Details')) {
      warnings.push(`Expected "Schedule Details" header in row ${config.scheduleHeaderRow}`);
    }
    
  } catch (error) {
    errors.push(`Content validation failed: ${(error as Error).message}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Parses time string with cross-day indicator detection
 */
export function parseExcelTime(timeString: string): ExcelTimeParseResult {
  if (!timeString || typeof timeString !== 'string') {
    throw new Error('Invalid time string provided');
  }
  
  const trimmed = timeString.trim();
  
  // Check for cross-day indicator (⁺¹)
  const isCrossDay = trimmed.includes('⁺¹');
  
  // Remove cross-day indicator and extract time
  const cleanTime = trimmed.replace('⁺¹', '').trim();
  
  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(cleanTime)) {
    throw new Error(`Invalid time format: "${cleanTime}". Expected HH:MM format.`);
  }
  
  return {
    time: cleanTime,
    isCrossDay,
    originalValue: timeString
  };
}

/**
 * Parses training time ranges like "08:00 - 16:00" or multi-line ranges
 */
export function parseTrainingTimeRange(timeRangeString: string): {
  startTime: string;
  endTime: string;
  totalHours: number;
  sessions: Array<{ start: string; end: string; hours: number }>;
} {
  if (!timeRangeString || typeof timeRangeString !== 'string') {
    throw new Error('Invalid time range string provided');
  }

  const trimmed = timeRangeString.trim();
  console.log(`🔍 parseTrainingTimeRange input: "${trimmed}"`);

  const sessions: Array<{ start: string; end: string; hours: number }> = [];
  let totalHours = 0;

  // Handle multi-line time ranges (separated by \n, \r\n, or \r)
  const lines = trimmed.split(/[\r\n]+/).map(line => line.trim()).filter(line => line.length > 0);
  console.log(`🔍 Split into ${lines.length} lines:`, lines);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`🔍 Processing line ${i + 1}: "${line}"`);

    // Match time range pattern: "HH:MM - HH:MM"
    const timeRangeRegex = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/;
    const match = line.match(timeRangeRegex);

    if (match) {
      const startTime = match[1];
      const endTime = match[2];
      console.log(`✅ Found time range: ${startTime} - ${endTime}`);

      // Calculate hours for this session
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // Handle cross-day scenarios (end time is next day)
      const sessionMinutes = endMinutes >= startMinutes ?
        endMinutes - startMinutes :
        (24 * 60) - startMinutes + endMinutes;

      const sessionHours = sessionMinutes / 60;

      sessions.push({
        start: startTime,
        end: endTime,
        hours: sessionHours
      });

      totalHours += sessionHours;
      console.log(`✅ Session added: ${startTime} - ${endTime} (${sessionHours} hours)`);
    } else {
      console.log(`⚠️ No time range found in line: "${line}"`);
    }
  }

  if (sessions.length === 0) {
    throw new Error(`No valid time ranges found in: "${timeRangeString}". Lines processed: ${lines.length}`);
  }

  const result = {
    startTime: sessions[0].start,
    endTime: sessions[sessions.length - 1].end,
    totalHours,
    sessions
  };

  console.log(`✅ parseTrainingTimeRange result:`, result);
  return result;
}

/**
 * Extracts date range from G4 cell
 */
export function parseExcelDateRange(dateRangeString: string): ExcelDateRangeResult {
  if (!dateRangeString || typeof dateRangeString !== 'string') {
    throw new Error('Invalid date range string provided');
  }
  
  // Expected format: "01/07/2025 - 31/07/2025 (All times in Local Base)"
  const dateRangeRegex = /(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/;
  const match = dateRangeString.match(dateRangeRegex);
  
  if (!match) {
    throw new Error(`Invalid date range format: "${dateRangeString}". Expected DD/MM/YYYY - DD/MM/YYYY format.`);
  }
  
  const [, startDateStr, endDateStr] = match;
  
  // Parse dates (DD/MM/YYYY format)
  const parseDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day); // month is 0-based in Date constructor
  };
  
  const startDate = parseDate(startDateStr);
  const endDate = parseDate(endDateStr);
  
  return {
    startDate,
    endDate,
    month: startDate.getMonth() + 1, // Convert to 1-based month
    year: startDate.getFullYear(),
    originalValue: dateRangeString
  };
}

/**
 * Extracts employee information from A6 cell
 */
export function parseEmployeeInfo(employeeInfoString: string): ExcelEmployeeInfo {
  if (!employeeInfoString || typeof employeeInfoString !== 'string') {
    throw new Error('Invalid employee info string provided');
  }
  
  // Expected format: "7818 TEIXEIRA RAFAEL DXB,CM,73H"
  const parts = employeeInfoString.trim().split(' ');
  
  if (parts.length < 3) {
    throw new Error(`Invalid employee info format: "${employeeInfoString}"`);
  }
  
  const employeeId = parts[0];
  const lastName = parts[1];
  const firstName = parts[2];
  const name = `${firstName} ${lastName}`;
  
  // Extract base, position, and aircraft from the last part
  const lastPart = parts.slice(3).join(' ');
  const detailsRegex = /([A-Z]{3}),([A-Z]+),([A-Z0-9]+)/;
  const detailsMatch = lastPart.match(detailsRegex);
  
  if (!detailsMatch) {
    throw new Error(`Could not parse employee details from: "${lastPart}"`);
  }
  
  const [, base, positionCode, aircraftType] = detailsMatch;
  
  // Convert position code to Position type
  let position: Position;
  switch (positionCode) {
    case 'CM':
      position = 'CCM';
      break;
    case 'SCM':
    case 'SCCM':
      position = 'SCCM';
      break;
    default:
      throw new Error(`Unknown position code: "${positionCode}"`);
  }
  
  return {
    employeeId,
    name,
    base,
    position,
    aircraftType,
    rawInfo: employeeInfoString
  };
}

/**
 * Creates Excel error with context
 */
export function createExcelError(
  type: ExcelErrorType,
  message: string,
  cellReference?: string,
  rowNumber?: number,
  originalError?: Error
): ExcelError {
  return {
    type,
    message,
    cellReference,
    rowNumber,
    originalError
  };
}

// ============================================================================
// FLEXIBLE EXCEL PARSER FUNCTIONS (Anchor-based approach)
// ============================================================================



/**
 * Scans column A to find "flydubai" validation text
 */
export function findFlydubaiValidation(worksheet: XLSX.WorkSheet): number | null {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A100');

  for (let row = range.s.r; row <= Math.min(range.e.r, 20); row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 }); // Column A
    const cell = worksheet[cellAddress];

    if (cell && cell.v) {
      const cellValue = String(cell.v || '').toLowerCase();
      if (cellValue.includes('flydubai')) {
        return row + 1; // Convert to 1-based row number
      }
    }
  }

  return null;
}

/**
 * Searches for "Schedule Details" text to locate header section
 */
export function findScheduleDetailsRow(worksheet: XLSX.WorkSheet): number | null {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');

  // Search in first 30 rows across all columns
  for (let row = range.s.r; row <= Math.min(range.e.r, 30); row++) {
    for (let col = range.s.c; col <= Math.min(range.e.c, 25); col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];

      if (cell && cell.v) {
        const cellValue = String(cell.v || '').toLowerCase();
        if (cellValue.includes('schedule details')) {
          return row + 1; // Convert to 1-based row number
        }
      }
    }
  }

  return null;
}

/**
 * Maps column headers dynamically based on header names
 */
export function mapColumnHeaders(
  worksheet: XLSX.WorkSheet,
  headerRow: number
): { [key: string]: string } | null {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
  const columnMapping: { [key: string]: string } = {};

  // Convert to 0-based row index
  const rowIndex = headerRow - 1;

  if (rowIndex > range.e.r) {
    return null;
  }

  // Scan across columns in the header row
  for (let col = range.s.c; col <= Math.min(range.e.c, 25); col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col });
    const cell = worksheet[cellAddress];

    if (cell && cell.v) {
      const headerValue = String(cell.v || '').toLowerCase().trim();
      const columnLetter = XLSX.utils.encode_col(col);

      // Map common header patterns
      if (headerValue.includes('date')) {
        columnMapping.date = columnLetter;
      } else if (headerValue.includes('duties')) {
        columnMapping.duties = columnLetter;
      } else if (headerValue.includes('details')) {
        columnMapping.details = columnLetter;
      } else if (headerValue.includes('report') && headerValue.includes('time')) {
        columnMapping.reportTime = columnLetter;
      } else if (headerValue.includes('debrief') && headerValue.includes('time')) {
        columnMapping.debriefTime = columnLetter;
      } else if (headerValue.includes('actual') && (headerValue.includes('time') || headerValue.includes('delay'))) {
        columnMapping.actualTimes = columnLetter;
        console.log(`📍 Found Actual Times column: ${columnLetter} with header: "${cell.v}"`);
      } else if (headerValue.includes('actualtimes')) {
        // Handle case where header might be "ActualTimes" without space
        columnMapping.actualTimes = columnLetter;
        console.log(`📍 Found ActualTimes column: ${columnLetter} with header: "${cell.v}"`);
      } else if (headerValue.includes('indicator')) {
        columnMapping.indicators = columnLetter;
      }
    }
  }

  return Object.keys(columnMapping).length > 0 ? columnMapping : null;
}

/**
 * Searches for date range information flexibly across the worksheet
 */
export function findDateRangeFlexible(worksheet: XLSX.WorkSheet): {
  row: number;
  column: string;
  value: string;
} | null {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');

  // Search in first 20 rows across all columns for date patterns
  for (let row = range.s.r; row <= Math.min(range.e.r, 20); row++) {
    for (let col = range.s.c; col <= Math.min(range.e.c, 25); col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];

      if (cell && cell.v) {
        const cellValue = String(cell.v || '');

        // Look for date range patterns like "01/07/2025 - 31/07/2025"
        const dateRangePattern = /\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}\/\d{2}\/\d{4}/;
        if (dateRangePattern.test(cellValue)) {
          return {
            row: row + 1, // Convert to 1-based
            column: XLSX.utils.encode_col(col),
            value: cellValue
          };
        }
      }
    }
  }

  return null;
}

/**
 * Searches for employee information flexibly
 */
export function findEmployeeInfoFlexible(worksheet: XLSX.WorkSheet): {
  row: number;
  column: string;
  value: string;
} | null {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');

  // Search in first 20 rows, focusing on column A but checking others too
  for (let row = range.s.r; row <= Math.min(range.e.r, 20); row++) {
    for (let col = range.s.c; col <= Math.min(range.e.c, 5); col++) { // Focus on first few columns
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];

      if (cell && cell.v) {
        const cellValue = String(cell.v || '');

        // Look for employee info patterns like "7818 TEIXEIRA RAFAEL DXB,CM,73H"
        const employeePattern = /^\d{4}\s+[A-Z]+\s+[A-Z]+\s+[A-Z]{3},[A-Z]+,[A-Z0-9]+/;
        if (employeePattern.test(cellValue)) {
          return {
            row: row + 1, // Convert to 1-based
            column: XLSX.utils.encode_col(col),
            value: cellValue
          };
        }
      }
    }
  }

  return null;
}

/**
 * Main function to detect Excel structure flexibly using anchor points
 */
export function detectExcelStructureFlexible(worksheet: XLSX.WorkSheet): FlexibleExcelStructure | null {
  try {
    // Step 1: Find "flydubai" validation
    const flydubaiRow = findFlydubaiValidation(worksheet);
    if (!flydubaiRow) {
      throw new Error('Could not find "flydubai" validation in column A');
    }

    // Step 2: Find "Schedule Details" header
    const scheduleDetailsRow = findScheduleDetailsRow(worksheet);
    if (!scheduleDetailsRow) {
      throw new Error('Could not find "Schedule Details" header');
    }

    // Step 3: Column headers should be in the next row after "Schedule Details"
    const columnHeaderRow = scheduleDetailsRow + 1;

    // Step 4: Map column headers dynamically
    const columnMapping = mapColumnHeaders(worksheet, columnHeaderRow);
    if (!columnMapping || !columnMapping.date || !columnMapping.duties) {
      throw new Error('Could not map essential column headers (Date, Duties)');
    }

    // Step 5: Data starts in the row after column headers
    const dataStartRow = columnHeaderRow + 1;

    // Step 6: Find date range and employee info flexibly
    const dateRangeLocation = findDateRangeFlexible(worksheet);
    const employeeInfoLocation = findEmployeeInfoFlexible(worksheet);

    return {
      flydubaiValidationRow: flydubaiRow,
      scheduleDetailsRow,
      columnHeaderRow,
      dataStartRow,
      columnMapping,
      dateRangeLocation,
      employeeInfoLocation
    };

  } catch (error) {
    console.error('Failed to detect Excel structure:', error);
    return null;
  }
}

/**
 * Checks if worksheet has data in expected range
 */
export function hasWorksheetData(worksheet: XLSX.WorkSheet): boolean {
  try {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    return range.e.r > 0 || range.e.c > 0; // Has more than just A1
  } catch {
    return false;
  }
}

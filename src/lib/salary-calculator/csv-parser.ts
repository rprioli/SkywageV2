/**
 * CSV parsing utilities for Skywage Salary Calculator
 * Basic CSV parsing functionality with error handling
 * Following existing utility patterns in the codebase
 */

import { CSVParseResult, FlightDuty } from '@/types/salary-calculator';
import { parseTimeString, parseTimeStringWithCrossDay, createTimeValue } from './time-calculator';
import { classifyFlightDuty, extractFlightNumbers, extractSectors, detectNonWorkingDay } from './flight-classifier';
import { validateFlightNumbers, validateSectors } from './csv-validator';
import { parseDate, extractMonthYearFromText } from './date-utilities';
import Papa from 'papaparse';

// Re-export parseDate for backwards compatibility
export { parseDate } from './date-utilities';

/**
 * Parses CSV content into structured data using PapaParse for proper handling of quoted multi-line cells
 */
export function parseCSVContent(content: string): string[][] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  try {
    // Use PapaParse for proper CSV parsing that handles quoted multi-line cells
    const result = Papa.parse(content, {
      header: false,
      skipEmptyLines: false, // Keep empty lines for proper row indexing
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ',',
      newline: '\n',
      transform: (value: string) => value.trim() // Trim whitespace from each cell
    });

    // Convert ParseResult data to string[][]
    const rows: string[][] = result.data as string[][];

    return rows;
  } catch {
    // Fallback to basic parsing if PapaParse fails
    return content.split('\n').map(line => [line.trim()]);
  }
}

/**
 * Extracts month and year from CSV content
 * Uses shared date utilities for parsing
 */
export function extractMonthFromCSV(content: string): { month: number; year: number } | null {
  const rows = parseCSVContent(content);
  
  if (rows.length < 2) {
    return null;
  }

  // Check C2 cell (third column of second row)
  const c2Cell = rows[1]?.[2];
  if (!c2Cell) {
    return null;
  }

  // Use shared utility for month/year extraction
  return extractMonthYearFromText(c2Cell);
}

/**
 * Merges multiple CSV rows that belong to the same flight duty (handles merged cells)
 */
function mergeRelatedRows(
  rows: string[][],
  startIndex: number
): { mergedRow: string[], rowsUsed: number } {
  const mergedRow = new Array(8).fill('');
  let rowsUsed = 1;

  // Start with the first row
  const firstRow = rows[startIndex] || [];
  for (let i = 0; i < Math.min(firstRow.length, 8); i++) {
    if (firstRow[i] && firstRow[i].trim() !== '') {
      mergedRow[i] = firstRow[i];
    }
  }

  // Look ahead up to 4 rows to find missing data
  for (let lookAhead = 1; lookAhead <= 4 && (startIndex + lookAhead) < rows.length; lookAhead++) {
    const nextRow = rows[startIndex + lookAhead] || [];
    let foundData = false;

    // Merge non-empty cells from the next row
    for (let i = 0; i < Math.min(nextRow.length, 8); i++) {
      if (nextRow[i] && nextRow[i].trim() !== '') {
        if (!mergedRow[i] || mergedRow[i].trim() === '') {
          mergedRow[i] = nextRow[i];
          foundData = true;
        }
      }
    }

    if (foundData) {
      rowsUsed = lookAhead + 1;
    }

    // Stop if we have essential data (date, duties, and at least one time)
    const hasDate = mergedRow[0] && mergedRow[0].trim() !== '';
    const hasDuties = mergedRow[1] && mergedRow[1].trim() !== '';
    const hasReportTime = mergedRow[3] && mergedRow[3].trim() !== '';
    const hasDebriefTime = mergedRow[5] && mergedRow[5].trim() !== '';

    if (hasDate && hasDuties && (hasReportTime || hasDebriefTime)) {
      break;
    }
  }

  return { mergedRow, rowsUsed };
}

/**
 * Checks if a row needs merging (has incomplete data)
 */
function needsRowMerging(row: string[]): boolean {
  const hasDate = !!(row[0] && row[0].trim() !== '' && !row[0].toLowerCase().includes('date'));
  const hasDuties = !!(row[1] && row[1].trim() !== '');
  const hasReportTime = !!(row[3] && row[3].trim() !== '');
  const hasDebriefTime = !!(row[5] && row[5].trim() !== '');

  // Needs merging if it has a date but missing other essential data
  return hasDate && (!hasDuties || (!hasReportTime && !hasDebriefTime));
}

/**
 * Parses a single CSV row into FlightDuty object
 */
export function parseFlightDutyRow(
  row: string[],
  rowIndex: number,
  userId: string,
  month: number,
  year: number
): { flightDuty: FlightDuty | null; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Skip completely empty rows
  if (row.every(cell => !cell || cell.trim() === '')) {
    return { flightDuty: null, errors, warnings };
  }

  // Handle rows with fewer than 8 columns by padding with empty strings
  // Flydubai CSV structure: Date, Duties, Details, Report times, Actual times/Delays, Debrief times, Indicators, Crew
  const paddedRow = [...row];
  while (paddedRow.length < 8) {
    paddedRow.push('');
  }

  // Extract the correct columns: Date, Duties, Details, Report times (col 3), Debrief times (col 5)
  const dateStr = paddedRow[0];
  const duties = paddedRow[1];
  const details = paddedRow[2];

  // Smart extraction for report time - handle empty cells and merged cell issues
  let reportTimeStr = paddedRow[3]; // Report times column
  if (!reportTimeStr || reportTimeStr.trim() === '') {
    // Search for time pattern in ALL columns if the expected column is empty
    for (let col = 0; col <= 7; col++) {
      const cellValue = paddedRow[col] || '';
      const trimmedValue = cellValue.trim();

      // Look for various time patterns:
      // 1. Simple HH:MM format: "19:10"
      // 2. HH:MM with special chars: "19:10?¹"
      // 3. A-prefixed format: "A19:10♦"
      // 4. Extract from time ranges: "A19:10♦ - A04:03♦/00:03"

      if (trimmedValue) {
        // Try simple HH:MM pattern first (handle various suffixes: ?¹, ?♦, ♦, ?�, �, etc.)
        const simpleTimeMatch = trimmedValue.match(/^(\d{1,2}:\d{2})(\?[¹²³⁴⁵⁶⁷⁸⁹♦◆�]|[¹²³⁴⁵⁶⁷⁸⁹♦◆�])*$/);
        if (simpleTimeMatch) {
          reportTimeStr = simpleTimeMatch[1]; // Extract just the time part without suffixes
          break;
        }

        // Try A-prefixed format: "A19:10♦"
        const aPrefixMatch = trimmedValue.match(/^A(\d{1,2}:\d{2})[♦◆]/);
        if (aPrefixMatch) {
          reportTimeStr = aPrefixMatch[1]; // Extract just the time part
          break;
        }

        // Try extracting first time from range: "A19:10♦ - A04:03♦/00:03"
        const rangeMatch = trimmedValue.match(/A(\d{1,2}:\d{2})[♦◆]\s*-\s*A(\d{1,2}:\d{2})[♦◆]/);
        if (rangeMatch) {
          reportTimeStr = rangeMatch[1]; // Extract the first time
          break;
        }
      }
    }
  }

  // Smart extraction for debrief time - handle empty cells and merged cell issues
  let debriefTimeStr = paddedRow[5]; // Debrief times column (skip col 4 which is Actual times/Delays)
  if (!debriefTimeStr || debriefTimeStr.trim() === '') {
    // Search for time pattern in ALL columns if the expected column is empty
    for (let col = 0; col <= 7; col++) {
      const cellValue = paddedRow[col] || '';
      const trimmedValue = cellValue.trim();

      // Look for various time patterns (same as report time logic)
      if (trimmedValue) {
        // Try simple HH:MM pattern first (handle various suffixes: ?¹, ?♦, ♦, ?�, �, etc.)
        const simpleTimeMatch = trimmedValue.match(/^(\d{1,2}:\d{2})(\?[¹²³⁴⁵⁶⁷⁸⁹♦◆�]|[¹²³⁴⁵⁶⁷⁸⁹♦◆�])*$/);
        if (simpleTimeMatch && col !== 3) { // Skip col 3 as it's likely report time
          debriefTimeStr = simpleTimeMatch[1]; // Extract just the time part without suffixes
          break;
        }

        // Try A-prefixed format: "A04:03♦"
        const aPrefixMatch = trimmedValue.match(/^A(\d{1,2}:\d{2})[♦◆]/);
        if (aPrefixMatch && col !== 3) {
          debriefTimeStr = aPrefixMatch[1]; // Extract just the time part
          break;
        }

        // Try extracting second time from range: "A19:10♦ - A04:03♦/00:03"
        const rangeMatch = trimmedValue.match(/A(\d{1,2}:\d{2})[♦◆]\s*-\s*A(\d{1,2}:\d{2})[♦◆]/);
        if (rangeMatch && !reportTimeStr) {
          // If we haven't found report time yet, use first time for report, second for debrief
          reportTimeStr = rangeMatch[1];
          debriefTimeStr = rangeMatch[2];
          break;
        } else if (rangeMatch && reportTimeStr) {
          // If we already have report time, use second time for debrief
          debriefTimeStr = rangeMatch[2];
          break;
        }
      }
    }
  }



  // Skip rows that look like headers
  if (dateStr && dateStr.toLowerCase().trim() === 'date') {
    return { flightDuty: null, errors, warnings };
  }

  // Skip rows that clearly don't contain dates (flight numbers, sectors, etc.)
  if (dateStr && dateStr.trim() !== '') {
    const trimmedDate = dateStr.trim();

    // Skip if it looks like a flight number (starts with letters)
    if (/^[A-Z]{2,3}\d+/.test(trimmedDate)) {
      return { flightDuty: null, errors, warnings };
    }

    // Skip if it looks like a sector (contains " - " or " -> ")
    if (trimmedDate.includes(' - ') || trimmedDate.includes(' -> ')) {
      return { flightDuty: null, errors, warnings };
    }

    // Skip if it looks like a time range (contains ":" and "-" or "♦")
    if (trimmedDate.includes(':') && (trimmedDate.includes('-') || trimmedDate.includes('♦'))) {
      return { flightDuty: null, errors, warnings };
    }

    // Skip common non-date patterns from CSV footer/metadata
    const nonDatePatterns = [
      /^\d{2}:\d{2}$/, // Time format like "79:25"
      /^[A-Z]{3,}$/, // All caps words like "PASS", "MED", "LIC"
      /^(Block Hours|Duty Hours|Off Days|Flight Days|Landings)$/i,
      /^(Expiry Dates|Descriptions|Code|Description|Date|Category|Memo)$/i,
      /^Generated on/i,
      /^Page \d+ of \d+$/i,
      /^\d+$/, // Pure numbers
      /^[A-Z\s-]+$/  // All caps phrases like "ADDITIONAL DAY OFF"
    ];

    for (const pattern of nonDatePatterns) {
      if (pattern.test(trimmedDate)) {
        return { flightDuty: null, errors, warnings };
      }
    }
  }

  // Parse date
  const date = parseDate(dateStr, year);
  if (!date) {
    // Only error if the date string is not empty (skip empty date rows)
    if (dateStr && dateStr.trim() !== '') {
      errors.push(`Row ${rowIndex + 1}: Invalid date format "${dateStr}"`);
    }
    return { flightDuty: null, errors, warnings };
  }

  // Skip empty duty rows
  if (!duties || duties.trim() === '') {
    return { flightDuty: null, errors, warnings };
  }

  // First classify the duty to determine if it's a non-duty entry
  const classification = classifyFlightDuty(duties, details, reportTimeStr, debriefTimeStr);

  // Use shared utility to detect non-working days
  const nonWorkingResult = detectNonWorkingDay(duties, details, classification.dutyType);

  // If it's a non-working day, create a minimal FlightDuty entry
  if (nonWorkingResult.isNonWorking && nonWorkingResult.dutyType) {
    const flightDuty: FlightDuty = {
      userId,
      date,
      flightNumbers: [],
      sectors: [],
      dutyType: nonWorkingResult.dutyType,
      reportTime: createTimeValue(0, 0),
      debriefTime: createTimeValue(0, 0),
      dutyHours: 0,
      flightPay: 0,
      isCrossDay: false,
      dataSource: 'csv',
      month,
      year,
      originalData: {
        duties,
        details,
        rowIndex
      }
    };

    return { flightDuty, errors, warnings };
  }

  // Skip SBY (Home Standby) - these are still filtered out as they're not relevant for comparison
  if (classification.dutyType === 'sby') {
    return { flightDuty: null, errors, warnings };
  }

  // Only validate flight numbers and sectors for actual flight duties
  const flightValidation = validateFlightNumbers(duties, rowIndex);
  warnings.push(...flightValidation.warnings);

  const sectorValidation = validateSectors(details, rowIndex);
  warnings.push(...sectorValidation.warnings);

  // Check for empty time strings first
  if (!reportTimeStr || reportTimeStr.trim() === '') {
    errors.push(`Row ${rowIndex + 1}: Invalid report time "": Invalid time string provided`);
  }

  if (!debriefTimeStr || debriefTimeStr.trim() === '') {
    errors.push(`Row ${rowIndex + 1}: Invalid debrief time "": Invalid time string provided`);
  }

  // Only parse times if they're not empty
  let reportTimeResult = null;
  let debriefTimeResult = null;

  // Use enhanced cross-day detection for both times
  if (reportTimeStr && reportTimeStr.trim() !== '' && debriefTimeStr && debriefTimeStr.trim() !== '') {
    const timeParseResult = parseTimeStringWithCrossDay(reportTimeStr, debriefTimeStr);
    reportTimeResult = timeParseResult.reportTime;
    debriefTimeResult = timeParseResult.debriefTime;

    if (!reportTimeResult.success) {
      errors.push(`Row ${rowIndex + 1}: Invalid report time "${reportTimeStr}": ${reportTimeResult.error}`);
    }

    if (!debriefTimeResult.success) {
      errors.push(`Row ${rowIndex + 1}: Invalid debrief time "${debriefTimeStr}": ${debriefTimeResult.error}`);
    }
  } else {
    // Fallback to individual parsing if one time is missing
    if (reportTimeStr && reportTimeStr.trim() !== '') {
      reportTimeResult = parseTimeString(reportTimeStr);
      if (!reportTimeResult.success) {
        errors.push(`Row ${rowIndex + 1}: Invalid report time "${reportTimeStr}": ${reportTimeResult.error}`);
      }
    }

    if (debriefTimeStr && debriefTimeStr.trim() !== '') {
      debriefTimeResult = parseTimeString(debriefTimeStr);
      if (!debriefTimeResult.success) {
        errors.push(`Row ${rowIndex + 1}: Invalid debrief time "${debriefTimeStr}": ${debriefTimeResult.error}`);
      }
    }
  }

  if (errors.length > 0) {
    return { flightDuty: null, errors, warnings };
  }

  // Add classification warnings (classification was done earlier)
  warnings.push(...classification.warnings);

  // Extract flight numbers and sectors
  const flightNumbers = extractFlightNumbers(duties);
  const sectors = extractSectors(details);

  // Create FlightDuty object (only if we have valid time data)
  if (!reportTimeResult || !debriefTimeResult || !reportTimeResult.timeValue || !debriefTimeResult.timeValue) {
    errors.push(`Row ${rowIndex + 1}: Cannot create flight duty without valid report and debrief times`);
    return { flightDuty: null, errors, warnings };
  }

  const flightDuty: FlightDuty = {
    userId,
    date,
    flightNumbers,
    sectors,
    dutyType: classification.dutyType,
    reportTime: reportTimeResult.timeValue,
    debriefTime: debriefTimeResult.timeValue,
    dutyHours: 0, // Will be calculated later
    flightPay: 0, // Will be calculated later
    isCrossDay: debriefTimeResult.isCrossDay,
    dataSource: 'csv',
    originalData: {
      row: row,
      rowIndex: rowIndex,
      classification: classification
    },
    month,
    year
  };

  return { flightDuty, errors, warnings };
}

/**
 * Parses complete CSV content into flight duties
 */
export function parseFlightDutiesFromCSV(
  content: string,
  userId: string,
  targetMonth?: number,
  targetYear?: number
): CSVParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const flightDuties: FlightDuty[] = [];

  try {
    // Extract month and year from CSV content
    const monthYear = extractMonthFromCSV(content);
    if (!monthYear) {
      errors.push('Could not extract month and year from CSV');
      return {
        success: false,
        errors,
        warnings,
        totalRows: 0,
        processedRows: 0
      };
    }

    // Use target month/year if provided, otherwise use extracted values
    const { month: extractedMonth, year: extractedYear } = monthYear;
    const month = targetMonth || extractedMonth;
    const year = targetYear || extractedYear;
    const rows = parseCSVContent(content);

    // Find the actual data start row by looking for the header row
    let dataStartRow = 5; // Default to row 5 (0-based index) which is row 6 in Excel

    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const row = rows[i];

      if (row.length > 0 && row[0] && row[0].toLowerCase().trim() === 'date') {
        dataStartRow = i + 1; // Data starts after the header row
        break;
      }
    }

    // Skip header rows and start from actual data
    const dataRows = rows.slice(dataStartRow);

    let i = 0;
    while (i < dataRows.length) {
      const row = dataRows[i];
      const actualRowIndex = i + dataStartRow;

      // Stop at end marker - check first column specifically for "Total Hours and Statistics"
      if (row[0] && row[0].toLowerCase().includes('total hours')) {
        break;
      }

      // Also stop if any cell contains the full end marker phrase
      if (row.some(cell => cell && cell.toLowerCase().includes('total hours and statistics'))) {
        break;
      }

      // Check if this row needs merging with subsequent rows
      let processedRow = row;
      let rowsUsed = 1;

      if (needsRowMerging(row)) {
        const mergeResult = mergeRelatedRows(dataRows, i);
        processedRow = mergeResult.mergedRow;
        rowsUsed = mergeResult.rowsUsed;
      }

      const result = parseFlightDutyRow(processedRow, actualRowIndex, userId, month, year);

      errors.push(...result.errors);
      warnings.push(...result.warnings);

      if (result.flightDuty) {
        flightDuties.push(result.flightDuty);
      }

      // Skip the rows that were merged
      i += rowsUsed;
    }

    // Apply month boundary filtering to prevent duplicate duties from overlapping months
    const filteredDuties = flightDuties.filter(duty => {
      const dutyMonth = duty.date.getUTCMonth() + 1; // Convert to 1-based month
      const dutyYear = duty.date.getUTCFullYear();

      const belongsToTargetMonth = dutyMonth === month && dutyYear === year;

      if (!belongsToTargetMonth) {
        warnings.push(
          `Filtered out duty from ${duty.date.toISOString().split('T')[0]} (belongs to ${dutyMonth}/${dutyYear}, target: ${month}/${year})`
        );
      }

      return belongsToTargetMonth;
    });

    if (filteredDuties.length !== flightDuties.length) {
      warnings.push(
        `Month boundary filtering: ${flightDuties.length - filteredDuties.length} duties filtered out (${filteredDuties.length} remaining)`
      );
    }

    return {
      success: errors.length === 0,
      data: filteredDuties,
      errors,
      warnings,
      month,
      year,
      totalRows: dataRows.length,
      processedRows: filteredDuties.length // Update to reflect filtered count
    };

  } catch (error) {
    errors.push(`Parsing error: ${(error as Error).message}`);
    
    return {
      success: false,
      errors,
      warnings,
      totalRows: 0,
      processedRows: 0
    };
  }
}

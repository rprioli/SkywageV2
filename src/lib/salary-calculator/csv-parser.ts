/**
 * CSV parsing utilities for Skywage Salary Calculator
 * Basic CSV parsing functionality with error handling
 * Following existing utility patterns in the codebase
 */

import { CSVParseResult, FlightDuty, ValidationResult } from '@/types/salary-calculator';
import { parseTimeString, createTimeValue } from './time-calculator';
import { classifyFlightDuty, extractFlightNumbers, extractSectors } from './flight-classifier';
import { validateCSVRow, validateFlightNumbers, validateSectors } from './csv-validator';
import Papa from 'papaparse';

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

    if (result.errors.length > 0) {
      console.warn('CSV parsing warnings:', result.errors);
    }

    // Convert ParseResult data to string[][]
    const rows: string[][] = result.data as string[][];

    return rows;
  } catch (error) {
    console.error('CSV parsing error:', error);
    // Fallback to basic parsing if PapaParse fails
    return content.split('\n').map(line => [line.trim()]);
  }
}

/**
 * Extracts month and year from CSV content
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

  // Try to extract month and year from various formats
  // Examples: "May 2024", "05/2024", "May-24", etc.
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  const text = c2Cell.toLowerCase();
  let month: number | null = null;
  let year: number | null = null;

  // Try to find month name
  for (let i = 0; i < monthNames.length; i++) {
    if (text.includes(monthNames[i])) {
      month = i + 1;
      break;
    }
  }

  // Try to extract year (4 digits or 2 digits)
  const yearMatch = text.match(/\b(20\d{2}|\d{2})\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1]);
    if (year < 100) {
      year += 2000; // Convert 2-digit year to 4-digit
    }

    // Debug: Log the year extraction
    console.log('CSV Parser - Year extraction:', {
      originalText: text,
      yearMatch: yearMatch[1],
      parsedYear: year
    });

    // Handle common year parsing issues
    if (year < 2020) {
      console.log('CSV Parser - Year too old, attempting to fix:', year);
      // If year is like 2004, it might be a parsing error for 2025
      if (year >= 2000 && year <= 2010) {
        year = year + 21; // Convert 2004 -> 2025
        console.log('CSV Parser - Adjusted year to:', year);
      }
    }
  }

  // Try numeric month format (MM/YYYY or MM-YYYY)
  if (!month) {
    const monthMatch = text.match(/\b(\d{1,2})[\/\-](\d{2,4})\b/);
    if (monthMatch) {
      month = parseInt(monthMatch[1]);
      year = parseInt(monthMatch[2]);
      if (year < 100) {
        year += 2000;
      }

      // Debug: Log the numeric month/year extraction
      console.log('CSV Parser - Numeric month/year extraction:', {
        originalText: text,
        monthMatch: monthMatch[1],
        yearMatch: monthMatch[2],
        parsedMonth: month,
        parsedYear: year
      });

      // Handle year parsing issues for numeric format too
      if (year < 2020) {
        console.log('CSV Parser - Numeric year too old, attempting to fix:', year);
        if (year >= 2000 && year <= 2010) {
          year = year + 21; // Convert 2004 -> 2025
          console.log('CSV Parser - Adjusted numeric year to:', year);
        }
      }
    }
  }

  if (month && year && month >= 1 && month <= 12) {
    return { month, year };
  }

  return null;
}

/**
 * Parses date string into Date object
 */
export function parseDate(dateStr: string, year?: number): Date | null {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }

  let cleaned = dateStr.trim();

  // Remove day names (Mon, Tue, Wed, Thu, Fri, Sat, Sun) from date strings
  // Handle formats like "03/04/2025 Thu" or "03/04/2025 Thursday"
  cleaned = cleaned.replace(/\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i, '');

  // Try various date formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // MM/DD/YYYY or DD/MM/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/, // MM-DD-YYYY or DD-MM-YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/, // MM.DD.YYYY or DD.MM.YYYY
    /^(\d{1,2})\/(\d{1,2})$/, // MM/DD (year from context)
    /^(\d{1,2})-(\d{1,2})$/, // MM-DD (year from context)
    /^(\d{1,2})\.(\d{1,2})$/, // MM.DD (year from context)
  ];

  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      let day = parseInt(match[1]);
      let month = parseInt(match[2]);
      let yearValue = match[3] ? parseInt(match[3]) : year || new Date().getFullYear();

      // Handle 2-digit years
      if (yearValue < 100) {
        yearValue += 2000;
      }

      // Handle DD/MM vs MM/DD format detection
      if (day <= 12 && month > 12) {
        // If month > 12, then it must be MM/DD format, so swap
        [day, month] = [month, day];
      }
      // If day > 12 and month <= 12, then it's definitely DD/MM format, no swap needed
      // If both are <= 12, assume DD/MM format for Flydubai (international format)

      // Validate date components
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(yearValue, month - 1, day);

        // Verify the date is valid (handles invalid dates like Feb 30)
        if (date.getFullYear() === yearValue &&
            date.getMonth() === month - 1 &&
            date.getDate() === day) {
          return date;
        }
      }
    }
  }

  return null;
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
  const hasDate = row[0] && row[0].trim() !== '' && !row[0].toLowerCase().includes('date');
  const hasDuties = row[1] && row[1].trim() !== '';
  const hasReportTime = row[3] && row[3].trim() !== '';
  const hasDebriefTime = row[5] && row[5].trim() !== '';

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
          console.log(`CSV Debug - Found simple report time in column ${col}: "${reportTimeStr}" (from "${trimmedValue}")`);
          break;
        }

        // Try A-prefixed format: "A19:10♦"
        const aPrefixMatch = trimmedValue.match(/^A(\d{1,2}:\d{2})[♦◆]/);
        if (aPrefixMatch) {
          reportTimeStr = aPrefixMatch[1]; // Extract just the time part
          console.log(`CSV Debug - Found A-prefixed report time in column ${col}: "${reportTimeStr}" (from "${trimmedValue}")`);
          break;
        }

        // Try extracting first time from range: "A19:10♦ - A04:03♦/00:03"
        const rangeMatch = trimmedValue.match(/A(\d{1,2}:\d{2})[♦◆]\s*-\s*A(\d{1,2}:\d{2})[♦◆]/);
        if (rangeMatch) {
          reportTimeStr = rangeMatch[1]; // Extract the first time
          console.log(`CSV Debug - Found report time from range in column ${col}: "${reportTimeStr}" (from "${trimmedValue}")`);
          break;
        }
      }
    }
  }

  // Smart extraction for debrief time - handle empty cells and merged cell issues
  let debriefTimeStr = paddedRow[5]; // Debrief times column (skip col 4 which is Actual times/Delays)
  console.log(`CSV Debug - Initial debrief time from column 5: "${debriefTimeStr}" (chars: ${debriefTimeStr ? Array.from(debriefTimeStr).map(c => c.charCodeAt(0)).join(',') : 'null'})`);
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
          console.log(`CSV Debug - Found simple debrief time in column ${col}: "${debriefTimeStr}" (from "${trimmedValue}")`);
          break;
        }

        // Try A-prefixed format: "A04:03♦"
        const aPrefixMatch = trimmedValue.match(/^A(\d{1,2}:\d{2})[♦◆]/);
        if (aPrefixMatch && col !== 3) {
          debriefTimeStr = aPrefixMatch[1]; // Extract just the time part
          console.log(`CSV Debug - Found A-prefixed debrief time in column ${col}: "${debriefTimeStr}" (from "${trimmedValue}")`);
          break;
        }

        // Try extracting second time from range: "A19:10♦ - A04:03♦/00:03"
        const rangeMatch = trimmedValue.match(/A(\d{1,2}:\d{2})[♦◆]\s*-\s*A(\d{1,2}:\d{2})[♦◆]/);
        if (rangeMatch && !reportTimeStr) {
          // If we haven't found report time yet, use first time for report, second for debrief
          reportTimeStr = rangeMatch[1];
          debriefTimeStr = rangeMatch[2];
          console.log(`CSV Debug - Found both times from range in column ${col}: report="${reportTimeStr}", debrief="${debriefTimeStr}" (from "${trimmedValue}")`);
          break;
        } else if (rangeMatch && reportTimeStr) {
          // If we already have report time, use second time for debrief
          debriefTimeStr = rangeMatch[2];
          console.log(`CSV Debug - Found debrief time from range in column ${col}: "${debriefTimeStr}" (from "${trimmedValue}")`);
          break;
        }
      }
    }
  }



  // Skip rows that look like headers
  if (dateStr && dateStr.toLowerCase().trim() === 'date') {
    console.log(`CSV Debug - Skipping header row ${rowIndex + 1}: [${paddedRow.join(', ')}]`);
    return { flightDuty: null, errors, warnings };
  }

  // Skip rows that clearly don't contain dates (flight numbers, sectors, etc.)
  if (dateStr && dateStr.trim() !== '') {
    const trimmedDate = dateStr.trim();

    // Skip if it looks like a flight number (starts with letters)
    if (/^[A-Z]{2,3}\d+/.test(trimmedDate)) {
      console.log(`CSV Debug - Skipping flight number row ${rowIndex + 1}: "${trimmedDate}"`);
      return { flightDuty: null, errors, warnings };
    }

    // Skip if it looks like a sector (contains " - " or " -> ")
    if (trimmedDate.includes(' - ') || trimmedDate.includes(' -> ')) {
      console.log(`CSV Debug - Skipping sector row ${rowIndex + 1}: "${trimmedDate}"`);
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
        console.log(`CSV Debug - Skipping non-date pattern row ${rowIndex + 1}: "${trimmedDate}"`);
        return { flightDuty: null, errors, warnings };
      }
    }
  }

  // Parse date
  const date = parseDate(dateStr, year);
  if (!date) {
    // Only error if the date string is not empty (skip empty date rows)
    if (dateStr && dateStr.trim() !== '') {
      console.log(`CSV Debug - Date parsing failed for row ${rowIndex + 1}: "${dateStr}"`);
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

  // Check if this is a non-duty entry that should be skipped entirely
  const dutiesUpper = duties.toUpperCase().trim();
  const isNonDutyEntry =
    dutiesUpper.includes('DAY OFF') ||
    dutiesUpper.includes('REST DAY') ||
    dutiesUpper.includes('ADDITIONAL DAY OFF') ||
    dutiesUpper.includes('OFF') ||
    dutiesUpper === 'X' ||
    classification.dutyType === 'off' ||
    classification.dutyType === 'sby';

  // Skip validation and processing for non-duty entries
  if (isNonDutyEntry) {
    return { flightDuty: null, errors, warnings };
  }

  // Only validate flight numbers and sectors for actual flight duties
  const flightValidation = validateFlightNumbers(duties, rowIndex);
  warnings.push(...flightValidation.warnings);

  const sectorValidation = validateSectors(details, rowIndex);
  warnings.push(...sectorValidation.warnings);

  // Check for empty time strings first and provide detailed error info
  if (!reportTimeStr || reportTimeStr.trim() === '') {
    console.log(`CSV Debug - Empty report time at row ${rowIndex + 1}:`, {
      reportTimeStr: `"${reportTimeStr}"`,
      reportTimeColumn: paddedRow[3],
      allColumns: paddedRow
    });
    errors.push(`Row ${rowIndex + 1}: Invalid report time "": Invalid time string provided`);
  }

  if (!debriefTimeStr || debriefTimeStr.trim() === '') {
    console.log(`CSV Debug - Empty debrief time at row ${rowIndex + 1}:`, {
      debriefTimeStr: `"${debriefTimeStr}"`,
      debriefTimeColumn: paddedRow[5],
      allColumns: paddedRow
    });
    errors.push(`Row ${rowIndex + 1}: Invalid debrief time "": Invalid time string provided`);
  }

  // Only parse times if they're not empty
  let reportTimeResult = null;
  let debriefTimeResult = null;

  if (reportTimeStr && reportTimeStr.trim() !== '') {
    console.log(`CSV Debug - Parsing report time: "${reportTimeStr}" (length: ${reportTimeStr.length}, chars: ${Array.from(reportTimeStr).map(c => c.charCodeAt(0)).join(',')})`);
    reportTimeResult = parseTimeString(reportTimeStr);
    if (!reportTimeResult.success) {
      console.log(`CSV Debug - Report time parsing failed:`, reportTimeResult);
      errors.push(`Row ${rowIndex + 1}: Invalid report time "${reportTimeStr}": ${reportTimeResult.error}`);
    }
  }

  if (debriefTimeStr && debriefTimeStr.trim() !== '') {
    console.log(`CSV Debug - Parsing debrief time: "${debriefTimeStr}" (length: ${debriefTimeStr.length}, chars: ${Array.from(debriefTimeStr).map(c => c.charCodeAt(0)).join(',')})`);
    debriefTimeResult = parseTimeString(debriefTimeStr);
    if (!debriefTimeResult.success) {
      console.log(`CSV Debug - Debrief time parsing failed:`, debriefTimeResult);
      errors.push(`Row ${rowIndex + 1}: Invalid debrief time "${debriefTimeStr}": ${debriefTimeResult.error}`);
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
  userId: string
): CSVParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const flightDuties: FlightDuty[] = [];

  try {
    // Extract month and year
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

    const { month, year } = monthYear;
    const rows = parseCSVContent(content);

    // Find the actual data start row by looking for the header row
    let dataStartRow = 5; // Default to row 5 (0-based index) which is row 6 in Excel
    let headerRowFound = false;

    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const row = rows[i];
      console.log(`CSV Debug - Checking row ${i} for headers:`, row);

      if (row.length > 0 && row[0] && row[0].toLowerCase().trim() === 'date') {
        dataStartRow = i + 1; // Data starts after the header row
        headerRowFound = true;
        console.log(`CSV Debug - Found header row at ${i} (Excel row ${i + 1}), data starts at ${dataStartRow} (Excel row ${dataStartRow + 1})`);
        break;
      }
    }

    if (!headerRowFound) {
      console.log(`CSV Debug - Header row not found, using default data start at ${dataStartRow} (Excel row ${dataStartRow + 1})`);
    }

    // Skip header rows and start from actual data
    const dataRows = rows.slice(dataStartRow);
    let processedRows = 0;

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
        console.log(`CSV Debug - Found end marker phrase at row ${actualRowIndex}, stopping processing`);
        break;
      }

      // Check if this row needs merging with subsequent rows
      let processedRow = row;
      let rowsUsed = 1;

      if (needsRowMerging(row)) {
        console.log(`CSV Debug - Row ${actualRowIndex} needs merging, looking ahead...`);
        const mergeResult = mergeRelatedRows(dataRows, i);
        processedRow = mergeResult.mergedRow;
        rowsUsed = mergeResult.rowsUsed;
        console.log(`CSV Debug - Merged ${rowsUsed} rows for processing`);
      }

      const result = parseFlightDutyRow(processedRow, actualRowIndex, userId, month, year);

      errors.push(...result.errors);
      warnings.push(...result.warnings);

      if (result.flightDuty) {
        flightDuties.push(result.flightDuty);
        processedRows++;
      }

      // Skip the rows that were merged
      i += rowsUsed;
    }

    return {
      success: errors.length === 0,
      data: flightDuties,
      errors,
      warnings,
      month,
      year,
      totalRows: dataRows.length,
      processedRows
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

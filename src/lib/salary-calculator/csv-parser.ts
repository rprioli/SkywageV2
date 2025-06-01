/**
 * CSV parsing utilities for Skywage Salary Calculator
 * Basic CSV parsing functionality with error handling
 * Following existing utility patterns in the codebase
 */

import { CSVParseResult, FlightDuty, ValidationResult } from '@/types/salary-calculator';
import { parseTimeString, createTimeValue } from './time-calculator';
import { classifyFlightDuty, extractFlightNumbers, extractSectors } from './flight-classifier';
import { validateCSVRow, validateFlightNumbers, validateSectors } from './csv-validator';

/**
 * Parses CSV content into structured data
 */
export function parseCSVContent(content: string): string[][] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  const lines = content.split('\n').map(line => line.trim());
  const rows: string[][] = [];

  for (const line of lines) {
    if (line.length === 0) continue;

    // Simple CSV parsing - handles basic comma separation
    // Note: This is a simplified parser. For production, consider using a robust CSV library
    const row = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
    rows.push(row);
  }

  return rows;
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

  const cleaned = dateStr.trim();
  
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

      // Assume DD/MM format for Flydubai (international format)
      if (day > 12 && month <= 12) {
        // Swap if day > 12 and month <= 12
        [day, month] = [month, day];
      }

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

  // Validate row structure
  const rowValidation = validateCSVRow(row, rowIndex);
  errors.push(...rowValidation.errors);
  warnings.push(...rowValidation.warnings);

  if (row.length < 5) {
    return { flightDuty: null, errors, warnings };
  }

  const [dateStr, duties, details, reportTimeStr, debriefTimeStr] = row;

  // Parse date
  const date = parseDate(dateStr, year);
  if (!date) {
    errors.push(`Row ${rowIndex + 1}: Invalid date format "${dateStr}"`);
    return { flightDuty: null, errors, warnings };
  }

  // Skip empty duty rows
  if (!duties || duties.trim() === '') {
    return { flightDuty: null, errors, warnings };
  }

  // Validate flight numbers and sectors
  const flightValidation = validateFlightNumbers(duties, rowIndex);
  warnings.push(...flightValidation.warnings);

  const sectorValidation = validateSectors(details, rowIndex);
  warnings.push(...sectorValidation.warnings);

  // Parse times
  const reportTimeResult = parseTimeString(reportTimeStr);
  const debriefTimeResult = parseTimeString(debriefTimeStr);

  if (!reportTimeResult.success) {
    errors.push(`Row ${rowIndex + 1}: Invalid report time "${reportTimeStr}": ${reportTimeResult.error}`);
  }

  if (!debriefTimeResult.success) {
    errors.push(`Row ${rowIndex + 1}: Invalid debrief time "${debriefTimeStr}": ${debriefTimeResult.error}`);
  }

  if (errors.length > 0) {
    return { flightDuty: null, errors, warnings };
  }

  // Classify flight duty
  const classification = classifyFlightDuty(duties, details, reportTimeStr, debriefTimeStr);
  warnings.push(...classification.warnings);

  // Extract flight numbers and sectors
  const flightNumbers = extractFlightNumbers(duties);
  const sectors = extractSectors(details);

  // Create FlightDuty object
  const flightDuty: FlightDuty = {
    userId,
    date,
    flightNumbers,
    sectors,
    dutyType: classification.dutyType,
    reportTime: reportTimeResult.timeValue!,
    debriefTime: debriefTimeResult.timeValue!,
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

    // Skip header rows (typically first 4 rows for Flydubai)
    const dataRows = rows.slice(4);
    let processedRows = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // Stop at end marker
      if (row.some(cell => cell.toLowerCase().includes('total hours'))) {
        break;
      }

      const result = parseFlightDutyRow(row, i + 4, userId, month, year);
      
      errors.push(...result.errors);
      warnings.push(...result.warnings);

      if (result.flightDuty) {
        flightDuties.push(result.flightDuty);
        processedRows++;
      }
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

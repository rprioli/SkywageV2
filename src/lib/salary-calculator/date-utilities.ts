/**
 * Date Utilities for Skywage Salary Calculator
 * Shared date parsing and extraction functions used by CSV and Excel parsers
 * Extracted from csv-parser.ts and excel-parser.ts to reduce duplication
 */

/**
 * Result of parsing a date string
 */
export interface DateParseResult {
  date: Date | null;
  day: number;
  month: number;
  year: number;
  success: boolean;
  error?: string;
}

/**
 * Result of extracting month/year from content
 */
export interface MonthYearResult {
  month: number;
  year: number;
}

/**
 * Month names for parsing
 */
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

/**
 * Parses a date string into a Date object with robust format detection
 * Handles DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY formats
 * Assumes DD/MM format for Flydubai (international format)
 * 
 * @param dateStr - The date string to parse
 * @param defaultYear - Optional default year if not in date string
 * @returns Date object or null if parsing fails
 */
export function parseDate(dateStr: string, defaultYear?: number): Date | null {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }

  let cleaned = dateStr.trim();

  // Remove day names (Mon, Tue, Wed, etc.) from date strings
  cleaned = cleaned.replace(
    /\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i,
    ''
  );

  // Date format patterns
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // DD/MM/YYYY or MM/DD/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/,   // DD-MM-YYYY or MM-DD-YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/, // DD.MM.YYYY or MM.DD.YYYY
    /^(\d{1,2})\/(\d{1,2})$/,            // DD/MM (year from context)
    /^(\d{1,2})-(\d{1,2})$/,             // DD-MM (year from context)
    /^(\d{1,2})\.(\d{1,2})$/,            // DD.MM (year from context)
  ];

  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      let day = parseInt(match[1]);
      let month = parseInt(match[2]);
      let year = match[3] ? parseInt(match[3]) : defaultYear || new Date().getFullYear();

      // Handle 2-digit years
      if (year < 100) {
        year += 2000;
      }

      // Handle DD/MM vs MM/DD format detection
      if (day <= 12 && month > 12) {
        // If month > 12, then it must be MM/DD format, so swap
        [day, month] = [month, day];
      }
      // If day > 12 and month <= 12, then it's definitely DD/MM format
      // If both are <= 12, assume DD/MM format for Flydubai (international format)

      // Validate date components
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        // Create date in UTC to avoid timezone shifting issues
        const date = new Date(Date.UTC(year, month - 1, day));

        // Verify the date is valid (handles invalid dates like Feb 30)
        if (
          date.getUTCFullYear() === year &&
          date.getUTCMonth() === month - 1 &&
          date.getUTCDate() === day
        ) {
          return date;
        }
      }
    }
  }

  return null;
}

/**
 * Parses a simple DD/MM/YYYY date string (Excel format)
 * More strict than parseDate - expects exact format
 * 
 * @param dateStr - Date string in DD/MM/YYYY format
 * @returns Date object
 * @throws Error if format is invalid
 */
export function parseExcelDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new Error(`Invalid Excel date format: ${dateStr}`);
  }
  
  return new Date(year, month - 1, day); // month is 0-based in Date constructor
}

/**
 * Extracts month name from text and returns 1-based month number
 * 
 * @param text - Text containing month name
 * @returns Month number (1-12) or null if not found
 */
export function extractMonthFromText(text: string): number | null {
  const lowerText = text.toLowerCase();
  
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    if (lowerText.includes(MONTH_NAMES[i])) {
      return i + 1;
    }
  }
  
  return null;
}

/**
 * Extracts year from text
 * Handles both 4-digit (2025) and 2-digit (25) years
 * 
 * @param text - Text containing year
 * @returns Year as 4-digit number or null if not found
 */
export function extractYearFromText(text: string): number | null {
  const yearMatch = text.match(/\b(20\d{2}|\d{2})\b/);
  
  if (!yearMatch) {
    return null;
  }
  
  let year = parseInt(yearMatch[1]);
  
  // Convert 2-digit year to 4-digit
  if (year < 100) {
    year += 2000;
  }
  
  // Handle common year parsing issues
  if (year < 2020 && year >= 2000 && year <= 2010) {
    year = year + 21; // Convert 2004 -> 2025
  }
  
  return year;
}

/**
 * Parses a date range string like "01/04/2025 - 30/04/2025"
 * 
 * @param dateRangeStr - Date range string
 * @returns Object with start date, end date, month, and year
 * @throws Error if format is invalid
 */
export function parseDateRange(dateRangeStr: string): {
  startDate: Date;
  endDate: Date;
  month: number;
  year: number;
} {
  if (!dateRangeStr || typeof dateRangeStr !== 'string') {
    throw new Error('Invalid date range string provided');
  }

  const dateRangeRegex = /(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/;
  const match = dateRangeStr.match(dateRangeRegex);

  if (!match) {
    throw new Error(
      `Invalid date range format: "${dateRangeStr}". Expected DD/MM/YYYY - DD/MM/YYYY format.`
    );
  }

  const [, startDateStr, endDateStr] = match;
  const startDate = parseExcelDate(startDateStr);
  const endDate = parseExcelDate(endDateStr);

  return {
    startDate,
    endDate,
    month: startDate.getMonth() + 1, // Convert to 1-based month
    year: startDate.getFullYear(),
  };
}

/**
 * Extracts month and year from various text formats
 * Handles: "May 2024", "05/2024", "May-24", "01/04/2025 - 30/04/2025"
 * 
 * @param text - Text containing month/year information
 * @returns Object with month and year, or null if not found
 */
export function extractMonthYearFromText(text: string): MonthYearResult | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const lowerText = text.toLowerCase();
  let month: number | null = null;
  let year: number | null = null;

  // Try to find month name first
  month = extractMonthFromText(lowerText);
  
  // Try to extract year
  year = extractYearFromText(lowerText);

  // Try date range format if month not found
  if (!month) {
    const dateRangeMatch = lowerText.match(
      /(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/
    );
    
    if (dateRangeMatch) {
      const startDay = parseInt(dateRangeMatch[1]);
      const startMonth = parseInt(dateRangeMatch[2]);
      const startYear = parseInt(dateRangeMatch[3]);
      const endDay = parseInt(dateRangeMatch[4]);
      const endMonth = parseInt(dateRangeMatch[5]);

      // If start day is 01 and end day is 28-31, and months match, it's a full month
      if (startDay === 1 && endDay >= 28 && startMonth === endMonth) {
        month = startMonth;
        year = startYear < 100 ? startYear + 2000 : startYear;
      }
    }
  }

  // Try numeric month format MM/YYYY
  if (!month) {
    const numericMatch = lowerText.match(/(\d{1,2})\/(\d{4})/);
    if (numericMatch) {
      month = parseInt(numericMatch[1]);
      year = parseInt(numericMatch[2]);
    }
  }

  if (month && year) {
    return { month, year };
  }

  return null;
}

/**
 * Validates that a date is within a reasonable range for flight duties
 * 
 * @param date - Date to validate
 * @returns True if date is valid for flight duties
 */
export function isValidFlightDate(date: Date): boolean {
  const year = date.getFullYear();
  
  // Flight dates should be between 2020 and 2100
  if (year < 2020 || year > 2100) {
    return false;
  }
  
  // Date should not be in the far future (more than 1 year from now)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (date > oneYearFromNow) {
    return false;
  }
  
  return true;
}

/**
 * Gets the number of days in a month
 * 
 * @param month - Month (1-12)
 * @param year - Year
 * @returns Number of days in the month
 */
export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Formats a Date object to DD/MM/YYYY string
 * 
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateDDMMYYYY(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}


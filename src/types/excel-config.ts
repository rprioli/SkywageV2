/**
 * Excel Configuration Types for Skywage Salary Calculator
 * Defines types for Excel file parsing and validation
 * Based on real-world analysis of Jul25ScheduleReport.xlsx
 */

import { Position, DutyType } from './salary-calculator';

// Excel file format types
export type ExcelFileFormat = 'xlsx' | 'xlsm';

// Excel parsing configuration
export interface ExcelParsingConfig {
  // File validation
  maxFileSize: number; // in bytes
  supportedFormats: ExcelFileFormat[];
  
  // Cell locations (based on real file analysis)
  airlineValidationCell: string; // A1
  dateRangeCell: string; // G4
  employeeInfoCell: string; // A6
  scheduleHeaderRow: number; // Row 8
  columnHeaderRow: number; // Row 9
  dataStartRow: number; // Row 10
  
  // Column mappings (based on real file structure)
  columns: {
    date: string[]; // A-B
    duties: string[]; // C-E
    details: string[]; // F-K
    reportTime: string; // L
    actualTimes: string[]; // M-P
    debriefTime: string[]; // Q-T
    indicators: string[]; // U-V
    crew: string[]; // W-Z
  };
}

// Excel parsing result
export interface ExcelParseResult {
  success: boolean;
  data?: ExcelFlightDuty[];
  errors: string[];
  warnings: string[];
  month?: number;
  year?: number;
  totalRows: number;
  processedRows: number;
  employeeInfo?: ExcelEmployeeInfo;
}

// Excel-specific flight duty (before conversion to FlightDuty)
export interface ExcelFlightDuty {
  rowNumber: number;
  date: string; // Raw Excel date string
  duties: string; // Raw duties string (may contain \n)
  details: string; // Raw details string (may contain \n)
  reportTime: string;
  debriefTime: string;
  actualTimes?: string;
  indicators?: string;
  dutyType: DutyType;
  flightNumbers: string[];
  sectors: string[];
  isCrossDay: boolean;
  originalData: {
    row: unknown[];
    cellReferences: { [key: string]: string };
  };
}

// Employee information extracted from Excel
export interface ExcelEmployeeInfo {
  employeeId: string;
  name: string;
  base: string;
  position: Position;
  aircraftType: string;
  rawInfo: string; // Original A6 cell content
}

// Excel validation result
export interface ExcelValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo?: {
    format: ExcelFileFormat;
    size: number;
    sheetCount: number;
    hasData: boolean;
  };
}

// Excel cell reference with value
export interface ExcelCellReference {
  address: string; // e.g., "A1", "G4"
  value: any;
  formattedValue?: string;
  type?: 'string' | 'number' | 'date' | 'boolean' | 'formula';
}

// Excel parsing context
export interface ExcelParsingContext {
  worksheet: any; // XLSX worksheet object
  config: ExcelParsingConfig;
  currentRow: number;
  totalRows: number;
  errors: string[];
  warnings: string[];
}

// Time parsing result with cross-day detection
export interface ExcelTimeParseResult {
  time: string; // HH:MM format
  isCrossDay: boolean;
  originalValue: string;
}

// Date range extraction result
export interface ExcelDateRangeResult {
  startDate: Date;
  endDate: Date;
  month: number;
  year: number;
  originalValue: string;
}

// Default Excel parsing configuration
export const DEFAULT_EXCEL_CONFIG: ExcelParsingConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ['xlsx', 'xlsm'],
  
  // Cell locations based on real file analysis
  airlineValidationCell: 'A1',
  dateRangeCell: 'G4',
  employeeInfoCell: 'A6',
  scheduleHeaderRow: 8,
  columnHeaderRow: 9,
  dataStartRow: 10,
  
  // Column mappings from real file structure
  columns: {
    date: ['A', 'B'],
    duties: ['C', 'D', 'E'],
    details: ['F', 'G', 'H', 'I', 'J', 'K'],
    reportTime: 'L',
    actualTimes: ['M', 'N', 'O', 'P'],
    debriefTime: ['Q', 'R', 'S', 'T'],
    indicators: ['U', 'V'],
    crew: ['W', 'X', 'Y', 'Z']
  }
};

// Excel error types
export enum ExcelErrorType {
  FILE_CORRUPTED = 'FILE_CORRUPTED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  MISSING_SHEET = 'MISSING_SHEET',
  INVALID_STRUCTURE = 'INVALID_STRUCTURE',
  CELL_REFERENCE_ERROR = 'CELL_REFERENCE_ERROR',
  DATA_PARSING_ERROR = 'DATA_PARSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

// Excel error with context
export interface ExcelError {
  type: ExcelErrorType;
  message: string;
  cellReference?: string;
  rowNumber?: number;
  originalError?: Error;
}

// Export utility type for Excel cell addressing
export type ExcelCellAddress = string; // e.g., "A1", "G4", "L14"

// Export type for Excel row data
export type ExcelRowData = { [column: string]: any };

// Flexible Excel structure detection types
export interface FlexibleExcelStructure {
  flydubaiValidationRow: number;
  scheduleDetailsRow: number;
  columnHeaderRow: number;
  dataStartRow: number;
  columnMapping: {
    date: string;
    duties: string;
    details: string;
    reportTime: string;
    debriefTime: string;
    actualTimes?: string;
    indicators?: string;
  };
  dateRangeLocation?: {
    row: number;
    column: string;
    value: string;
  };
  employeeInfoLocation?: {
    row: number;
    column: string;
    value: string;
  };
}

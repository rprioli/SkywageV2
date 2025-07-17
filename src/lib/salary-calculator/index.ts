/**
 * Skywage Salary Calculator - Phase 3 Exports
 * Core calculation engine, utilities, and upload processing
 * Following existing export patterns in the codebase
 */

// Core calculation engine
export {
  calculateFlightPay,
  calculatePerDiemPay,
  calculateAsbyPay,
  calculateDutyHours,
  calculateFlightDuty,
  calculateLayoverRestPeriods,
  calculateMonthlySalary,
  FLYDUBAI_RATES
} from './calculation-engine';

// Time calculation utilities
export {
  createTimeValue,
  parseTimeString,
  calculateDuration,
  calculateRestPeriod,
  formatTimeValue,
  formatDecimalHours,
  validateTimeSequence,
  createTimestamp,
  calculateTimestampDuration,
  detectCrossDay,
  parseTimeStringWithCrossDay
} from './time-calculator';

// Flight classification utilities
export {
  classifyFlightDuty,
  extractFlightNumbers,
  extractSectors,
  validateFlightNumber,
  validateSector,
  isTurnaroundSequence,
  extractBaseAirport,
  hasInternationalSectors,
  calculateDutyComplexity
} from './flight-classifier';

// CSV validation utilities
export {
  validateCSVFile,
  validateCSVContent,
  validateFlydubaiCSV,
  validateCSVRow,
  validateFlightNumbers,
  validateSectors,
  validateCompleteCSV
} from './csv-validator';

// CSV parsing utilities
export {
  parseCSVContent,
  extractMonthFromCSV,
  parseDate,
  parseFlightDutyRow,
  parseFlightDutiesFromCSV
} from './csv-parser';

// Flydubai-specific configuration
export {
  FLYDUBAI_CONFIG,
  FLYDUBAI_CSV_COLUMNS,
  FLYDUBAI_CSV_VALIDATION,
  FLYDUBAI_FLIGHT_PATTERN,
  FLYDUBAI_SECTOR_PATTERN,
  FLYDUBAI_TIME_FORMATS,
  FLYDUBAI_BUSINESS_RULES,
  isValidFlydubaiFlightNumber,
  isValidFlydubaiSector,
  isFlydubaiBase,
  getFlydubaiDestinations,
  isDomesticRoute,
  getTurnaroundDestinations,
  isLikelyTurnaround,
  getFlydubaiRate,
  getFlydubaiMonthlyMinimums
} from './airlines/flydubai-config';

// Flydubai CSV parser
export { FlydubaiCSVParser } from './airlines/flydubai-parser';

// Phase 3 & 4: Upload processing (CSV and Excel)
export {
  processCSVUpload,
  processCSVUploadWithReplacement,
  processFileUpload,
  processFileUploadWithReplacement,
  validateCSVFileQuick,
  validateFileQuick,
  detectFileType,
  parseFileContent,
  checkForExistingData,
  type ProcessingStatus,
  type ProcessingResult,
  type ProgressCallback,
  type FileType,
  type UnifiedParseResult
} from './upload-processor';

// Roster replacement utilities
export {
  checkExistingRosterData,
  replaceRosterData,
  validateMonthYear,
  getMonthName,
  createReplacementSummary,
  type ExistingDataCheck,
  type ReplacementResult
} from './roster-replacement';

// Phase 4: Manual entry processing
export {
  processManualEntry,
  processBatchManualEntries,
  validateManualEntryRealTime,
  convertToFlightDuty,
  getSuggestedFlightNumbers,
  getSuggestedSectors,
  type ManualEntryResult,
  type BatchManualEntryResult
} from './manual-entry-processor';

export {
  validateDate,
  validateTime,
  validateManualEntry,
  type ManualFlightEntryData,
  type FieldValidationResult,
  type FormValidationResult
} from './manual-entry-validation';

// Excel parsing utilities (NEW)
export {
  readExcelFile,
  getFirstWorksheet,
  getCellValue,
  validateExcelFile,
  validateExcelContent,
  parseExcelTime,
  parseExcelDateRange,
  parseEmployeeInfo,
  createExcelError,
  hasWorksheetData
} from './excel-parser';

// Excel parser and validator (NEW)
export {
  FlydubaiExcelParser,
  parseFlydubaiExcelFile
} from './flydubai-excel-parser';

export {
  validateExcelFileComprehensive,
  validateExcelStructure,
  createValidationError,
  validateCellContent
} from './excel-validator';

export {
  detectExcelStructureFlexible,
  findFlydubaiValidation,
  findScheduleDetailsRow,
  mapColumnHeaders,
  findDateRangeFlexible,
  findEmployeeInfoFlexible
} from './excel-parser';

// Type exports
export type {
  Position,
  DutyType,
  DataSource,
  TimeValue,
  FlightDuty,
  LayoverRestPeriod,
  MonthlyCalculation,
  SalaryRates,
  CSVParseResult,
  FlightCalculationResult,
  MonthlyCalculationResult,
  AuditTrailEntry,
  ValidationResult,
  TimeParseResult,
  FlightClassificationResult
} from '@/types/salary-calculator';

export type {
  SupportedAirline,
  CSVColumnMapping,
  CSVValidationRules,
  CSVParser,
  AirlineConfig,
  AirlineConfigRegistry,
  ConfigFactory
} from '@/types/airline-config';

// Excel type exports (NEW)
export type {
  ExcelFileFormat,
  ExcelParsingConfig,
  ExcelParseResult,
  ExcelFlightDuty,
  ExcelEmployeeInfo,
  ExcelValidationResult,
  ExcelCellReference,
  ExcelTimeParseResult,
  ExcelDateRangeResult,
  ExcelErrorType,
  ExcelError
} from '@/types/excel-config';

// Phase 5: Edit functionality and recalculation
export {
  RecalculationResult,
  recalculateMonthlyTotals,
  handleFlightEdit,
  validateFlightEdit
} from './recalculation-engine';

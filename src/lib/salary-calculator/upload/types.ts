/**
 * Upload Module Types
 * Type definitions for file upload processing
 */

import {
  FlightDuty,
  LayoverRestPeriod,
  MonthlyCalculationResult
} from '@/types/salary-calculator';

// Re-export from roster-replacement
export type { ExistingDataCheck, ReplacementResult } from '../roster-replacement';

/**
 * Processing status for real-time feedback
 */
export interface ProcessingStatus {
  step: 'validating' | 'parsing' | 'calculating' | 'saving' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  details?: string;
}

/**
 * Processing result
 */
export interface ProcessingResult {
  success: boolean;
  monthlyCalculation?: MonthlyCalculationResult;
  flightDuties?: FlightDuty[];
  layoverRestPeriods?: LayoverRestPeriod[];
  errors?: string[];
  warnings?: string[];
  replacementPerformed?: boolean;
  replacementResult?: import('../roster-replacement').ReplacementResult;
}

/**
 * Progress callback type
 */
export type ProgressCallback = (status: ProcessingStatus) => void;

/**
 * File type detection
 */
export type FileType = 'csv' | 'excel';

/**
 * Unified parse result (compatible with both CSV and Excel)
 */
export interface UnifiedParseResult {
  success: boolean;
  data?: FlightDuty[];
  errors?: string[];
  warnings?: string[];
  totalRows?: number;
  processedRows?: number;
  month?: number;
  year?: number;
}


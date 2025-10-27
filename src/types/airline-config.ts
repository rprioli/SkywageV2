/**
 * Airline configuration types for Skywage Salary Calculator
 * Supports multi-airline framework starting with Flydubai
 */

import { Position, SalaryRates, CSVParseResult, ValidationResult } from './salary-calculator';

// Supported airlines
export type SupportedAirline = 'flydubai';

// CSV column mapping for different airlines
export interface CSVColumnMapping {
  date: string | number; // Column name or index
  duties: string | number;
  details: string | number;
  reportTime: string | number;
  debriefTime: string | number;
  // Optional columns
  remarks?: string | number;
  aircraft?: string | number;
}

// CSV validation rules
export interface CSVValidationRules {
  requiredHeaders: string[];
  requiredCells: {
    [key: string]: string; // Cell reference -> expected content
  };
  monthExtractionCell: string; // Cell reference for month extraction
  dataStartRow: number;
  dataEndMarker?: string; // Text that indicates end of data
  skipRows?: number[]; // Row numbers to skip
}

// CSV parser interface
export interface CSVParser {
  validateFile(content: string): ValidationResult;
  extractMonth(content: string): { month: number; year: number } | null;
  parseFlightDuties(content: string, userId: string): CSVParseResult;
}

// Airline-specific configuration
export interface AirlineConfig {
  name: string;
  code: SupportedAirline;
  
  // Salary rates for different positions
  salaryRates: {
    [K in Position]: SalaryRates;
  };
  
  // CSV parsing configuration
  csvConfig: {
    columnMapping: CSVColumnMapping;
    validationRules: CSVValidationRules;
    parser: CSVParser;
  };
  
  // Supported positions
  positions: Position[];
  
  // Flight number patterns for validation
  flightNumberPattern: RegExp;
  
  // Sector format patterns
  sectorPattern: RegExp;
  
  // Time format patterns
  timeFormats: {
    standard: RegExp;
    crossDay: RegExp;
    specialCharacters: string[]; // Characters to clean from time strings
  };
  
  // Business rules
  businessRules: {
    minDutyHours: number;
    maxDutyHours: number;
    minRestHours: number;
    maxRestHours: number;
    asbyFixedHours: number;
  };
}

// Registry of all airline configurations
export interface AirlineConfigRegistry {
  [K in SupportedAirline]: AirlineConfig;
}

// Configuration factory interface
export interface ConfigFactory {
  getConfig(airline: SupportedAirline): AirlineConfig;
  getSupportedAirlines(): SupportedAirline[];
  validateAirlineSupport(airline: string): airline is SupportedAirline;
}

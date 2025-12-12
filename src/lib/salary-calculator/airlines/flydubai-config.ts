/**
 * Flydubai-specific configuration for Skywage Salary Calculator
 * Implements airline-specific rules and patterns
 * Following existing configuration patterns in the codebase
 */

import { AirlineConfig, CSVColumnMapping, CSVValidationRules } from '@/types/airline-config';
import { FLYDUBAI_RATES, getPositionRatesForDate } from '../calculation-engine';
import { FlydubaiCSVParser } from './flydubai-parser';

// CSV column mapping for Flydubai roster format
export const FLYDUBAI_CSV_COLUMNS: CSVColumnMapping = {
  date: 0,        // Column A - Date
  duties: 1,      // Column B - Duties (flight numbers)
  details: 2,     // Column C - Details (sectors)
  reportTime: 3,  // Column D - Report time
  debriefTime: 4  // Column E - Debrief time
};

// CSV validation rules for Flydubai format
export const FLYDUBAI_CSV_VALIDATION: CSVValidationRules = {
  requiredHeaders: ['Date', 'Duties', 'Details', 'Report', 'Debrief'],
  requiredCells: {
    'A1': 'flydubai' // A1 cell must contain "flydubai"
  },
  monthExtractionCell: 'C2', // C2 cell contains month information
  dataStartRow: 5, // Data typically starts at row 5 (0-indexed: row 4)
  dataEndMarker: 'Total Hours and Statistics',
  skipRows: [3, 4] // Skip rows 3 and 4 (0-indexed: rows 2 and 3)
};

// Flydubai flight number pattern (FZ followed by 1-4 digits)
// Supports short flight numbers like FZ43, FZ59
export const FLYDUBAI_FLIGHT_PATTERN = /^FZ\d{1,4}$/;

// Flydubai sector pattern (IATA codes with dash)
export const FLYDUBAI_SECTOR_PATTERN = /^[A-Z]{3}\s*-\s*[A-Z]{3}$/;

// Time format patterns for Flydubai
export const FLYDUBAI_TIME_FORMATS = {
  standard: /^\d{1,2}:\d{2}$/, // HH:MM
  crossDay: /^\d{1,2}:\d{2}[¹²³⁴⁵⁶⁷⁸⁹]$/, // HH:MM with superscript
  specialCharacters: ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '?'] // Characters to clean
};

// Business rules for Flydubai operations
export const FLYDUBAI_BUSINESS_RULES = {
  minDutyHours: 0.5,   // Minimum duty hours
  maxDutyHours: 14,    // Maximum duty hours per day
  minRestHours: 8,     // Minimum rest hours between duties
  maxRestHours: 72,    // Maximum rest hours for per diem calculation
  asbyFixedHours: 4    // Fixed hours for Airport Standby
};

// Complete Flydubai configuration
export const FLYDUBAI_CONFIG: AirlineConfig = {
  name: 'Flydubai',
  code: 'flydubai',
  
  salaryRates: FLYDUBAI_RATES,
  
  csvConfig: {
    columnMapping: FLYDUBAI_CSV_COLUMNS,
    validationRules: FLYDUBAI_CSV_VALIDATION,
    parser: new FlydubaiCSVParser()
  },
  
  positions: ['CCM', 'SCCM'],
  
  flightNumberPattern: FLYDUBAI_FLIGHT_PATTERN,
  sectorPattern: FLYDUBAI_SECTOR_PATTERN,
  timeFormats: FLYDUBAI_TIME_FORMATS,
  businessRules: FLYDUBAI_BUSINESS_RULES
};

// Helper functions for Flydubai-specific operations

/**
 * Validates if a flight number is a valid Flydubai flight
 */
export function isValidFlydubaiFlightNumber(flightNumber: string): boolean {
  return FLYDUBAI_FLIGHT_PATTERN.test(flightNumber.toUpperCase());
}

/**
 * Validates if a sector follows Flydubai format
 */
export function isValidFlydubaiSector(sector: string): boolean {
  return FLYDUBAI_SECTOR_PATTERN.test(sector.toUpperCase());
}

/**
 * Checks if an airport is a Flydubai base
 */
export function isFlydubaiBase(airportCode: string): boolean {
  const flydubaiBases = ['DXB']; // Dubai International is the main base
  return flydubaiBases.includes(airportCode.toUpperCase());
}

/**
 * Gets common Flydubai destinations
 */
export function getFlydubaiDestinations(): string[] {
  return [
    // Middle East
    'DOH', 'KWI', 'BAH', 'MCT', 'RUH', 'JED', 'DMM',
    // Europe
    'VIE', 'PRG', 'BUD', 'WAW', 'BEG', 'SOF', 'OTP',
    // Asia
    'DEL', 'BOM', 'CCU', 'COK', 'TRV', 'CMB', 'KTM',
    // Africa
    'CAI', 'KRT', 'ADD', 'NBO', 'DAR', 'JNB',
    // CIS
    'SVO', 'VKO', 'LED', 'KZN', 'ALA', 'TAS', 'FRU'
  ];
}

/**
 * Determines if a route is domestic (within UAE)
 */
export function isDomesticRoute(sector: string): boolean {
  const uaeAirports = ['DXB', 'AUH', 'SHJ', 'RKT', 'AAN', 'DWC'];
  const airports = sector.split('-').map(code => code.trim().toUpperCase());
  
  return airports.every(airport => uaeAirports.includes(airport));
}

/**
 * Gets typical turnaround destinations from DXB
 */
export function getTurnaroundDestinations(): string[] {
  return [
    'CMB', 'COK', 'TRV', 'CCU', 'DEL', 'BOM', // India/Sri Lanka
    'KTM', 'DAC', // Nepal/Bangladesh
    'DOH', 'KWI', 'BAH', 'MCT', // GCC
    'CAI', 'AMM', 'BGW', // Middle East
    'VIE', 'PRG', 'BUD', // Europe
    'KZN', 'SVO', 'VKO' // Russia/CIS
  ];
}

/**
 * Estimates if a route is likely a turnaround based on destination
 */
export function isLikelyTurnaround(sectors: string[]): boolean {
  if (sectors.length < 2) return false;
  
  const turnaroundDestinations = getTurnaroundDestinations();
  const firstSector = sectors[0];
  const lastSector = sectors[sectors.length - 1];
  
  // Check if it starts from DXB and returns to DXB
  if (firstSector.startsWith('DXB-') && lastSector.endsWith('-DXB')) {
    const destination = firstSector.split('-')[1];
    return turnaroundDestinations.includes(destination);
  }
  
  return false;
}

/**
 * Gets salary rate for a specific position
 * Overloaded to support date-aware rate selection
 */
export function getFlydubaiRate(
  position: 'CCM' | 'SCCM',
  rateType: 'hourly' | 'perDiem' | 'basic' | 'housing' | 'transport',
  year?: number,
  month?: number
): number {
  const rates = year && month
    ? getPositionRatesForDate(position, year, month)
    : FLYDUBAI_RATES[position];

  switch (rateType) {
    case 'hourly':
      return rates.hourlyRate;
    case 'perDiem':
      return rates.perDiemRate;
    case 'basic':
      return rates.basicSalary;
    case 'housing':
      return rates.housingAllowance;
    case 'transport':
      return rates.transportAllowance;
    default:
      throw new Error(`Unknown rate type: ${rateType}`);
  }
}

/**
 * Calculates expected monthly minimums for Flydubai crew
 * Overloaded to support date-aware rate selection
 */
export function getFlydubaiMonthlyMinimums(
  position: 'CCM' | 'SCCM',
  year?: number,
  month?: number
) {
  const rates = year && month
    ? getPositionRatesForDate(position, year, month)
    : FLYDUBAI_RATES[position];
  const fixedSalary = rates.basicSalary + rates.housingAllowance + rates.transportAllowance;

  return {
    fixedSalary,
    minimumFlightHours: 80, // Typical minimum flight hours
    minimumFlightPay: 80 * rates.hourlyRate,
    minimumTotalSalary: fixedSalary + (80 * rates.hourlyRate)
  };
}

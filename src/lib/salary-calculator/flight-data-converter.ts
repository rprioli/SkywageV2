/**
 * Flight Data Conversion Utilities for Skywage Salary Calculator
 * Converts FlightDuty objects to ManualFlightEntryData format for form population
 * Handles all duty types including complex layover flight conversions
 */

import { FlightDuty, TimeValue } from '@/types/salary-calculator';
import { ManualFlightEntryData } from './manual-entry-validation';
import { extractFlightNumbers, extractAirportCodes } from './input-transformers';

/**
 * Converts a TimeValue object to HH:MM string format
 */
export function formatTimeForInput(timeValue: TimeValue | null | undefined): string {
  if (!timeValue) return '';
  
  const hours = Math.floor(timeValue.hours);
  const minutes = Math.floor(timeValue.minutes);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Converts a Date object to YYYY-MM-DD string format
 */
export function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return '';
  
  return date.toISOString().split('T')[0];
}

/**
 * Validates that a FlightDuty object has the required fields for conversion
 */
export function validateFlightDutyForConversion(flightDuty: FlightDuty): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!flightDuty.date) {
    errors.push('Flight duty date is required');
  }
  
  if (!flightDuty.dutyType) {
    errors.push('Flight duty type is required');
  }
  
  if (!flightDuty.reportTime && flightDuty.dutyType !== 'off') {
    errors.push('Report time is required for non-off duties');
  }
  
  if (!flightDuty.debriefTime && flightDuty.dutyType !== 'off') {
    errors.push('Debrief time is required for non-off duties');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Converts a single FlightDuty object to ManualFlightEntryData format
 * Note: This handles individual flight duties. For layover pairs, use convertLayoverPairToFormData
 */
export function flightDutyToFormData(flightDuty: FlightDuty): ManualFlightEntryData {
  // Validate input
  const validation = validateFlightDutyForConversion(flightDuty);
  if (!validation.valid) {
    throw new Error(`Invalid FlightDuty for conversion: ${validation.errors.join(', ')}`);
  }
  
  // Convert flight numbers from FZ-prefixed to digits-only format
  const convertedFlightNumbers = flightDuty.flightNumbers && flightDuty.flightNumbers.length > 0
    ? extractFlightNumbers(flightDuty.flightNumbers)
    : [''];

  // Convert sectors from sector strings to individual airport codes
  const convertedSectors = flightDuty.sectors && flightDuty.sectors.length > 0
    ? extractAirportCodes(flightDuty.sectors)
    : [''];

  // Base conversion for all duty types
  const formData: ManualFlightEntryData = {
    date: formatDateForInput(flightDuty.date),
    dutyType: flightDuty.dutyType,
    flightNumbers: convertedFlightNumbers,
    sectors: convertedSectors,
    reportTime: formatTimeForInput(flightDuty.reportTime),
    debriefTime: formatTimeForInput(flightDuty.debriefTime),
    isCrossDay: flightDuty.isCrossDay || false
  };

  // Ensure we have at least empty strings for form fields
  if (formData.flightNumbers.length === 0) {
    formData.flightNumbers = [''];
  }

  if (formData.sectors.length === 0) {
    formData.sectors = [''];
  }
  
  return formData;
}



/**
 * Identifies if a FlightDuty is part of a layover pair by checking for matching layover flights
 * Returns the paired flight if found, null otherwise
 */
export function findLayoverPair(
  targetFlight: FlightDuty,
  allFlights: FlightDuty[]
): FlightDuty | null {
  if (targetFlight.dutyType !== 'layover') {
    return null;
  }
  
  // Look for another layover flight on a different date with related routing
  // This is a simplified approach - in a real system you might have better pairing logic
  const otherLayovers = allFlights.filter(flight => 
    flight.dutyType === 'layover' && 
    flight.id !== targetFlight.id &&
    flight.userId === targetFlight.userId
  );
  
  // For now, return the closest layover flight by date
  // In a production system, you'd want more sophisticated pairing logic
  if (otherLayovers.length > 0) {
    return otherLayovers.sort((a, b) => 
      Math.abs(a.date.getTime() - targetFlight.date.getTime()) - 
      Math.abs(b.date.getTime() - targetFlight.date.getTime())
    )[0];
  }
  
  return null;
}



/**
 * Utility function to safely extract flight numbers with format conversion and fallbacks
 */
export function extractFlightNumbersFromDuty(flightDuty: FlightDuty, minLength: number = 1): string[] {
  const numbers = flightDuty.flightNumbers || [];

  // Convert from FZ-prefixed to digits-only format
  const convertedNumbers = extractFlightNumbers(numbers);

  // Ensure minimum length with empty strings
  while (convertedNumbers.length < minLength) {
    convertedNumbers.push('');
  }

  return convertedNumbers;
}

/**
 * Utility function to safely extract sectors with format conversion and fallbacks
 */
export function extractSectorsFromDuty(flightDuty: FlightDuty, minLength: number = 1): string[] {
  const sectors = flightDuty.sectors || [];

  // Convert from sector strings to individual airport codes
  const convertedSectors = extractAirportCodes(sectors);

  // Ensure minimum length with empty strings
  while (convertedSectors.length < minLength) {
    convertedSectors.push('');
  }

  return convertedSectors;
}

/**
 * Conversion result with validation and error information
 */
export interface ConversionResult {
  success: boolean;
  data?: ManualFlightEntryData;
  errors: string[];
  warnings: string[];
}





/**
 * Helper to determine if two flights could be a layover pair
 */
export function couldBeLayoverPair(flight1: FlightDuty, flight2: FlightDuty): boolean {
  if (flight1.dutyType !== 'layover' || flight2.dutyType !== 'layover') {
    return false;
  }

  if (flight1.userId !== flight2.userId) {
    return false;
  }

  // Check if dates are within reasonable range (typically 1-7 days apart)
  const daysDiff = Math.abs(
    (flight1.date.getTime() - flight2.date.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysDiff >= 1 && daysDiff <= 7;
}

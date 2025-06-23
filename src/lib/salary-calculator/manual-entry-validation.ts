/**
 * Manual Entry Validation for Skywage Salary Calculator
 * Phase 4: Real-time validation for manual flight entry
 * Following existing validation patterns and using Flydubai config
 */

import {
  FlightDuty,
  DutyType,
  ValidationResult,
  Position
} from '@/types/salary-calculator';
import {
  FLYDUBAI_CONFIG,
  isValidFlydubaiFlightNumber,
  isValidFlydubaiSector,
  parseTimeString,
  calculateDuration
} from '@/lib/salary-calculator';
import {
  transformFlightNumbers,
  transformSectors,
  validateAndTransformInput
} from './input-transformers';

// Manual entry form data
export interface ManualFlightEntryData {
  date: string; // YYYY-MM-DD format
  dutyType: DutyType;
  flightNumbers: string[]; // Multiple for turnarounds
  sectors: string[]; // Multiple for turnarounds
  reportTime: string; // HH:MM format
  debriefTime: string; // HH:MM format
  isCrossDay: boolean; // Whether debrief is next day
}

// Field-level validation result
export interface FieldValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  suggestion?: string;
}

// Form validation result
export interface FormValidationResult extends ValidationResult {
  fieldErrors: {
    [key: string]: string;
  };
  calculatedDutyHours?: number;
  estimatedPay?: number;
}

/**
 * Validates date field
 */
export function validateDate(date: string): FieldValidationResult {
  if (!date) {
    return { valid: false, error: 'Date is required' };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  // Check if date is too far in the past or future
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  if (dateObj < oneYearAgo) {
    return { 
      valid: false, 
      error: 'Date cannot be more than 1 year in the past' 
    };
  }

  if (dateObj > oneYearFromNow) {
    return { 
      valid: false, 
      error: 'Date cannot be more than 1 year in the future' 
    };
  }

  return { valid: true };
}

/**
 * Validates flight numbers based on duty type
 */
export function validateFlightNumbers(
  flightNumbers: string[], 
  dutyType: DutyType
): FieldValidationResult {
  if (dutyType === 'asby' || dutyType === 'sby' || dutyType === 'off') {
    // ASBY/SBY/OFF duties don't require flight numbers
    return { valid: true };
  }

  if (!flightNumbers || flightNumbers.length === 0) {
    return { valid: false, error: 'At least one flight number is required' };
  }

  // Remove empty entries
  const validNumbers = flightNumbers.filter(num => num.trim() !== '');
  
  if (validNumbers.length === 0) {
    return { valid: false, error: 'At least one flight number is required' };
  }

  // Transform simplified input to expected format and validate
  try {
    const transformedNumbers = transformFlightNumbers(validNumbers);

    // Validate each number (original format should be 3-4 digits)
    for (let i = 0; i < validNumbers.length; i++) {
      const originalNumber = validNumbers[i];
      const transformedNumber = transformedNumbers[i];

      // Check if original is valid number format (3-4 digits)
      if (!/^\d{3,4}$/.test(originalNumber.trim())) {
        return {
          valid: false,
          error: `Invalid flight number: ${originalNumber}`,
          suggestion: 'Flight numbers should be 3-4 digits (e.g., 123, 1234)'
        };
      }

      // Validate transformed number
      if (!isValidFlydubaiFlightNumber(transformedNumber)) {
        return {
          valid: false,
          error: `Invalid flight number: ${originalNumber}`,
          suggestion: 'Flight numbers should be 3-4 digits'
        };
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Error validating flight numbers',
      suggestion: 'Please check flight number format'
    };
  }

  // Check for duplicates
  const uniqueNumbers = new Set(validNumbers.map(num => num.toUpperCase()));
  if (uniqueNumbers.size !== validNumbers.length) {
    return { valid: false, error: 'Duplicate flight numbers are not allowed' };
  }

  // Validate based on duty type
  if (dutyType === 'layover' && validNumbers.length > 1) {
    return { 
      valid: false, 
      error: 'Layover duties should have only one flight number',
      suggestion: 'Use turnaround type for multiple flights'
    };
  }

  if (dutyType === 'turnaround' && validNumbers.length < 2) {
    return { 
      valid: true, 
      warning: 'Turnarounds typically have multiple flight numbers'
    };
  }

  return { valid: true };
}

/**
 * Validates sectors based on duty type
 * Now supports individual airport codes (e.g., ['DXB', 'KHI'] instead of ['DXB-KHI'])
 */
export function validateSectors(
  airportCodes: string[],
  dutyType: DutyType
): FieldValidationResult {
  if (dutyType === 'asby' || dutyType === 'sby' || dutyType === 'off') {
    // ASBY/SBY/OFF duties don't require sectors
    return { valid: true };
  }

  if (!airportCodes || airportCodes.length === 0) {
    return { valid: false, error: 'At least one airport is required' };
  }

  // Remove empty entries
  const validCodes = airportCodes.filter(code => code.trim() !== '');

  if (validCodes.length === 0) {
    return { valid: false, error: 'At least one airport is required' };
  }

  // Validate each airport code (should be 3 letters)
  for (const code of validCodes) {
    if (!/^[A-Z]{3}$/.test(code.trim().toUpperCase())) {
      return {
        valid: false,
        error: `Invalid airport code: ${code}`,
        suggestion: 'Airport codes should be 3 letters (e.g., DXB, KHI)'
      };
    }
  }

  // Transform to sectors and validate
  try {
    const transformedSectors = transformSectors(validCodes);

    // Validate transformed sectors
    for (const sector of transformedSectors) {
      if (!isValidFlydubaiSector(sector)) {
        return {
          valid: false,
          error: `Invalid route: ${sector}`,
          suggestion: 'Please check airport codes'
        };
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Error validating route',
      suggestion: 'Please check airport codes'
    };
  }

  // Validate based on duty type
  if (dutyType === 'layover' && validCodes.length > 2) {
    return {
      valid: false,
      error: 'Layover duties should have only 2 airports (origin and destination)',
      suggestion: 'Use turnaround type for multiple stops'
    };
  }

  if (dutyType === 'layover' && validCodes.length < 2) {
    return {
      valid: false,
      error: 'Layover duties require both origin and destination airports'
    };
  }

  return { valid: true };
}

/**
 * Validates time format
 */
export function validateTime(time: string, fieldName: string): FieldValidationResult {
  if (!time) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return { 
      valid: false, 
      error: `Invalid ${fieldName.toLowerCase()} format`,
      suggestion: 'Use HH:MM format (e.g., 09:30)'
    };
  }

  return { valid: true };
}

/**
 * Validates time sequence (report before debrief)
 */
export function validateTimeSequence(
  reportTime: string, 
  debriefTime: string, 
  isCrossDay: boolean
): FieldValidationResult {
  const reportValidation = validateTime(reportTime, 'Report time');
  if (!reportValidation.valid) return reportValidation;

  const debriefValidation = validateTime(debriefTime, 'Debrief time');
  if (!debriefValidation.valid) return debriefValidation;

  try {
    const reportTimeObj = parseTimeString(reportTime);
    const debriefTimeObj = parseTimeString(debriefTime);

    if (!reportTimeObj || !debriefTimeObj) {
      return { valid: false, error: 'Invalid time format' };
    }

    // For validation, we need to check the raw time sequence first
    const reportMinutes = reportTimeObj.totalMinutes;
    const debriefMinutes = debriefTimeObj.totalMinutes;

    // If debrief is before report on same day and cross-day is not enabled, it's invalid
    if (debriefMinutes <= reportMinutes && !isCrossDay) {
      return {
        valid: false,
        error: 'Debrief time must be after report time',
        suggestion: 'Enable cross-day if debrief is next day'
      };
    }

    // Now calculate actual duration for further validation
    const duration = calculateDuration(reportTimeObj, debriefTimeObj, isCrossDay);

    if (duration <= 0) {
      return {
        valid: false,
        error: 'Debrief time must be after report time',
        suggestion: isCrossDay ? 'Check if this is a cross-day flight' : 'Enable cross-day if debrief is next day'
      };
    }

    // Warn about unusually long duties
    if (duration > 16) {
      return { 
        valid: true, 
        warning: `Very long duty (${duration.toFixed(2)} hours). Please verify times.`
      };
    }

    // Warn about very short duties
    if (duration < 1) {
      return { 
        valid: true, 
        warning: `Very short duty (${duration.toFixed(2)} hours). Please verify times.`
      };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Error calculating duty duration' };
  }
}

/**
 * Validates complete manual entry form
 */
export function validateManualEntry(
  data: ManualFlightEntryData,
  position: Position
): FormValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fieldErrors: { [key: string]: string } = {};

  // Validate date
  const dateValidation = validateDate(data.date);
  if (!dateValidation.valid) {
    fieldErrors.date = dateValidation.error!;
    errors.push(dateValidation.error!);
  }

  // Validate flight numbers
  const flightNumbersValidation = validateFlightNumbers(data.flightNumbers, data.dutyType);
  if (!flightNumbersValidation.valid) {
    fieldErrors.flightNumbers = flightNumbersValidation.error!;
    errors.push(flightNumbersValidation.error!);
  } else if (flightNumbersValidation.warning) {
    warnings.push(flightNumbersValidation.warning);
  }

  // Validate sectors
  const sectorsValidation = validateSectors(data.sectors, data.dutyType);
  if (!sectorsValidation.valid) {
    fieldErrors.sectors = sectorsValidation.error!;
    errors.push(sectorsValidation.error!);
  }

  // Validate time sequence
  const timeValidation = validateTimeSequence(
    data.reportTime, 
    data.debriefTime, 
    data.isCrossDay
  );
  if (!timeValidation.valid) {
    fieldErrors.timeSequence = timeValidation.error!;
    errors.push(timeValidation.error!);
  } else if (timeValidation.warning) {
    warnings.push(timeValidation.warning);
  }

  // Calculate duty hours and estimated pay if validation passes
  let calculatedDutyHours: number | undefined;
  let estimatedPay: number | undefined;

  if (errors.length === 0) {
    try {
      const reportTimeObj = parseTimeString(data.reportTime);
      const debriefTimeObj = parseTimeString(data.debriefTime);
      
      if (reportTimeObj && debriefTimeObj) {
        calculatedDutyHours = calculateDuration(reportTimeObj, debriefTimeObj, data.isCrossDay);
        
        // Calculate estimated pay based on position and duty type
        const rates = FLYDUBAI_CONFIG.salaryRates[position];
        if (data.dutyType === 'asby') {
          estimatedPay = rates.asbyHours * rates.hourlyRate;
        } else {
          estimatedPay = calculatedDutyHours * rates.hourlyRate;
        }
      }
    } catch (error) {
      warnings.push('Could not calculate estimated pay');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fieldErrors,
    calculatedDutyHours,
    estimatedPay
  };
}

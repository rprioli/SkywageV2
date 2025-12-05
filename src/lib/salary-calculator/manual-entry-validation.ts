/**
 * Manual Entry Validation for Skywage Salary Calculator
 * Phase 4: Real-time validation for manual flight entry
 * Following existing validation patterns and using Flydubai config
 */

import {
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
  transformSectors
} from './input-transformers';

// Manual entry form data
export interface ManualFlightEntryData {
  date: string; // YYYY-MM-DD format - outbound flight date
  dutyType: DutyType;
  flightNumbers: string[]; // Multiple for turnarounds and layovers (2 flights)
  sectors: string[]; // Multiple for turnarounds and layovers
  reportTime: string; // HH:MM format - for turnaround/asby, or outbound report for layover
  debriefTime: string; // HH:MM format - for turnaround/asby, or inbound debrief for layover
  isCrossDay: boolean; // Whether debrief is next day (auto-detected)
  // Layover-specific fields
  inboundDate?: string; // YYYY-MM-DD format - inbound flight date for layover
  reportTimeInbound?: string; // HH:MM format - inbound report time for layover
  debriefTimeOutbound?: string; // HH:MM format - outbound debrief time for layover
  isCrossDayOutbound?: boolean; // Whether outbound debrief is next day (auto-detected)
  isCrossDayInbound?: boolean; // Whether inbound debrief is next day (auto-detected)
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
 * @param date - Date string in YYYY-MM-DD format
 * @param selectedYear - The year selected by the user
 * @param isInbound - Whether this is an inbound date (allows next year for cross-year layovers)
 */
export function validateDate(date: string, selectedYear: number, isInbound = false): FieldValidationResult {
  if (!date) {
    return { valid: false, error: 'Date is required' };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  const dateYear = dateObj.getFullYear();

  // For outbound dates: must be within selected year
  if (!isInbound) {
    if (dateYear !== selectedYear) {
      return {
        valid: false,
        error: `Date must be within ${selectedYear}`
      };
    }
  } else {
    // For inbound dates: can be in selected year or next year (for cross-year layovers)
    if (dateYear !== selectedYear && dateYear !== selectedYear + 1) {
      return {
        valid: false,
        error: `Date must be within ${selectedYear} or ${selectedYear + 1}`
      };
    }
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
  if (dutyType === 'asby' || dutyType === 'recurrent' || dutyType === 'sby' || dutyType === 'off' || dutyType === 'business_promotion') {
    // ASBY/Recurrent/SBY/OFF/Business Promotion duties don't require flight numbers
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
  } catch {
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
  if (dutyType === 'layover' && validNumbers.length !== 2) {
    return {
      valid: false,
      error: 'Layover duties require exactly two flight numbers (outbound and inbound)',
      suggestion: 'Enter both outbound and inbound flight numbers'
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
  if (dutyType === 'asby' || dutyType === 'recurrent' || dutyType === 'sby' || dutyType === 'off' || dutyType === 'business_promotion') {
    // ASBY/Recurrent/SBY/OFF/Business Promotion duties don't require sectors
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
  } catch {
    return {
      valid: false,
      error: 'Error validating route',
      suggestion: 'Please check airport codes'
    };
  }

  // Validate based on duty type
  if (dutyType === 'layover' && validCodes.length !== 4) {
    return {
      valid: false,
      error: 'Layover duties require 4 airports (outbound: origin-destination, inbound: origin-destination)',
      suggestion: 'Enter all 4 airports for the layover route'
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

    if (!reportTimeObj.success || !debriefTimeObj.success || !reportTimeObj.timeValue || !debriefTimeObj.timeValue) {
      return { valid: false, error: 'Invalid time format' };
    }

    // For validation, we need to check the raw time sequence first
    const reportMinutes = reportTimeObj.timeValue.totalMinutes;
    const debriefMinutes = debriefTimeObj.timeValue.totalMinutes;

    // If debrief is before report on same day and cross-day is not enabled, it's invalid
    if (debriefMinutes <= reportMinutes && !isCrossDay) {
      return {
        valid: false,
        error: 'Debrief time must be after report time',
        suggestion: 'Enable cross-day if debrief is next day'
      };
    }

    // Now calculate actual duration for further validation
    const duration = calculateDuration(reportTimeObj.timeValue, debriefTimeObj.timeValue, isCrossDay);

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
  } catch {
    return { valid: false, error: 'Error calculating duty duration' };
  }
}

/**
 * Validates complete manual entry form
 */
export function validateManualEntry(
  data: ManualFlightEntryData,
  position: Position,
  selectedYear: number
): FormValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fieldErrors: { [key: string]: string } = {};

  // Validate outbound date (must be in selected year)
  const dateValidation = validateDate(data.date, selectedYear, false);
  if (!dateValidation.valid) {
    fieldErrors.date = dateValidation.error!;
    errors.push(dateValidation.error!);
  }

  // Validate inbound date for layover duties
  if (data.dutyType === 'layover') {
    if (!data.inboundDate || data.inboundDate.trim() === '') {
      fieldErrors.inboundDate = 'Inbound date is required for layover duties';
      errors.push('Inbound date is required for layover duties');
    } else {
      // Inbound date can be in selected year or next year (for cross-year layovers)
      const inboundDateValidation = validateDate(data.inboundDate, selectedYear, true);
      if (!inboundDateValidation.valid) {
        fieldErrors.inboundDate = inboundDateValidation.error!;
        errors.push(inboundDateValidation.error!);
      } else if (data.date && new Date(data.inboundDate) < new Date(data.date)) {
        fieldErrors.inboundDate = 'Inbound date cannot be before outbound date';
        errors.push('Inbound date cannot be before outbound date');
      }
    }
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

  // Validate time sequence (skip for Day Off - no times required)
  if (data.dutyType !== 'off') {
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
  }

  // Calculate duty hours and estimated pay if validation passes
  let calculatedDutyHours: number | undefined;
  let estimatedPay: number | undefined;

  if (errors.length === 0) {
    // Day Off has no duty hours or pay
    if (data.dutyType === 'off') {
      calculatedDutyHours = 0;
      estimatedPay = 0;
    } else {
      try {
        const reportTimeObj = parseTimeString(data.reportTime);
        const debriefTimeObj = parseTimeString(data.debriefTime);

        if (reportTimeObj.success && debriefTimeObj.success && reportTimeObj.timeValue && debriefTimeObj.timeValue) {
          calculatedDutyHours = calculateDuration(reportTimeObj.timeValue, debriefTimeObj.timeValue, data.isCrossDay);

          // Calculate estimated pay based on position and duty type
          const rates = FLYDUBAI_CONFIG.salaryRates[position];
          if (data.dutyType === 'asby') {
            estimatedPay = rates.asbyHours * rates.hourlyRate;
          } else {
            estimatedPay = calculatedDutyHours * rates.hourlyRate;
          }
        }
      } catch {
        warnings.push('Could not calculate estimated pay');
      }
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

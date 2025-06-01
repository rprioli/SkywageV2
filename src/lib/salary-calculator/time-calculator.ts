/**
 * Time calculation utilities for Skywage Salary Calculator
 * Handles time parsing, cross-day calculations, and duration computations
 * Following existing utility patterns in the codebase
 */

import { TimeValue, TimeParseResult } from '@/types/salary-calculator';

/**
 * Creates a TimeValue object from hours and minutes
 */
export function createTimeValue(hours: number, minutes: number): TimeValue {
  const totalMinutes = hours * 60 + minutes;
  const totalHours = totalMinutes / 60;
  
  return {
    hours,
    minutes,
    totalMinutes,
    totalHours
  };
}

/**
 * Parses time string with support for cross-day indicators
 * Handles formats: "09:20", "15:30", "05:45¹", "02:25¹", "03:45?¹"
 */
export function parseTimeString(timeStr: string): TimeParseResult {
  if (!timeStr || typeof timeStr !== 'string') {
    return {
      success: false,
      error: 'Invalid time string provided',
      isCrossDay: false
    };
  }

  // Clean the time string - remove special characters
  const cleanedTime = timeStr.replace(/[?¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '');
  
  // Check for cross-day indicator
  const isCrossDay = /[¹²³⁴⁵⁶⁷⁸⁹]/.test(timeStr);
  
  // Parse HH:MM format
  const timeMatch = cleanedTime.match(/^(\d{1,2}):(\d{2})$/);
  
  if (!timeMatch) {
    return {
      success: false,
      error: `Invalid time format: ${timeStr}. Expected HH:MM format.`,
      isCrossDay
    };
  }

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);

  // Validate time values
  if (hours < 0 || hours > 23) {
    return {
      success: false,
      error: `Invalid hours: ${hours}. Must be between 0-23.`,
      isCrossDay
    };
  }

  if (minutes < 0 || minutes > 59) {
    return {
      success: false,
      error: `Invalid minutes: ${minutes}. Must be between 0-59.`,
      isCrossDay
    };
  }

  return {
    success: true,
    timeValue: createTimeValue(hours, minutes),
    isCrossDay
  };
}

/**
 * Calculates duration between two times, handling cross-day scenarios
 */
export function calculateDuration(
  startTime: TimeValue,
  endTime: TimeValue,
  isEndTimeCrossDay: boolean = false
): number {
  let startMinutes = startTime.totalMinutes;
  let endMinutes = endTime.totalMinutes;

  // Handle cross-day scenario
  if (isEndTimeCrossDay) {
    endMinutes += 24 * 60; // Add 24 hours in minutes
  }

  // If end time is before start time (same day), assume next day
  if (endMinutes <= startMinutes && !isEndTimeCrossDay) {
    endMinutes += 24 * 60;
  }

  const durationMinutes = endMinutes - startMinutes;
  
  if (durationMinutes < 0) {
    throw new Error('Invalid time sequence: end time cannot be before start time');
  }

  return durationMinutes / 60; // Return decimal hours
}

/**
 * Calculates rest period between two flights
 */
export function calculateRestPeriod(
  flight1DebriefTime: TimeValue,
  flight1DebriefCrossDay: boolean,
  flight2ReportTime: TimeValue,
  flight2ReportCrossDay: boolean,
  daysBetween: number = 0
): number {
  let debrief = flight1DebriefTime.totalMinutes;
  let report = flight2ReportTime.totalMinutes;

  // Apply cross-day adjustments
  if (flight1DebriefCrossDay) {
    debrief += 24 * 60;
  }

  if (flight2ReportCrossDay) {
    report += 24 * 60;
  }

  // Add days between flights
  report += daysBetween * 24 * 60;

  // If report time is before debrief time, assume next day
  if (report <= debrief) {
    report += 24 * 60;
  }

  const restMinutes = report - debrief;
  
  if (restMinutes < 0) {
    throw new Error('Invalid rest period: report time cannot be before debrief time');
  }

  return restMinutes / 60; // Return decimal hours
}

/**
 * Formats TimeValue back to HH:MM string
 */
export function formatTimeValue(timeValue: TimeValue): string {
  const hours = Math.floor(timeValue.hours);
  const minutes = Math.floor(timeValue.minutes);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Formats decimal hours to HH:MM format
 */
export function formatDecimalHours(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Validates that a time sequence is logical
 */
export function validateTimeSequence(
  reportTime: TimeValue,
  debriefTime: TimeValue,
  isDebriefCrossDay: boolean
): { valid: boolean; error?: string } {
  try {
    const duration = calculateDuration(reportTime, debriefTime, isDebriefCrossDay);
    
    if (duration <= 0) {
      return {
        valid: false,
        error: 'Duty duration must be greater than 0'
      };
    }

    if (duration > 24) {
      return {
        valid: false,
        error: 'Duty duration cannot exceed 24 hours'
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: (error as Error).message
    };
  }
}

/**
 * Converts date and time to full timestamp
 */
export function createTimestamp(date: Date, timeValue: TimeValue, isCrossDay: boolean = false): Date {
  const timestamp = new Date(date);
  timestamp.setHours(timeValue.hours, timeValue.minutes, 0, 0);
  
  if (isCrossDay) {
    timestamp.setDate(timestamp.getDate() + 1);
  }
  
  return timestamp;
}

/**
 * Calculates the difference between two timestamps in decimal hours
 */
export function calculateTimestampDuration(startTimestamp: Date, endTimestamp: Date): number {
  const diffMs = endTimestamp.getTime() - startTimestamp.getTime();
  
  if (diffMs < 0) {
    throw new Error('End timestamp cannot be before start timestamp');
  }
  
  return diffMs / (1000 * 60 * 60); // Convert to decimal hours
}

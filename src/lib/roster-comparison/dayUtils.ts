/**
 * Day generation utilities for Roster Comparison Grid
 * Phase 4a - Friends Feature
 */

import { CalendarDay } from './types';

/**
 * Day name abbreviations
 */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Month abbreviations
 */
const MONTH_ABBREVS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

/**
 * Full month names
 */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  // month is 1-12
  return new Date(year, month, 0).getDate();
}

/**
 * Get the full name of a month (1-12)
 */
export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || '';
}

/**
 * Generate all days for a given month
 * @param year - Full year (e.g., 2025)
 * @param month - Month number (1-12)
 * @returns Array of CalendarDay objects for the month
 */
export function generateMonthDays(year: number, month: number): CalendarDay[] {
  const daysInMonth = getDaysInMonth(year, month);
  const days: CalendarDay[] = [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const date = new Date(year, month - 1, dayNum);
    const dayOfWeek = date.getDay();
    
    days.push({
      date,
      dayNumber: dayNum,
      dayName: DAY_NAMES[dayOfWeek],
      monthAbbrev: MONTH_ABBREVS[month - 1],
      isToday: date.getTime() === today.getTime(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }
  
  return days;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Format a date as YYYY-MM-DD string for comparison
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the day of year for a date (1-366)
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Calculate the number of days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 1000 * 60 * 60 * 24;
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diff / oneDay);
}


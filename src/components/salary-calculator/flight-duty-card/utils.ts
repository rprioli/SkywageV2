/**
 * Flight Duty Card Utilities
 * Formatting functions and configurations for flight duty display
 */

import {
  RotateCcw,
  Hotel,
  Timer,
  Clock,
  Calendar,
  BookOpen,
  LucideIcon
} from 'lucide-react';

/**
 * Formats a number as AED currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats a TimeValue object to HH:MM string
 */
export function formatTime(timeValue: { hours: number; minutes: number }): string {
  return `${timeValue.hours.toString().padStart(2, '0')}:${timeValue.minutes.toString().padStart(2, '0')}`;
}

/**
 * Formats decimal hours to HH:MM string
 */
export function formatDecimalHoursToHHMM(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Formats decimal hours to "Xh XXm" string
 */
export function formatHoursMinutes(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

/**
 * Formats time with date in DD/MM format
 */
export function formatTimeWithDate(
  timeValue: { hours: number; minutes: number },
  date: Date,
  isCrossDay: boolean,
  isDebriefing: boolean = false
): string {
  const timeStr = formatTime(timeValue);

  // For cross-day flights, debriefing time should show the next day's date
  const displayDate = (isDebriefing && isCrossDay)
    ? new Date(date.getTime() + 24 * 60 * 60 * 1000)
    : date;

  const dateStr = displayDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit'
  });
  return `${timeStr} ${dateStr}`;
}

/**
 * Parses sector string into array of airports
 */
export function parseSectors(sectorString: string): string[] {
  if (sectorString.includes(' → ')) {
    return sectorString.split(' → ').map(s => s.trim());
  } else if (sectorString.includes(' - ')) {
    return sectorString.split(' - ').map(s => s.trim());
  } else if (sectorString.includes('-')) {
    return sectorString.split('-').map(s => s.trim());
  } else {
    return [sectorString.trim()];
  }
}

/**
 * Extracts destination from sectors array
 */
export function getDestination(sectors: string[]): string {
  const firstSector = sectors[0] || '';
  const airports = parseSectors(firstSector);

  if (airports.length >= 2) {
    return airports[0] === 'DXB' ? airports[1] : airports[0];
  }
  return '';
}

/**
 * Checks if flight is outbound (DXB → destination)
 */
export function isOutboundFlight(sectors: string[]): boolean {
  const firstSector = sectors[0] || '';
  const airports = parseSectors(firstSector);
  return airports.length >= 2 && airports[0] === 'DXB';
}

/**
 * Checks if flight is inbound (destination → DXB)
 */
export function isInboundFlight(sectors: string[]): boolean {
  const firstSector = sectors[0] || '';
  const airports = parseSectors(firstSector);
  return airports.length >= 2 && airports[airports.length - 1] === 'DXB';
}

/**
 * Duty type configuration interface
 */
export interface DutyTypeConfig {
  bgColor: string;
  textColor: string;
  icon: LucideIcon;
  label: string;
}

/**
 * Gets configuration for a duty type
 */
export function getDutyTypeConfig(dutyType: string): DutyTypeConfig {
  const baseConfig = {
    bgColor: 'bg-[#4C49ED]',
    textColor: 'text-white'
  };

  switch (dutyType) {
    case 'turnaround':
      return { ...baseConfig, icon: RotateCcw, label: 'Turnaround' };
    case 'layover':
      return { ...baseConfig, icon: Hotel, label: 'Layover' };
    case 'asby':
      return { ...baseConfig, icon: Timer, label: 'Airport Standby' };
    case 'recurrent':
      return { ...baseConfig, icon: BookOpen, label: 'Ground Duty' };
    case 'sby':
      return { ...baseConfig, icon: Clock, label: 'Home Standby' };
    case 'business_promotion':
      return { ...baseConfig, icon: BookOpen, label: 'Business Promotion' };
    case 'off':
      return { ...baseConfig, icon: Calendar, label: 'Off' };
    case 'rest':
      return { ...baseConfig, icon: Calendar, label: 'Rest' };
    case 'annual_leave':
      return { ...baseConfig, icon: Calendar, label: 'Annual Leave' };
    default:
      return { ...baseConfig, icon: Timer, label: dutyType.toUpperCase() };
  }
}

/**
 * Checks if sectors look like a turnaround pattern
 */
export function isTurnaroundPattern(sectors: string[]): boolean {
  if (sectors.length >= 2) {
    const airports = sectors.flatMap(sector => sector.split('-').map(airport => airport.trim()));
    return airports.length >= 3 && airports[0] === airports[airports.length - 1];
  }
  return false;
}


/**
 * Tests for Flight Data Conversion Utilities
 * Validates conversion between FlightDuty and ManualFlightEntryData formats
 */

import {
  flightDutyToFormData,
  formatTimeForInput,
  formatDateForInput,
  validateFlightDutyForConversion
} from '../flight-data-converter';
import { FlightDuty, TimeValue } from '@/types/salary-calculator';

// Helper function to create a TimeValue
function createTimeValue(hours: number, minutes: number): TimeValue {
  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
    totalHours: hours + minutes / 60
  };
}

// Helper function to create a basic FlightDuty
function createBasicFlightDuty(overrides: Partial<FlightDuty> = {}): FlightDuty {
  return {
    id: 'test-flight-1',
    userId: 'test-user',
    date: new Date('2024-01-15'),
    flightNumbers: ['FZ123'], // FlightDuty stores with FZ prefix
    sectors: ['DXB-KHI'], // FlightDuty stores as sector strings
    dutyType: 'turnaround',
    reportTime: createTimeValue(6, 30),
    debriefTime: createTimeValue(14, 45),
    dutyHours: 8.25,
    flightPay: 412.5,
    isCrossDay: false,
    dataSource: 'manual',
    month: 1,
    year: 2024,
    ...overrides
  };
}

describe('Flight Data Converter', () => {
  describe('formatTimeForInput', () => {
    it('should format TimeValue to HH:MM string', () => {
      const timeValue = createTimeValue(9, 30);
      expect(formatTimeForInput(timeValue)).toBe('09:30');
    });

    it('should handle null/undefined TimeValue', () => {
      expect(formatTimeForInput(null)).toBe('');
      expect(formatTimeForInput(undefined)).toBe('');
    });

    it('should pad single digits with zeros', () => {
      const timeValue = createTimeValue(6, 5);
      expect(formatTimeForInput(timeValue)).toBe('06:05');
    });
  });

  describe('formatDateForInput', () => {
    it('should format Date to YYYY-MM-DD string', () => {
      const date = new Date('2024-01-15');
      expect(formatDateForInput(date)).toBe('2024-01-15');
    });

    it('should handle null/undefined Date', () => {
      expect(formatDateForInput(null)).toBe('');
      expect(formatDateForInput(undefined)).toBe('');
    });
  });

  describe('validateFlightDutyForConversion', () => {
    it('should validate a complete FlightDuty', () => {
      const flightDuty = createBasicFlightDuty();
      const result = validateFlightDutyForConversion(flightDuty);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const flightDuty = createBasicFlightDuty({
        date: undefined as unknown as Date,
        reportTime: undefined as unknown as TimeValue
      });

      const result = validateFlightDutyForConversion(flightDuty);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Flight duty date is required');
      expect(result.errors).toContain('Report time is required for non-off duties');
    });
  });

  describe('flightDutyToFormData', () => {
    it('should convert turnaround flight to form data', () => {
      const flightDuty = createBasicFlightDuty({
        dutyType: 'turnaround',
        flightNumbers: ['FZ123', 'FZ124'],
        sectors: ['DXB-KHI', 'KHI-DXB']
      });

      const result = flightDutyToFormData(flightDuty);

      expect(result).toEqual({
        date: '2024-01-15',
        dutyType: 'turnaround',
        flightNumbers: ['123', '124'], // Should be digits-only
        sectors: ['DXB', 'KHI', 'KHI', 'DXB'], // Should be individual airport codes
        reportTime: '06:30',
        debriefTime: '14:45',
        isCrossDay: false
      });
    });

    it('should convert ASBY duty to form data', () => {
      const flightDuty = createBasicFlightDuty({
        dutyType: 'asby',
        flightNumbers: [],
        sectors: []
      });

      const result = flightDutyToFormData(flightDuty);

      expect(result.dutyType).toBe('asby');
      expect(result.flightNumbers).toEqual(['']); // Should have at least empty string
      expect(result.sectors).toEqual(['']); // Should have at least empty string
    });

    it('should handle cross-day flights', () => {
      const flightDuty = createBasicFlightDuty({
        isCrossDay: true,
        debriefTime: createTimeValue(2, 15) // Next day
      });

      const result = flightDutyToFormData(flightDuty);

      expect(result.isCrossDay).toBe(true);
      expect(result.debriefTime).toBe('02:15');
    });
  });

});

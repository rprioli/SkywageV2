/**
 * Tests for Flight Data Conversion Utilities
 * Validates conversion between FlightDuty and ManualFlightEntryData formats
 */

import {
  flightDutyToFormData,
  convertLayoverPairToFormData,
  safeConvertFlightDutyForEditing,
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
        date: undefined as any,
        reportTime: undefined as any
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

  describe('convertLayoverPairToFormData', () => {
    it('should convert layover pair to form data', () => {
      const outboundFlight = createBasicFlightDuty({
        dutyType: 'layover',
        date: new Date('2024-01-15'),
        flightNumbers: ['FZ123'],
        sectors: ['DXB-KHI'], // FlightDuty stores as sector strings
        reportTime: createTimeValue(6, 30),
        debriefTime: createTimeValue(10, 45)
      });

      const inboundFlight = createBasicFlightDuty({
        dutyType: 'layover',
        date: new Date('2024-01-17'),
        flightNumbers: ['FZ124'],
        sectors: ['KHI-DXB'], // FlightDuty stores as sector strings
        reportTime: createTimeValue(12, 15),
        debriefTime: createTimeValue(16, 30),
        isCrossDay: false
      });

      const result = convertLayoverPairToFormData(outboundFlight, inboundFlight);

      expect(result).toEqual({
        date: '2024-01-15',
        dutyType: 'layover',
        flightNumbers: ['123', '124'], // Should be digits-only
        sectors: ['DXB', 'KHI', 'KHI', 'DXB'], // Should be individual airport codes
        reportTime: '06:30',
        debriefTimeOutbound: '10:45',
        isCrossDay: false,
        inboundDate: '2024-01-17',
        reportTimeInbound: '12:15',
        debriefTime: '16:30',
        isCrossDayOutbound: false,
        isCrossDayInbound: false
      });
    });

    it('should throw error for non-layover flights', () => {
      const flight1 = createBasicFlightDuty({ dutyType: 'turnaround' });
      const flight2 = createBasicFlightDuty({ dutyType: 'layover' });

      expect(() => {
        convertLayoverPairToFormData(flight1, flight2);
      }).toThrow('Both flights must be layover type');
    });
  });

  describe('safeConvertFlightDutyForEditing', () => {
    it('should return success for valid conversion', () => {
      const flightDuty = createBasicFlightDuty();
      const result = safeConvertFlightDutyForEditing(flightDuty);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for invalid input', () => {
      const result = safeConvertFlightDutyForEditing(null as any);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('FlightDuty object is required');
    });

    it('should add warning for layover without pair', () => {
      const layoverFlight = createBasicFlightDuty({ dutyType: 'layover' });
      const result = safeConvertFlightDutyForEditing(layoverFlight, []);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Layover flight pair not found - editing as individual flight');
    });
  });
});

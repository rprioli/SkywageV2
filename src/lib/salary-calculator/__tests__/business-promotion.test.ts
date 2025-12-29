/**
 * Unit tests for Business Promotion duty calculations
 * Tests that BP duties are paid by rostered duration and included in total hours
 */

import { 
  calculateFlightPay,
  calculateMonthlySalary,
  calculateFlightDuty
} from '../calculation-engine';
import { FlightDuty, Position } from '@/types/salary-calculator';
import { createTimeValue } from '../time-calculator';

describe('Business Promotion Duty Calculations', () => {
  
  describe('BP Pay Calculations', () => {
    test('BP duty from 08:00 to 16:00 pays 8 hours × hourly rate for CCM', () => {
      const dutyHours = 8;
      const position: Position = 'CCM';
      const expectedPay = 8 * 50; // 400 AED
      
      expect(calculateFlightPay(dutyHours, position)).toBe(expectedPay);
    });

    test('BP duty from 08:00 to 16:00 pays 8 hours × hourly rate for SCCM', () => {
      const dutyHours = 8;
      const position: Position = 'SCCM';
      const expectedPay = 8 * 62; // 496 AED
      
      expect(calculateFlightPay(dutyHours, position)).toBe(expectedPay);
    });

    test('BP duty with 6.5 hours pays correctly', () => {
      const dutyHours = 6.5;
      const ccmPay = calculateFlightPay(dutyHours, 'CCM');
      const sccmPay = calculateFlightPay(dutyHours, 'SCCM');
      
      expect(ccmPay).toBe(6.5 * 50); // 325 AED
      expect(sccmPay).toBe(6.5 * 62); // 403 AED
    });
  });

  describe('BP Duty Hours in Monthly Totals', () => {
    test('BP duty hours are included in totalDutyHours', () => {
      const userId = 'test-user';
      const position: Position = 'CCM';
      const month = 1;
      const year = 2025;

      // Create a BP duty with 8 hours
      const bpDuty: FlightDuty = {
        id: 'bp-1',
        userId,
        date: new Date(2025, 0, 15),
        month,
        year,
        flightNumbers: ['BP001'],
        sectors: ['DXB'],
        dutyType: 'business_promotion',
        reportTime: createTimeValue(8, 0),
        debriefTime: createTimeValue(16, 0),
        dutyHours: 8,
        flightPay: 400, // 8 * 50
        isCrossDay: false,
        dataSource: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create a turnaround duty with 5 hours
      const turnaroundDuty: FlightDuty = {
        id: 'ta-1',
        userId,
        date: new Date(2025, 0, 10),
        month,
        year,
        flightNumbers: ['FZ123'],
        sectors: ['DXB', 'DOH', 'DXB'],
        dutyType: 'turnaround',
        reportTime: createTimeValue(6, 0),
        debriefTime: createTimeValue(11, 0),
        dutyHours: 5,
        flightPay: 250, // 5 * 50
        isCrossDay: false,
        dataSource: 'csv',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = calculateMonthlySalary(
        [bpDuty, turnaroundDuty],
        [],
        position,
        month,
        year,
        userId
      );

      // Total duty hours should include both BP (8h) and turnaround (5h) = 13h
      expect(result.monthlyCalculation.totalDutyHours).toBe(13);
      
      // Total flight pay should include both duties
      expect(result.monthlyCalculation.flightPay).toBe(650); // 400 + 250
    });

    test('BP duties are counted in totalFlights summary stat', () => {
      const userId = 'test-user';
      const position: Position = 'CCM';
      const month = 1;
      const year = 2025;

      const bpDuty: FlightDuty = {
        id: 'bp-1',
        userId,
        date: new Date(2025, 0, 15),
        month,
        year,
        flightNumbers: ['BP001'],
        sectors: ['DXB'],
        dutyType: 'business_promotion',
        reportTime: createTimeValue(8, 0),
        debriefTime: createTimeValue(16, 0),
        dutyHours: 8,
        flightPay: 400,
        isCrossDay: false,
        dataSource: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const turnaroundDuty: FlightDuty = {
        id: 'ta-1',
        userId,
        date: new Date(2025, 0, 10),
        month,
        year,
        flightNumbers: ['FZ123'],
        sectors: ['DXB', 'DOH', 'DXB'],
        dutyType: 'turnaround',
        reportTime: createTimeValue(6, 0),
        debriefTime: createTimeValue(11, 0),
        dutyHours: 5,
        flightPay: 250,
        isCrossDay: false,
        dataSource: 'csv',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = calculateMonthlySalary(
        [bpDuty, turnaroundDuty],
        [],
        position,
        month,
        year,
        userId
      );

      // totalFlights should count both BP and turnaround
      expect(result.calculationSummary.totalFlights).toBe(2);
      
      // averageDutyHours should be (8 + 5) / 2 = 6.5
      expect(result.calculationSummary.averageDutyHours).toBe(6.5);
    });
  });

  describe('BP Flight Duty Calculation', () => {
    test('calculateFlightDuty computes BP pay from rostered duty hours', () => {
      const userId = 'test-user';
      const position: Position = 'CCM';
      const month = 1;
      const year = 2025;

      const bpDuty: FlightDuty = {
        id: 'bp-1',
        userId,
        date: new Date(2025, 0, 15),
        month,
        year,
        flightNumbers: ['BP001'],
        sectors: ['DXB'],
        dutyType: 'business_promotion',
        reportTime: createTimeValue(9, 0),
        debriefTime: createTimeValue(15, 30),
        dutyHours: 0, // Not yet calculated
        flightPay: 0, // Not yet calculated
        isCrossDay: false,
        dataSource: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = calculateFlightDuty(bpDuty, position, year, month);

      // Should calculate 6.5 hours (09:00 to 15:30)
      expect(result.flightDuty.dutyHours).toBe(6.5);
      
      // Should calculate 6.5 * 50 = 325 AED
      expect(result.flightDuty.flightPay).toBe(325);
      
      // Should have no errors
      expect(result.errors).toEqual([]);
    });

    test('calculateFlightDuty handles cross-day BP duties', () => {
      const userId = 'test-user';
      const position: Position = 'SCCM';
      const month = 1;
      const year = 2025;

      const bpDuty: FlightDuty = {
        id: 'bp-2',
        userId,
        date: new Date(2025, 0, 20),
        month,
        year,
        flightNumbers: ['BP002'],
        sectors: ['DXB'],
        dutyType: 'business_promotion',
        reportTime: createTimeValue(22, 0), // 22:00
        debriefTime: createTimeValue(6, 0),  // 06:00 next day
        dutyHours: 0,
        flightPay: 0,
        isCrossDay: true,
        dataSource: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = calculateFlightDuty(bpDuty, position, year, month);

      // Should calculate 8 hours (22:00 to 06:00 next day)
      expect(result.flightDuty.dutyHours).toBe(8);
      
      // Should calculate 8 * 62 = 496 AED
      expect(result.flightDuty.flightPay).toBe(496);
      
      // Should have no errors
      expect(result.errors).toEqual([]);
    });
  });
});


/**
 * Unit tests for Business Promotion duty calculations
 * Tests that BP duties use fixed 5 flight hours for both pay and totals
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
    test('BP fixed 5 hours are included in totalDutyHours', () => {
      const userId = 'test-user';
      const position: Position = 'CCM';
      const month = 1;
      const year = 2025;

      // BP duty — dutyHours is fixed 5 regardless of rostered time
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
        dutyHours: 5,
        flightPay: 250, // fixed 5 * 50
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

      // Total duty hours: BP fixed 5h + turnaround 5h = 10h
      expect(result.monthlyCalculation.totalDutyHours).toBe(10);

      // Total flight pay: BP 5*50=250 + turnaround 5*50=250 = 500
      expect(result.monthlyCalculation.flightPay).toBe(500);
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
        dutyHours: 5,
        flightPay: 250, // fixed 5 * 50
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

      // averageDutyHours should be (5 + 5) / 2 = 5
      expect(result.calculationSummary.averageDutyHours).toBe(5);
    });
  });

  describe('BP Flight Duty Calculation', () => {
    test('calculateFlightDuty sets BP dutyHours to fixed 5 regardless of rostered time', () => {
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

      // dutyHours should be fixed 5 (not rostered 6.5)
      expect(result.flightDuty.dutyHours).toBe(5);

      // flightPay = fixed 5 * 50 = 250 AED
      expect(result.flightDuty.flightPay).toBe(250);

      // Should have no errors
      expect(result.errors).toEqual([]);
    });

    test('calculateFlightDuty handles cross-day BP duties with fixed 5 hours', () => {
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

      // dutyHours should be fixed 5 (not rostered 8)
      expect(result.flightDuty.dutyHours).toBe(5);

      // flightPay = fixed 5 * 62 = 310 AED
      expect(result.flightDuty.flightPay).toBe(310);

      // Should have no errors
      expect(result.errors).toEqual([]);
    });
  });
});

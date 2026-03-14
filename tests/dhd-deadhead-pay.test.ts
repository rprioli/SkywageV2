/**
 * Tests for DHD (Deadhead) Pay Calculation
 *
 * Verifies:
 * - Dual-signal DHD detection (* prefix + D indicator)
 * - Pay deduction: 50% of DHD block time subtracted from duty hours
 * - Edge cases: partial DHD, missing block minutes, non-DHD unaffected
 */

import { buildSectorDetails } from '@/lib/salary-calculator/sector-time-parser';
import { calculateFlightDuty } from '@/lib/salary-calculator/calculation-engine';
import type { FlightDuty, Sector } from '@/types/salary-calculator';

// ─── DHD Detection ─────────────────────────────────────────────────────────

describe('buildSectorDetails - DHD detection (dual signal)', () => {
  const flightNumbers = ['FZ1745'];
  const cleanSectors = ['DXB-BEG'];
  const actualTimes = 'A11:02 - A14:37';

  test('marks isDeadhead when BOTH * prefix AND D indicator are present', () => {
    const rawSectors = ['*DXB - BEG'];
    const result = buildSectorDetails(flightNumbers, cleanSectors, actualTimes, rawSectors, 'D');

    expect(result).toHaveLength(1);
    expect(result[0].isFlaggedSector).toBe(true);
    expect(result[0].isDeadhead).toBe(true);
  });

  test('does NOT mark isDeadhead when only * prefix (no D indicator)', () => {
    const rawSectors = ['*DXB - BEG'];
    const result = buildSectorDetails(flightNumbers, cleanSectors, actualTimes, rawSectors, 'S,R');

    expect(result).toHaveLength(1);
    expect(result[0].isFlaggedSector).toBe(true);
    expect(result[0].isDeadhead).toBeFalsy();
  });

  test('does NOT mark isDeadhead when only D indicator (no * prefix)', () => {
    const rawSectors = ['DXB - BEG'];
    const result = buildSectorDetails(flightNumbers, cleanSectors, actualTimes, rawSectors, 'D');

    expect(result).toHaveLength(1);
    expect(result[0].isFlaggedSector).toBe(false);
    expect(result[0].isDeadhead).toBeFalsy();
  });

  test('does NOT mark isDeadhead when neither signal is present', () => {
    const rawSectors = ['DXB - BEG'];
    const result = buildSectorDetails(flightNumbers, cleanSectors, actualTimes, rawSectors, 'S');

    expect(result).toHaveLength(1);
    expect(result[0].isFlaggedSector).toBe(false);
    expect(result[0].isDeadhead).toBeFalsy();
  });

  test('handles D in comma-separated indicator list (e.g. "D,R,M")', () => {
    const rawSectors = ['*DXB - BEG'];
    const result = buildSectorDetails(flightNumbers, cleanSectors, actualTimes, rawSectors, 'D,R,M');

    expect(result).toHaveLength(1);
    expect(result[0].isDeadhead).toBe(true);
  });

  test('handles indicators with extra whitespace', () => {
    const rawSectors = ['*DXB - BEG'];
    const result = buildSectorDetails(flightNumbers, cleanSectors, actualTimes, rawSectors, ' D , R ');

    expect(result).toHaveLength(1);
    expect(result[0].isDeadhead).toBe(true);
  });

  test('no indicators parameter defaults to no DHD', () => {
    const rawSectors = ['*DXB - BEG'];
    const result = buildSectorDetails(flightNumbers, cleanSectors, actualTimes, rawSectors);

    expect(result).toHaveLength(1);
    expect(result[0].isFlaggedSector).toBe(true);
    expect(result[0].isDeadhead).toBeFalsy();
  });
});

// ─── Pay Calculation ────────────────────────────────────────────────────────

/** Helper to build a minimal FlightDuty for pay calculation tests */
function makeFlightDuty(overrides: Partial<FlightDuty> & { sectorDetails?: Sector[] }): FlightDuty {
  return {
    date: new Date('2026-01-16'),
    flightNumbers: ['FZ1745', 'FZ1746'],
    sectors: ['DXB-BEG', 'BEG-DXB'],
    dutyType: 'layover',
    reportTime: { hours: 9, minutes: 30, totalMinutes: 570, totalHours: 9.5 },
    debriefTime: { hours: 17, minutes: 0, totalMinutes: 1020, totalHours: 17 },
    dutyHours: 7.5,
    flightPay: 0,
    isCrossDay: false,
    dataSource: 'csv',
    month: 1,
    year: 2026,
    ...overrides,
  };
}

describe('calculateFlightDuty - DHD pay deduction', () => {
  test('deducts 50% of DHD block time from duty hours (6h04m → 3h02m deduction)', () => {
    // 6h04m = 364 block minutes → half = 182 minutes = 3h02m = 3.0333...h
    const duty = makeFlightDuty({
      dutyType: 'layover',
      hasDeadheadSectors: true,
      sectorDetails: [
        {
          flightNumber: 'FZ1745',
          origin: 'DXB',
          destination: 'BEG',
          departureTime: '11:02',
          arrivalTime: '14:37',
          blockMinutes: 364, // 6h04m — the DHD sector
          isFlaggedSector: true,
          isDeadhead: true,
        },
      ],
    });

    const result = calculateFlightDuty(duty, 'CCM');

    // dutyHours 7.5 - (364 / 2 / 60) = 7.5 - 3.0333 = 4.4667
    const expectedDutyHours = 7.5 - (364 / 2 / 60);
    expect(result.calculationDetails.dutyHours).toBeCloseTo(expectedDutyHours, 4);
    // CCM rate = 50 AED/hr
    expect(result.calculationDetails.flightPay).toBeCloseTo(expectedDutyHours * 50, 2);
  });

  test('non-DHD flight has no deduction', () => {
    const duty = makeFlightDuty({
      dutyType: 'turnaround',
      hasDeadheadSectors: false,
      sectorDetails: [
        {
          flightNumber: 'FZ501',
          origin: 'DXB',
          destination: 'MCT',
          departureTime: '08:00',
          arrivalTime: '09:30',
          blockMinutes: 90,
          isFlaggedSector: false,
        },
        {
          flightNumber: 'FZ502',
          origin: 'MCT',
          destination: 'DXB',
          departureTime: '10:30',
          arrivalTime: '12:00',
          blockMinutes: 90,
          isFlaggedSector: false,
        },
      ],
    });

    const result = calculateFlightDuty(duty, 'CCM');

    // dutyHours should remain unchanged (no DHD deduction)
    expect(result.calculationDetails.dutyHours).toBeCloseTo(duty.dutyHours, 4);
    expect(result.calculationDetails.flightPay).toBeCloseTo(duty.dutyHours * 50, 2);
  });

  test('multi-sector with partial DHD deducts only DHD sector block time', () => {
    // Two sectors: one DHD (200 min) + one normal (150 min)
    // Only 200 min should be halved → 100 min deduction
    const duty = makeFlightDuty({
      dutyType: 'turnaround',
      hasDeadheadSectors: true,
      sectorDetails: [
        {
          flightNumber: 'FZ1001',
          origin: 'DXB',
          destination: 'BEG',
          departureTime: '10:00',
          arrivalTime: '13:20',
          blockMinutes: 200,
          isFlaggedSector: true,
          isDeadhead: true,
        },
        {
          flightNumber: 'FZ1002',
          origin: 'BEG',
          destination: 'DXB',
          departureTime: '14:30',
          arrivalTime: '17:00',
          blockMinutes: 150,
          isFlaggedSector: false,
        },
      ],
    });

    const result = calculateFlightDuty(duty, 'CCM');

    // 7.5h - (200 / 2 / 60) = 7.5 - 1.6667 = 5.8333
    const expectedDutyHours = 7.5 - (200 / 2 / 60);
    expect(result.calculationDetails.dutyHours).toBeCloseTo(expectedDutyHours, 4);
  });

  test('DHD without blockMinutes falls back to regular pay with warning', () => {
    const duty = makeFlightDuty({
      dutyType: 'layover',
      hasDeadheadSectors: true,
      sectorDetails: [
        {
          flightNumber: 'FZ1745',
          origin: 'DXB',
          destination: 'BEG',
          isFlaggedSector: true,
          isDeadhead: true,
          // no blockMinutes
        },
      ],
    });

    const result = calculateFlightDuty(duty, 'CCM');

    // No deduction — full duty hours used
    expect(result.calculationDetails.dutyHours).toBeCloseTo(duty.dutyHours, 4);
    expect(result.warnings).toContain(
      'DHD sectors detected but block minutes unavailable — calculated as regular duty'
    );
  });

  test('SCCM rate applies correctly with DHD deduction', () => {
    const duty = makeFlightDuty({
      dutyType: 'layover',
      hasDeadheadSectors: true,
      sectorDetails: [
        {
          flightNumber: 'FZ1745',
          origin: 'DXB',
          destination: 'BEG',
          departureTime: '11:02',
          arrivalTime: '14:37',
          blockMinutes: 364,
          isFlaggedSector: true,
          isDeadhead: true,
        },
      ],
    });

    const result = calculateFlightDuty(duty, 'SCCM');

    const expectedDutyHours = 7.5 - (364 / 2 / 60);
    // SCCM rate = 62 AED/hr
    expect(result.calculationDetails.flightPay).toBeCloseTo(expectedDutyHours * 62, 2);
  });

  test('DHD deduction does not go below zero', () => {
    // Extreme case: huge block time > 2x duty hours
    const duty = makeFlightDuty({
      dutyHours: 2,
      dutyType: 'layover',
      hasDeadheadSectors: true,
      sectorDetails: [
        {
          flightNumber: 'FZ999',
          origin: 'DXB',
          destination: 'BEG',
          departureTime: '10:00',
          arrivalTime: '20:00',
          blockMinutes: 600, // 10h → half = 5h, more than 2h duty
          isFlaggedSector: true,
          isDeadhead: true,
        },
      ],
    });

    const result = calculateFlightDuty(duty, 'CCM');

    // Should clamp to 0, but dutyHours ≤ 0 produces an error
    expect(result.calculationDetails.dutyHours).toBe(0);
  });
});

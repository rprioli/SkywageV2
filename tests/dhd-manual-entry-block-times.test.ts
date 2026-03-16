/**
 * Tests for DHD Manual Entry Block Times
 *
 * Verifies:
 * - buildDeadheadSector computes blockMinutes from departure/arrival times
 * - Layover/turnaround conversion paths pass DHD times through correctly
 * - Edit reconstruction populates DHD time fields from saved sectorDetails
 * - End-to-end: manual DHD entry → conversion → calculation engine deduction
 */

import { buildDeadheadSector } from '@/lib/salary-calculator/manual-entry/conversion';
import { convertToFlightDuty } from '@/lib/salary-calculator/manual-entry/conversion';
import { flightDutyToFormData } from '@/lib/salary-calculator/flight-data-converter';
import { calculateFlightDuty } from '@/lib/salary-calculator/calculation-engine';
import type { FlightDuty, Sector } from '@/types/salary-calculator';
import type { ManualFlightEntryData } from '@/lib/salary-calculator/manual-entry-validation';

// ─── buildDeadheadSector ────────────────────────────────────────────────────

describe('buildDeadheadSector', () => {
  test('with departure/arrival times computes correct blockMinutes', () => {
    const sector = buildDeadheadSector('FZ123', 'DXB', 'BEG', '08:30', '11:45');

    expect(sector.isDeadhead).toBe(true);
    expect(sector.isFlaggedSector).toBe(true);
    expect(sector.departureTime).toBe('08:30');
    expect(sector.arrivalTime).toBe('11:45');
    expect(sector.blockMinutes).toBe(195); // 3h 15m
  });

  test('without times produces no blockMinutes (backward compat)', () => {
    const sector = buildDeadheadSector('FZ123', 'DXB', 'BEG');

    expect(sector.isDeadhead).toBe(true);
    expect(sector.isFlaggedSector).toBe(true);
    expect(sector.departureTime).toBeUndefined();
    expect(sector.arrivalTime).toBeUndefined();
    expect(sector.blockMinutes).toBeUndefined();
  });

  test('handles cross-midnight times correctly', () => {
    const sector = buildDeadheadSector('FZ456', 'DXB', 'CMB', '23:00', '04:30');

    expect(sector.blockMinutes).toBe(330); // 5h 30m
  });
});

// ─── Conversion: Layover ────────────────────────────────────────────────────

describe('convertToFlightDuty - layover with DHD times', () => {
  const baseLOData: ManualFlightEntryData = {
    date: '2026-01-15',
    dutyType: 'layover',
    flightNumbers: ['123', '124'],
    sectors: ['DXB', 'BEG', 'BEG', 'DXB'],
    reportTime: '09:00',
    debriefTime: '17:00',
    isCrossDay: false,
    inboundDate: '2026-01-16',
    reportTimeInbound: '10:00',
    debriefTimeOutbound: '15:00',
    isCrossDayOutbound: false,
    isCrossDayInbound: false,
    deadheadSectors: [true, false],
    deadheadDepartureTimes: ['10:00', ''],
    deadheadArrivalTimes: ['13:15', ''],
  };

  test('outbound DHD sector has blockMinutes populated', () => {
    const duties = convertToFlightDuty(baseLOData, 'user1', 'CCM');

    expect(duties).not.toBeNull();
    expect(duties!.length).toBe(2);

    const outbound = duties![0];
    expect(outbound.hasDeadheadSectors).toBe(true);
    expect(outbound.sectorDetails).toBeDefined();
    expect(outbound.sectorDetails![0].isDeadhead).toBe(true);
    expect(outbound.sectorDetails![0].blockMinutes).toBe(195); // 3h 15m
    expect(outbound.sectorDetails![0].departureTime).toBe('10:00');
    expect(outbound.sectorDetails![0].arrivalTime).toBe('13:15');
  });

  test('inbound DHD sector has blockMinutes populated', () => {
    const data: ManualFlightEntryData = {
      ...baseLOData,
      deadheadSectors: [false, true],
      deadheadDepartureTimes: ['', '11:00'],
      deadheadArrivalTimes: ['', '14:30'],
    };

    const duties = convertToFlightDuty(data, 'user1', 'CCM');
    expect(duties).not.toBeNull();

    const inbound = duties![1];
    expect(inbound.hasDeadheadSectors).toBe(true);
    expect(inbound.sectorDetails![0].blockMinutes).toBe(210); // 3h 30m
  });
});

// ─── Conversion: Turnaround ─────────────────────────────────────────────────

describe('convertToFlightDuty - turnaround with DHD times', () => {
  test('all sectors get blockMinutes when any sector is DHD', () => {
    const data: ManualFlightEntryData = {
      date: '2026-01-15',
      dutyType: 'turnaround',
      flightNumbers: ['123', '124'],
      sectors: ['DXB', 'KHI', 'DXB'],
      reportTime: '06:00',
      debriefTime: '14:00',
      isCrossDay: false,
      deadheadSectors: [true, false],
      deadheadDepartureTimes: ['07:00', '11:30'],
      deadheadArrivalTimes: ['10:30', '13:00'],
    };

    const duties = convertToFlightDuty(data, 'user1', 'CCM');
    expect(duties).not.toBeNull();
    expect(duties!.length).toBe(1);

    const duty = duties![0];
    expect(duty.hasDeadheadSectors).toBe(true);
    expect(duty.sectorDetails).toBeDefined();
    expect(duty.sectorDetails!.length).toBe(2);

    // DHD sector — has blockMinutes + isDeadhead
    expect(duty.sectorDetails![0].isDeadhead).toBe(true);
    expect(duty.sectorDetails![0].blockMinutes).toBe(210); // 3h 30m
    expect(duty.sectorDetails![0].departureTime).toBe('07:00');

    // Non-DHD sector — also has blockMinutes (for display)
    expect(duty.sectorDetails![1].isDeadhead).toBeUndefined();
    expect(duty.sectorDetails![1].blockMinutes).toBe(90); // 1h 30m
    expect(duty.sectorDetails![1].departureTime).toBe('11:30');
  });
});

// ─── Edit Reconstruction ────────────────────────────────────────────────────

describe('flightDutyToFormData - DHD time reconstruction', () => {
  test('populates deadheadDepartureTimes/ArrivalTimes from saved sectorDetails', () => {
    const duty: FlightDuty = {
      date: new Date('2026-01-15'),
      dutyType: 'turnaround',
      flightNumbers: ['FZ123', 'FZ124'],
      sectors: ['DXB-KHI', 'KHI-DXB'],
      reportTime: { hours: 6, minutes: 0, totalMinutes: 360, totalHours: 6 },
      debriefTime: { hours: 14, minutes: 0, totalMinutes: 840, totalHours: 14 },
      dutyHours: 8,
      flightPay: 400,
      isCrossDay: false,
      dataSource: 'manual',
      month: 1,
      year: 2026,
      hasDeadheadSectors: true,
      sectorDetails: [
        {
          flightNumber: 'FZ123',
          origin: 'DXB',
          destination: 'KHI',
          isFlaggedSector: true,
          isDeadhead: true,
          departureTime: '07:00',
          arrivalTime: '10:30',
          blockMinutes: 210,
        },
        {
          flightNumber: 'FZ124',
          origin: 'KHI',
          destination: 'DXB',
          isFlaggedSector: false,
          departureTime: '11:30',
          arrivalTime: '13:00',
          blockMinutes: 90,
        },
      ],
    };

    const formData = flightDutyToFormData(duty);

    expect(formData.deadheadSectors).toEqual([true, false]);
    expect(formData.deadheadDepartureTimes).toEqual(['07:00', '11:30']);
    expect(formData.deadheadArrivalTimes).toEqual(['10:30', '13:00']);
  });

  test('does not populate DHD times for legacy entries without times', () => {
    const duty: FlightDuty = {
      date: new Date('2026-01-15'),
      dutyType: 'turnaround',
      flightNumbers: ['FZ123', 'FZ124'],
      sectors: ['DXB-KHI', 'KHI-DXB'],
      reportTime: { hours: 6, minutes: 0, totalMinutes: 360, totalHours: 6 },
      debriefTime: { hours: 14, minutes: 0, totalMinutes: 840, totalHours: 14 },
      dutyHours: 8,
      flightPay: 400,
      isCrossDay: false,
      dataSource: 'manual',
      month: 1,
      year: 2026,
      hasDeadheadSectors: true,
      sectorDetails: [
        {
          flightNumber: 'FZ123',
          origin: 'DXB',
          destination: 'KHI',
          isFlaggedSector: true,
          isDeadhead: true,
          // No departureTime/arrivalTime (legacy)
        },
      ],
    };

    const formData = flightDutyToFormData(duty);

    expect(formData.deadheadSectors).toEqual([true]);
    expect(formData.deadheadDepartureTimes).toBeUndefined();
    expect(formData.deadheadArrivalTimes).toBeUndefined();
  });
});

// ─── End-to-End ─────────────────────────────────────────────────────────────

describe('end-to-end: manual DHD entry → calculation engine', () => {
  test('produces correct reduced flight pay with no warning', () => {
    const data: ManualFlightEntryData = {
      date: '2026-01-15',
      dutyType: 'turnaround',
      flightNumbers: ['123', '124'],
      sectors: ['DXB', 'KHI', 'DXB'],
      reportTime: '06:00',
      debriefTime: '14:00',
      isCrossDay: false,
      deadheadSectors: [true, false],
      deadheadDepartureTimes: ['07:00', '11:30'],
      deadheadArrivalTimes: ['10:30', '13:00'],
    };

    const duties = convertToFlightDuty(data, 'user1', 'CCM');
    expect(duties).not.toBeNull();

    const duty = duties![0];
    expect(duty.sectorDetails![0].blockMinutes).toBe(210);
    expect(duty.sectorDetails![1].blockMinutes).toBe(90); // non-DHD also has block time

    // Run through calculation engine
    const result = calculateFlightDuty(duty, 'CCM');

    // 8h duty - (210/2/60)h = 8 - 1.75 = 6.25h
    // 6.25 * 50 = 312.50 AED
    expect(result.calculationDetails.dutyHours).toBeCloseTo(6.25, 2);
    expect(result.calculationDetails.flightPay).toBeCloseTo(312.5, 1);

    // Should NOT have the "block minutes unavailable" warning
    const blockMinWarning = result.warnings?.find(w =>
      w.includes('block minutes unavailable')
    );
    expect(blockMinWarning).toBeUndefined();
  });
});

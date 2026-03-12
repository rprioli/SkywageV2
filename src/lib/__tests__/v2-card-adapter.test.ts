/**
 * Tests for the V2 Card Data Adapter.
 * Verifies mapping from FlightDuty objects to v2 card component props.
 */

import {
  mapTurnaroundToV2Props,
  mapLayoverToV2Props,
  mapSimpleDutyToV2Props,
  formatDateShort,
  formatBlockMinutes,
} from '../salary-calculator/v2-card-adapter';
import { FlightDuty, Sector, TimeValue } from '@/types/salary-calculator';

// ─── Test helpers ───────────────────────────────────────────────────────────

function makeTime(h: number, m: number): TimeValue {
  return { hours: h, minutes: m, totalMinutes: h * 60 + m, totalHours: h + m / 60 };
}

function makeFlightDuty(overrides: Partial<FlightDuty> = {}): FlightDuty {
  return {
    id: 'test-1',
    date: new Date(2026, 2, 27), // 27 Mar 2026
    flightNumbers: ['FZ1931', 'FZ1932'],
    sectors: ['DXB-IKA', 'IKA-DXB'],
    dutyType: 'turnaround',
    reportTime: makeTime(15, 40),
    debriefTime: makeTime(22, 40),
    dutyHours: 7,
    flightPay: 350,
    isCrossDay: false,
    dataSource: 'csv',
    month: 3,
    year: 2026,
    ...overrides,
  };
}

function makeSectorDetails(): Sector[] {
  return [
    { flightNumber: 'FZ1931', origin: 'DXB', destination: 'IKA', departureTime: '16:40', arrivalTime: '18:55', blockMinutes: 135, isFlaggedSector: false },
    { flightNumber: 'FZ1932', origin: 'IKA', destination: 'DXB', departureTime: '19:55', arrivalTime: '22:10', blockMinutes: 135, isFlaggedSector: false },
  ];
}

// ─── formatDateShort ────────────────────────────────────────────────────────

describe('formatDateShort', () => {
  it('formats a date as "27 Mar"', () => {
    expect(formatDateShort(new Date(2026, 2, 27))).toBe('27 Mar');
  });

  it('formats January correctly', () => {
    expect(formatDateShort(new Date(2026, 0, 5))).toBe('5 Jan');
  });
});

// ─── formatBlockMinutes ─────────────────────────────────────────────────────

describe('formatBlockMinutes', () => {
  it('formats 135 minutes as "2h 15m"', () => {
    expect(formatBlockMinutes(135)).toBe('2h 15m');
  });

  it('formats 60 minutes as "1h 00m"', () => {
    expect(formatBlockMinutes(60)).toBe('1h 00m');
  });
});

// ─── mapTurnaroundToV2Props ─────────────────────────────────────────────────

describe('mapTurnaroundToV2Props', () => {
  it('maps a standard turnaround with sectorDetails', () => {
    const duty = makeFlightDuty({ sectorDetails: makeSectorDetails() });
    const props = mapTurnaroundToV2Props(duty);

    expect(props.date).toBe('27 Mar');
    expect(props.destinations).toHaveLength(1);
    expect(props.destinations[0].iata).toBe('IKA');
    expect(props.destinations[0].city).toBe('Tehran, Iran');
    expect(props.pay).toContain('350');
    expect(props.sectors).toHaveLength(2);
    expect(props.sectors[0].flightNumber).toBe('FZ1931');
    expect(props.sectors[0].route).toBe('DXB → IKA');
    expect(props.sectors[0].blockTime).toBe('2h 15m');
    expect(props.dutyTime).toBe('07h 00m Duty');
    expect(props.blockTime).toBe('4h 30m Block');
    expect(props.isDoubleSector).toBe(false);
  });

  it('maps a double-sector turnaround', () => {
    const duty = makeFlightDuty({
      flightNumbers: ['FZ1931', 'FZ1932', 'FZ1401', 'FZ1402'],
      sectors: ['DXB-IKA', 'IKA-DXB', 'DXB-KHI', 'KHI-DXB'],
      sectorDetails: [
        { flightNumber: 'FZ1931', origin: 'DXB', destination: 'IKA', departureTime: '16:40', arrivalTime: '18:55', blockMinutes: 135, isFlaggedSector: false },
        { flightNumber: 'FZ1932', origin: 'IKA', destination: 'DXB', departureTime: '19:55', arrivalTime: '22:10', blockMinutes: 135, isFlaggedSector: false },
        { flightNumber: 'FZ1401', origin: 'DXB', destination: 'KHI', departureTime: '23:00', arrivalTime: '01:15', blockMinutes: 135, crossDay: true, isFlaggedSector: false },
        { flightNumber: 'FZ1402', origin: 'KHI', destination: 'DXB', departureTime: '02:00', arrivalTime: '04:15', blockMinutes: 135, isFlaggedSector: false },
      ],
      dutyHours: 11,
      flightPay: 520,
    });
    const props = mapTurnaroundToV2Props(duty);

    expect(props.isDoubleSector).toBe(true);
    expect(props.destinations).toHaveLength(2);
    expect(props.destinations[0].iata).toBe('IKA');
    expect(props.destinations[1].iata).toBe('KHI');
    expect(props.destinations[1].city).toBe('Karachi, Pakistan');
    expect(props.sectors).toHaveLength(4);
  });

  it('handles missing sectorDetails gracefully', () => {
    const duty = makeFlightDuty({ sectorDetails: undefined });
    const props = mapTurnaroundToV2Props(duty);

    expect(props.destinations).toHaveLength(1);
    expect(props.destinations[0].iata).toBe('IKA');
    expect(props.sectors).toHaveLength(2);
    expect(props.sectors[0].flightNumber).toBe('FZ1931');
    expect(props.sectors[0].blockTime).toBe('');
    expect(props.blockTime).toBe('');
  });
});

// ─── mapLayoverToV2Props ────────────────────────────────────────────────────

describe('mapLayoverToV2Props', () => {
  it('maps a layover pair with two sectors', () => {
    const outbound = makeFlightDuty({
      id: 'out-1',
      dutyType: 'layover',
      flightNumbers: ['FZ1931'],
      sectors: ['DXB-IKA'],
      dutyHours: 3.75,
      flightPay: 112.5,
      sectorDetails: [
        { flightNumber: 'FZ1931', origin: 'DXB', destination: 'IKA', departureTime: '16:40', arrivalTime: '18:55', blockMinutes: 135, isFlaggedSector: false },
      ],
    });
    const inbound = makeFlightDuty({
      id: 'in-1',
      date: new Date(2026, 2, 28),
      dutyType: 'layover',
      flightNumbers: ['FZ1932'],
      sectors: ['IKA-DXB'],
      dutyHours: 3.75,
      flightPay: 112.5,
      sectorDetails: [
        { flightNumber: 'FZ1932', origin: 'IKA', destination: 'DXB', departureTime: '19:55', arrivalTime: '22:10', blockMinutes: 135, isFlaggedSector: false },
      ],
    });

    const props = mapLayoverToV2Props(outbound, inbound, 24, 211.68);

    expect(props.sectors).toHaveLength(2);
    expect(props.sectors[0].iata).toBe('IKA');
    expect(props.sectors[0].city).toBe('Tehran, Iran');
    expect(props.sectors[0].date).toBe('27 Mar');
    expect(props.sectors[1].iata).toBe('DXB');
    expect(props.sectors[1].date).toBe('28 Mar');
    expect(props.restDuration).toBe('24h 00m');
    expect(props.perDiem).toContain('211.68');
  });

  it('handles cross-month layover (outbound only)', () => {
    const outbound = makeFlightDuty({
      dutyType: 'layover',
      flightNumbers: ['FZ1931'],
      sectors: ['DXB-IKA'],
      flightPay: 112.5,
    });

    const props = mapLayoverToV2Props(outbound, null, 30, 264.6);

    expect(props.sectors).toHaveLength(1);
    expect(props.sectors[0].iata).toBe('IKA');
    expect(props.restDuration).toBe('30h 00m');
  });
});

// ─── mapSimpleDutyToV2Props ─────────────────────────────────────────────────

describe('mapSimpleDutyToV2Props', () => {
  it.each([
    ['asby', 'ASBY', 200, ['Airport Standby', '04h 00m Fixed'], true],
    ['sby', 'SBY', 0, ['Home Standby'], false],
    ['recurrent', 'REC', 200, ['Recurrent Training', '04h 00m Fixed'], true],
    ['business_promotion', 'BP', 250, ['Business Promotion', '05h 00m Duty'], true],
    ['off', 'OFF', 0, ['Day Off'], false],
    ['rest', 'REST', 0, ['Rest Day'], false],
    ['annual_leave', 'AL', 0, ['Annual Leave'], false],
    ['sick', 'SICK', 0, ['Sick Leave'], false],
  ] as const)('maps %s correctly', (dutyType, expectedLabel, flightPay, expectedTags, hasPay) => {
    const duty = makeFlightDuty({
      dutyType: dutyType as FlightDuty['dutyType'],
      flightPay,
      dutyHours: dutyType === 'business_promotion' ? 5 : 4,
    });
    const props = mapSimpleDutyToV2Props(duty);

    expect(props.label).toBe(expectedLabel);
    expect(props.tags).toEqual(expectedTags);
    if (hasPay) {
      expect(props.pay).toBeDefined();
    } else {
      expect(props.pay).toBeUndefined();
    }
  });

  it('detects "Additional Day Off" from originalData', () => {
    const duty = makeFlightDuty({
      dutyType: 'off',
      flightPay: 0,
      originalData: { duties: 'ADDITIONAL DAY OFF' },
    });
    const props = mapSimpleDutyToV2Props(duty);
    expect(props.tags).toEqual(['Additional Day Off']);
  });
});

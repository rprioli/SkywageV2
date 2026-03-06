/**
 * Tests for DHD Sector Asterisk Parsing and SICK Duty Code
 *
 * Verifies that:
 * - The * prefix on sector airport codes is stripped during parsing
 * - The flagged sector metadata is captured
 * - SICK and X duty codes are correctly classified
 */

import {
  extractSectors,
  extractSectorsWithFlags,
  detectNonWorkingDay,
} from '@/lib/salary-calculator/flight-classifier';
import { parseSectors, getDestination, isOutboundFlight } from '@/components/salary-calculator/flight-duty-card/utils';

describe('extractSectors - asterisk stripping', () => {
  test('strips * from origin airport', () => {
    const result = extractSectors('*DXB  - BEG');
    expect(result).toEqual(['DXB-BEG']);
  });

  test('strips * from destination airport', () => {
    const result = extractSectors('DXB  - *BEG');
    expect(result).toEqual(['DXB-BEG']);
  });

  test('leaves normal sectors unchanged', () => {
    const result = extractSectors('DXB  - BEG');
    expect(result).toEqual(['DXB-BEG']);
  });

  test('handles multi-line cell with one flagged sector', () => {
    const result = extractSectors('*DXB - MCT\nMCT - DXB');
    expect(result).toEqual(['DXB-MCT', 'MCT-DXB']);
  });
});

describe('extractSectorsWithFlags - metadata capture', () => {
  test('returns hasFlaggedSectors: true when * is present on origin', () => {
    const result = extractSectorsWithFlags('*DXB  - BEG');
    expect(result).toEqual({
      sectors: ['DXB-BEG'],
      hasFlaggedSectors: true,
    });
  });

  test('returns hasFlaggedSectors: true when * is present on destination', () => {
    const result = extractSectorsWithFlags('DXB  - *BEG');
    expect(result).toEqual({
      sectors: ['DXB-BEG'],
      hasFlaggedSectors: true,
    });
  });

  test('returns hasFlaggedSectors: false for normal sectors', () => {
    const result = extractSectorsWithFlags('DXB  - BEG');
    expect(result).toEqual({
      sectors: ['DXB-BEG'],
      hasFlaggedSectors: false,
    });
  });

  test('detects flag in multi-line cell where only one line is flagged', () => {
    const result = extractSectorsWithFlags('*DXB - MCT\nMCT - DXB');
    expect(result.sectors).toEqual(['DXB-MCT', 'MCT-DXB']);
    expect(result.hasFlaggedSectors).toBe(true);
  });
});

describe('UI parseSectors - asterisk stripping', () => {
  test('strips * from airports in dash-separated format', () => {
    expect(parseSectors('*DXB-BEG')).toEqual(['DXB', 'BEG']);
  });

  test('strips * from airports in spaced format', () => {
    expect(parseSectors('*DXB - BEG')).toEqual(['DXB', 'BEG']);
  });
});

describe('isOutboundFlight - works after * stripping', () => {
  test('returns true for DXB origin sector (already cleaned)', () => {
    expect(isOutboundFlight(['DXB-BEG'])).toBe(true);
  });
});

describe('getDestination - works after * stripping', () => {
  test('returns correct destination for outbound sector', () => {
    expect(getDestination(['DXB-BEG'])).toBe('BEG');
  });

  test('returns correct destination for inbound sector', () => {
    expect(getDestination(['BEG-DXB'])).toBe('BEG');
  });
});

describe('detectNonWorkingDay - SICK duty code', () => {
  test('detects SICK as non-working day with sick duty type', () => {
    const result = detectNonWorkingDay('SICK');
    expect(result.isNonWorking).toBe(true);
    expect(result.dutyType).toBe('sick');
  });

  test('detects SICK with indicator suffix', () => {
    const result = detectNonWorkingDay('SICK F');
    expect(result.isNonWorking).toBe(true);
    expect(result.dutyType).toBe('sick');
  });
});

describe('detectNonWorkingDay - X duty code (REST DAY)', () => {
  test('detects X as non-working off day', () => {
    const result = detectNonWorkingDay('X');
    expect(result.isNonWorking).toBe(true);
    expect(result.dutyType).toBe('off');
  });
});

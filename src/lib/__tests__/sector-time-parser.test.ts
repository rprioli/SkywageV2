/**
 * Tests for sector-time-parser.ts
 * Validates parsing of per-sector actual times from Flydubai rosters
 */

import {
  parseActualTimeLine,
  calculateBlockMinutes,
  parseSectorActualTimes,
  buildSectorDetails
} from '../salary-calculator/sector-time-parser';

describe('parseActualTimeLine', () => {
  it('parses standard actual times with A prefix', () => {
    const result = parseActualTimeLine('A11:02 - A14:37');
    expect(result).toEqual({
      dep: '11:02',
      arr: '14:37',
      depCrossDay: false,
      arrCrossDay: false,
    });
  });

  it('strips delay suffix', () => {
    const result = parseActualTimeLine('A04:07 - A09:19/00:57');
    expect(result).toEqual({
      dep: '4:07',
      arr: '9:19',
      depCrossDay: false,
      arrCrossDay: false,
    });
  });

  it('detects cross-day arrival with ⁺¹', () => {
    const result = parseActualTimeLine('A22:36 - A02:06⁺¹');
    expect(result).toEqual({
      dep: '22:36',
      arr: '2:06',
      depCrossDay: false,
      arrCrossDay: true,
    });
  });

  it('detects both sides cross-day', () => {
    const result = parseActualTimeLine('A02:23⁺¹ - A07:53⁺¹');
    expect(result).toEqual({
      dep: '2:23',
      arr: '7:53',
      depCrossDay: true,
      arrCrossDay: true,
    });
  });

  it('handles no A prefix', () => {
    const result = parseActualTimeLine('20:15 - A02:01⁺¹');
    expect(result).toEqual({
      dep: '20:15',
      arr: '2:01',
      depCrossDay: false,
      arrCrossDay: true,
    });
  });

  it('returns null for empty input', () => {
    expect(parseActualTimeLine('')).toBeNull();
    expect(parseActualTimeLine('  ')).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(parseActualTimeLine('no time here')).toBeNull();
    expect(parseActualTimeLine('A11:02')).toBeNull(); // no separator
  });
});

describe('calculateBlockMinutes', () => {
  it('calculates same-day block time', () => {
    // A11:02 - A14:37 = 3h35m = 215 min
    expect(calculateBlockMinutes('11:02', '14:37', false, false)).toBe(215);
  });

  it('calculates cross-day arrival block time', () => {
    // A22:36 - A02:06⁺¹ = 3h30m = 210 min
    expect(calculateBlockMinutes('22:36', '2:06', false, true)).toBe(210);
  });

  it('calculates both cross-day block time', () => {
    // A02:23⁺¹ - A07:53⁺¹ = 5h30m = 330 min
    expect(calculateBlockMinutes('2:23', '7:53', true, true)).toBe(330);
  });

  it('handles implicit cross-day (arr < dep, no flag)', () => {
    // 23:00 - 01:30 (no cross-day flags) = 2h30m = 150 min
    expect(calculateBlockMinutes('23:00', '1:30', false, false)).toBe(150);
  });
});

describe('parseSectorActualTimes', () => {
  it('parses multi-line actual times', () => {
    const input = 'A11:02 - A14:37\nA15:20 - A18:45';
    const result = parseSectorActualTimes(input);
    expect(result).toHaveLength(2);
    expect(result[0].dep).toBe('11:02');
    expect(result[1].dep).toBe('15:20');
  });

  it('returns empty array for empty input', () => {
    expect(parseSectorActualTimes('')).toEqual([]);
    expect(parseSectorActualTimes(undefined as unknown as string)).toEqual([]);
  });

  it('skips malformed lines', () => {
    const input = 'A11:02 - A14:37\nbad line\nA15:20 - A18:45';
    const result = parseSectorActualTimes(input);
    expect(result).toHaveLength(2);
  });
});

describe('buildSectorDetails', () => {
  it('builds 2-sector turnaround', () => {
    const sectors = buildSectorDetails(
      ['FZ1635', 'FZ1636'],
      ['DXB-TLV', 'TLV-DXB'],
      'A11:02 - A14:37\nA15:20 - A18:45',
      ['DXB-TLV', 'TLV-DXB']
    );
    expect(sectors).toHaveLength(2);
    expect(sectors[0].flightNumber).toBe('FZ1635');
    expect(sectors[0].origin).toBe('DXB');
    expect(sectors[0].destination).toBe('TLV');
    expect(sectors[0].blockMinutes).toBe(215);
    expect(sectors[0].isFlaggedSector).toBe(false);
    expect(sectors[1].flightNumber).toBe('FZ1636');
    expect(sectors[1].blockMinutes).toBe(205);
  });

  it('builds 4-sector double turnaround', () => {
    const sectors = buildSectorDetails(
      ['FZ1', 'FZ2', 'FZ3', 'FZ4'],
      ['DXB-MCT', 'MCT-DXB', 'DXB-KWI', 'KWI-DXB'],
      'A06:00 - A07:00\nA08:00 - A09:00\nA10:00 - A11:30\nA12:30 - A14:00',
      ['DXB-MCT', 'MCT-DXB', 'DXB-KWI', 'KWI-DXB']
    );
    expect(sectors).toHaveLength(4);
  });

  it('builds single-sector layover leg', () => {
    const sectors = buildSectorDetails(
      ['FZ501'],
      ['DXB-ZAG'],
      'A20:15 - A02:01⁺¹',
      ['DXB-ZAG']
    );
    expect(sectors).toHaveLength(1);
    expect(sectors[0].crossDay).toBe(true);
  });

  it('detects flagged sectors from raw sectors with *', () => {
    const sectors = buildSectorDetails(
      ['FZ1745', 'FZ1746'],
      ['DXB-BEG', 'BEG-DXB'],
      'A11:00 - A15:00\nA16:00 - A20:00',
      ['*DXB-BEG', 'BEG-DXB']
    );
    expect(sectors[0].isFlaggedSector).toBe(true);
    expect(sectors[1].isFlaggedSector).toBe(false);
  });

  it('returns empty array for missing actual times', () => {
    const sectors = buildSectorDetails(
      ['FZ1635'],
      ['DXB-TLV'],
      undefined,
      ['DXB-TLV']
    );
    expect(sectors).toEqual([]);
  });

  it('returns empty array for empty actual times', () => {
    const sectors = buildSectorDetails(
      ['FZ1635'],
      ['DXB-TLV'],
      '',
      ['DXB-TLV']
    );
    expect(sectors).toEqual([]);
  });
});

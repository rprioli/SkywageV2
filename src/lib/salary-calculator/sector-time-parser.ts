/**
 * Sector Time Parser
 * Parses per-sector actual departure/arrival times from Flydubai roster actualTimes column.
 * Computes block minutes for each sector.
 */

import { Sector } from '@/types/salary-calculator';

interface ParsedTime {
  dep: string;
  arr: string;
  depCrossDay: boolean;
  arrCrossDay: boolean;
}

/**
 * Parses a single actual-time line from the roster.
 * Input examples:
 *   "A11:02 - A14:37/00:07"
 *   "20:15 - A02:01⁺¹"
 *   "A02:23⁺¹ - A07:53⁺¹"
 */
export function parseActualTimeLine(line: string): ParsedTime | null {
  if (!line || typeof line !== 'string') return null;

  // Strip delay suffix (e.g., "/00:07" or "/01:23")
  let cleaned = line.replace(/\/\d{2}:\d{2}$/, '').trim();
  if (!cleaned) return null;

  // Split on " - " to get departure and arrival parts
  const parts = cleaned.split(' - ');
  if (parts.length !== 2) return null;

  const depPart = parts[0].trim();
  const arrPart = parts[1].trim();

  const parsePart = (part: string) => {
    const crossDay = part.includes('\u207A\u00B9') || part.includes('+1');
    // Strip A prefix, cross-day markers, and other non-time characters
    const timeStr = part
      .replace(/^A/, '')
      .replace(/\u207A\u00B9/g, '') // ⁺¹
      .replace(/\+1/g, '')
      .replace(/[^0-9:]/g, '')
      .trim();
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    return { time: timeStr, crossDay };
  };

  const dep = parsePart(depPart);
  const arr = parsePart(arrPart);
  if (!dep || !arr) return null;

  return {
    dep: dep.time,
    arr: arr.time,
    depCrossDay: dep.crossDay,
    arrCrossDay: arr.crossDay,
  };
}

/**
 * Calculates block time in minutes between departure and arrival.
 * Handles cross-day scenarios.
 */
export function calculateBlockMinutes(
  depTime: string,
  arrTime: string,
  depCrossDay: boolean,
  arrCrossDay: boolean
): number {
  const [depH, depM] = depTime.split(':').map(Number);
  const [arrH, arrM] = arrTime.split(':').map(Number);

  let depMinutes = depH * 60 + depM;
  let arrMinutes = arrH * 60 + arrM;

  if (depCrossDay) depMinutes += 24 * 60;
  if (arrCrossDay) arrMinutes += 24 * 60;

  // Implicit cross-day: arrival appears earlier than departure
  if (arrMinutes < depMinutes) {
    arrMinutes += 24 * 60;
  }

  return arrMinutes - depMinutes;
}

/**
 * Parses the full actualTimes string (multi-line) into an array of parsed times.
 */
export function parseSectorActualTimes(actualTimesStr: string): ParsedTime[] {
  if (!actualTimesStr) return [];
  return actualTimesStr
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(parseActualTimeLine)
    .filter((t): t is ParsedTime => t !== null);
}

/**
 * Builds Sector[] from flight data and actual times.
 */
export function buildSectorDetails(
  flightNumbers: string[],
  cleanSectors: string[],
  actualTimesStr: string | undefined,
  rawSectors: string[],
  indicators?: string
): Sector[] {
  if (!actualTimesStr || !actualTimesStr.trim()) return [];

  const parsedTimes = parseSectorActualTimes(actualTimesStr);
  if (parsedTimes.length === 0) return [];

  // Parse indicator tokens for DHD confirmation (e.g., "D,R,M" → ["D", "R", "M"])
  const indicatorTokens = indicators
    ? indicators.split(',').map(t => t.trim())
    : [];
  const hasDIndicator = indicatorTokens.includes('D');

  const count = Math.min(flightNumbers.length, cleanSectors.length);
  const sectors: Sector[] = [];

  for (let i = 0; i < count; i++) {
    const sectorParts = cleanSectors[i].split('-').map(s => s.trim());
    const origin = sectorParts[0] || '';
    const destination = sectorParts[1] || '';
    const isFlaggedSector = rawSectors[i] ? rawSectors[i].includes('*') : false;
    const isDeadhead = isFlaggedSector && hasDIndicator;

    const timing = parsedTimes[i];
    const sector: Sector = {
      flightNumber: flightNumbers[i],
      origin,
      destination,
      isFlaggedSector,
      ...(isDeadhead && { isDeadhead }),
    };

    if (timing) {
      sector.departureTime = timing.dep;
      sector.arrivalTime = timing.arr;
      sector.crossDay = timing.arrCrossDay && !timing.depCrossDay;
      sector.blockMinutes = calculateBlockMinutes(
        timing.dep,
        timing.arr,
        timing.depCrossDay,
        timing.arrCrossDay
      );
    }

    sectors.push(sector);
  }

  return sectors;
}

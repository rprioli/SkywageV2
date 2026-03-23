/**
 * V2 Card Data Mapper — Pure data mapping with zero React or component imports.
 *
 * Returns plain data objects (strings, arrays, numbers) that each platform's
 * UI layer can format and render. Used by React Native directly and by the
 * web v2-card-adapter as a shared data layer.
 */

import { FlightDuty, Sector, TimeValue, DutyType } from '@/types/salary-calculator';
import { isDoubleSectorTurnaroundPattern, extractTurnaroundDestinations, extractAirportCodes } from './input-transformers';
import { formatCurrency, formatDutyHours } from './card-data-mapper';
import { lookupCity } from './iata-city-lookup';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TimesData {
  reportTime?: string;
  departureTime?: string;
  arrivalTime?: string;
  debriefTime?: string;
  isFirst: boolean;
  isLast: boolean;
}

export interface TurnaroundSectorDataPlain {
  flightNumber: string;
  route: string;
  times: TimesData;
  blockTime: string;
  isDeadhead?: boolean;
}

export interface TurnaroundCardData {
  date: string;
  destinations: { iata: string; city: string }[];
  pay: string;
  sectors: TurnaroundSectorDataPlain[];
  dutyTime: string;
  blockTime: string;
  isDoubleSector: boolean;
  dutyLabel?: string;
  hasDeadhead?: boolean;
}

export interface LayoverFlightDataPlain {
  flightNumber: string;
  route: string;
  times: TimesData;
  blockTime?: string;
  isDeadhead?: boolean;
}

export interface LayoverSectorDataPlain {
  iata: string;
  city: string;
  date: string;
  pay: string;
  flights: LayoverFlightDataPlain[];
  dutyTime: string;
  blockTime: string;
  hasDeadhead?: boolean;
}

export interface LayoverCardData {
  sectors: LayoverSectorDataPlain[];
  restDuration: string;
  perDiem: string;
}

export interface SimpleDutyCardData {
  date: string;
  label: string;
  subtitle: string;
  dutyType: DutyType;
  pay?: string;
  tags: string[];
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DXB_CITY = lookupCity('DXB');

/** Formats a Date to short display format: "27 Mar" */
export function formatDateShort(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

/** Formats block minutes to display string: "2h 15m" */
export function formatBlockMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

/** Sums all block minutes from sector details, halving DHD sectors */
export function effectiveBlockMinutes(sectorDetails: Sector[]): number {
  return sectorDetails.reduce((sum, s) => {
    if (s.blockMinutes == null) return sum;
    return sum + (s.isDeadhead ? Math.round(s.blockMinutes / 2) : s.blockMinutes);
  }, 0);
}

/** Formats a TimeValue to "HH:MM" */
function formatTimeVal(tv: TimeValue): string {
  return `${tv.hours.toString().padStart(2, '0')}:${tv.minutes.toString().padStart(2, '0')}`;
}

/** Returns the outstation (non-DXB) airport from sector strings using simple split */
function getLayoverDestinationFromSectors(sectors: string[]): string {
  for (const sector of sectors) {
    const airports = sector.split('-').map(s => s.trim());
    for (const airport of airports) {
      if (airport && airport !== 'DXB') return airport;
    }
  }
  return sectors[0] ?? '';
}

// ─── Maps for simple duty types ─────────────────────────────────────────────

/** Maps non-payable duty types to tag arrays */
export const DUTY_TYPE_TAGS: Partial<Record<DutyType, (duty: FlightDuty) => string[]>> = {
  asby: (d) => ['Airport Standby', `${formatDutyHours(d.dutyHours)} Fixed`],
  sby: () => ['Home Standby'],
  recurrent: (d) => ['Recurrent Training', `${formatDutyHours(d.dutyHours)} Fixed`],
  business_promotion: (d) => ['Business Promotion', `${formatDutyHours(d.dutyHours)} Duty`],
  off: (d) => {
    const od = d.originalData as { duties?: string; details?: string } | undefined;
    const text = `${od?.duties ?? ''} ${od?.details ?? ''}`.toUpperCase();
    return text.includes('ADDITIONAL DAY OFF') ? ['Additional Day Off'] : ['Day Off'];
  },
  rest: () => ['Rest Day'],
  annual_leave: () => ['Annual Leave'],
  sick: () => ['Sick Leave'],
  layover: (d) => ['Layover', d.sectors.join(' \u2192 ')],
};

/** Label abbreviations for the v2 card title */
export const DUTY_LABEL: Partial<Record<DutyType, string>> = {
  asby: 'ASBY',
  sby: 'SBY',
  recurrent: 'REC',
  business_promotion: 'BP',
  off: 'OFF',
  rest: 'REST',
  annual_leave: 'AL',
  sick: 'SICK',
  layover: 'LYR',
};

// ─── Pure data builders ─────────────────────────────────────────────────────

/** Builds plain times data for a flight row (pure data equivalent of buildTimesNode) */
export function buildTimesData(
  sector: Sector | undefined,
  isFirst: boolean,
  isLast: boolean,
  reportTime?: TimeValue,
  debriefTime?: TimeValue,
): TimesData {
  return {
    reportTime: isFirst && reportTime ? formatTimeVal(reportTime) : undefined,
    departureTime: sector?.departureTime ?? undefined,
    arrivalTime: sector?.arrivalTime ?? undefined,
    debriefTime: isLast && debriefTime ? formatTimeVal(debriefTime) : undefined,
    isFirst,
    isLast,
  };
}

function buildTurnaroundSectorData(duty: FlightDuty): TurnaroundSectorDataPlain[] {
  const sd = duty.sectorDetails;

  if (sd && sd.length > 0) {
    return sd.map((sector, i) => ({
      flightNumber: sector.flightNumber,
      route: `${sector.origin} \u2192 ${sector.destination}`,
      times: buildTimesData(sector, i === 0, i === sd.length - 1, duty.reportTime, duty.debriefTime),
      blockTime: sector.isDeadhead && sector.blockMinutes != null
        ? formatBlockMinutes(Math.round(sector.blockMinutes / 2))
        : sector.blockMinutes != null ? formatBlockMinutes(sector.blockMinutes) : '',
      isDeadhead: sector.isDeadhead === true,
    }));
  }

  // Fallback: build from flightNumbers + sectors arrays
  return duty.flightNumbers.map((fn, i) => {
    const sectorStr = duty.sectors[i] ?? '';
    const airports = sectorStr.split('-').map(s => s.trim());
    const route = airports.length >= 2
      ? `${airports[0]} \u2192 ${airports[airports.length - 1]}`
      : sectorStr;

    return {
      flightNumber: fn,
      route,
      times: buildTimesData(undefined, i === 0, i === duty.flightNumbers.length - 1, duty.reportTime, duty.debriefTime),
      blockTime: '',
    };
  });
}

function buildLayoverSectorDataPlain(duty: FlightDuty, isOutbound: boolean): LayoverSectorDataPlain {
  const destCode = isOutbound
    ? getLayoverDestinationFromSectors(duty.sectors)
    : 'DXB';

  const sd = duty.sectorDetails;
  const hasSectorDetails = sd && sd.length > 0;

  const flights: LayoverFlightDataPlain[] = hasSectorDetails
    ? sd!.map((sector, i) => ({
        flightNumber: sector.flightNumber,
        route: `${sector.origin} \u2192 ${sector.destination}`,
        times: buildTimesData(sector, i === 0, i === sd!.length - 1, duty.reportTime, duty.debriefTime),
        blockTime: sector.isDeadhead && sector.blockMinutes != null
          ? formatBlockMinutes(Math.round(sector.blockMinutes / 2))
          : sector.blockMinutes != null ? formatBlockMinutes(sector.blockMinutes) : undefined,
        isDeadhead: sector.isDeadhead === true,
      }))
    : duty.flightNumbers.map((fn, i) => {
        const sectorStr = duty.sectors[i] ?? '';
        const airports = sectorStr.split('-').map(s => s.trim());
        const route = airports.length >= 2
          ? `${airports[0]} \u2192 ${airports[airports.length - 1]}`
          : sectorStr;
        return {
          flightNumber: fn,
          route,
          times: buildTimesData(undefined, i === 0, i === duty.flightNumbers.length - 1, duty.reportTime, duty.debriefTime),
        };
      });

  const totalBlock = hasSectorDetails ? effectiveBlockMinutes(sd!) : 0;
  const hasDeadhead = duty.hasDeadheadSectors === true && hasSectorDetails;

  return {
    iata: destCode,
    city: lookupCity(destCode),
    date: formatDateShort(duty.date),
    pay: formatCurrency(duty.flightPay),
    flights,
    dutyTime: `${formatDutyHours(duty.dutyHours)} Duty`,
    blockTime: totalBlock > 0 ? `${formatBlockMinutes(totalBlock)} Block` : '',
    ...(hasDeadhead && { hasDeadhead: true }),
  };
}

// ─── Top-level mappers ──────────────────────────────────────────────────────

export function mapTurnaroundToCardData(duty: FlightDuty): TurnaroundCardData {
  const isDoubleSector = isDoubleSectorTurnaroundPattern(duty.sectors);

  let destCodes: string[];
  if (duty.dutyType === 'layover') {
    const airports = extractAirportCodes(duty.sectors);
    const arrival = airports[airports.length - 1] ?? 'DXB';
    destCodes = [arrival];
  } else {
    destCodes = extractTurnaroundDestinations(duty.sectors);
  }

  const destinations = destCodes.map(code => ({ iata: code, city: lookupCity(code) }));

  if (destinations.length === 0 && duty.sectors.length > 0) {
    const airports = duty.sectors[0].split('-').map(s => s.trim());
    const outstation = airports.find(a => a !== 'DXB') ?? airports[1] ?? '';
    if (outstation) {
      destinations.push({ iata: outstation, city: lookupCity(outstation) });
    }
  }

  const sectors = buildTurnaroundSectorData(duty);

  const hasSectorDetails = duty.sectorDetails && duty.sectorDetails.length > 0;
  const totalBlock = hasSectorDetails ? effectiveBlockMinutes(duty.sectorDetails!) : 0;
  const hasDeadhead = duty.hasDeadheadSectors === true && hasSectorDetails;

  return {
    date: formatDateShort(duty.date),
    destinations,
    pay: formatCurrency(duty.flightPay),
    sectors,
    dutyTime: `${formatDutyHours(duty.dutyHours)} Duty`,
    blockTime: totalBlock > 0 ? `${formatBlockMinutes(totalBlock)} Block` : '',
    isDoubleSector,
    ...(duty.dutyType === 'layover' && { dutyLabel: 'Layover' }),
    ...(hasDeadhead && { hasDeadhead: true }),
  };
}

export function mapLayoverToCardData(
  outbound: FlightDuty,
  inbound: FlightDuty | null,
  restHours: number,
  perDiemPay: number,
): LayoverCardData {
  const sectors: LayoverSectorDataPlain[] = [buildLayoverSectorDataPlain(outbound, true)];
  if (inbound) {
    sectors.push(buildLayoverSectorDataPlain(inbound, false));
  }

  return {
    sectors,
    restDuration: formatDutyHours(restHours),
    perDiem: formatCurrency(perDiemPay),
  };
}

export function mapSimpleDutyToCardData(duty: FlightDuty): SimpleDutyCardData {
  const tagsFn = DUTY_TYPE_TAGS[duty.dutyType] ?? (() => [duty.dutyType.toUpperCase()]);

  return {
    date: formatDateShort(duty.date),
    label: DUTY_LABEL[duty.dutyType] ?? duty.dutyType.toUpperCase(),
    subtitle: DXB_CITY,
    dutyType: duty.dutyType,
    pay: duty.flightPay > 0 ? formatCurrency(duty.flightPay) : undefined,
    tags: tagsFn(duty),
  };
}

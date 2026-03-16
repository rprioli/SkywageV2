/**
 * V2 Card Data Adapter
 * Maps FlightDuty objects into the pre-formatted props expected by v2 glassmorphic card components.
 * Pure functions — no side effects, no hooks, no database calls.
 */

import React from 'react';
import { FlightDuty, Sector, TimeValue, DutyType } from '@/types/salary-calculator';
import type {
  TurnaroundCardV2Props,
  TurnaroundDestination,
  TurnaroundSector,
  LayoverCardV2Props,
  LayoverSectorData,
  SimpleDutyCardV2Props,
} from '@/components/salary-calculator/v2-cards';
import { isDoubleSectorTurnaroundPattern, extractTurnaroundDestinations, extractAirportCodes } from './input-transformers';
import { formatCurrency, formatDutyHours } from './card-data-mapper';
import { formatTime, getDutyTypeConfig, parseSectors } from '@/components/salary-calculator/flight-duty-card/utils';
import { lookupCity } from './iata-city-lookup';

const DXB_CITY = lookupCity('DXB');

// ─── Shared helpers ─────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
function effectiveBlockMinutes(sectorDetails: Sector[]): number {
  return sectorDetails.reduce((sum, s) => {
    if (s.blockMinutes == null) return sum;
    return sum + (s.isDeadhead ? Math.round(s.blockMinutes / 2) : s.blockMinutes);
  }, 0);
}

/** Returns the outstation (non-DXB) airport from a layover flight's sectors */
function getLayoverDestination(sectors: string[]): string {
  for (const sector of sectors) {
    const airports = parseSectors(sector);
    for (const airport of airports) {
      if (airport !== 'DXB') return airport;
    }
  }
  return sectors[0] ?? '';
}

/**
 * Builds the inline times ReactNode for a flight row.
 * Shows: report · dep–arr · debrief (report on first sector, debrief on last).
 */
export function buildTimesNode(
  sector: Sector | undefined,
  isFirst: boolean,
  isLast: boolean,
  reportTime?: TimeValue,
  debriefTime?: TimeValue,
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const fadedClass = 'text-[#3A3780]/38 font-normal';

  // Report time (only on first sector)
  if (isFirst && reportTime) {
    parts.push(
      React.createElement('span', { className: fadedClass, key: 'rpt' },
        `${formatTime(reportTime)} \u00B7 `)
    );
  }

  // Departure – Arrival
  if (sector?.departureTime && sector?.arrivalTime) {
    parts.push(React.createElement(React.Fragment, { key: 'dep-arr' },
      `${sector.departureTime}\u2013${sector.arrivalTime}`));
  } else if (isFirst && isLast && reportTime && debriefTime) {
    // No per-sector times; show report–debrief as main times
    parts.push(React.createElement(React.Fragment, { key: 'rpt-dbr' },
      `${formatTime(reportTime)}\u2013${formatTime(debriefTime)}`));
    // Already shown, skip faded debrief below
    return React.createElement(React.Fragment, null, ...parts);
  }

  // Debrief time (only on last sector)
  if (isLast && debriefTime) {
    parts.push(
      React.createElement('span', { className: fadedClass, key: 'dbr' },
        ` \u00B7 ${formatTime(debriefTime)}`)
    );
  }

  return React.createElement(React.Fragment, null, ...parts);
}

// ─── Turnaround mapper ──────────────────────────────────────────────────────

export function mapTurnaroundToV2Props(duty: FlightDuty): TurnaroundCardV2Props {
  const isDoubleSector = isDoubleSectorTurnaroundPattern(duty.sectors);

  // Orphaned layovers routed here: show arrival airport (e.g. DXB for NQZ→DXB)
  // instead of the outstation, matching paired layover inbound display
  let destCodes: string[];
  if (duty.dutyType === 'layover') {
    const airports = extractAirportCodes(duty.sectors);
    const arrival = airports[airports.length - 1] ?? 'DXB';
    destCodes = [arrival];
  } else {
    destCodes = extractTurnaroundDestinations(duty.sectors);
  }

  const destinations: TurnaroundDestination[] = destCodes.map(code => ({
    iata: code,
    city: lookupCity(code),
  }));

  // If no destinations extracted, derive from sectors
  if (destinations.length === 0 && duty.sectors.length > 0) {
    const airports = parseSectors(duty.sectors[0]);
    const outstation = airports.find(a => a !== 'DXB') ?? airports[1] ?? '';
    if (outstation) {
      destinations.push({ iata: outstation, city: lookupCity(outstation) });
    }
  }

  const sectors: TurnaroundSector[] = buildTurnaroundSectors(duty);

  const hasSectorDetails = duty.sectorDetails && duty.sectorDetails.length > 0;
  const totalBlock = hasSectorDetails
    ? effectiveBlockMinutes(duty.sectorDetails!)
    : 0;

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

function buildTurnaroundSectors(duty: FlightDuty): TurnaroundSector[] {
  const sd = duty.sectorDetails;

  if (sd && sd.length > 0) {
    return sd.map((sector, i) => ({
      flightNumber: sector.flightNumber,
      route: `${sector.origin} \u2192 ${sector.destination}`,
      times: buildTimesNode(
        sector,
        i === 0,
        i === sd.length - 1,
        duty.reportTime,
        duty.debriefTime,
      ),
      blockTime: sector.isDeadhead && sector.blockMinutes != null
        ? formatBlockMinutes(Math.round(sector.blockMinutes / 2))
        : sector.blockMinutes != null ? formatBlockMinutes(sector.blockMinutes) : '',
      isDeadhead: sector.isDeadhead === true,
    }));
  }

  // Fallback: build from flightNumbers + sectors arrays
  return duty.flightNumbers.map((fn, i) => {
    const sectorStr = duty.sectors[i] ?? '';
    const airports = parseSectors(sectorStr);
    const route = airports.length >= 2
      ? `${airports[0]} \u2192 ${airports[airports.length - 1]}`
      : sectorStr;

    return {
      flightNumber: fn,
      route,
      times: buildTimesNode(
        undefined,
        i === 0,
        i === duty.flightNumbers.length - 1,
        duty.reportTime,
        duty.debriefTime,
      ),
      blockTime: '',
    };
  });
}

// ─── Layover mapper ─────────────────────────────────────────────────────────

export function mapLayoverToV2Props(
  outbound: FlightDuty,
  inbound: FlightDuty | null,
  restHours: number,
  perDiemPay: number,
): LayoverCardV2Props {
  const outboundSector = buildLayoverSectorData(outbound, true);
  const sectors: LayoverSectorData[] = [outboundSector];

  if (inbound) {
    sectors.push(buildLayoverSectorData(inbound, false));
  }

  return {
    sectors,
    restDuration: formatDutyHours(restHours),
    perDiem: formatCurrency(perDiemPay),
  };
}

function buildLayoverSectorData(duty: FlightDuty, isOutbound: boolean): LayoverSectorData {
  const destCode = isOutbound
    ? getLayoverDestination(duty.sectors)
    : 'DXB';

  const sd = duty.sectorDetails;
  const hasSectorDetails = sd && sd.length > 0;

  const flights = hasSectorDetails
    ? sd!.map((sector, i) => ({
        flightNumber: sector.flightNumber,
        route: `${sector.origin} \u2192 ${sector.destination}`,
        times: buildTimesNode(sector, i === 0, i === sd!.length - 1, duty.reportTime, duty.debriefTime),
        blockTime: sector.isDeadhead && sector.blockMinutes != null
          ? formatBlockMinutes(Math.round(sector.blockMinutes / 2))
          : sector.blockMinutes != null ? formatBlockMinutes(sector.blockMinutes) : undefined,
        isDeadhead: sector.isDeadhead === true,
      }))
    : duty.flightNumbers.map((fn, i) => {
        const sectorStr = duty.sectors[i] ?? '';
        const airports = parseSectors(sectorStr);
        const route = airports.length >= 2
          ? `${airports[0]} \u2192 ${airports[airports.length - 1]}`
          : sectorStr;
        return {
          flightNumber: fn,
          route,
          times: buildTimesNode(undefined, i === 0, i === duty.flightNumbers.length - 1, duty.reportTime, duty.debriefTime),
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

// ─── Simple duty mapper ─────────────────────────────────────────────────────

/** Maps non-payable duty types to tag arrays */
const DUTY_TYPE_TAGS: Partial<Record<DutyType, (duty: FlightDuty) => string[]>> = {
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
const DUTY_LABEL: Partial<Record<DutyType, string>> = {
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

export function mapSimpleDutyToV2Props(duty: FlightDuty): SimpleDutyCardV2Props {
  const config = getDutyTypeConfig(duty.dutyType);
  const tagsFn = DUTY_TYPE_TAGS[duty.dutyType] ?? (() => [duty.dutyType.toUpperCase()]);

  return {
    date: formatDateShort(duty.date),
    label: DUTY_LABEL[duty.dutyType] ?? duty.dutyType.toUpperCase(),
    subtitle: DXB_CITY,
    icon: config.icon,
    pay: duty.flightPay > 0 ? formatCurrency(duty.flightPay) : undefined,
    tags: tagsFn(duty),
  };
}

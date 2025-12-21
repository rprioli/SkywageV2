/**
 * Data Mapping Layer for New Flight Cards
 * Maps FlightDuty interface to new card design requirements
 */

import { FlightDuty, TimeValue } from '@/types/salary-calculator';
import { createTimestamp, calculateTimestampDuration } from './time-calculator';

export interface CardData {
  flightNumber: string;
  routing: string;
  reporting: string;
  debriefing: string;
  totalDuty: string;
  pay: string;
  restPeriod?: string;
  perDiem?: string;
  destination?: string;
}

export interface LayoverPair {
  outbound: FlightDuty;
  inbound: FlightDuty;
  destination: string;
  restHours: number;
  perDiemPay: number;
}

/**
 * Formats TimeValue to display format (HH:MM DD/MM)
 */
export function formatDateTime(timeValue: TimeValue, date: Date, isCrossDay: boolean = false): string {
  const displayDate = new Date(date);
  if (isCrossDay) {
    displayDate.setDate(displayDate.getDate() + 1);
  }
  
  const hours = timeValue.hours.toString().padStart(2, '0');
  const minutes = timeValue.minutes.toString().padStart(2, '0');
  const day = displayDate.getDate().toString().padStart(2, '0');
  const month = (displayDate.getMonth() + 1).toString().padStart(2, '0');
  
  return `${hours}:${minutes} ${day}/${month}`;
}

/**
 * Formats duty hours to display format (XXh XXm)
 */
export function formatDutyHours(dutyHours: number): string {
  const hours = Math.floor(dutyHours);
  const minutes = Math.round((dutyHours - hours) * 60);
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
}

/**
 * Formats currency to AED display format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Maps FlightDuty to CardData format
 */
export function mapFlightDutyToCardData(
  flightDuty: FlightDuty,
  allFlightDuties: FlightDuty[] = []
): CardData {
  const cardData: CardData = {
    flightNumber: flightDuty.flightNumbers.join(' '),
    routing: flightDuty.sectors.join(' → '),
    reporting: formatDateTime(flightDuty.reportTime, flightDuty.date),
    debriefing: formatDateTime(flightDuty.debriefTime, flightDuty.date, flightDuty.isCrossDay),
    totalDuty: formatDutyHours(flightDuty.dutyHours),
    pay: formatCurrency(flightDuty.flightPay)
  };

  // Add layover-specific information if applicable
  if (flightDuty.dutyType === 'layover') {
    const layoverInfo = calculateLayoverInfo(flightDuty, allFlightDuties);
    if (layoverInfo) {
      cardData.restPeriod = formatDutyHours(layoverInfo.restHours);
      cardData.perDiem = formatCurrency(layoverInfo.perDiemPay);
      cardData.destination = layoverInfo.destination;
    }
  }

  return cardData;
}

/**
 * Calculates layover information for display
 */
function calculateLayoverInfo(
  flightDuty: FlightDuty,
  allFlightDuties: FlightDuty[]
): { restHours: number; perDiemPay: number; destination: string } | null {
  // Find matching inbound flight for this layover
  const destination = getDestination(flightDuty.sectors);
  if (!destination) return null;

  const matchingInboundFlight = allFlightDuties.find(flight => {
    // Must be a layover flight
    if (flight.dutyType !== 'layover') return false;
    
    // Must be an inbound flight from the same destination
    if (!isInboundFlight(flight.sectors) || getDestination(flight.sectors) !== destination) return false;
    
    // Must be after the outbound flight
    if (flight.date.getTime() <= flightDuty.date.getTime()) return false;
    
    // Must be within reasonable timeframe (within 5 days)
    const daysDiff = (flight.date.getTime() - flightDuty.date.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 5;
  });

  if (!matchingInboundFlight) return null;

  // Calculate rest period using timestamp-based calculation (matches production system)
  // Use the same logic as calculation-engine.ts to ensure consistency
  const outboundDebriefTs = createTimestamp(
    flightDuty.date,
    flightDuty.debriefTime,
    flightDuty.isCrossDay
  );
  const inboundReportTs = createTimestamp(
    matchingInboundFlight.date,
    matchingInboundFlight.reportTime,
    false // Inbound report is always on the inbound date (no crossday adjustment)
  );

  const restHours = calculateTimestampDuration(outboundDebriefTs, inboundReportTs);

  const perDiemRate = 8.82; // AED per hour
  const perDiemPay = restHours * perDiemRate;

  return {
    restHours,
    perDiemPay,
    destination
  };
}

/**
 * Helper function to get destination from sectors
 */
function getDestination(sectors: string[]): string | null {
  if (sectors.length === 0) return null;
  const lastSector = sectors[sectors.length - 1];

  // Handle both formats: "DXB-ZAG" and "DXB → ZAG"
  const airports = lastSector.split(/[-→]/).map(airport => airport.trim());
  return airports.length >= 2 ? airports[1] : null;
}

/**
 * Helper function to check if flight is inbound (returns to DXB)
 */
function isInboundFlight(sectors: string[]): boolean {
  if (sectors.length === 0) return false;
  const lastSector = sectors[sectors.length - 1];

  // Handle both formats: "ZAG-DXB" and "ZAG → DXB"
  const airports = lastSector.split(/[-→]/).map(airport => airport.trim());
  return airports.length >= 2 && airports[1] === 'DXB';
}

/**
 * Helper function to check if flight is outbound (departs from DXB)
 */
function isOutboundFlight(sectors: string[]): boolean {
  if (sectors.length === 0) return false;
  const firstSector = sectors[0];

  // Handle both formats: "DXB-ZAG" and "DXB → ZAG"
  const airports = firstSector.split(/[-→]/).map(airport => airport.trim());
  return airports.length >= 2 && airports[0] === 'DXB';
}

/**
 * Identifies layover pairs for UI navigation
 */
export function identifyLayoverPairs(flightDuties: FlightDuty[]): LayoverPair[] {
  const pairs: LayoverPair[] = [];
  const layoverFlights = flightDuties.filter(flight => flight.dutyType === 'layover');

  for (const outboundFlight of layoverFlights) {
    try {
      // Skip if this is not an outbound flight (doesn't start from DXB)
      if (!isOutboundFlight(outboundFlight.sectors)) continue;

      const destination = getDestination(outboundFlight.sectors);
      if (!destination) continue;

      // Find matching inbound flight
      const matchingInboundFlight = layoverFlights.find(flight => {
        try {
          // Must be an inbound flight (returns to DXB)
          if (!isInboundFlight(flight.sectors)) return false;

          // Must be from the same destination - with better error handling
          const inboundOrigin = flight.sectors?.[0]?.split(/[-→]/)?.[0]?.trim();
          if (!inboundOrigin || inboundOrigin !== destination) return false;

          // Must be after the outbound flight (within reasonable timeframe)
          const daysDiff = (flight.date.getTime() - outboundFlight.date.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff > 0 && daysDiff <= 5;
        } catch {
          return false;
        }
      });

      if (matchingInboundFlight) {
        // Calculate rest period and per diem with error handling
        // Use timestamp-based calculation to match production system
        const outboundDebriefTs = createTimestamp(
          outboundFlight.date,
          outboundFlight.debriefTime,
          outboundFlight.isCrossDay
        );
        const inboundReportTs = createTimestamp(
          matchingInboundFlight.date,
          matchingInboundFlight.reportTime,
          false // Inbound report is always on the inbound date
        );

        const restHours = calculateTimestampDuration(outboundDebriefTs, inboundReportTs);

        const perDiemRate = 8.82; // AED per hour
        const perDiemPay = restHours * perDiemRate;

        pairs.push({
          outbound: outboundFlight,
          inbound: matchingInboundFlight,
          destination,
          restHours,
          perDiemPay
        });
      }
    } catch {
      continue;
    }
  }

  return pairs;
}

/**
 * Finds layover pair for a specific flight duty with robust error handling
 */
export function findLayoverPair(
  flightDuty: FlightDuty,
  allFlightDuties: FlightDuty[]
): LayoverPair | null {
  try {
    const pairs = identifyLayoverPairs(allFlightDuties);
    const foundPair = pairs.find(pair =>
      pair.outbound.id === flightDuty.id || pair.inbound.id === flightDuty.id
    );

    if (foundPair) {
      return foundPair;
    }

    // Fallback: Try to find a layover pair using more lenient criteria
    // This helps during edits when data might be temporarily inconsistent
    return findLayoverPairFallback(flightDuty, allFlightDuties);
  } catch {
    return findLayoverPairFallback(flightDuty, allFlightDuties);
  }
}

/**
 * Fallback layover pair detection with more lenient criteria
 * Used when the main pairing logic fails during edits
 */
function findLayoverPairFallback(
  flightDuty: FlightDuty,
  allFlightDuties: FlightDuty[]
): LayoverPair | null {
  if (flightDuty.dutyType !== 'layover') {
    return null;
  }

  const layoverFlights = allFlightDuties.filter(flight =>
    flight.dutyType === 'layover' &&
    flight.id !== flightDuty.id &&
    flight.userId === flightDuty.userId
  );

  // Find the closest layover flight by date (within 7 days)
  const potentialPairs = layoverFlights.filter(flight => {
    const daysDiff = Math.abs(
      (flight.date.getTime() - flightDuty.date.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff > 0 && daysDiff <= 7;
  });

  if (potentialPairs.length === 0) {
    return null;
  }

  // Sort by date proximity and take the closest one
  const closestPair = potentialPairs.sort((a, b) =>
    Math.abs(a.date.getTime() - flightDuty.date.getTime()) -
    Math.abs(b.date.getTime() - flightDuty.date.getTime())
  )[0];

  // Determine which is outbound and which is inbound based on date.
  // IMPORTANT: Even in fallback mode, never pair unrelated flights (prevents false layovers like "rest in DXB").
  const isCurrentOutbound = flightDuty.date.getTime() < closestPair.date.getTime();
  const outboundCandidate = isCurrentOutbound ? flightDuty : closestPair;
  const inboundCandidate = isCurrentOutbound ? closestPair : flightDuty;

  // Validate route directions
  if (!isOutboundFlight(outboundCandidate.sectors) || !isInboundFlight(inboundCandidate.sectors)) {
    return null;
  }

  // Validate destination match (outstation) and avoid treating home-base rest as layover
  const destination = getDestination(outboundCandidate.sectors);
  if (!destination || destination === 'DXB') {
    return null;
  }

  // Inbound must originate from the same destination
  const inboundOrigin = inboundCandidate.sectors?.[0]?.split(/[-→]/)?.[0]?.trim();
  if (!inboundOrigin || inboundOrigin !== destination) {
    return null;
  }

  const outboundDebriefTs = createTimestamp(
    outboundCandidate.date,
    outboundCandidate.debriefTime,
    outboundCandidate.isCrossDay
  );
  const inboundReportTs = createTimestamp(
    inboundCandidate.date,
    inboundCandidate.reportTime,
    false // Inbound report is always on the inbound date
  );

  const restHours = calculateTimestampDuration(outboundDebriefTs, inboundReportTs);
  const perDiemRate = 8.82; // AED per hour
  const perDiemPay = restHours * perDiemRate;

  return {
    outbound: outboundCandidate,
    inbound: inboundCandidate,
    destination,
    restHours,
    perDiemPay
  };
}

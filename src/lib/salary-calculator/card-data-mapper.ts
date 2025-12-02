/**
 * Data Mapping Layer for New Flight Cards
 * Maps FlightDuty interface to new card design requirements
 */

import { FlightDuty, TimeValue } from '@/types/salary-calculator';

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

  // Calculate rest period using the same logic as the production system
  const daysBetween = Math.floor(
    (matchingInboundFlight.date.getTime() - flightDuty.date.getTime()) / (24 * 60 * 60 * 1000)
  );

  // Simple rest calculation (this should match the production calculation)
  const restHours = calculateRestPeriod(
    flightDuty.debriefTime,
    flightDuty.isCrossDay,
    matchingInboundFlight.reportTime,
    matchingInboundFlight.isCrossDay,
    daysBetween
  );

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
 * Simple rest period calculation
 */
function calculateRestPeriod(
  flight1DebriefTime: TimeValue,
  flight1DebriefCrossDay: boolean,
  flight2ReportTime: TimeValue,
  flight2ReportCrossDay: boolean,
  daysBetween: number = 0
): number {
  let debrief = flight1DebriefTime.totalMinutes;
  let report = flight2ReportTime.totalMinutes;

  // Apply cross-day adjustments
  if (flight1DebriefCrossDay) {
    debrief += 24 * 60;
  }

  if (flight2ReportCrossDay) {
    report += 24 * 60;
  }

  // Add days between flights
  report += daysBetween * 24 * 60;

  // If report time is before debrief time, assume next day
  if (report <= debrief) {
    report += 24 * 60;
  }

  const restMinutes = report - debrief;
  return restMinutes / 60; // Return decimal hours
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
        const restHours = calculateRestPeriod(
          outboundFlight.debriefTime,
          outboundFlight.isCrossDay,
          matchingInboundFlight.reportTime,
          matchingInboundFlight.isCrossDay,
          Math.floor((matchingInboundFlight.date.getTime() - outboundFlight.date.getTime()) / (24 * 60 * 60 * 1000))
        );

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

  // Determine which is outbound and which is inbound based on date
  const isCurrentOutbound = flightDuty.date.getTime() < closestPair.date.getTime();

  if (isCurrentOutbound) {
    return {
      outbound: flightDuty,
      inbound: closestPair,
      destination: getDestination(flightDuty.sectors) || 'Unknown',
      restHours: calculateRestPeriod(
        flightDuty.debriefTime,
        flightDuty.isCrossDay,
        closestPair.reportTime,
        false
      ),
      perDiemPay: 0 // Will be calculated elsewhere
    };
  } else {
    return {
      outbound: closestPair,
      inbound: flightDuty,
      destination: getDestination(closestPair.sectors) || 'Unknown',
      restHours: calculateRestPeriod(
        closestPair.debriefTime,
        closestPair.isCrossDay,
        flightDuty.reportTime,
        false
      ),
      perDiemPay: 0 // Will be calculated elsewhere
    };
  }
}

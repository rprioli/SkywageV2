/**
 * Flight classification utilities for Skywage Salary Calculator
 * Determines flight types: turnaround, layover, ASBY, etc.
 * Following existing utility patterns in the codebase
 */

import { DutyType, FlightClassificationResult } from '@/types/salary-calculator';

/**
 * Classifies flight duty type based on flight data
 */
export function classifyFlightDuty(
  duties: string,
  details: string,
  reportTime?: string,
  debriefTime?: string
): FlightClassificationResult {
  const dutiesUpper = duties.toUpperCase().trim();
  const detailsUpper = details.toUpperCase().trim();
  
  // Check for Airport Standby (ASBY)
  if (dutiesUpper.includes('ASBY')) {
    return {
      dutyType: 'asby',
      confidence: 1.0,
      reasoning: 'Contains ASBY in duties column',
      warnings: []
    };
  }

  // Check for Home Standby (SBY)
  if (dutiesUpper.includes('SBY') && !dutiesUpper.includes('ASBY')) {
    return {
      dutyType: 'sby',
      confidence: 1.0,
      reasoning: 'Contains SBY (Home Standby) in duties column',
      warnings: []
    };
  }

  // Check for Off Days
  if (dutiesUpper.includes('OFF') || dutiesUpper === 'X') {
    return {
      dutyType: 'off',
      confidence: 1.0,
      reasoning: 'Contains OFF or X indicating off day',
      warnings: []
    };
  }

  // Check for flight duties
  const flightNumbers = extractFlightNumbers(duties);
  const sectors = extractSectors(details);

  if (flightNumbers.length === 0) {
    return {
      dutyType: 'off',
      confidence: 0.8,
      reasoning: 'No flight numbers detected, assuming off day',
      warnings: ['Could not detect flight numbers in duties column']
    };
  }

  // Determine if turnaround or layover
  if (flightNumbers.length > 1) {
    // Multiple flight numbers suggest turnaround
    const lastSector = sectors[sectors.length - 1] || '';
    const returnsToDXB = lastSector.includes('DXB') && sectors.length > 1;
    
    if (returnsToDXB) {
      return {
        dutyType: 'turnaround',
        confidence: 0.9,
        reasoning: `Multiple flights (${flightNumbers.join(', ')}) returning to DXB`,
        warnings: []
      };
    } else {
      return {
        dutyType: 'turnaround',
        confidence: 0.7,
        reasoning: `Multiple flights (${flightNumbers.join(', ')}) in single duty`,
        warnings: ['Could not confirm return to DXB - verify turnaround classification']
      };
    }
  } else {
    // Single flight number suggests layover
    return {
      dutyType: 'layover',
      confidence: 0.8,
      reasoning: `Single flight (${flightNumbers[0]}) suggests layover duty`,
      warnings: []
    };
  }
}

/**
 * Extracts flight numbers from duties string
 */
export function extractFlightNumbers(duties: string): string[] {
  if (!duties || typeof duties !== 'string') {
    return [];
  }

  // Common flight number patterns: FZ123, FZ1234, etc.
  const flightPattern = /\b[A-Z]{2}\d{3,4}\b/g;
  const matches = duties.match(flightPattern);
  
  return matches ? [...new Set(matches)] : []; // Remove duplicates
}

/**
 * Extracts sectors from details string
 */
export function extractSectors(details: string): string[] {
  if (!details || typeof details !== 'string') {
    return [];
  }

  // Common sector patterns: DXB - CMB, CMB - DXB, etc.
  const sectorPattern = /\b[A-Z]{3}\s*-\s*[A-Z]{3}\b/g;
  const matches = details.match(sectorPattern);
  
  return matches ? matches.map(sector => sector.replace(/\s/g, '')) : [];
}

/**
 * Validates flight number format
 */
export function validateFlightNumber(flightNumber: string): boolean {
  if (!flightNumber || typeof flightNumber !== 'string') {
    return false;
  }

  // Flydubai pattern: FZ followed by 3-4 digits
  const flydubaiPattern = /^FZ\d{3,4}$/;
  return flydubaiPattern.test(flightNumber.toUpperCase());
}

/**
 * Validates sector format
 */
export function validateSector(sector: string): boolean {
  if (!sector || typeof sector !== 'string') {
    return false;
  }

  // Standard IATA format: XXX-XXX or XXX - XXX
  const sectorPattern = /^[A-Z]{3}\s*-\s*[A-Z]{3}$/;
  return sectorPattern.test(sector.toUpperCase());
}

/**
 * Determines if flights form a turnaround sequence
 */
export function isTurnaroundSequence(sectors: string[]): boolean {
  if (sectors.length < 2) {
    return false;
  }

  // Extract airports from sectors
  const airports: string[] = [];
  
  for (const sector of sectors) {
    const parts = sector.split('-').map(part => part.trim().toUpperCase());
    if (parts.length === 2) {
      if (airports.length === 0) {
        airports.push(parts[0], parts[1]);
      } else {
        // Check if this sector connects to the previous one
        if (airports[airports.length - 1] === parts[0]) {
          airports.push(parts[1]);
        } else {
          return false; // Disconnected sectors
        }
      }
    }
  }

  // Check if it returns to the starting airport (typically DXB for Flydubai)
  return airports.length >= 3 && airports[0] === airports[airports.length - 1];
}

/**
 * Extracts base airport from sectors (typically the starting airport)
 */
export function extractBaseAirport(sectors: string[]): string | null {
  if (sectors.length === 0) {
    return null;
  }

  const firstSector = sectors[0];
  const parts = firstSector.split('-').map(part => part.trim().toUpperCase());
  
  return parts.length >= 1 ? parts[0] : null;
}

/**
 * Checks if duty involves international sectors
 */
export function hasInternationalSectors(sectors: string[]): boolean {
  // This is a simplified check - in a real implementation,
  // you'd have a database of airport codes and their countries
  const uaeAirports = ['DXB', 'AUH', 'SHJ', 'RKT', 'AAN', 'DWC'];
  
  for (const sector of sectors) {
    const parts = sector.split('-').map(part => part.trim().toUpperCase());
    for (const airport of parts) {
      if (!uaeAirports.includes(airport)) {
        return true; // Found non-UAE airport
      }
    }
  }
  
  return false;
}

/**
 * Estimates duty complexity based on sectors and flight numbers
 */
export function calculateDutyComplexity(flightNumbers: string[], sectors: string[]): {
  complexity: 'simple' | 'moderate' | 'complex';
  score: number;
  factors: string[];
} {
  let score = 0;
  const factors: string[] = [];

  // Base score for number of flights
  score += flightNumbers.length;
  if (flightNumbers.length > 1) {
    factors.push(`Multiple flights (${flightNumbers.length})`);
  }

  // Additional score for number of sectors
  score += sectors.length * 0.5;
  if (sectors.length > 2) {
    factors.push(`Multiple sectors (${sectors.length})`);
  }

  // International flights add complexity
  if (hasInternationalSectors(sectors)) {
    score += 1;
    factors.push('International sectors');
  }

  // Turnaround adds complexity
  if (isTurnaroundSequence(sectors)) {
    score += 1;
    factors.push('Turnaround sequence');
  }

  let complexity: 'simple' | 'moderate' | 'complex';
  if (score <= 1) {
    complexity = 'simple';
  } else if (score <= 3) {
    complexity = 'moderate';
  } else {
    complexity = 'complex';
  }

  return { complexity, score, factors };
}

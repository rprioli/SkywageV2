/**
 * Input Transformers for Skywage Salary Calculator
 * Transforms simplified user input to expected validation formats
 * Phase 7: Supporting new grid-based input format
 */

/**
 * Transforms number-only flight input to FZ-prefixed format
 * @param flightNumbers Array of number-only strings (e.g., ['123', '124'])
 * @returns Array of FZ-prefixed strings (e.g., ['FZ123', 'FZ124'])
 */
export function transformFlightNumbers(flightNumbers: string[]): string[] {
  return flightNumbers
    .filter(num => num.trim() !== '') // Remove empty entries
    .map(num => {
      const cleanNum = num.trim();
      // If already has FZ prefix, return as is
      if (cleanNum.toUpperCase().startsWith('FZ')) {
        return cleanNum.toUpperCase();
      }
      // Add FZ prefix to numbers
      return `FZ${cleanNum}`;
    });
}

/**
 * Transforms individual airport codes to sector format
 * @param airportCodes Array of 3-letter airport codes (e.g., ['DXB', 'KHI', 'KHI', 'DXB'])
 * @returns Array of sector strings (e.g., ['DXB-KHI', 'KHI-DXB'])
 */
export function transformSectors(airportCodes: string[]): string[] {
  const validCodes = airportCodes
    .filter(code => code.trim() !== '') // Remove empty entries
    .map(code => code.trim().toUpperCase());

  if (validCodes.length === 0) {
    return [];
  }

  // For single airport (layover), create a placeholder sector
  if (validCodes.length === 1) {
    return [`${validCodes[0]}-???`]; // Will be handled by validation
  }

  // Create sectors by pairing consecutive airports
  const sectors: string[] = [];
  for (let i = 0; i < validCodes.length - 1; i++) {
    sectors.push(`${validCodes[i]}-${validCodes[i + 1]}`);
  }

  return sectors;
}

/**
 * Transforms simplified input back to individual components for display
 * @param flightNumbers FZ-prefixed flight numbers
 * @returns Number-only strings for display
 */
export function extractFlightNumbers(flightNumbers: string[]): string[] {
  return flightNumbers.map(num => {
    const upperNum = num.toUpperCase();
    if (upperNum.startsWith('FZ')) {
      return upperNum.substring(2); // Remove FZ prefix
    }
    return num;
  });
}

/**
 * Transforms sectors back to individual airport codes for display
 * @param sectors Array of sector strings (e.g., ['DXB-KHI', 'KHI-DXB'])
 * @returns Array of individual airport codes (e.g., ['DXB', 'KHI', 'KHI', 'DXB'])
 */
export function extractAirportCodes(sectors: string[]): string[] {
  const airportCodes: string[] = [];
  
  sectors.forEach((sector, index) => {
    const parts = sector.split('-').map(part => part.trim());
    if (parts.length === 2) {
      if (index === 0) {
        // First sector: add both airports
        airportCodes.push(parts[0], parts[1]);
      } else {
        // Subsequent sectors: only add destination (origin should match previous destination)
        airportCodes.push(parts[1]);
      }
    }
  });

  return airportCodes;
}

/**
 * Validates if simplified input can be transformed to valid format
 * @param flightNumbers Number-only flight numbers
 * @param airportCodes Individual airport codes
 * @returns Validation result with transformed data
 */
export function validateAndTransformInput(
  flightNumbers: string[],
  airportCodes: string[]
): {
  valid: boolean;
  transformedFlightNumbers: string[];
  transformedSectors: string[];
  errors: string[];
} {
  const errors: string[] = [];
  
  // Transform flight numbers
  const transformedFlightNumbers = transformFlightNumbers(flightNumbers);
  
  // Validate flight numbers are numeric
  for (const num of flightNumbers.filter(n => n.trim() !== '')) {
    if (!/^\d{3,4}$/.test(num.trim())) {
      errors.push(`Flight number "${num}" must be 3-4 digits`);
    }
  }
  
  // Transform sectors
  const transformedSectors = transformSectors(airportCodes);
  
  // Validate airport codes are 3 letters
  for (const code of airportCodes.filter(c => c.trim() !== '')) {
    if (!/^[A-Z]{3}$/.test(code.trim().toUpperCase())) {
      errors.push(`Airport code "${code}" must be 3 letters`);
    }
  }

  return {
    valid: errors.length === 0,
    transformedFlightNumbers,
    transformedSectors,
    errors
  };
}

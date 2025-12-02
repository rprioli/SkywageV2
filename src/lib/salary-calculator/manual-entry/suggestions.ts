/**
 * Manual Entry Suggestions Module
 * Auto-complete suggestions for flight numbers and sectors
 */

/**
 * Gets suggested flight numbers based on partial input
 */
export function getSuggestedFlightNumbers(partial: string): string[] {
  if (!partial || partial.length < 2) {
    return [];
  }

  // Simple suggestions based on Flydubai pattern
  const suggestions: string[] = [];
  const upperPartial = partial.toUpperCase();

  if (upperPartial.startsWith('FZ')) {
    const numberPart = upperPartial.substring(2);
    if (numberPart.length > 0 && /^\d+$/.test(numberPart)) {
      // Suggest common flight numbers
      const baseNumber = parseInt(numberPart);
      for (let i = 0; i < 5; i++) {
        const suggestedNumber = baseNumber + i;
        if (suggestedNumber >= 100 && suggestedNumber <= 9999) {
          suggestions.push(`FZ${suggestedNumber}`);
        }
      }
    }
  } else if (/^\d/.test(upperPartial)) {
    // If user starts with number, suggest FZ prefix
    suggestions.push(`FZ${upperPartial}`);
  }

  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

/**
 * Gets suggested sectors based on partial input
 */
export function getSuggestedSectors(partial: string): string[] {
  if (!partial || partial.length < 2) {
    return [];
  }

  // Common Flydubai destinations
  const commonSectors = [
    'DXB-CMB', 'CMB-DXB', 'DXB-CCJ', 'CCJ-DXB',
    'DXB-COK', 'COK-DXB', 'DXB-TRV', 'TRV-DXB',
    'DXB-BOM', 'BOM-DXB', 'DXB-DEL', 'DEL-DXB',
    'DXB-KTM', 'KTM-DXB', 'DXB-DAC', 'DAC-DXB'
  ];

  const upperPartial = partial.toUpperCase();
  return commonSectors.filter(sector => 
    sector.startsWith(upperPartial)
  ).slice(0, 5);
}


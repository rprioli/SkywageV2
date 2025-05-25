/**
 * Country utilities for Skywage
 * Shared utilities for country code to name conversion
 */

import { countries } from 'countries-list';

/**
 * Convert country code to country name
 * @param countryCode The ISO country code (e.g., 'US', 'BR', 'CA')
 * @returns The country name or the original code if not found
 */
export function getCountryName(countryCode: string): string {
  if (!countryCode) return 'Not specified';
  
  const country = (countries as Record<string, { name: string }>)[countryCode];
  return country?.name || countryCode;
}

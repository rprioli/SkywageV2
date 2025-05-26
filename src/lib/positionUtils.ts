/**
 * Position utilities for Skywage
 * Used to handle position-related operations and display
 */

/**
 * Gets the full display name for a position code
 * @param position The position code ('CCM' or 'SCCM')
 * @returns The full position name or 'N/A' if not found
 */
export function getPositionName(position: string): string {
  switch (position) {
    case 'CCM':
      return 'Cabin Crew Member';
    case 'SCCM':
      return 'Senior Cabin Crew Member';
    default:
      return 'N/A';
  }
}

/**
 * Validates if a position code is valid
 * @param position The position code to validate
 * @returns True if valid, false otherwise
 */
export function isValidPosition(position: string): position is 'CCM' | 'SCCM' {
  return position === 'CCM' || position === 'SCCM';
}

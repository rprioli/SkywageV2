/**
 * FlightTile Component
 * Blue filled tile for flight duties
 * Phase 4b - Friends Feature (Polish: multi-day spanning)
 */

'use client';

import React from 'react';
import { Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TilePosition } from '@/lib/roster-comparison';

interface FlightTileProps {
  airportCode?: string;
  flightNumber?: string;
  isMultiDay?: boolean;
  position?: TilePosition;
  className?: string;
}

/**
 * Flight duty tile - blue background with airplane icon
 * Matches the reference design with bold airport code and smaller flight number
 * Multi-day flights connect visually with no gap between tiles
 */
export function FlightTile({
  airportCode,
  flightNumber,
  isMultiDay = false,
  position = 'single',
  className,
}: FlightTileProps) {
  // Determine border radius based on position in multi-day span
  const borderRadiusClasses = cn({
    'rounded-lg': position === 'single',
    'rounded-t-lg rounded-b-none': position === 'start',
    'rounded-none': position === 'middle',
    'rounded-b-lg rounded-t-none': position === 'end',
  });

  // Multi-day tiles need margin adjustment to visually connect
  const marginClasses = cn({
    'mb-0': position === 'start',
    'mt-0 mb-0': position === 'middle',
    'mt-0': position === 'end',
  });

  // Only hide content for actual multi-day layovers (same flight spanning days)
  // NOT for consecutive but separate work duties (each should show its destination)
  const showContent = !isMultiDay || position === 'single' || position === 'start';

  return (
    <div
      className={cn(
        'relative flex h-full min-h-[48px] sm:min-h-[60px] items-center px-3 py-2 sm:px-4 sm:py-3',
        'bg-[#4169E1] text-white', // Royal blue matching reference
        borderRadiusClasses,
        marginClasses,
        className
      )}
    >
      {showContent && (
        <>
          {/* Icon - anchored to the left */}
          <div className="flex-shrink-0">
            <Plane className="h-4 w-4 sm:h-5 sm:w-5 rotate-45" fill="currentColor" />
          </div>

          {/* Duty label - centered in the tile */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm sm:text-base font-medium leading-tight truncate max-w-[60%]">
              {airportCode || 'FLT'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}


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

  // For multi-day layovers, only show content on the first day (start)
  // Middle and end days show just the blue background (continuation)
  const showContent = position === 'single' || position === 'start';

  return (
    <div
      className={cn(
        'flex h-full min-h-[48px] sm:min-h-[60px] items-center justify-center gap-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3',
        'bg-[#4169E1] text-white', // Royal blue matching reference
        borderRadiusClasses,
        marginClasses,
        className
      )}
    >
      {showContent && (
        <>
          {/* Airplane icon - smaller on mobile */}
          <div className="flex-shrink-0">
            <Plane className="h-4 w-4 sm:h-5 sm:w-5 rotate-45" fill="currentColor" />
          </div>

          {/* Airport code and flight number */}
          <div className="flex flex-col items-center text-center">
            <span className="text-base sm:text-lg font-bold leading-tight">
              {airportCode || 'FLT'}
            </span>
            {/* Hide flight number on mobile for compact view */}
            {flightNumber && (
              <span className="hidden sm:block text-sm font-medium opacity-90">{flightNumber}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}


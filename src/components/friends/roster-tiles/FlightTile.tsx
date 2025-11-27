/**
 * FlightTile Component
 * Blue filled tile for flight duties
 * Phase 4b - Friends Feature
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

  return (
    <div
      className={cn(
        'flex h-full min-h-[60px] items-center justify-between gap-2 px-3 py-2',
        'bg-[#4169E1] text-white', // Royal blue matching reference
        borderRadiusClasses,
        isMultiDay && position !== 'single' && 'border-t-0',
        className
      )}
    >
      {/* Airplane icon */}
      <div className="flex-shrink-0">
        <Plane className="h-5 w-5 rotate-45" fill="currentColor" />
      </div>

      {/* Airport code and flight number */}
      <div className="flex flex-col items-end text-right">
        <span className="text-base font-bold leading-tight">
          {airportCode || 'FLT'}
        </span>
        {flightNumber && (
          <span className="text-xs font-medium opacity-90">{flightNumber}</span>
        )}
      </div>
    </div>
  );
}


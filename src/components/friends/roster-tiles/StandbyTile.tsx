/**
 * StandbyTile Component
 * Tile for standby duties (ASBY, SBY)
 * Phase 4b - Friends Feature
 */

'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TilePosition } from '@/lib/roster-comparison';

interface StandbyTileProps {
  type: 'asby' | 'sby';
  position?: TilePosition;
  className?: string;
}

/**
 * Standby duty tile - amber/yellow themed for standby states
 * Supports position-based corner rounding for consecutive standby days
 */
export function StandbyTile({
  type,
  position = 'single',
  className,
}: StandbyTileProps) {
  const label = type === 'asby' ? 'ASBY' : 'SBY';

  // Determine border radius based on position in consecutive group
  const borderRadiusClasses = cn({
    'rounded-lg': position === 'single',
    'rounded-t-lg rounded-b-none': position === 'start',
    'rounded-none': position === 'middle',
    'rounded-b-lg rounded-t-none': position === 'end',
  });

  // Border styling based on position for seamless connection
  const borderClasses = cn(
    'border-amber-400',
    {
      'border-2': position === 'single',
      'border-l-2 border-r-2 border-t-2 border-b-0': position === 'start',
      'border-l-2 border-r-2 border-t-0 border-b-0': position === 'middle',
      'border-l-2 border-r-2 border-t-0 border-b-2': position === 'end',
    }
  );

  return (
    <div
      className={cn(
        'flex h-full min-h-[48px] sm:min-h-[60px] items-center justify-center px-2 py-2 sm:px-4 sm:py-3',
        'bg-amber-50',
        borderRadiusClasses,
        borderClasses,
        className
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Icon container - fixed width for consistent alignment */}
        <div className="w-5 sm:w-6 flex-shrink-0 flex justify-center">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
        </div>

        {/* Label - left-aligned */}
        <span className="text-sm sm:text-base font-medium text-amber-700">
          {label}
        </span>
      </div>
    </div>
  );
}


/**
 * OffDayTile Component
 * Outlined tile with green house icon for off days
 * Phase 4b - Friends Feature
 */

'use client';

import React from 'react';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TilePosition } from '@/lib/roster-comparison';

interface OffDayTileProps {
  label?: string;
  position?: TilePosition;
  className?: string;
}

/**
 * Off day tile - outlined style with green house icon
 * Supports position-based corner rounding for consecutive off days
 */
export function OffDayTile({
  label = 'OFF',
  position = 'single',
  className,
}: OffDayTileProps) {
  // Determine border radius based on position in consecutive group
  const borderRadiusClasses = cn({
    'rounded-lg': position === 'single',
    'rounded-t-lg rounded-b-none': position === 'start',
    'rounded-none': position === 'middle',
    'rounded-b-lg rounded-t-none': position === 'end',
  });

  // Border styling based on position for seamless connection
  // - single: all borders
  // - start: all borders except bottom (connects downward)
  // - middle: left/right borders only (connects both ways)
  // - end: all borders except top (connects upward)
  const borderClasses = cn(
    'border-gray-300',
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
        'flex h-full min-h-[48px] sm:min-h-[60px] items-center justify-center gap-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3',
        'bg-white',
        borderRadiusClasses,
        borderClasses,
        className
      )}
    >
      {/* House icon - green like the accent color, smaller on mobile */}
      <div className="flex-shrink-0">
        <Home 
          className="h-4 w-4 sm:h-5 sm:w-5 text-[#22C55E]" 
          fill="#22C55E" 
          strokeWidth={0}
        />
      </div>

      {/* Label */}
      <span className="text-base sm:text-lg font-medium text-gray-600">
        {label}
      </span>
    </div>
  );
}


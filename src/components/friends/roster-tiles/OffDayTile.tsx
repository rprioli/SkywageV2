/**
 * OffDayTile Component
 * Outlined tile with green house icon for off days
 * Phase 4b - Friends Feature
 */

'use client';

import React from 'react';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OffDayTileProps {
  label?: string;
  className?: string;
}

/**
 * Off day tile - outlined style with green house icon
 * Content centered like FlightTile
 */
export function OffDayTile({
  label = 'OFF',
  className,
}: OffDayTileProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[48px] sm:min-h-[60px] items-center justify-center gap-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3',
        'rounded-lg border-2 border-gray-300 bg-white',
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


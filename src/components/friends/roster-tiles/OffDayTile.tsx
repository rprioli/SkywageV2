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
 * Matches the reference design
 */
export function OffDayTile({
  label = 'XX',
  className,
}: OffDayTileProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[60px] items-center justify-between gap-2 px-3 py-2',
        'rounded-lg border-2 border-gray-300 bg-white',
        className
      )}
    >
      {/* House icon - green like the accent color */}
      <div className="flex-shrink-0">
        <Home 
          className="h-5 w-5 text-[#22C55E]" 
          fill="#22C55E" 
          strokeWidth={0}
        />
      </div>

      {/* Label */}
      <span className="text-base font-medium text-gray-600">
        {label}
      </span>
    </div>
  );
}


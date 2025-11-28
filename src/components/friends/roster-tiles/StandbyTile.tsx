/**
 * StandbyTile Component
 * Tile for standby duties (ASBY, SBY)
 * Phase 4b - Friends Feature
 */

'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StandbyTileProps {
  type: 'asby' | 'sby';
  className?: string;
}

/**
 * Standby duty tile - amber/yellow themed for standby states
 */
export function StandbyTile({
  type,
  className,
}: StandbyTileProps) {
  const label = type === 'asby' ? 'ASBY' : 'SBY';

  return (
    <div
      className={cn(
        'flex h-full min-h-[48px] sm:min-h-[60px] items-center justify-center gap-2 sm:gap-3 px-2 py-2 sm:px-3 sm:py-2',
        'rounded-lg border-2 border-amber-400 bg-amber-50',
        className
      )}
    >
      {/* Clock icon - smaller on mobile */}
      <div className="flex-shrink-0">
        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
      </div>

      {/* Label */}
      <span className="text-sm sm:text-base font-medium text-amber-700">
        {label}
      </span>
    </div>
  );
}


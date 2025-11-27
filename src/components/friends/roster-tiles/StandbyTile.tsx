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
        'flex h-full min-h-[60px] items-center justify-between gap-2 px-3 py-2',
        'rounded-lg border-2 border-amber-400 bg-amber-50',
        className
      )}
    >
      {/* Clock icon */}
      <div className="flex-shrink-0">
        <Clock className="h-5 w-5 text-amber-600" />
      </div>

      {/* Label */}
      <span className="text-base font-semibold text-amber-700">
        {label}
      </span>
    </div>
  );
}


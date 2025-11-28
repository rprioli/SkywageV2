/**
 * EmptyTile Component
 * Placeholder tile for days with no duty data
 * Phase 4b - Friends Feature
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyTileProps {
  className?: string;
}

/**
 * Empty tile - subtle placeholder for days with no data
 */
export function EmptyTile({ className }: EmptyTileProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[48px] sm:min-h-[60px] items-center justify-center',
        'rounded-lg border border-dashed border-gray-200 bg-gray-50/50',
        className
      )}
    >
      <span className="text-xs text-gray-300">—</span>
    </div>
  );
}


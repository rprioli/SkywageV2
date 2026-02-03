'use client';

/**
 * Compact Duty Tile Component
 * Smaller tiles optimized for the multi-friend comparison grid (horizontal layout)
 * Phase 4b - Multi-friend comparison feature
 */

import React from 'react';
import { Plane, Home, Palmtree, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DutyTileData, TilePosition, getDutyDisplayInfo } from '@/lib/roster-comparison';

interface CompactDutyTileProps {
  duty: DutyTileData | null;
  groupPosition: TilePosition;
  className?: string;
}

/**
 * Compact duty tile for horizontal grid layout
 * Renders appropriate tile type based on duty data
 */
export function CompactDutyTile({ duty, groupPosition, className }: CompactDutyTileProps) {
  if (!duty) {
    return <EmptyCell className={className} />;
  }

  const displayInfo = getDutyDisplayInfo(duty);
  
  // Use groupPosition for visual connection between consecutive duties
  const effectivePosition = groupPosition || duty.position || 'single';

  switch (duty.type) {
    case 'flight':
      return (
        <FlightCell
          airportCode={duty.airportCode}
          position={effectivePosition}
          isMultiDay={duty.isMultiDay}
          className={className}
        />
      );

    case 'off':
      return (
        <OffDayCell
          label={displayInfo.label}
          position={effectivePosition}
          className={className}
        />
      );

    case 'standby':
      return (
        <StandbyCell
          type={duty.dutyType === 'asby' ? 'asby' : 'sby'}
          position={effectivePosition}
          className={className}
        />
      );

    default:
      return <EmptyCell className={className} />;
  }
}

// ============================================================================
// Cell Sub-components
// ============================================================================

interface FlightCellProps {
  airportCode?: string;
  position: TilePosition;
  isMultiDay?: boolean;
  className?: string;
}

/**
 * Compact flight tile - blue background
 */
function FlightCell({ airportCode, position, isMultiDay, className }: FlightCellProps) {
  const borderRadiusClasses = getBorderRadiusClasses(position, 'horizontal');
  
  // Only show content for single tiles or start of multi-day
  const showContent = !isMultiDay || position === 'single' || position === 'start';

  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-[76px] items-center justify-center p-1', // Increased height, vertical layout
        'bg-[#4169E1] text-white',
        borderRadiusClasses,
        className
      )}
    >
      {showContent && (
        <>
          <Plane
            className="h-4 w-4 rotate-45 flex-shrink-0 mb-1"
            fill="currentColor"
          />
          <span className="text-sm font-medium leading-tight truncate max-w-full text-center">
            {airportCode || 'FLT'}
          </span>
        </>
      )}
    </div>
  );
}

interface OffDayCellProps {
  label: string;
  position: TilePosition;
  className?: string;
}

/**
 * Compact off day tile - outlined with green icon
 */
function OffDayCell({ label, position, className }: OffDayCellProps) {
  const borderRadiusClasses = getBorderRadiusClasses(position, 'horizontal');
  const borderClasses = getBorderClasses(position, 'horizontal');

  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-[76px] items-center justify-center p-1', // Increased height
        'bg-white',
        borderRadiusClasses,
        borderClasses,
        className
      )}
    >
      {label === 'LEAVE' ? (
        <Palmtree
          className="h-4 w-4 text-[#22C55E] flex-shrink-0 mb-1"
          strokeWidth={2}
        />
      ) : (
        <Home
          className="h-4 w-4 text-[#22C55E] flex-shrink-0 mb-1"
          fill="#22C55E"
          strokeWidth={0}
        />
      )}
      <span className="text-xs font-medium text-gray-600 truncate text-center">
        {label}
      </span>
    </div>
  );
}

interface StandbyCellProps {
  type: 'asby' | 'sby';
  position: TilePosition;
  className?: string;
}

/**
 * Compact standby tile - amber/orange background
 */
function StandbyCell({ type, position, className }: StandbyCellProps) {
  const borderRadiusClasses = getBorderRadiusClasses(position, 'horizontal');
  const label = type === 'asby' ? 'ASBY' : 'SBY';

  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-[76px] items-center justify-center p-1', // Increased height
        'bg-amber-500 text-white',
        borderRadiusClasses,
        className
      )}
    >
      <Clock className="h-4 w-4 flex-shrink-0 mb-1" />
      <span className="text-sm font-medium truncate text-center">
        {label}
      </span>
    </div>
  );
}

interface EmptyCellProps {
  className?: string;
}

/**
 * Empty cell placeholder
 */
function EmptyCell({ className }: EmptyCellProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[76px] items-center justify-center',
        'rounded bg-gray-50 border border-dashed border-gray-200',
        className
      )}
    >
      <span className="text-xs text-gray-300">—</span>
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get border radius classes for horizontal layout (left-right connection)
 */
function getBorderRadiusClasses(position: TilePosition, direction: 'horizontal' | 'vertical'): string {
  if (direction === 'horizontal') {
    // Horizontal: start=left rounded, end=right rounded
    switch (position) {
      case 'single':
        return 'rounded';
      case 'start':
        return 'rounded-l rounded-r-none';
      case 'middle':
        return 'rounded-none';
      case 'end':
        return 'rounded-r rounded-l-none';
      default:
        return 'rounded';
    }
  } else {
    // Vertical: start=top rounded, end=bottom rounded
    switch (position) {
      case 'single':
        return 'rounded';
      case 'start':
        return 'rounded-t rounded-b-none';
      case 'middle':
        return 'rounded-none';
      case 'end':
        return 'rounded-b rounded-t-none';
      default:
        return 'rounded';
    }
  }
}

/**
 * Get border classes for off-day tiles (horizontal layout)
 */
function getBorderClasses(position: TilePosition, direction: 'horizontal' | 'vertical'): string {
  if (direction === 'horizontal') {
    switch (position) {
      case 'single':
        return 'border-2 border-gray-300';
      case 'start':
        return 'border-t-2 border-b-2 border-l-2 border-r-0 border-gray-300';
      case 'middle':
        return 'border-t-2 border-b-2 border-l-0 border-r-0 border-gray-300';
      case 'end':
        return 'border-t-2 border-b-2 border-r-2 border-l-0 border-gray-300';
      default:
        return 'border-2 border-gray-300';
    }
  } else {
    switch (position) {
      case 'single':
        return 'border-2 border-gray-300';
      case 'start':
        return 'border-l-2 border-r-2 border-t-2 border-b-0 border-gray-300';
      case 'middle':
        return 'border-l-2 border-r-2 border-t-0 border-b-0 border-gray-300';
      case 'end':
        return 'border-l-2 border-r-2 border-b-2 border-t-0 border-gray-300';
      default:
        return 'border-2 border-gray-300';
    }
  }
}

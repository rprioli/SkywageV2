/**
 * DutyTile Component
 * Smart wrapper that renders the appropriate tile based on duty type
 * Phase 4b - Friends Feature
 */

'use client';

import React from 'react';
import { DutyTileData, getDutyDisplayInfo, TilePosition } from '@/lib/roster-comparison';
import { FlightTile } from './FlightTile';
import { OffDayTile } from './OffDayTile';
import { StandbyTile } from './StandbyTile';
import { EmptyTile } from './EmptyTile';

interface DutyTileProps {
  tile: DutyTileData | null;
  /** Override position for consecutive duty groups (not multi-day layovers) */
  groupPosition?: TilePosition;
  className?: string;
}

/**
 * Smart duty tile that renders the appropriate component based on tile type
 * Supports groupPosition for seamless consecutive duty rendering
 */
export function DutyTile({ tile, groupPosition, className }: DutyTileProps) {
  if (!tile) {
    return <EmptyTile className={className} />;
  }

  const displayInfo = getDutyDisplayInfo(tile);
  
  // For multi-day layovers, use the tile's native position
  // For consecutive duty groups, use the groupPosition if provided
  const effectivePosition = tile.isMultiDay ? tile.position : (groupPosition || 'single');

  switch (tile.type) {
    case 'flight':
      return (
        <FlightTile
          airportCode={tile.airportCode}
          flightNumber={tile.flightNumber}
          isMultiDay={tile.isMultiDay}
          position={tile.isMultiDay ? tile.position : effectivePosition}
          className={className}
        />
      );

    case 'off':
      return (
        <OffDayTile 
          label={displayInfo.label} 
          position={effectivePosition}
          className={className} 
        />
      );

    case 'standby':
      return (
        <StandbyTile
          type={tile.dutyType === 'asby' ? 'asby' : 'sby'}
          position={effectivePosition}
          className={className}
        />
      );

    default:
      return <EmptyTile className={className} />;
  }
}


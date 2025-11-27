/**
 * DutyTile Component
 * Smart wrapper that renders the appropriate tile based on duty type
 * Phase 4b - Friends Feature
 */

'use client';

import React from 'react';
import { DutyTileData, getDutyDisplayInfo } from '@/lib/roster-comparison';
import { FlightTile } from './FlightTile';
import { OffDayTile } from './OffDayTile';
import { StandbyTile } from './StandbyTile';
import { EmptyTile } from './EmptyTile';

interface DutyTileProps {
  tile: DutyTileData | null;
  className?: string;
}

/**
 * Smart duty tile that renders the appropriate component based on tile type
 */
export function DutyTile({ tile, className }: DutyTileProps) {
  if (!tile) {
    return <EmptyTile className={className} />;
  }

  const displayInfo = getDutyDisplayInfo(tile);

  switch (tile.type) {
    case 'flight':
      return (
        <FlightTile
          airportCode={tile.airportCode}
          flightNumber={tile.flightNumber}
          isMultiDay={tile.isMultiDay}
          position={tile.position}
          className={className}
        />
      );

    case 'off':
      return <OffDayTile label={displayInfo.label} className={className} />;

    case 'standby':
      return (
        <StandbyTile
          type={tile.dutyType === 'asby' ? 'asby' : 'sby'}
          className={className}
        />
      );

    default:
      return <EmptyTile className={className} />;
  }
}


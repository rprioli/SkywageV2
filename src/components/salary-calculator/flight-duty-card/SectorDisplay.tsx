'use client';

/**
 * Sector Display Component
 * Renders flight sectors with proper formatting and arrows
 */

import { ArrowRight } from 'lucide-react';
import { isTurnaroundPattern } from './utils';

interface SectorDisplayProps {
  sectors: string[];
  dutyType: string;
}

export function SectorDisplay({ sectors, dutyType }: SectorDisplayProps) {
  if (sectors.length === 0) return null;

  // Special handling for home standby - just show base location without arrows
  if (dutyType === 'sby' || dutyType === 'asby') {
    const baseAirport = sectors[0]?.split('-')[0]?.trim() || 'DXB';
    return <span style={{ color: 'rgb(58, 55, 128)' }}>{baseAirport}</span>;
  }

  // Handle turnaround patterns (either classified as turnaround or looks like one)
  if (dutyType === 'turnaround' || isTurnaroundPattern(sectors)) {
    const airports = sectors.flatMap(sector => sector.split('-').map(airport => airport.trim()));
    if (airports.length >= 3) {
      const origin = airports[0];
      const destination = airports[1];
      const returnToOrigin = airports[airports.length - 1];
      const turnaroundRoute = [origin, destination, returnToOrigin];

      return (
        <span className="flex items-center justify-center gap-1.5">
          {turnaroundRoute.map((airport, index) => (
            <span key={index} className="flex items-center gap-1.5">
              <span style={{ color: 'rgb(58, 55, 128)' }}>{airport}</span>
              {index < turnaroundRoute.length - 1 && (
                <ArrowRight className="h-3 w-3 text-[#4C49ED]" />
              )}
            </span>
          ))}
        </span>
      );
    }
  }

  // Layover sectors - show each sector separately
  if (dutyType === 'layover') {
    return (
      <div className="flex flex-col gap-1">
        {sectors.map((sector, index) => {
          const airports = sector.split('-').map(airport => airport.trim());
          if (airports.length === 2) {
            return (
              <span key={index} className="flex items-center justify-center gap-1.5">
                <span style={{ color: 'rgb(58, 55, 128)' }}>{airports[0]}</span>
                <ArrowRight className="h-3 w-3 text-[#4C49ED]" />
                <span style={{ color: 'rgb(58, 55, 128)' }}>{airports[1]}</span>
              </span>
            );
          }
          return <span key={index} style={{ color: 'rgb(58, 55, 128)' }}>{sector}</span>;
        })}
      </div>
    );
  }

  // Single sectors - show with arrow
  if (sectors.length === 1) {
    const airports = sectors[0].split('-').map(airport => airport.trim());
    if (airports.length === 2) {
      return (
        <span className="flex items-center justify-center gap-1.5">
          <span style={{ color: 'rgb(58, 55, 128)' }}>{airports[0]}</span>
          <ArrowRight className="h-3 w-3 text-[#4C49ED]" />
          <span style={{ color: 'rgb(58, 55, 128)' }}>{airports[1]}</span>
        </span>
      );
    }
  }

  // Fallback: show sectors as-is
  return <span style={{ color: 'rgb(58, 55, 128)' }}>{sectors.join(', ')}</span>;
}


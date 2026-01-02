'use client';

/**
 * Sector Display Component
 * Renders flight sectors with proper formatting and arrows
 * Supports standard turnarounds and double-sector turnarounds
 */

import { ArrowRight } from 'lucide-react';
import { isTurnaroundPattern } from './utils';
import { isDoubleSectorTurnaroundPattern, extractTurnaroundDestinations } from '@/lib/salary-calculator/input-transformers';

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

  // Handle double-sector turnaround patterns (DXB → A → DXB → B → DXB)
  if (dutyType === 'turnaround' && isDoubleSectorTurnaroundPattern(sectors)) {
    const destinations = extractTurnaroundDestinations(sectors);
    if (destinations.length >= 2) {
      // Display: DXB → dest1 → DXB → dest2 → DXB
      const fullRoute = ['DXB', destinations[0], 'DXB', destinations[1], 'DXB'];
      return (
        <span className="flex items-center justify-center gap-1 flex-wrap">
          {fullRoute.map((airport, index) => (
            <span key={index} className="flex items-center gap-1">
              <span className="text-xs" style={{ color: 'rgb(58, 55, 128)' }}>{airport}</span>
              {index < fullRoute.length - 1 && (
                <ArrowRight className="h-2.5 w-2.5 text-[#4C49ED]" />
              )}
            </span>
          ))}
        </span>
      );
    }
  }

  // Handle standard turnaround patterns (either classified as turnaround or looks like one)
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


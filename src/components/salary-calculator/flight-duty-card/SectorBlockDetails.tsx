'use client';

import React from 'react';
import { Sector } from '@/types/salary-calculator';

interface SectorBlockDetailsProps {
  sectorDetails: Sector[];
}

function formatBlockTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins.toString().padStart(2, '0')}m`;
}

export function SectorBlockDetails({ sectorDetails }: SectorBlockDetailsProps) {
  const totalBlockMinutes = sectorDetails.reduce(
    (sum, s) => sum + (s.blockMinutes ?? 0),
    0
  );

  return (
    <div className="mt-1.5 pt-1.5 border-t border-gray-100">
      <div className="space-y-0.5">
        {sectorDetails.map((sector, i) => (
          <div key={i} className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span className="font-medium text-gray-600 w-16 truncate">{sector.flightNumber}</span>
            <span className="flex-1 text-center">
              {sector.origin}
              <span className="mx-0.5">&rarr;</span>
              {sector.destination}
            </span>
            <span className="w-12 text-right tabular-nums">
              {sector.departureTime ?? '--:--'}
            </span>
            <span className="mx-0.5">-</span>
            <span className="w-14 text-right tabular-nums">
              {sector.arrivalTime ?? '--:--'}
              {sector.crossDay && <sup className="text-gray-400 ml-px">+1</sup>}
            </span>
            <span className="w-14 text-right font-medium text-gray-600 tabular-nums">
              {sector.blockMinutes != null ? formatBlockTime(sector.blockMinutes) : '—'}
            </span>
          </div>
        ))}
      </div>
      {sectorDetails.length > 0 && totalBlockMinutes > 0 && (
        <div className="flex justify-end text-xs font-semibold text-gray-700 mt-0.5 px-1">
          <span>Block: {formatBlockTime(totalBlockMinutes)}</span>
        </div>
      )}
    </div>
  );
}

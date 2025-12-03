'use client';

/**
 * Off Day Card Component
 * Displays off/rest/leave days in the flight duties table
 * Day Off and Additional Day Off match flight card styling
 * Rest Day and Annual Leave have distinct colored styling
 */

import React from 'react';
import { FlightDuty } from '@/types/salary-calculator';
import { Card } from '@/components/ui/card';
import { Home, Palmtree, Moon } from 'lucide-react';

interface OffDayCardProps {
  flightDuty: FlightDuty;
}

// Brand colors matching flight duty cards
const BRAND = { primary: "#4C49ED", accent: "#6DDC91" };
const BRAND_PURPLE = '#3A3780';

export function OffDayCard({ flightDuty }: OffDayCardProps) {
  // Format date for display (e.g., "Wed, Dec 3")
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check for specific duty types
  const originalData = flightDuty.originalData as { duties?: string; details?: string } | undefined;
  const duties = originalData?.duties?.toUpperCase() || '';
  const details = originalData?.details?.toUpperCase() || '';
  const isAdditionalDayOff = duties.includes('ADDITIONAL DAY OFF') || details.includes('ADDITIONAL DAY OFF');

  // Day Off and Additional Day Off use flight card styling
  if (flightDuty.dutyType === 'off') {
    return (
      <Card className="rounded-2xl border-0 bg-white shadow-none hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-gray-200 flight-card-uniform-height">
        <div className="card-mobile-optimized h-full flex flex-col">
          {/* Date badge - matches duty badge position */}
          <div className="flex justify-center mb-1 pt-2">
            <span
              className="inline-block text-white text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: isAdditionalDayOff ? '#F59E0B' : '#9CA3AF' }}
            >
              {formatDate(flightDuty.date)}
            </span>
          </div>

          {/* Main content - flex-based alignment like flight cards */}
          <div className="flight-card-main-content">
            <div className="flex flex-col items-center justify-center">
              {/* Line with house icon in middle - matches airplane styling */}
              <div className="flex items-center gap-1 mb-1">
                <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
                <Home className="h-4 w-4" style={{ color: BRAND.primary }} />
                <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
              </div>
              {/* Label - matches "Turnaround" styling */}
              <div className="text-xs font-semibold text-gray-700">
                {isAdditionalDayOff ? 'Additional Day Off' : 'Day Off'}
              </div>
            </div>
          </div>

          {/* Bottom spacer for consistent layout */}
          <div className="flex-1"></div>
        </div>
      </Card>
    );
  }

  // Rest Day - distinct blue styling
  if (flightDuty.dutyType === 'rest') {
    return (
      <Card className="rounded-2xl border-0 shadow-none hover:shadow-lg transition-all duration-300 flight-card-uniform-height bg-blue-50">
        <div className="card-mobile-optimized h-full flex flex-col items-center justify-center text-center">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <Moon className="h-4 w-4 text-blue-500" />
          </div>
          
          {/* Date */}
          <div className="text-lg font-bold tracking-wide mb-1" style={{ color: BRAND_PURPLE }}>
            {formatDate(flightDuty.date)}
          </div>
          
          {/* Label */}
          <div className="text-sm font-medium text-blue-500">
            Rest Day
          </div>
        </div>
      </Card>
    );
  }

  // Annual Leave - distinct green styling
  if (flightDuty.dutyType === 'annual_leave') {
    return (
      <Card className="rounded-2xl border-0 shadow-none hover:shadow-lg transition-all duration-300 flight-card-uniform-height bg-green-50">
        <div className="card-mobile-optimized h-full flex flex-col items-center justify-center text-center">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <Palmtree className="h-4 w-4 text-green-500" />
          </div>
          
          {/* Date */}
          <div className="text-lg font-bold tracking-wide mb-1" style={{ color: BRAND_PURPLE }}>
            {formatDate(flightDuty.date)}
          </div>
          
          {/* Label */}
          <div className="text-sm font-medium text-green-500">
            Annual Leave
          </div>
        </div>
      </Card>
    );
  }

  // Fallback for any other type
  return (
    <Card className="rounded-2xl border-0 bg-white shadow-none hover:shadow-lg transition-all duration-300 flight-card-uniform-height">
      <div className="card-mobile-optimized h-full flex flex-col items-center justify-center text-center">
        <div className="text-lg font-bold tracking-wide mb-1" style={{ color: BRAND_PURPLE }}>
          {formatDate(flightDuty.date)}
        </div>
        <div className="text-sm font-medium text-gray-500">
          {flightDuty.dutyType}
        </div>
      </div>
    </Card>
  );
}

'use client';

/**
 * Off Day Card Component
 * Displays off/rest/leave days in the flight duties table
 * Matches flight card styling with centered layout
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

  // Get config based on duty type
  const getConfig = () => {
    switch (flightDuty.dutyType) {
      case 'rest':
        return { icon: Moon, label: 'Rest Day' };
      case 'annual_leave':
        return { icon: Palmtree, label: 'Annual Leave' };
      case 'off':
      default:
        return { 
          icon: Home, 
          label: isAdditionalDayOff ? 'Additional Day Off' : 'Day Off' 
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  // Unified card layout matching TurnaroundCard structure
  return (
    <Card className="rounded-2xl border-0 bg-white shadow-none hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-gray-200 flight-card-uniform-height">
      <div className="card-mobile-optimized h-full flex flex-col">
        {/* Date badge - matches duty badge row position */}
        <div className="flex justify-center mb-1">
          <span
            className="inline-block text-white text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: BRAND.primary }}
          >
            {formatDate(flightDuty.date)}
          </span>
        </div>

        {/* Main content - centered like TurnaroundCard middle column */}
        <div className="flight-card-main-content">
          <div className="flex flex-col items-center justify-center">
            {/* Line with icon in middle - matches airplane styling */}
            <div className="flex items-center gap-1 mb-1">
              <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
              <Icon className="h-4 w-4" style={{ color: BRAND.primary }} />
              <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
            </div>
            {/* Label - matches "Turnaround" styling */}
            <div className="text-xs font-semibold text-gray-700">
              {config.label}
            </div>
          </div>
        </div>

        {/* Bottom spacer for consistent layout */}
        <div className="flex-1"></div>
      </div>
    </Card>
  );
}

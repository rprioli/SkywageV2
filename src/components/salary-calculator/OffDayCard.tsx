'use client';

/**
 * Off Day Card Component
 * Displays off/rest/leave days in the flight duties table
 * Styled to match flight duty cards with color-coded labels
 */

import React from 'react';
import { FlightDuty } from '@/types/salary-calculator';
import { Card } from '@/components/ui/card';
import { Home, Palmtree, Moon } from 'lucide-react';

interface OffDayCardProps {
  flightDuty: FlightDuty;
}

interface OffDayConfig {
  label: string;
  icon: typeof Home;
  bgColor: string;
  iconBg: string;
  iconColor: string;
  labelColor: string;
}

// Brand color matching flight duty cards
const BRAND_PURPLE = '#3A3780';

export function OffDayCard({ flightDuty }: OffDayCardProps) {
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get icon and styling based on duty type
  const getOffDayConfig = (): OffDayConfig => {
    const originalData = flightDuty.originalData as { duties?: string; details?: string } | undefined;
    const duties = originalData?.duties?.toUpperCase() || '';
    const details = originalData?.details?.toUpperCase() || '';

    switch (flightDuty.dutyType) {
      case 'rest':
        return {
          label: 'Rest Day',
          icon: Moon,
          bgColor: 'bg-blue-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-500',
          labelColor: 'text-blue-500'
        };
      case 'annual_leave':
        return {
          label: 'Annual Leave',
          icon: Palmtree,
          bgColor: 'bg-green-50',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-500',
          labelColor: 'text-green-500'
        };
      case 'off':
      default:
        // Check for Additional Day Off
        if (duties.includes('ADDITIONAL DAY OFF') || details.includes('ADDITIONAL DAY OFF')) {
          return {
            label: 'Additional Day Off',
            icon: Home,
            bgColor: 'bg-white',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-500',
            labelColor: 'text-amber-500'
          };
        }
        return {
          label: 'Day Off',
          icon: Home,
          bgColor: 'bg-white',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-500',
          labelColor: 'text-gray-500'
        };
    }
  };

  const config = getOffDayConfig();
  const Icon = config.icon;

  return (
    <Card className={`rounded-2xl border-0 shadow-none hover:shadow-lg transition-all duration-300 flight-card-uniform-height ${config.bgColor}`}>
      <div className="card-mobile-optimized h-full flex flex-col items-center justify-center text-center">
        {/* Icon - smaller size */}
        <div className={`w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center mb-3`}>
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
        </div>
        
        {/* Date - using brand purple to match flight cards */}
        <div className="text-lg font-bold tracking-wide mb-1" style={{ color: BRAND_PURPLE }}>
          {formatDate(flightDuty.date)}
        </div>
        
        {/* Label */}
        <div className={`text-sm font-medium ${config.labelColor}`}>
          {config.label}
        </div>
      </div>
    </Card>
  );
}

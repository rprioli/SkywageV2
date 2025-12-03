'use client';

/**
 * Off Day Card Component
 * Displays off/rest/leave days in the flight duties table
 * Color-coded design with uniform height to match flight cards
 */

import React from 'react';
import { FlightDuty } from '@/types/salary-calculator';
import { Card } from '@/components/ui/card';
import { Calendar, Coffee, Palmtree, Moon } from 'lucide-react';

interface OffDayCardProps {
  flightDuty: FlightDuty;
}

interface OffDayConfig {
  label: string;
  icon: typeof Calendar;
  bgColor: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
}

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
          textColor: 'text-blue-700'
        };
      case 'annual_leave':
        return {
          label: 'Annual Leave',
          icon: Palmtree,
          bgColor: 'bg-green-50',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-500',
          textColor: 'text-green-700'
        };
      case 'off':
      default:
        // Check for Additional Day Off
        if (duties.includes('ADDITIONAL DAY OFF') || details.includes('ADDITIONAL DAY OFF')) {
          return {
            label: 'Additional Day Off',
            icon: Coffee,
            bgColor: 'bg-amber-50',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-500',
            textColor: 'text-amber-700'
          };
        }
        return {
          label: 'Day Off',
          icon: Calendar,
          bgColor: 'bg-gray-50',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-500',
          textColor: 'text-gray-700'
        };
    }
  };

  const config = getOffDayConfig();
  const Icon = config.icon;

  return (
    <Card className={`rounded-2xl border-0 shadow-none hover:shadow-lg transition-all duration-300 flight-card-uniform-height ${config.bgColor}`}>
      <div className="card-mobile-optimized h-full flex flex-col items-center justify-center text-center">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center mb-3`}>
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
        </div>
        
        {/* Date */}
        <div className={`text-lg font-bold ${config.textColor} mb-1`}>
          {formatDate(flightDuty.date)}
        </div>
        
        {/* Label */}
        <div className={`text-sm font-medium ${config.iconColor}`}>
          {config.label}
        </div>
      </div>
    </Card>
  );
}

'use client';

/**
 * Off Day Card Component
 * Displays off/rest/leave days in roster comparison view
 * Simple, minimal design to indicate non-working days
 */

import React from 'react';
import { FlightDuty } from '@/types/salary-calculator';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface OffDayCardProps {
  flightDuty: FlightDuty;
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

  // Determine label based on duty type
  const getOffDayLabel = () => {
    // Use the duty type directly for the primary classification
    switch (flightDuty.dutyType) {
      case 'rest':
        return 'Rest';
      case 'annual_leave':
        return 'Annual Leave';
      case 'off':
      default:
        // For 'off' type, check original data for more specific label
        const originalData = flightDuty.originalData as { duties?: string; details?: string } | undefined;
        const duties = originalData?.duties?.toUpperCase() || '';
        const details = originalData?.details?.toUpperCase() || '';
        
        if (duties.includes('ADDITIONAL DAY OFF') || details.includes('ADDITIONAL DAY OFF')) {
          return 'Additional Day Off';
        }
        return 'Off';
    }
  };

  return (
    <Card className="border border-gray-200 bg-gray-50">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
          <Calendar className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700">
            {formatDate(flightDuty.date)}
          </div>
          <div className="text-xs text-gray-500">
            {getOffDayLabel()}
          </div>
        </div>
      </div>
    </Card>
  );
}


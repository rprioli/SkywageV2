'use client';

/**
 * New Flight Duty Card Component - Redesigned with uniform heights and improved layout
 * Routes to appropriate card type based on duty type
 * Phase 3: Added userId and position props for edit functionality
 * Phase 3: Added showOffDays prop for roster comparison view
 */

import React from 'react';
import { FlightDuty, Position } from '@/types/salary-calculator';
import { LayoverConnectedCard } from './LayoverConnectedCard';
import { TurnaroundCard } from './TurnaroundCard';
import { StandardDutyCard } from './StandardDutyCard';
import { OffDayCard } from './OffDayCard';

interface NewFlightDutyCardProps {
  flightDuty: FlightDuty;
  allFlightDuties?: FlightDuty[];
  onDelete?: (flightDuty: FlightDuty) => void;
  showActions?: boolean;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (flightId: string) => void;
  userId?: string;
  position?: Position;
  onEditComplete?: () => void;
  showOffDays?: boolean; // New prop for roster comparison
}

export function NewFlightDutyCard({
  flightDuty,
  allFlightDuties = [],
  onDelete,
  showActions = true,
  bulkMode = false,
  isSelected = false,
  onToggleSelection,
  userId,
  position,
  onEditComplete,
  showOffDays = false
}: NewFlightDutyCardProps) {

  // Route to appropriate card type based on duty type
  const commonProps = {
    flightDuty,
    allFlightDuties,
    onDelete,
    showActions,
    bulkMode,
    isSelected,
    onToggleSelection,
    userId,
    position,
    onEditComplete
  };

  switch (flightDuty.dutyType) {
    case 'layover':
      return <LayoverConnectedCard {...commonProps} />;

    case 'turnaround':
      return <TurnaroundCard {...commonProps} />;

    case 'off':
      // Show off days only in roster comparison view
      return showOffDays ? <OffDayCard flightDuty={flightDuty} /> : null;

    case 'asby':
    case 'recurrent':
    case 'sby':
    case 'business_promotion':
    default:
      return <StandardDutyCard {...commonProps} />;
  }
}

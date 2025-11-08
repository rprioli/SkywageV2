'use client';

/**
 * New Flight Duty Card Component - Redesigned with uniform heights and improved layout
 * Routes to appropriate card type based on duty type
 * Phase 3: Added userId and position props for edit functionality
 */

import React from 'react';
import { FlightDuty, Position } from '@/types/salary-calculator';
import { LayoverConnectedCard } from './LayoverConnectedCard';
import { TurnaroundCard } from './TurnaroundCard';
import { StandardDutyCard } from './StandardDutyCard';

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
  onEditComplete
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
      // Don't create cards for off days
      return null;

    case 'asby':
    case 'recurrent':
    case 'sby':
    case 'business_promotion':
    default:
      return <StandardDutyCard {...commonProps} />;
  }
}

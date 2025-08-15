'use client';

/**
 * New Flight Duty Card Component - Redesigned with uniform heights and improved layout
 * Routes to appropriate card type based on duty type
 */

import React from 'react';
import { FlightDuty } from '@/types/salary-calculator';
import { LayoverConnectedCard } from './LayoverConnectedCard';
import { TurnaroundCard } from './TurnaroundCard';
import { StandardDutyCard } from './StandardDutyCard';

interface NewFlightDutyCardProps {
  flightDuty: FlightDuty;
  allFlightDuties?: FlightDuty[];
  onEdit?: (flightDuty: FlightDuty) => void;
  onDelete?: (flightDuty: FlightDuty) => void;
  showActions?: boolean;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (flightId: string) => void;
}

export function NewFlightDutyCard({
  flightDuty,
  allFlightDuties = [],
  onEdit,
  onDelete,
  showActions = true,
  bulkMode = false,
  isSelected = false,
  onToggleSelection
}: NewFlightDutyCardProps) {
  
  // Route to appropriate card type based on duty type
  const commonProps = {
    flightDuty,
    allFlightDuties,
    onEdit,
    onDelete,
    showActions,
    bulkMode,
    isSelected,
    onToggleSelection
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
    default:
      return <StandardDutyCard {...commonProps} />;
  }
}

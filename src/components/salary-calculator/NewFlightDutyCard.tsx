'use client';

/**
 * New Flight Duty Card Component - Redesigned with uniform heights and improved layout
 * Routes to appropriate card type based on duty type
 * Phase 3: Added userId and position props for edit functionality
 * Phase 3: Added showOffDays prop for roster comparison view
 */

import React from 'react';
import { FlightDuty, Position, LayoverRestPeriod } from '@/types/salary-calculator';
import { LayoverConnectedCard } from './LayoverConnectedCard';
import { TurnaroundCard } from './TurnaroundCard';
import { StandardDutyCard } from './StandardDutyCard';
import { OffDayCard } from './OffDayCard';
import { findLayoverPair } from '@/lib/salary-calculator/card-data-mapper';

interface NewFlightDutyCardProps {
  flightDuty: FlightDuty;
  allFlightDuties?: FlightDuty[];
  layoverRestPeriods?: LayoverRestPeriod[];
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
  layoverRestPeriods = [],
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

  const hasLayoverRestPeriod = layoverRestPeriods.some((rp) => {
    return rp.outboundFlightId === flightDuty.id || rp.inboundFlightId === flightDuty.id;
  });

  // If this layover flight does not have an in-month pair and does not have a persisted rest period
  // (e.g., inbound segment that belongs to a previous month), render it as a standard duty card.
  const hasInMonthLayoverPair = Boolean(findLayoverPair(flightDuty, allFlightDuties));

  // Route to appropriate card type based on duty type
  const commonProps = {
    flightDuty,
    allFlightDuties,
    layoverRestPeriods,
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
      if (!hasLayoverRestPeriod && !hasInMonthLayoverPair) {
        return <StandardDutyCard {...commonProps} />;
      }

      return <LayoverConnectedCard {...commonProps} />;

    case 'turnaround':
      return <TurnaroundCard {...commonProps} />;

    case 'off':
    case 'rest':
    case 'annual_leave':
      // Show off/rest/annual leave days only in roster comparison view
      return showOffDays ? <OffDayCard flightDuty={flightDuty} /> : null;

    case 'asby':
    case 'recurrent':
    case 'sby':
    case 'business_promotion':
    default:
      return <StandardDutyCard {...commonProps} />;
  }
}

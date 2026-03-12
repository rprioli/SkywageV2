'use client';

/**
 * NewFlightDutyCard — Routes FlightDuty to the appropriate v2 glassmorphic card.
 */

import React from 'react';
import { FlightDuty, Position, LayoverRestPeriod } from '@/types/salary-calculator';
import { TurnaroundCardV2Wrapper } from './v2-cards/TurnaroundCardV2Wrapper';
import { LayoverCardV2Wrapper } from './v2-cards/LayoverCardV2Wrapper';
import { SimpleDutyCardV2Wrapper } from './v2-cards/SimpleDutyCardV2Wrapper';
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
  showOffDays?: boolean;
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

  const hasInMonthLayoverPair = Boolean(findLayoverPair(flightDuty, allFlightDuties));

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
        // Orphaned layover (e.g., inbound-only with outbound in previous month):
        // render as turnaround card so flight number and timings are displayed
        return <TurnaroundCardV2Wrapper {...commonProps} />;
      }
      return <LayoverCardV2Wrapper {...commonProps} />;

    case 'turnaround':
      return <TurnaroundCardV2Wrapper {...commonProps} />;

    case 'off':
    case 'rest':
    case 'annual_leave':
    case 'sick':
      return showOffDays ? <SimpleDutyCardV2Wrapper {...commonProps} /> : null;

    case 'asby':
    case 'recurrent':
    case 'sby':
    case 'business_promotion':
    default:
      return <SimpleDutyCardV2Wrapper {...commonProps} />;
  }
}

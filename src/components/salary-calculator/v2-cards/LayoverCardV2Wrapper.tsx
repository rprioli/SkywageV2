'use client';

/**
 * LayoverCardV2Wrapper — Bridges FlightDuty data to LayoverCardV2 presentation.
 * Handles layover pairing, cross-month layovers, edit dialog, delete, and bulk selection.
 */

import { useState, useMemo } from 'react';
import { FlightDuty, Position, LayoverRestPeriod } from '@/types/salary-calculator';
import { findLayoverPair } from '@/lib/salary-calculator/card-data-mapper';
import { mapLayoverToV2Props } from '@/lib/salary-calculator/v2-card-adapter';
import { LayoverCardV2 } from './LayoverCardV2';
import { CardActions } from './CardActions';
import { EditTimesDialog } from '../EditTimesDialog';
import { useCardEditHandler } from './useCardEditHandler';

interface LayoverCardV2WrapperProps {
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
}

export function LayoverCardV2Wrapper({
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
}: LayoverCardV2WrapperProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeSectorIdx, setActiveSectorIdx] = useState(0);
  const { createSaveHandler } = useCardEditHandler(userId, position, onEditComplete);

  // Find in-month layover pair
  const layoverPair = useMemo(
    () => findLayoverPair(flightDuty, allFlightDuties),
    [flightDuty, allFlightDuties],
  );

  // Cross-month: outbound with persisted rest period but no in-month inbound
  const crossMonthRest = useMemo(() => {
    if (layoverPair) return null;
    return layoverRestPeriods.find(rp => rp.outboundFlightId === flightDuty.id) ?? null;
  }, [layoverPair, layoverRestPeriods, flightDuty.id]);

  // Determine outbound/inbound flights and rest data
  const outbound = layoverPair ? layoverPair.outbound : flightDuty;
  const inbound = layoverPair ? layoverPair.inbound : null;
  const restHours = layoverPair?.restHours ?? crossMonthRest?.restHours ?? 0;
  const perDiemPay = layoverPair?.perDiemPay ?? crossMonthRest?.perDiemPay ?? 0;

  const v2Props = useMemo(
    () => mapLayoverToV2Props(outbound, inbound, restHours, perDiemPay),
    [outbound, inbound, restHours, perDiemPay],
  );

  // The active flight depends on which sector the user is viewing
  const activeFlight = activeSectorIdx === 0 ? outbound : (inbound ?? outbound);

  const actions = showActions && (onDelete || userId) ? (
    <CardActions
      onEdit={userId ? () => setEditDialogOpen(true) : undefined}
      onDelete={onDelete ? () => onDelete(activeFlight) : undefined}
    />
  ) : undefined;

  return (
    <>
      <LayoverCardV2
        {...v2Props}
        actions={actions}
        bulkMode={bulkMode}
        isSelected={isSelected}
        onToggleSelection={onToggleSelection ? () => onToggleSelection(flightDuty.id!) : undefined}
        onSectorChange={setActiveSectorIdx}
      />
      {userId && (
        <EditTimesDialog
          flightDuty={activeFlight}
          allFlightDuties={allFlightDuties}
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={createSaveHandler(activeFlight)}
        />
      )}
    </>
  );
}

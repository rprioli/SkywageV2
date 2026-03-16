'use client';

/**
 * TurnaroundCardV2Wrapper — Bridges FlightDuty data to TurnaroundCardV2 presentation.
 * Handles data mapping, edit dialog, delete, and bulk selection.
 */

import { useState, useMemo } from 'react';
import { FlightDuty, Position } from '@/types/salary-calculator';
import { mapTurnaroundToV2Props } from '@/lib/salary-calculator/v2-card-adapter';
import { TurnaroundCardV2 } from './TurnaroundCardV2';
import { CardActions } from './CardActions';
import { EditTimesDialog } from '../EditTimesDialog';
import { useCardEditHandler } from './useCardEditHandler';

interface TurnaroundCardV2WrapperProps {
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

export function TurnaroundCardV2Wrapper({
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
}: TurnaroundCardV2WrapperProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { createSaveHandler } = useCardEditHandler(userId, position, onEditComplete);
  const v2Props = useMemo(() => mapTurnaroundToV2Props(flightDuty), [flightDuty]);

  const actions = showActions && (onDelete || userId) ? (
    <CardActions
      onEdit={userId ? () => setEditDialogOpen(true) : undefined}
      onDelete={onDelete ? () => onDelete(flightDuty) : undefined}
    />
  ) : undefined;

  return (
    <>
      <TurnaroundCardV2
        {...v2Props}
        actions={actions}
        bulkMode={bulkMode}
        isSelected={isSelected}
        onToggleSelection={onToggleSelection ? () => onToggleSelection(flightDuty.id!) : undefined}
      />
      {userId && (
        <EditTimesDialog
          flightDuty={flightDuty}
          allFlightDuties={allFlightDuties}
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={createSaveHandler(flightDuty)}
        />
      )}
    </>
  );
}

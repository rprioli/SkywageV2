'use client';

/**
 * SimpleDutyCardV2Wrapper — Bridges FlightDuty data to SimpleDutyCardV2 presentation.
 * Handles data mapping, edit dialog (ASBY/SBY only), delete, and bulk selection.
 * Used for: ASBY, SBY, Recurrent, Business Promotion, Off, Rest, Annual Leave, Sick,
 * and unpaired layover fallback.
 */

import { useState, useMemo } from 'react';
import { FlightDuty, Position } from '@/types/salary-calculator';
import { mapSimpleDutyToV2Props } from '@/lib/salary-calculator/v2-card-adapter';
import { OFF_DAY_TYPES } from '@/lib/salary-calculator/calculation-engine';
import { SimpleDutyCardV2 } from './SimpleDutyCardV2';
import { CardActions } from './CardActions';
import { EditTimesDialog } from '../EditTimesDialog';
import { useCardEditHandler } from './useCardEditHandler';

const EDITABLE_TYPES = new Set(['asby', 'sby']);

interface SimpleDutyCardV2WrapperProps {
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

export function SimpleDutyCardV2Wrapper({
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
}: SimpleDutyCardV2WrapperProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { createSaveHandler } = useCardEditHandler(userId, position, onEditComplete);
  const v2Props = useMemo(() => mapSimpleDutyToV2Props(flightDuty), [flightDuty]);

  const isEditable = EDITABLE_TYPES.has(flightDuty.dutyType);
  const isOffDay = OFF_DAY_TYPES.has(flightDuty.dutyType);

  // Off-day types have no actions
  const actions = !isOffDay && showActions && (onDelete || (userId && isEditable)) ? (
    <CardActions
      onEdit={userId && isEditable ? () => setEditDialogOpen(true) : undefined}
      onDelete={onDelete ? () => onDelete(flightDuty) : undefined}
    />
  ) : undefined;

  return (
    <>
      <SimpleDutyCardV2
        {...v2Props}
        actions={actions}
        bulkMode={!isOffDay ? bulkMode : false}
        isSelected={!isOffDay ? isSelected : false}
        onToggleSelection={
          !isOffDay && onToggleSelection
            ? () => onToggleSelection(flightDuty.id!)
            : undefined
        }
      />
      {isEditable && userId && (
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

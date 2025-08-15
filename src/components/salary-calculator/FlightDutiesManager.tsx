'use client';

/**
 * Flight Duties Manager Component for Skywage Salary Calculator
 * Phase 5: Manages flight duties with edit, delete, and audit trail functionality
 * Integrates EditFlightModal, FlightDutiesTable, and AuditTrailDisplay
 */

import { useState, useEffect } from 'react';
import { FlightDuty, Position } from '@/types/salary-calculator';
import { deleteFlightDuty } from '@/lib/database/flights';
import { handleFlightEdit } from '@/lib/salary-calculator/recalculation-engine';
import { FlightDutiesTable } from './FlightDutiesTable';
import { EditFlightModal } from './EditFlightModal';

import { useToast } from '@/hooks/use-toast';
import { identifyLayoverPairs } from '@/lib/salary-calculator/card-data-mapper';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface FlightDutiesManagerProps {
  flightDuties: FlightDuty[];
  position: Position;
  userId: string;
  loading?: boolean;
  onFlightUpdated?: (updatedFlight: FlightDuty) => void;
  onFlightDeleted?: (deletedFlightId: string) => void;
  onRecalculationComplete?: () => void;
}

export function FlightDutiesManager({
  flightDuties,
  position,
  userId,
  loading = false,
  onFlightUpdated,
  onFlightDeleted,
  onRecalculationComplete
}: FlightDutiesManagerProps) {
  const { salaryCalculator } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightDuty | null>(null);

  const [processing, setProcessing] = useState(false);

  // Handle edit button click
  const handleEditClick = (flightDuty: FlightDuty) => {
    setSelectedFlight(flightDuty);
    setEditModalOpen(true);
  };

  // Helper function to find layover pair for a given flight duty
  const findLayoverPair = (targetFlight: FlightDuty): FlightDuty | null => {
    if (targetFlight.dutyType !== 'layover') return null;

    const layoverPairs = identifyLayoverPairs(flightDuties);
    const pair = layoverPairs.find(p =>
      p.outbound.id === targetFlight.id || p.inbound.id === targetFlight.id
    );

    if (!pair) return null;

    // Return the other flight in the pair
    return pair.outbound.id === targetFlight.id ? pair.inbound : pair.outbound;
  };

  // Handle delete button click
  const handleDeleteClick = (flightDuty: FlightDuty) => {
    setSelectedFlight(flightDuty);
    setDeleteDialogOpen(true);
  };

  // Handle successful flight edit
  const handleEditSuccess = async (updatedFlight: FlightDuty) => {
    setProcessing(true);
    try {
      // Trigger recalculation
      const recalcResult = await handleFlightEdit(updatedFlight, userId, position);

      if (recalcResult.success) {
        // Show success toast
        salaryCalculator.flightUpdated(updatedFlight.flightNumbers);
        onFlightUpdated?.(updatedFlight);
        onRecalculationComplete?.();
      } else {
        const errorMsg = `Flight updated but recalculation failed: ${recalcResult.errors.join(', ')}`;
        salaryCalculator.calculationError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error during recalculation';
      salaryCalculator.calculationError(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  // Handle edit error
  const handleEditError = (error: string) => {
    salaryCalculator.calculationError(error);
  };

  // Handle flight deletion
  const handleDeleteConfirm = async () => {
    if (!selectedFlight?.id) return;

    setProcessing(true);
    try {
      // Check if this is a layover flight and find its pair
      const layoverPair = findLayoverPair(selectedFlight);
      const flightsToDelete = layoverPair ? [selectedFlight, layoverPair] : [selectedFlight];

      // Delete all flights (main flight and its layover pair if applicable)
      const deletePromises = flightsToDelete.map(flight =>
        deleteFlightDuty(
          flight.id,
          userId,
          layoverPair
            ? 'Layover pair deletion - Flight duty deleted via manager'
            : 'Flight duty deleted via manager'
        )
      );

      const results = await Promise.all(deletePromises);
      const errors = results.filter(result => result.error).map(result => result.error);

      if (errors.length > 0) {
        salaryCalculator.calculationError(`Failed to delete ${errors.length} flights`);
      } else {
        // Show success toast
        if (layoverPair) {
          salaryCalculator.bulkDeleteSuccess(2); // Show bulk delete success for layover pair
        } else {
          salaryCalculator.flightDeleted(selectedFlight.flightNumbers);
        }

        // Notify parent components for all deleted flights
        flightsToDelete.forEach(flight => onFlightDeleted?.(flight.id));
        onRecalculationComplete?.();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      salaryCalculator.calculationError(errorMessage);
    } finally {
      setProcessing(false);
      setDeleteDialogOpen(false);
      setSelectedFlight(null);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async (flightDuties: FlightDuty[]) => {
    if (flightDuties.length === 0) return;

    setProcessing(true);
    try {
      const deletePromises = flightDuties.map(flight =>
        deleteFlightDuty(
          flight.id,
          userId,
          `Bulk delete operation - ${flightDuties.length} flights`
        )
      );

      const results = await Promise.all(deletePromises);
      const errors = results.filter(result => result.error).map(result => result.error);

      if (errors.length > 0) {
        salaryCalculator.calculationError(`Failed to delete ${errors.length} flights`);
      } else {
        // Show success toast
        salaryCalculator.bulkDeleteSuccess(flightDuties.length);

        // Notify parent components
        flightDuties.forEach(flight => onFlightDeleted?.(flight.id));
        onRecalculationComplete?.();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during bulk delete';
      salaryCalculator.calculationError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // Handle Delete All functionality
  const handleDeleteAll = async () => {
    if (flightDuties.length === 0) return;

    setProcessing(true);
    try {
      const deletePromises = flightDuties.map(flight =>
        deleteFlightDuty(
          flight.id,
          userId,
          `Delete all operation - ${flightDuties.length} flights`
        )
      );

      const results = await Promise.all(deletePromises);
      const errors = results.filter(result => result.error).map(result => result.error);

      if (errors.length > 0) {
        salaryCalculator.calculationError(`Failed to delete ${errors.length} flights`);
      } else {
        // Show success toast
        salaryCalculator.bulkDeleteSuccess(flightDuties.length);

        // Notify parent components
        flightDuties.forEach(flight => onFlightDeleted?.(flight.id));
        onRecalculationComplete?.();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during delete all';
      salaryCalculator.calculationError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Flight Duties Table */}
      <FlightDutiesTable
        flightDuties={flightDuties}
        loading={loading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onBulkDelete={handleBulkDelete}
        onDeleteAll={handleDeleteAll}
        showActions={true}
      />



      {/* Edit Modal */}
      <EditFlightModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedFlight(null);
        }}
        flightDuty={selectedFlight}
        position={position}
        onSuccess={handleEditSuccess}
        onError={handleEditError}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Flight
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete flight <strong>{selectedFlight?.flightNumbers.join('')}</strong>?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                This action cannot be undone. The flight will be permanently removed from your roster and salary calculations will be updated automatically.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? 'Deleting...' : 'Delete Flight'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

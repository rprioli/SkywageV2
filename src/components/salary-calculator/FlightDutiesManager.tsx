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
import { AuditTrailModal } from './AuditTrailDisplay';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { History, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightDuty | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastOperation, setLastOperation] = useState<{
    type: 'edit' | 'delete';
    success: boolean;
    message: string;
  } | null>(null);

  // Clear operation status after 5 seconds
  useEffect(() => {
    if (lastOperation) {
      const timer = setTimeout(() => setLastOperation(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastOperation]);

  // Handle edit button click
  const handleEditClick = (flightDuty: FlightDuty) => {
    setSelectedFlight(flightDuty);
    setEditModalOpen(true);
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
        setLastOperation({
          type: 'edit',
          success: true,
          message: 'Flight updated successfully and calculations refreshed'
        });
        
        onFlightUpdated?.(updatedFlight);
        onRecalculationComplete?.();
      } else {
        setLastOperation({
          type: 'edit',
          success: false,
          message: `Flight updated but recalculation failed: ${recalcResult.errors.join(', ')}`
        });
      }
    } catch (error) {
      setLastOperation({
        type: 'edit',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during recalculation'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Handle edit error
  const handleEditError = (error: string) => {
    setLastOperation({
      type: 'edit',
      success: false,
      message: error
    });
  };

  // Handle flight deletion
  const handleDeleteConfirm = async () => {
    if (!selectedFlight?.id) return;

    setProcessing(true);
    try {
      const result = await deleteFlightDuty(
        selectedFlight.id,
        userId,
        deleteReason || 'Flight duty deleted via manager'
      );

      if (result.error) {
        setLastOperation({
          type: 'delete',
          success: false,
          message: result.error
        });
      } else {
        setLastOperation({
          type: 'delete',
          success: true,
          message: 'Flight deleted successfully'
        });

        onFlightDeleted?.(selectedFlight.id);
        onRecalculationComplete?.();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastOperation({
        type: 'delete',
        success: false,
        message: errorMessage
      });
    } finally {
      setProcessing(false);
      setDeleteDialogOpen(false);
      setSelectedFlight(null);
      setDeleteReason('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Operation Status */}
      {lastOperation && (
        <Alert variant={lastOperation.success ? "default" : "destructive"}>
          {lastOperation.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>{lastOperation.message}</AlertDescription>
        </Alert>
      )}

      {/* Processing Indicator */}
      {processing && (
        <Alert>
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
            <AlertDescription>Processing changes and updating calculations...</AlertDescription>
          </div>
        </Alert>
      )}

      {/* Flight Duties Table */}
      <FlightDutiesTable
        flightDuties={flightDuties}
        loading={loading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        showActions={true}
      />

      {/* Audit Trail Button */}
      {flightDuties.length > 0 && (
        <div className="flex justify-end">
          <AuditTrailModal
            userId={userId}
            trigger={
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                View Activity History
              </Button>
            }
          />
        </div>
      )}

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
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Flight Duty
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this flight duty? This action cannot be undone.
              {selectedFlight && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">
                    {selectedFlight.date.toLocaleDateString()} - {selectedFlight.dutyType.toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedFlight.flightNumbers.join(', ')} | {selectedFlight.sectors.join(' ')}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <label className="block text-sm font-medium mb-2">Reason for deletion (optional)</label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Explain why this flight duty is being deleted..."
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={processing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {processing ? 'Deleting...' : 'Delete Flight'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

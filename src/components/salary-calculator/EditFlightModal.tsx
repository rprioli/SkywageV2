'use client';

/**
 * Edit Flight Modal Component for Skywage Salary Calculator
 * Phase 5: Modal for editing existing flight duties
 * Following existing patterns from FlightEntryForm and Dialog components
 */

import { useState, useEffect } from 'react';
import { FlightDuty, Position, DutyType } from '@/types/salary-calculator';
import { 
  ManualFlightEntryData, 
  validateManualEntry,
  FormValidationResult 
} from '@/lib/salary-calculator/manual-entry-validation';
import { updateFlightDuty } from '@/lib/database/flights';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FlightTypeSelector,
  FlightNumberInput,
  SectorInput,
  TimeInput 
} from '@/components/salary-calculator';
import { AlertTriangle, Save, X } from 'lucide-react';

interface EditFlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  flightDuty: FlightDuty | null;
  position: Position;
  onSuccess?: (updatedFlight: FlightDuty) => void;
  onError?: (error: string) => void;
}

export function EditFlightModal({
  isOpen,
  onClose,
  flightDuty,
  position,
  onSuccess,
  onError
}: EditFlightModalProps) {
  const [formData, setFormData] = useState<ManualFlightEntryData>({
    date: '',
    dutyType: 'turnaround',
    flightNumbers: [''],
    sectors: [''],
    reportTime: '',
    debriefTime: '',
    isCrossDay: false
  });
  const [validation, setValidation] = useState<FormValidationResult>({
    valid: false,
    errors: [],
    warnings: [],
    fieldErrors: {}
  });
  const [loading, setLoading] = useState(false);
  const [changeReason, setChangeReason] = useState('');

  // Initialize form data when flight duty changes
  useEffect(() => {
    if (flightDuty) {
      setFormData({
        date: flightDuty.date.toISOString().split('T')[0],
        dutyType: flightDuty.dutyType,
        flightNumbers: flightDuty.flightNumbers || [''],
        sectors: flightDuty.sectors || [''],
        reportTime: flightDuty.reportTime ? 
          `${flightDuty.reportTime.hours.toString().padStart(2, '0')}:${flightDuty.reportTime.minutes.toString().padStart(2, '0')}` : '',
        debriefTime: flightDuty.debriefTime ? 
          `${flightDuty.debriefTime.hours.toString().padStart(2, '0')}:${flightDuty.debriefTime.minutes.toString().padStart(2, '0')}` : '',
        isCrossDay: flightDuty.isCrossDay || false
      });
      setChangeReason('');
    }
  }, [flightDuty]);

  // Real-time validation
  useEffect(() => {
    const validationResult = validateManualEntry(formData, position);
    setValidation(validationResult);
  }, [formData, position]);

  // Handle form field changes
  const handleFieldChange = <K extends keyof ManualFlightEntryData>(
    field: K,
    value: ManualFlightEntryData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle duty type change
  const handleDutyTypeChange = (dutyType: DutyType) => {
    setFormData(prev => {
      const newData = { ...prev, dutyType };
      
      // Adjust form fields based on duty type
      if (dutyType === 'asby') {
        newData.flightNumbers = [];
        newData.sectors = [];
      } else if (dutyType === 'layover') {
        newData.flightNumbers = [prev.flightNumbers[0] || ''];
        newData.sectors = [prev.sectors[0] || ''];
      }
      
      return newData;
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!flightDuty?.id || !validation.valid) return;

    setLoading(true);
    try {
      // Convert form data to FlightDuty updates
      const updates: Partial<FlightDuty> = {
        date: new Date(formData.date),
        dutyType: formData.dutyType,
        flightNumbers: formData.flightNumbers.filter(fn => fn.trim() !== ''),
        sectors: formData.sectors.filter(s => s.trim() !== ''),
        isCrossDay: formData.isCrossDay
      };

      // Add time fields if they exist
      if (formData.reportTime) {
        const [hours, minutes] = formData.reportTime.split(':').map(Number);
        updates.reportTime = { hours, minutes, totalMinutes: hours * 60 + minutes };
      }
      
      if (formData.debriefTime) {
        const [hours, minutes] = formData.debriefTime.split(':').map(Number);
        updates.debriefTime = { hours, minutes, totalMinutes: hours * 60 + minutes };
      }

      // Calculate duty hours and flight pay if times are provided
      if (updates.reportTime && updates.debriefTime) {
        const duration = (updates.debriefTime.totalMinutes - updates.reportTime.totalMinutes + 
          (formData.isCrossDay ? 24 * 60 : 0)) / 60;
        updates.dutyHours = duration;
        
        // Calculate flight pay based on duty type and position
        if (formData.dutyType === 'asby') {
          updates.flightPay = position === 'CCM' ? 200 : 248; // 4 hours at hourly rate
        } else {
          const hourlyRate = position === 'CCM' ? 50 : 62;
          updates.flightPay = duration * hourlyRate;
        }
      }

      const result = await updateFlightDuty(
        flightDuty.id, 
        updates, 
        flightDuty.userId, 
        changeReason || 'Flight duty updated via edit modal'
      );

      if (result.error) {
        onError?.(result.error);
      } else if (result.data) {
        onSuccess?.(result.data);
        onClose();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update flight duty';
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!flightDuty) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Flight Duty</DialogTitle>
          <DialogDescription>
            Modify the flight duty details. Changes will be tracked in the audit trail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Field */}
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {validation.fieldErrors.date && (
              <p className="mt-1 text-sm text-destructive">{validation.fieldErrors.date}</p>
            )}
          </div>

          {/* Flight Type Selector */}
          <FlightTypeSelector
            value={formData.dutyType}
            onChange={handleDutyTypeChange}
            error={validation.fieldErrors.dutyType}
          />

          {/* Flight Numbers - only for non-ASBY duties */}
          {formData.dutyType !== 'asby' && (
            <FlightNumberInput
              value={formData.flightNumbers}
              onChange={(value) => handleFieldChange('flightNumbers', value)}
              dutyType={formData.dutyType}
              error={validation.fieldErrors.flightNumbers}
            />
          )}

          {/* Sectors - only for non-ASBY duties */}
          {formData.dutyType !== 'asby' && (
            <SectorInput
              value={formData.sectors}
              onChange={(value) => handleFieldChange('sectors', value)}
              dutyType={formData.dutyType}
              error={validation.fieldErrors.sectors}
            />
          )}

          {/* Time Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TimeInput
              label="Report Time"
              value={formData.reportTime}
              onChange={(value) => handleFieldChange('reportTime', value)}
              error={validation.fieldErrors.reportTime}
            />
            <TimeInput
              label="Debrief Time"
              value={formData.debriefTime}
              onChange={(value) => handleFieldChange('debriefTime', value)}
              error={validation.fieldErrors.debriefTime}
              isCrossDay={formData.isCrossDay}
              onCrossDayChange={(value) => handleFieldChange('isCrossDay', value)}
            />
          </div>

          {/* Time Sequence Error */}
          {validation.fieldErrors.timeSequence && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validation.fieldErrors.timeSequence}</AlertDescription>
            </Alert>
          )}

          {/* Change Reason */}
          <div>
            <label className="block text-sm font-medium mb-2">Change Reason (Optional)</label>
            <textarea
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Describe why this flight duty is being modified..."
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>

          {/* Calculation Preview */}
          {validation.valid && validation.calculatedDutyHours && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Calculation Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Duty Hours:</span>
                  <span className="ml-2 font-medium">{validation.calculatedDutyHours.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estimated Pay:</span>
                  <span className="ml-2 font-medium">
                    {validation.estimatedPay && !isNaN(validation.estimatedPay)
                      ? `${validation.estimatedPay.toFixed(2)} AED`
                      : 'Calculating...'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {validation.warnings.join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!validation.valid || loading}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

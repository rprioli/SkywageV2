'use client';

/**
 * Edit Times Dialog Component for Skywage Salary Calculator
 * Phase 2: Shared dialog for editing flight duty reporting/debriefing times
 * Following existing dialog patterns and .augment-guidelines.md principles
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { TimeInput } from './TimeInput';
import { FlightDuty, TimeValue } from '@/types/salary-calculator';
import { parseTimeString, formatTimeValue, calculateDuration, calculateRestPeriod } from '@/lib/salary-calculator';
import { findLayoverPair, formatDutyHours, formatCurrency } from '@/lib/salary-calculator/card-data-mapper';
import { Plane, AlertTriangle, Info } from 'lucide-react';

interface EditTimesDialogProps {
  flightDuty: FlightDuty;
  allFlightDuties: FlightDuty[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    flightId: string,
    newReportTime: TimeValue,
    newDebriefTime: TimeValue,
    isCrossDay: boolean
  ) => Promise<void>;
}

export function EditTimesDialog({
  flightDuty,
  allFlightDuties,
  isOpen,
  onClose,
  onSave
}: EditTimesDialogProps) {
  // Form state
  const [reportTimeStr, setReportTimeStr] = useState('');
  const [debriefTimeStr, setDebriefTimeStr] = useState('');
  const [errors, setErrors] = useState<{ report?: string; debrief?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Initialize form with current values
  useEffect(() => {
    if (isOpen) {
      setReportTimeStr(formatTimeValue(flightDuty.reportTime));
      setDebriefTimeStr(formatTimeValue(flightDuty.debriefTime));
      setErrors({});
    }
  }, [isOpen, flightDuty]);

  // Parse times and detect cross-day
  const parsedTimes = useMemo(() => {
    const reportResult = parseTimeString(reportTimeStr);
    const debriefResult = parseTimeString(debriefTimeStr);

    // Auto-detect cross-day if debrief < report
    let isCrossDay = false;
    if (reportResult.success && debriefResult.success && reportResult.timeValue && debriefResult.timeValue) {
      isCrossDay = debriefResult.timeValue.totalMinutes < reportResult.timeValue.totalMinutes;
    }

    return {
      reportTime: reportResult.timeValue,
      debriefTime: debriefResult.timeValue,
      isCrossDay,
      reportValid: reportResult.success,
      debriefValid: debriefResult.success
    };
  }, [reportTimeStr, debriefTimeStr]);

  // Calculate duty hours preview
  const dutyHoursPreview = useMemo(() => {
    if (!parsedTimes.reportTime || !parsedTimes.debriefTime) return null;

    const durationMinutes = calculateDuration(
      parsedTimes.reportTime,
      parsedTimes.debriefTime,
      parsedTimes.isCrossDay
    );

    return durationMinutes / 60; // Convert minutes to hours
  }, [parsedTimes]);

  // Find layover pair and calculate rest period preview
  const layoverInfo = useMemo(() => {
    if (flightDuty.dutyType !== 'layover') return null;

    const pair = findLayoverPair(flightDuty, allFlightDuties);
    if (!pair) return null;

    // Determine if this is outbound or inbound
    const isOutbound = pair.outbound.id === flightDuty.id;

    // Calculate new rest period based on which flight is being edited
    if (!parsedTimes.reportTime || !parsedTimes.debriefTime) return { pair, isOutbound, newRestHours: null };

    let outboundDebriefTime: TimeValue;
    let outboundIsCrossDay: boolean;
    let inboundReportTime: TimeValue;
    let inboundIsCrossDay: boolean;

    if (isOutbound) {
      // Editing outbound - use new debrief time
      outboundDebriefTime = parsedTimes.debriefTime;
      outboundIsCrossDay = parsedTimes.isCrossDay;
      inboundReportTime = pair.inbound.reportTime;
      inboundIsCrossDay = pair.inbound.isCrossDay;
    } else {
      // Editing inbound - use new report time
      outboundDebriefTime = pair.outbound.debriefTime;
      outboundIsCrossDay = pair.outbound.isCrossDay;
      inboundReportTime = parsedTimes.reportTime;
      inboundIsCrossDay = parsedTimes.isCrossDay;
    }

    // Calculate days between flights
    const daysBetween = Math.floor(
      (pair.inbound.date.getTime() - pair.outbound.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    const restHours = calculateRestPeriod(
      outboundDebriefTime,
      outboundIsCrossDay,
      inboundReportTime,
      inboundIsCrossDay,
      daysBetween
    );

    return {
      pair,
      isOutbound,
      newRestHours: restHours,
      newPerDiem: restHours * 8.82
    };
  }, [flightDuty, allFlightDuties, parsedTimes]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: { report?: string; debrief?: string } = {};

    if (!reportTimeStr) {
      newErrors.report = 'Reporting time is required';
    } else if (!parsedTimes.reportValid) {
      newErrors.report = 'Invalid time format (use HH:MM)';
    }

    if (!debriefTimeStr) {
      newErrors.debrief = 'Debriefing time is required';
    } else if (!parsedTimes.debriefValid) {
      newErrors.debrief = 'Invalid time format (use HH:MM)';
    }

    // Check for negative duty hours (same day)
    if (parsedTimes.reportValid && parsedTimes.debriefValid && !parsedTimes.isCrossDay) {
      if (parsedTimes.debriefTime!.totalMinutes <= parsedTimes.reportTime!.totalMinutes) {
        newErrors.debrief = 'Debrief time must be after report time (or enable cross-day)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save click
  const handleSaveClick = () => {
    if (!validate()) return;
    setShowConfirmation(true);
  };

  // Handle confirmed save
  const handleConfirmedSave = async () => {
    if (!parsedTimes.reportTime || !parsedTimes.debriefTime || !flightDuty.id) return;

    setLoading(true);
    try {
      await onSave(
        flightDuty.id,
        parsedTimes.reportTime,
        parsedTimes.debriefTime,
        parsedTimes.isCrossDay
      );
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      console.error('Error saving times:', error);
      // Error handling will be done by parent component
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowConfirmation(false);
    onClose();
  };

  return (
    <>
      {/* Main Edit Dialog */}
      <Dialog open={isOpen && !showConfirmation} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="modal-md modal-form-compact">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              Edit Flight Times
            </DialogTitle>
            <DialogDescription>
              {flightDuty.flightNumbers.join(', ')} • {flightDuty.dutyType.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Reporting Time */}
            <TimeInput
              label="Reporting Time"
              value={reportTimeStr}
              onChange={setReportTimeStr}
              error={errors.report}
              required
            />

            {/* Debriefing Time */}
            <TimeInput
              label="Debriefing Time"
              value={debriefTimeStr}
              onChange={setDebriefTimeStr}
              error={errors.debrief}
              required
            />

            {/* Cross-day indicator */}
            {parsedTimes.isCrossDay && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-md">
                <Info className="h-4 w-4" />
                <span>Cross-day duty detected (debrief time is next day)</span>
              </div>
            )}

            {/* Duty hours preview */}
            {dutyHoursPreview !== null && (
              <div className="bg-gray-50 p-3 rounded-md space-y-1">
                <div className="text-sm font-medium text-gray-700">Preview:</div>
                <div className="text-sm text-gray-600">
                  Duty Hours: <span className="font-semibold">{dutyHoursPreview.toFixed(2)}h</span>
                </div>
              </div>
            )}

            {/* Layover rest period preview */}
            {layoverInfo && layoverInfo.newRestHours !== null && (
              <div className="bg-blue-50 p-3 rounded-md space-y-1 border border-blue-200">
                <div className="text-sm font-medium text-blue-900 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Layover Rest Period Impact
                </div>
                <div className="text-sm text-blue-800">
                  Current: {formatDutyHours(layoverInfo.pair.restHours)} • {formatCurrency(layoverInfo.pair.perDiemPay)}
                </div>
                <div className="text-sm text-blue-900 font-semibold">
                  New: {formatDutyHours(layoverInfo.newRestHours)} • {formatCurrency(layoverInfo.newPerDiem || 0)}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  {layoverInfo.isOutbound ? 'Outbound' : 'Inbound'} flight • Paired flight will be updated
                </div>
              </div>
            )}

            {/* ASBY fixed pay note */}
            {flightDuty.dutyType === 'asby' && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                <Info className="h-4 w-4" />
                <span>Note: ASBY payment is fixed at 4 hours regardless of actual duty time</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveClick} disabled={loading}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Time Changes
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>You are about to update the flight times:</p>
                <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm">
                  <div className="font-medium text-gray-900">Changes:</div>
                  <div className="text-gray-700">
                    Report: {formatTimeValue(flightDuty.reportTime)} → {reportTimeStr}
                  </div>
                  <div className="text-gray-700">
                    Debrief: {formatTimeValue(flightDuty.debriefTime)} → {debriefTimeStr}
                  </div>
                  {parsedTimes.isCrossDay && (
                    <div className="text-orange-600 font-medium">Cross-day duty</div>
                  )}
                </div>
                {layoverInfo && (
                  <p className="text-orange-600 font-medium">
                    This will also update the layover rest period and per diem pay.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmation(false)} disabled={loading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSave} disabled={loading}>
              {loading ? 'Saving...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


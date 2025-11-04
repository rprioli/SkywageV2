/**
 * RosterUploadSection Component
 * 
 * Handles roster file upload UI and logic.
 * Supports CSV and Excel files with month selection and replacement confirmation.
 * Extracted from dashboard page to reduce complexity.
 */

'use client';

import React, { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { Position } from '@/types/salary-calculator';
import { ProcessingStatus } from '@/components/salary-calculator/ProcessingStatus';
import { RosterReplacementDialog } from '@/components/salary-calculator/RosterReplacementDialog';
import { useToast } from '@/hooks/use-toast';
import {
  processFileUploadWithReplacement,
  checkForExistingData,
  ProcessingStatus as ProcessingStatusType,
  validateFileQuick,
  type ExistingDataCheck
} from '@/lib/salary-calculator/upload-processor';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getMonthName = (month: number) => {
  return MONTHS[month - 1] || '';
};

interface RosterUploadSectionProps {
  userId: string;
  position: Position;
  userPositionLoading: boolean;
  onUploadSuccess: () => Promise<void>;
}

export const RosterUploadSection = memo<RosterUploadSectionProps>(({
  userId,
  position,
  userPositionLoading,
  onUploadSuccess,
}) => {
  const { salaryCalculator } = useToast();

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUploadMonth, setSelectedUploadMonth] = useState<number | null>(null);

  // Upload states
  const [uploadState, setUploadState] = useState<'month' | 'upload' | 'processing'>('month');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType | null>(null);

  // Roster replacement state
  const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
  const [existingDataCheck, setExistingDataCheck] = useState<ExistingDataCheck | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [replacementProcessing, setReplacementProcessing] = useState(false);

  // Handle upload modal opening
  const handleUploadClick = useCallback(() => {
    setUploadModalOpen(true);
    setUploadState('month');
    setSelectedUploadMonth(null);
    setProcessingStatus(null);
  }, []);

  // Handle upload modal close
  const handleUploadModalClose = useCallback(() => {
    setUploadModalOpen(false);
    setUploadState('month');
    setSelectedUploadMonth(null);
    setProcessingStatus(null);
    // Reset replacement state
    setReplacementDialogOpen(false);
    setExistingDataCheck(null);
    setPendingFile(null);
    setReplacementProcessing(false);
  }, []);

  // Handle month selection for upload - automatically trigger file selection
  const handleMonthSelect = useCallback((month: number) => {
    setSelectedUploadMonth(month);
    setUploadState('upload');

    // Automatically trigger file selection after a brief delay
    setTimeout(() => {
      const fileInput = document.getElementById('roster-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }, 100);
  }, []);

  // Process file upload (with or without replacement)
  const processFileUpload = useCallback(async (file: File, performReplacement: boolean) => {
    if (!selectedUploadMonth) return;

    setUploadState('processing');

    // Show loading toast
    const loadingToast = salaryCalculator.processingStarted(file.name);

    try {
      const currentYear = new Date().getFullYear();

      const result = await processFileUploadWithReplacement(
        file,
        userId,
        position,
        selectedUploadMonth,
        currentYear,
        (status) => {
          setProcessingStatus(status);
        },
        performReplacement
      );

      // Dismiss loading toast
      salaryCalculator.dismiss(loadingToast);

      if (result.success && result.flightDuties) {
        if (performReplacement && result.replacementPerformed) {
          salaryCalculator.csvUploadSuccess(
            file.name,
            result.flightDuties.length,
            `Replaced existing data and processed ${result.flightDuties.length} flights`
          );
        } else {
          salaryCalculator.csvUploadSuccess(file.name, result.flightDuties.length);
        }

        // Refresh dashboard data
        await onUploadSuccess();

        // Close modal - user will see results on dashboard
        handleUploadModalClose();
      } else {
        salaryCalculator.csvUploadError(result.errors?.join(', ') || 'Unknown error occurred');
        setUploadState('upload');
      }
    } catch (error) {
      salaryCalculator.dismiss(loadingToast);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      salaryCalculator.csvUploadError(errorMessage);
      setUploadState('upload');
    }
  }, [selectedUploadMonth, userId, position, salaryCalculator, onUploadSuccess, handleUploadModalClose]);

  // Handle file selection and start processing
  const handleFileSelect = useCallback(async (file: File) => {
    if (!selectedUploadMonth) return;

    // Validate file first (unified validation for both CSV and Excel)
    const validation = validateFileQuick(file);
    if (!validation.valid) {
      salaryCalculator.csvUploadError(validation.errors?.join(', ') || "Please select a valid roster file.");
      return;
    }

    // Ensure user is authenticated before upload
    if (!userId) {
      salaryCalculator.csvUploadError('You must be logged in to upload roster files. Please sign in and try again.');
      return;
    }

    // Wait for user position to be loaded
    if (userPositionLoading) {
      salaryCalculator.csvUploadError('Loading user profile... Please try again in a moment.');
      return;
    }

    const currentYear = new Date().getFullYear();

    // Check for existing data before processing
    try {
      const existingCheck = await checkForExistingData(userId, selectedUploadMonth, currentYear);

      if (existingCheck.error) {
        salaryCalculator.csvUploadError(`Error checking existing data: ${existingCheck.error}`);
        return;
      }

      // If data exists, show replacement confirmation dialog
      if (existingCheck.exists) {
        setExistingDataCheck(existingCheck);
        setPendingFile(file);
        setReplacementDialogOpen(true);
        return;
      }

      // No existing data, proceed with normal upload
      await processFileUpload(file, false);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      salaryCalculator.csvUploadError(`Error during upload: ${errorMessage}`);
    }
  }, [selectedUploadMonth, userId, userPositionLoading, salaryCalculator, processFileUpload]);

  // Handle replacement confirmation
  const handleReplacementConfirm = useCallback(async () => {
    if (!pendingFile || !userId || !selectedUploadMonth) return;

    setReplacementProcessing(true);
    setReplacementDialogOpen(false);

    try {
      await processFileUpload(pendingFile, true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      salaryCalculator.csvUploadError(`Replacement failed: ${errorMessage}`);
    } finally {
      setReplacementProcessing(false);
      setPendingFile(null);
      setExistingDataCheck(null);
    }
  }, [pendingFile, userId, selectedUploadMonth, processFileUpload, salaryCalculator]);

  // Handle replacement cancellation
  const handleReplacementCancel = useCallback(() => {
    setReplacementDialogOpen(false);
    setPendingFile(null);
    setExistingDataCheck(null);
    setUploadState('month'); // Go back to month selection
  }, []);

  return (
    <>
      {/* Upload Button */}
      <Button
        variant="outline"
        className="border-[#4C49ED] text-[#4C49ED] cursor-pointer rounded-2xl flex items-center gap-2 hover:bg-transparent hover:opacity-80"
        onClick={handleUploadClick}
      >
        <Upload className="h-4 w-4" />
        <span>Upload Roster</span>
      </Button>

      {/* Upload Roster Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={handleUploadModalClose}>
        <DialogContent className="modal-xl modal-touch-friendly max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Roster
            </DialogTitle>
            {uploadState === 'month' && (
              <DialogDescription>
                Select the month for your roster upload
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-6">
            {uploadState === 'month' && (
              <div className="w-full max-w-sm mx-auto space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <Select onValueChange={(value) => handleMonthSelect(parseInt(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {getMonthName(month)} {new Date().getFullYear()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {uploadState === 'upload' && selectedUploadMonth && (
              <div>
                {/* Hidden file input */}
                <input
                  id="roster-file-input"
                  type="file"
                  accept=".csv,.xlsx,.xlsm,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileSelect(file);
                    }
                  }}
                />
              </div>
            )}

            {uploadState === 'processing' && processingStatus && (
              <ProcessingStatus status={processingStatus} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Roster Replacement Confirmation Dialog */}
      {existingDataCheck && selectedUploadMonth !== null && (
        <RosterReplacementDialog
          open={replacementDialogOpen}
          onOpenChange={setReplacementDialogOpen}
          month={selectedUploadMonth}
          onConfirm={handleReplacementConfirm}
          onCancel={handleReplacementCancel}
          isProcessing={replacementProcessing}
        />
      )}
    </>
  );
});

RosterUploadSection.displayName = 'RosterUploadSection';


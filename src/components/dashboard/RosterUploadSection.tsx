'use client';

import React, { useState, useCallback, memo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveModal, ResponsiveModalContent, ResponsiveModalDescription, ResponsiveModalHeader, ResponsiveModalTitle } from '@/components/ui/responsive-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
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
  selectedYear: number;
  onUploadSuccess: () => Promise<void>;
}

export const RosterUploadSection = memo<RosterUploadSectionProps>(({
  userId,
  selectedYear,
  onUploadSuccess,
}) => {
  const { salaryCalculator } = useToast();

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUploadMonth, setSelectedUploadMonth] = useState<number | null>(null);

  // Upload states — 'upload' state removed; picker is now triggered by explicit button press
  const [uploadState, setUploadState] = useState<'month' | 'processing'>('month');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType | null>(null);

  // Roster replacement state
  const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
  const [existingDataCheck, setExistingDataCheck] = useState<ExistingDataCheck | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [replacementProcessing, setReplacementProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle upload modal opening
  const handleUploadClick = useCallback(() => {
    setUploadModalOpen(true);
    setUploadState('month');
    setSelectedUploadMonth(null);
    setProcessingStatus(null);
  }, []);

  // Handle upload modal close — full state reset
  const handleUploadModalClose = useCallback(() => {
    setUploadModalOpen(false);
    setUploadState('month');
    setSelectedUploadMonth(null);
    setProcessingStatus(null);
    setReplacementDialogOpen(false);
    setExistingDataCheck(null);
    setPendingFile(null);
    setReplacementProcessing(false);
  }, []);

  // Open the native file picker — no cancel-detection side effects.
  // Mobile browsers require file input clicks to originate from a direct user gesture,
  // so this must be called from a button's onClick handler.
  const openFilePicker = useCallback(() => {
    const fileInput = fileInputRef.current;
    if (!fileInput) return;

    // Clear any previous selection so the same file can be re-picked after a cancel.
    fileInput.value = '';
    fileInput.click();
  }, []);

  // Update selected month — no longer auto-opens the file picker
  const handleMonthSelect = useCallback((month: number) => {
    setSelectedUploadMonth(month);
  }, []);

  // Process file upload (with or without replacement)
  const processFileUpload = useCallback(async (file: File, performReplacement: boolean) => {
    if (!selectedUploadMonth) {
      salaryCalculator.csvUploadError('Please select a month before uploading a roster.');
      setUploadState('month');
      return;
    }

    setUploadState('processing');

    const loadingToast = salaryCalculator.processingStarted(file.name);

    try {
      const result = await processFileUploadWithReplacement(
        file,
        userId,
        selectedUploadMonth,
        selectedYear,
        (status) => {
          setProcessingStatus(status);
        },
        performReplacement
      );

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

        await onUploadSuccess();
        handleUploadModalClose();
      } else {
        salaryCalculator.csvUploadError(result.errors?.join(', ') || 'Unknown error occurred');
        // Return to month selection so the user can retry
        setUploadState('month');
      }
    } catch (error) {
      salaryCalculator.dismiss(loadingToast);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      salaryCalculator.csvUploadError(errorMessage);
      setUploadState('month');
    }
  }, [selectedUploadMonth, userId, salaryCalculator, onUploadSuccess, handleUploadModalClose]);

  // Handle file selection from the hidden input
  const handleFileSelect = useCallback(async (file: File) => {
    if (!selectedUploadMonth) {
      salaryCalculator.csvUploadError('Please select a month before uploading a roster.');
      setUploadState('month');
      return;
    }

    const validation = validateFileQuick(file);
    if (!validation.valid) {
      salaryCalculator.csvUploadError(validation.errors?.join(', ') || 'Please select a valid roster file.');
      return;
    }

    if (!userId) {
      salaryCalculator.csvUploadError('You must be logged in to upload roster files. Please sign in and try again.');
      return;
    }

    try {
      const existingCheck = await checkForExistingData(userId, selectedUploadMonth, selectedYear);

      if (existingCheck.error) {
        salaryCalculator.csvUploadError(`Error checking existing data: ${existingCheck.error}`);
        return;
      }

      if (existingCheck.exists) {
        setExistingDataCheck(existingCheck);
        setPendingFile(file);
        setReplacementDialogOpen(true);
        return;
      }

      await processFileUpload(file, false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      salaryCalculator.csvUploadError(`Error during upload: ${errorMessage}`);
    }
  }, [selectedUploadMonth, userId, salaryCalculator, processFileUpload]);

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

  // Handle replacement cancellation — stay on month step so the user can retry
  const handleReplacementCancel = useCallback(() => {
    setReplacementDialogOpen(false);
    setPendingFile(null);
    setExistingDataCheck(null);
    setUploadState('month');
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
      <ResponsiveModal
        open={uploadModalOpen}
        onOpenChange={(open) => {
          // Only run the full reset when the modal is actually closing, not on incidental
          // open-change callbacks (e.g. from the portalled Select dropdown on mobile).
          if (!open) handleUploadModalClose();
        }}
      >
        <ResponsiveModalContent className="modal-xl modal-touch-friendly max-h-[90vh] overflow-y-auto">
          <ResponsiveModalHeader className="pr-10">
            <ResponsiveModalTitle className="flex items-center gap-2 justify-center sm:justify-start">
              <Upload className="h-5 w-5 text-primary" />
              Upload Roster
            </ResponsiveModalTitle>
            <ResponsiveModalDescription>
              {selectedUploadMonth
                ? `Upload your roster for ${getMonthName(selectedUploadMonth)} ${selectedYear}`
                : 'Select the month for your roster upload'}
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>

          <div className="space-y-6">
            {/* Hidden file input — kept always mounted so the browser can associate the
                programmatic click with a user gesture when triggered from the button below. */}
            <input
              ref={fileInputRef}
              id="roster-file-input"
              type="file"
              accept=".csv,.xlsx,.xlsm,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                // If the user cancelled the picker (no file chosen), stay on the current
                // screen so they can retry — do NOT close or reset the modal.
                if (!file) return;
                handleFileSelect(file);
              }}
            />

            {uploadState === 'month' && (
              <div className="w-full max-w-sm mx-auto space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  {/* Controlled Select — preserves the visible selection after the picker is dismissed */}
                  <Select
                    value={selectedUploadMonth?.toString() ?? ''}
                    onValueChange={(value) => handleMonthSelect(parseInt(value, 10))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {getMonthName(month)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUploadMonth !== null && (
                  <Button
                    className="w-full"
                    onClick={openFilePicker}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose roster file
                  </Button>
                )}
              </div>
            )}

            {uploadState === 'processing' && processingStatus && (
              <ProcessingStatus status={processingStatus} />
            )}
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

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

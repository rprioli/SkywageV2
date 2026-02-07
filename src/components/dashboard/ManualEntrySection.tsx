/**
 * ManualEntrySection Component
 * 
 * Handles manual flight entry UI and logic.
 * Provides a button to open the manual entry modal and manages the modal state.
 * Extracted from dashboard page to reduce complexity.
 */

'use client';

import React, { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveModal, ResponsiveModalContent, ResponsiveModalDescription, ResponsiveModalHeader, ResponsiveModalTitle } from '@/components/ui/responsive-modal';
import { FileText } from 'lucide-react';
import { Position } from '@/types/salary-calculator';
import { ManualFlightEntry } from '@/components/salary-calculator/ManualFlightEntry';

interface ManualEntrySectionProps {
  position: Position;
  userPositionLoading: boolean;
  selectedYear: number;
  onEntrySuccess: () => Promise<void>;
}

export const ManualEntrySection = memo<ManualEntrySectionProps>(({
  position,
  userPositionLoading,
  selectedYear,
  onEntrySuccess,
}) => {
  const [manualEntryModalOpen, setManualEntryModalOpen] = useState(false);

  // Handle manual entry modal
  const handleManualEntryClick = useCallback(() => {
    setManualEntryModalOpen(true);
  }, []);

  // Handle manual entry success - refresh data and close modal
  const handleManualEntrySuccess = useCallback(async () => {
    // Refresh data using the callback
    await onEntrySuccess();

    // Close modal
    setManualEntryModalOpen(false);
  }, [onEntrySuccess]);

  return (
    <>
      {/* Manual Entry Button */}
      <Button
        variant="outline"
        className="border-[#4C49ED] text-[#4C49ED] cursor-pointer rounded-2xl flex items-center gap-2 hover:bg-transparent hover:opacity-80"
        onClick={handleManualEntryClick}
      >
        <FileText className="h-4 w-4" />
        <span>Add Flight</span>
      </Button>

      {/* Manual Entry Modal */}
      <ResponsiveModal open={manualEntryModalOpen} onOpenChange={setManualEntryModalOpen}>
        <ResponsiveModalContent className="modal-xl modal-touch-friendly max-h-[90vh] overflow-y-auto">
          <ResponsiveModalHeader className="pt-0 pb-0 sm:pb-4">
            <ResponsiveModalTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Add Flight Manually
            </ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Enter flight details manually for salary calculation
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>

          {userPositionLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading user profile...</p>
              </div>
            </div>
          ) : (
            <ManualFlightEntry
              position={position}
              selectedYear={selectedYear}
              onBack={() => setManualEntryModalOpen(false)}
              onSuccess={handleManualEntrySuccess}
            />
          )}
        </ResponsiveModalContent>
      </ResponsiveModal>
    </>
  );
});

ManualEntrySection.displayName = 'ManualEntrySection';


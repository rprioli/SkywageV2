'use client';

/**
 * Roster Replacement Confirmation Dialog for Skywage Salary Calculator
 * Warns users about data replacement and gets confirmation
 * Following existing dialog patterns and .augment-guidelines.md principles
 */

import { useState } from 'react';
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
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMonthName } from '@/lib/salary-calculator/roster-replacement';

interface RosterReplacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: number;
  year: number;
  existingFlightCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function RosterReplacementDialog({
  open,
  onOpenChange,
  month,
  year,
  existingFlightCount,
  onConfirm,
  onCancel,
  isProcessing = false
}: RosterReplacementDialogProps) {
  const monthName = getMonthName(month);

  const handleCancel = () => {
    if (!isProcessing) {
      onCancel();
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    if (!isProcessing) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader className="flex flex-col gap-2 text-center sm:text-left">
          <AlertDialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Replace {monthName} Data?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            This will permanently replace all current data with your new roster.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-start">
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isProcessing}
            className={cn(
              "bg-red-600 hover:bg-red-700",
              isProcessing && "opacity-50 cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Replacing...
              </div>
            ) : (
              'Replace Data'
            )}
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

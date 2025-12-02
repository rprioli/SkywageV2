'use client';

/**
 * Form Actions Component for Flight Entry Form
 * Handles submit, batch, and save batch buttons
 */

import { Button } from '@/components/ui/button';
import { Save, Loader2, Plus } from 'lucide-react';

interface FormActionsProps {
  loading: boolean;
  disabled: boolean;
  batchCount: number;
  onAddToBatch?: () => void;
  onSaveBatchOnly?: () => Promise<void>;
}

export function FormActions({
  loading,
  disabled,
  batchCount,
  onAddToBatch,
  onSaveBatchOnly
}: FormActionsProps) {
  const isFormDisabled = disabled || loading;

  return (
    <div className="space-y-3">
      {/* Batch Counter */}
      {batchCount > 0 && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
          <p className="text-primary text-sm font-medium">
            {batchCount} flight {batchCount === 1 ? 'duty' : 'duties'} added to batch
          </p>
        </div>
      )}

      {/* Save Batch Only Button */}
      {batchCount > 0 && onSaveBatchOnly && (
        <Button
          type="button"
          variant="secondary"
          size="touch"
          onClick={onSaveBatchOnly}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Batch...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save {batchCount} Flight {batchCount === 1 ? 'Duty' : 'Duties'} Only</span>
            </>
          )}
        </Button>
      )}

      {/* Main Action Buttons */}
      <div className="flex gap-3">
        {/* Submit Button */}
        <Button
          type="submit"
          size="touch"
          disabled={isFormDisabled}
          className="flex-1 flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Flight...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>
                {batchCount > 0 ? `Save ${batchCount + 1} Flight Duties` : 'Save Flight Duty'}
              </span>
            </>
          )}
        </Button>

        {/* Add Another Duty Button */}
        {onAddToBatch && (
          <Button
            type="button"
            variant="outline"
            size="touch"
            onClick={onAddToBatch}
            disabled={isFormDisabled}
            className="flex-1 flex items-center justify-center gap-2 cursor-pointer hover:bg-transparent hover:opacity-80"
          >
            <Plus className="h-4 w-4" />
            <span>Add Another Duty</span>
          </Button>
        )}
      </div>
    </div>
  );
}


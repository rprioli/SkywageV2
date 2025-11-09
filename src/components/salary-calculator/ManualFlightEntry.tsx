'use client';

/**
 * Manual Flight Entry Component for Skywage Salary Calculator
 * Phase 7: Redesigned with clean, minimal UI matching Upload Roster design
 * Following ultra-streamlined workflow principles
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

import { FlightEntryForm } from './FlightEntryForm';

import { Position } from '@/types/salary-calculator';
import {
  ManualFlightEntryData,
  processManualEntry,
  processManualEntryBatch,
  ManualEntryResult,
  BatchManualEntryResult
} from '@/lib/salary-calculator/manual-entry-processor';

interface ManualFlightEntryProps {
  position: Position;
  selectedYear: number;
  onBack?: () => void;
  onSuccess?: () => void;
  className?: string;
}

type EntryState = 'form' | 'processing' | 'success' | 'error';

export function ManualFlightEntry({
  position,
  selectedYear,
  onBack,
  onSuccess,
  className
}: ManualFlightEntryProps) {
  const { user } = useAuth();
  const { salaryCalculator } = useToast();

  // Component state
  const [entryState, setEntryState] = useState<EntryState>('form');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ManualEntryResult | BatchManualEntryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Batch entry state
  const [batchDuties, setBatchDuties] = useState<ManualFlightEntryData[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);

  // Auto-close modal after successful submission
  useEffect(() => {
    if (entryState === 'success' && onSuccess) {
      const timer = setTimeout(() => {
        onSuccess();
      }, 2000); // Close after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [entryState, onSuccess]);

  // Handle adding duty to batch
  const handleAddToBatch = (data: ManualFlightEntryData) => {
    setBatchDuties(prev => [...prev, data]);
    setIsBatchMode(true);
  };

  // Handle form submission (single or batch)
  const handleFormSubmit = async (data: ManualFlightEntryData) => {
    if (!user?.id) {
      const errorMsg = 'User not authenticated';
      setError(errorMsg);
      salaryCalculator.csvUploadError(errorMsg);
      return;
    }

    setLoading(true);
    setEntryState('processing');
    setError(null);

    try {
      let processingResult: ManualEntryResult | BatchManualEntryResult;

      if (isBatchMode || batchDuties.length > 0) {
        // Process as batch (include current form data + batch)
        const allDuties = [...batchDuties, data];
        processingResult = await processManualEntryBatch(allDuties, user.id, position);
      } else {
        // Process single entry
        processingResult = await processManualEntry(data, user.id, position);
      }

      if (processingResult.success) {
        setResult(processingResult);
        setEntryState('success');

        // Show success toast
        if ('flightDuty' in processingResult && processingResult.flightDuty) {
          // Single entry
          salaryCalculator.flightSaved(processingResult.flightDuty.flightNumbers);
        } else if ('flightDuties' in processingResult && processingResult.flightDuties) {
          // Batch entry
          const totalFlights = processingResult.flightDuties.length;
          salaryCalculator.flightSaved([`${totalFlights} flight duties`]);
        }

        // Reset batch state
        setBatchDuties([]);
        setIsBatchMode(false);

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorMsg = processingResult.errors?.join(', ') || 'Failed to save flight duty';
        setError(errorMsg);
        setEntryState('error');
        salaryCalculator.csvUploadError(errorMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setEntryState('error');
      salaryCalculator.csvUploadError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle saving batch only (without current form)
  const handleSaveBatchOnly = async () => {
    if (!user?.id) {
      const errorMsg = 'User not authenticated';
      setError(errorMsg);
      salaryCalculator.csvUploadError(errorMsg);
      return;
    }

    if (batchDuties.length === 0) {
      salaryCalculator.csvUploadError('No duties in batch to save');
      return;
    }

    setLoading(true);
    setEntryState('processing');
    setError(null);

    try {
      // Process only the batched duties (exclude current form)
      const processingResult = await processManualEntryBatch(batchDuties, user.id, position);

      if (processingResult.success) {
        setResult(processingResult);
        setEntryState('success');

        // Show success toast
        const totalFlights = processingResult.flightDuties?.length || batchDuties.length;
        salaryCalculator.flightSaved([`${totalFlights} flight duties`]);

        // Reset batch state
        setBatchDuties([]);
        setIsBatchMode(false);

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorMsg = processingResult.errors?.join(', ') || 'Failed to save batch duties';
        setError(errorMsg);
        setEntryState('error');
        salaryCalculator.csvUploadError(errorMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setEntryState('error');
      salaryCalculator.csvUploadError(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  // Handle retry
  const handleRetry = () => {
    setEntryState('form');
    setError(null);
  };

  // Render based on current state
  const renderContent = () => {
    switch (entryState) {
      case 'form':
        return (
          <FlightEntryForm
            onSubmit={handleFormSubmit}
            onAddToBatch={handleAddToBatch}
            onSaveBatchOnly={handleSaveBatchOnly}
            loading={loading}
            position={position}
            selectedYear={selectedYear}
            batchCount={batchDuties.length}
          />
        );

      case 'processing':
        return (
          <div className="text-center space-y-4 py-8">
            <div className="flex justify-center">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Processing Flight Entry</h3>
              <p className="text-muted-foreground">
                Saving flight duty and calculating salary...
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4 py-8">
            {/* Success message */}
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-accent">Flight Duty Saved Successfully!</h3>
              {result?.warnings && result.warnings.length > 0 && (
                <p className="text-muted-foreground text-sm mt-2">
                  Note: {result.warnings.join(', ')}
                </p>
              )}
              <p className="text-muted-foreground text-sm mt-2">
                The dashboard will update automatically
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-6">
            {/* Error message */}
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'An error occurred while saving the flight duty'}
              </AlertDescription>
            </Alert>

            {/* Retry button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleRetry} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              {onBack && (
                <Button variant="outline" onClick={onBack} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Calculator
                </Button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Main content */}
      {renderContent()}
    </div>
  );
}

'use client';

/**
 * Manual Flight Entry Component for Skywage Salary Calculator
 * Phase 4: Main container for manual flight entry workflow
 * Following existing patterns from Phase 3 upload components
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  ArrowLeft,
  Plus
} from 'lucide-react';

import { FlightEntryForm } from './FlightEntryForm';
import { SalaryBreakdown } from './SalaryBreakdown';
import { FlightDutiesTable } from './FlightDutiesTable';

import { Position } from '@/types/salary-calculator';
import { 
  ManualFlightEntryData,
  processManualEntry,
  ManualEntryResult
} from '@/lib/salary-calculator/manual-entry-processor';

interface ManualFlightEntryProps {
  position: Position;
  onBack?: () => void;
  className?: string;
}

type EntryState = 'form' | 'processing' | 'success' | 'error';

export function ManualFlightEntry({
  position,
  onBack,
  className
}: ManualFlightEntryProps) {
  const { user } = useAuth();
  const { salaryCalculator } = useToast();

  // Component state
  const [entryState, setEntryState] = useState<EntryState>('form');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ManualEntryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
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
      const processingResult = await processManualEntry(data, user.id, position);

      if (processingResult.success) {
        setResult(processingResult);
        setEntryState('success');

        // Show success toast
        if (processingResult.flightDuty) {
          salaryCalculator.flightSaved(processingResult.flightDuty.flightNumbers);
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

  // Handle adding another flight
  const handleAddAnother = () => {
    setEntryState('form');
    setResult(null);
    setError(null);
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
            loading={loading}
            position={position}
          />
        );

      case 'processing':
        return (
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
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
            </CardContent>
          </Card>
        );

      case 'success':
        return (
          <div className="space-y-6">
            {/* Success message */}
            <Alert className="border-accent bg-accent/10">
              <CheckCircle className="h-4 w-4 text-accent" />
              <AlertDescription className="text-accent">
                Flight duty saved successfully! 
                {result?.warnings && result.warnings.length > 0 && (
                  <span className="block mt-1 text-sm">
                    Note: {result.warnings.join(', ')}
                  </span>
                )}
              </AlertDescription>
            </Alert>

            {/* Results display */}
            {result?.monthlyCalculation && (
              <div className="space-y-4">
                <SalaryBreakdown 
                  calculation={result.monthlyCalculation.calculation}
                  variant="detailed"
                />
                
                {result.flightDuty && (
                  <FlightDutiesTable 
                    flightDuties={[result.flightDuty]}
                    showActions={false}
                  />
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleAddAnother} className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                Add Another Flight
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
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {onBack && entryState === 'form' && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Manual Flight Entry</h1>
            <p className="text-muted-foreground">
              Enter flight duties manually for salary calculation
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Position: {position}</span>
          {user?.email && (
            <>
              <span>•</span>
              <span>{user.email}</span>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      {renderContent()}

      {/* Help text */}
      {entryState === 'form' && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Manual Entry Tips:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Choose the correct flight type (Turnaround, Layover, or Airport Standby)</li>
            <li>• Flight numbers should be in format FZ123 or FZ1234</li>
            <li>• Sectors should be in format DXB-CMB</li>
            <li>• Use 24-hour time format (e.g., 09:30, 17:45)</li>
            <li>• Enable "Cross-day flight" if debrief time is the next day</li>
            <li>• The system will calculate duty hours and estimated pay automatically</li>
          </ul>
        </div>
      )}
    </div>
  );
}

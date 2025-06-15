'use client';

/**
 * Processing Status Component for Skywage Salary Calculator
 * Phase 3: Real-time progress tracking for CSV processing
 * Following existing UI patterns with ShadCN components
 */

import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessingStatus as ProcessingStatusType } from '@/lib/salary-calculator/upload-processor';

interface ProcessingStatusProps {
  status: ProcessingStatusType;
  className?: string;
}

export function ProcessingStatus({ status, className }: ProcessingStatusProps) {
  const isError = status.step === 'error';
  const isComplete = status.step === 'complete';

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div className="space-y-4">
        {/* Title with Icon */}
        <div className="flex items-center gap-2">
          {isError ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : isComplete ? (
            <CheckCircle className="h-5 w-5 text-accent" />
          ) : (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          )}
          <h3 className="text-lg font-semibold">
            {isError ? 'Processing Failed' : isComplete ? 'Processing Complete' : 'Processing Roster'}
          </h3>
        </div>

        {/* Current Step Message */}
        <p className="text-muted-foreground">
          {status.message}
        </p>

        {/* Progress Bar with Percentage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{status.progress}%</span>
          </div>
          <Progress
            value={status.progress}
            className={cn(
              'h-2',
              isError && 'bg-destructive/20 [&>div]:bg-destructive'
            )}
          />
        </div>
      </div>
    </div>
  );
}

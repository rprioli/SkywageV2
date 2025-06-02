'use client';

/**
 * Processing Status Component for Skywage Salary Calculator
 * Phase 3: Real-time progress tracking for CSV processing
 * Following existing UI patterns with ShadCN components
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileCheck, 
  Calculator, 
  Database,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessingStatus as ProcessingStatusType } from '@/lib/salary-calculator/upload-processor';

interface ProcessingStatusProps {
  status: ProcessingStatusType;
  className?: string;
}

export function ProcessingStatus({ status, className }: ProcessingStatusProps) {
  const getStepIcon = (step: string, isActive: boolean, isComplete: boolean, isError: boolean) => {
    const iconClass = cn(
      'h-5 w-5',
      isError ? 'text-destructive' : 
      isComplete ? 'text-accent' : 
      isActive ? 'text-primary' : 
      'text-muted-foreground'
    );

    if (isError) {
      return <AlertCircle className={iconClass} />;
    }
    
    if (isComplete) {
      return <CheckCircle className={iconClass} />;
    }
    
    if (isActive) {
      return <Loader2 className={cn(iconClass, 'animate-spin')} />;
    }

    switch (step) {
      case 'validating':
        return <FileCheck className={iconClass} />;
      case 'parsing':
        return <Upload className={iconClass} />;
      case 'calculating':
        return <Calculator className={iconClass} />;
      case 'saving':
        return <Database className={iconClass} />;
      default:
        return <CheckCircle className={iconClass} />;
    }
  };

  const steps = [
    { key: 'validating', label: 'Validating File', description: 'Checking file format and content' },
    { key: 'parsing', label: 'Parsing Data', description: 'Extracting flight duties from CSV' },
    { key: 'calculating', label: 'Calculating Salary', description: 'Computing salary components' },
    { key: 'saving', label: 'Saving Results', description: 'Storing data to database' }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === status.step);
  const isError = status.step === 'error';
  const isComplete = status.step === 'complete';

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isError ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : isComplete ? (
            <CheckCircle className="h-5 w-5 text-accent" />
          ) : (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          )}
          {isError ? 'Processing Failed' : isComplete ? 'Processing Complete' : 'Processing Roster'}
        </CardTitle>
        <CardDescription>
          {status.message}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Bar */}
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

          {/* Processing Steps */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Processing Steps</h4>
            <div className="space-y-3">
              {steps.map((step, index) => {
                const isActive = step.key === status.step && !isComplete && !isError;
                const isStepComplete = index < currentStepIndex || isComplete;
                const isStepError = isError && step.key === status.step;

                return (
                  <div
                    key={step.key}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg transition-colors',
                      isActive && 'bg-primary/5 border border-primary/20',
                      isStepComplete && 'bg-accent/5',
                      isStepError && 'bg-destructive/5 border border-destructive/20'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStepIcon(step.key, isActive, isStepComplete, isStepError)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium text-sm',
                        isStepError ? 'text-destructive' :
                        isStepComplete ? 'text-accent' :
                        isActive ? 'text-primary' :
                        'text-muted-foreground'
                      )}>
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isActive && status.details ? status.details : step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Details */}
          {status.details && (
            <div className={cn(
              'p-3 rounded-lg text-sm',
              isError ? 'bg-destructive/10 text-destructive' :
              isComplete ? 'bg-accent/10 text-accent-foreground' :
              'bg-muted text-muted-foreground'
            )}>
              <p className="font-medium mb-1">
                {isError ? 'Error Details:' : isComplete ? 'Success:' : 'Current Status:'}
              </p>
              <p>{status.details}</p>
            </div>
          )}

          {/* Completion Message */}
          {isComplete && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 mx-auto text-accent mb-2" />
              <p className="font-medium text-accent">Processing completed successfully!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your salary calculation is ready to view
              </p>
            </div>
          )}

          {/* Error Message */}
          {isError && (
            <div className="text-center py-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-2" />
              <p className="font-medium text-destructive">Processing failed</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please check your file and try again
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

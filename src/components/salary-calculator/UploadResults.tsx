'use client';

/**
 * Upload Results Component for Skywage Salary Calculator
 * Phase 3: Display processing results using existing UI components
 * Following existing patterns from SalaryBreakdown and FlightDutiesTable
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SalaryBreakdown } from '@/components/salary-calculator/SalaryBreakdown';
import { FlightDutiesTable } from '@/components/salary-calculator/FlightDutiesTable';
import { 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  FileText, 
  Calculator,
  ArrowLeft
} from 'lucide-react';
import { ProcessingResult } from '@/lib/salary-calculator/upload-processor';

interface UploadResultsProps {
  result: ProcessingResult;
  fileName: string;
  position: 'CCM' | 'SCCM';
  onStartOver: () => void;
  onDownloadReport?: () => void;
  className?: string;
}

export function UploadResults({
  result,
  fileName,
  position,
  onStartOver,
  onDownloadReport,
  className
}: UploadResultsProps) {
  // Debug logging to see what we're getting
  console.log('UploadResults - Processing result:', result);
  console.log('UploadResults - Errors array:', result.errors);
  console.log('UploadResults - Warnings array:', result.warnings);
  if (result.errors) {
    result.errors.forEach((error, index) => {
      console.log(`UploadResults - Error ${index}:`, error);
    });
  }

  if (!result.success) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Processing Failed
          </CardTitle>
          <CardDescription>
            There were errors processing your roster file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Error Messages */}
            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Errors:</h4>
                <ul className="space-y-1 text-sm">
                  {result.errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2 text-destructive">
                      <span className="text-destructive mt-1">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warning Messages */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-orange-600">Warnings:</h4>
                <ul className="space-y-1 text-sm">
                  {result.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2 text-orange-600">
                      <span className="text-orange-600 mt-1">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={onStartOver} variant="outline" className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { monthlyCalculation, flightDuties, layoverRestPeriods } = result;

  if (!monthlyCalculation || !flightDuties) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Incomplete Results
          </CardTitle>
          <CardDescription>
            Processing completed but results are incomplete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onStartOver} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Start Over
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Success Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <CheckCircle className="h-5 w-5" />
              Processing Complete
            </CardTitle>
            <CardDescription>
              Successfully processed {fileName} with {flightDuties.length} flight duties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onStartOver} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Upload Another File
              </Button>
              {onDownloadReport && (
                <Button onClick={onDownloadReport} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              )}
              <Button variant="outline" disabled>
                <FileText className="mr-2 h-4 w-4" />
                Edit Flights (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {result.warnings && result.warnings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Processing Warnings
              </CardTitle>
              <CardDescription>
                The following warnings were encountered during processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {result.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2 text-orange-600">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Salary Breakdown */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Salary Breakdown
          </h2>
          <SalaryBreakdown
            calculation={monthlyCalculation.monthlyCalculation}
            position={position}
          />
        </div>

        {/* Flight Duties Table */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Flight Duties
          </h2>
          <FlightDutiesTable 
            flightDuties={flightDuties}
            loading={false}
          />
        </div>

        {/* Summary Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Summary</CardTitle>
            <CardDescription>
              Overview of processed data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{flightDuties.length}</p>
                <p className="text-sm text-muted-foreground">Flight Duties</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {layoverRestPeriods?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Layovers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {monthlyCalculation.monthlyCalculation.totalDutyHours.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">Duty Hours</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">
                  {monthlyCalculation.monthlyCalculation.totalSalary.toLocaleString()} AED
                </p>
                <p className="text-sm text-muted-foreground">Total Salary</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

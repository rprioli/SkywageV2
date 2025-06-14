'use client';

/**
 * Phase 6 Test Page for Skywage Salary Calculator
 * Tests enhanced UI/UX improvements with sample data
 * Shows the beautiful new FlightDutiesTable design
 */

import { useState } from 'react';
import { FlightDuty, Position } from '@/types/salary-calculator';
import { FlightDutiesTable } from '@/components/salary-calculator/FlightDutiesTable';
import { SalaryBreakdown } from '@/components/salary-calculator/SalaryBreakdown';
import { RosterUpload } from '@/components/salary-calculator/RosterUpload';
import { ProcessingStatus } from '@/components/salary-calculator/ProcessingStatus';
import { UploadResults } from '@/components/salary-calculator/UploadResults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  processCSVUpload,
  ProcessingStatus as ProcessingStatusType,
  ProcessingResult,
  parseFlightDutiesFromCSV
} from '@/lib/salary-calculator';
import { Sparkles, Palette, Bell, CheckCircle, AlertTriangle, Upload } from 'lucide-react';

export default function Phase6TestPage() {
  const [position, setPosition] = useState<Position>('CCM');
  const { salaryCalculator, showSuccess, showError, showWarning, showInfo } = useToast();

  // CSV Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType | null>(null);
  const [uploadResults, setUploadResults] = useState<ProcessingResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Sample flight duties data to showcase the new design
  const sampleFlightDuties: FlightDuty[] = [
    {
      id: '1',
      userId: 'test-user',
      date: new Date('2025-01-15'),
      flightNumbers: ['FZ549', 'FZ550'],
      sectors: ['DXB-CMB', 'CMB-DXB'],
      dutyType: 'turnaround',
      reportTime: { hours: 9, minutes: 20 },
      debriefTime: { hours: 21, minutes: 15 },
      dutyHours: 11.92,
      flightPay: 596.00,
      isCrossDay: false,
      dataSource: 'csv',
      month: 1,
      year: 2025,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      userId: 'test-user',
      date: new Date('2025-01-17'),
      flightNumbers: ['FZ967'],
      sectors: ['DXB-VKO'],
      dutyType: 'layover',
      reportTime: { hours: 22, minutes: 30 },
      debriefTime: { hours: 5, minutes: 45 },
      dutyHours: 7.25,
      flightPay: 362.50,
      isCrossDay: true,
      dataSource: 'manual',
      month: 1,
      year: 2025,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      userId: 'test-user',
      date: new Date('2025-01-18'),
      flightNumbers: ['FZ968'],
      sectors: ['VKO-DXB'],
      dutyType: 'layover',
      reportTime: { hours: 5, minutes: 15 },
      debriefTime: { hours: 12, minutes: 25 },
      dutyHours: 7.17,
      flightPay: 358.50,
      isCrossDay: false,
      dataSource: 'manual',
      month: 1,
      year: 2025,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      userId: 'test-user',
      date: new Date('2025-01-20'),
      flightNumbers: [],
      sectors: [],
      dutyType: 'asby',
      reportTime: { hours: 8, minutes: 0 },
      debriefTime: { hours: 12, minutes: 0 },
      dutyHours: 4.0,
      flightPay: 200.00,
      isCrossDay: false,
      dataSource: 'csv',
      month: 1,
      year: 2025,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      userId: 'test-user',
      date: new Date('2025-01-22'),
      flightNumbers: ['FZ321', 'FZ322', 'FZ323'],
      sectors: ['DXB-DEL', 'DEL-BOM', 'BOM-DXB'],
      dutyType: 'turnaround',
      reportTime: { hours: 6, minutes: 30 },
      debriefTime: { hours: 23, minutes: 45 },
      dutyHours: 17.25,
      flightPay: 862.50,
      isCrossDay: false,
      dataSource: 'edited',
      month: 1,
      year: 2025,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '7',
      userId: 'test-user',
      date: new Date('2025-01-28'),
      flightNumbers: ['FZ789', 'FZ790'],
      sectors: ['DXB-BKK', 'BKK-DXB'],
      dutyType: 'turnaround',
      reportTime: { hours: 10, minutes: 0 },
      debriefTime: { hours: 22, minutes: 30 },
      dutyHours: 12.5,
      flightPay: 625.00,
      isCrossDay: false,
      dataSource: 'csv',
      month: 1,
      year: 2025,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '6',
      userId: 'test-user',
      date: new Date('2025-01-25'),
      flightNumbers: ['FZ145'],
      sectors: ['DXB-KTM'],
      dutyType: 'layover',
      reportTime: { hours: 14, minutes: 15 },
      debriefTime: { hours: 20, minutes: 30 },
      dutyHours: 6.25,
      flightPay: 312.50,
      isCrossDay: false,
      dataSource: 'csv',
      month: 1,
      year: 2025,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Calculate sample salary breakdown
  const sampleCalculation = (() => {
    const basicSalary = position === 'CCM' ? 3275 : 4275;
    const housingAllowance = position === 'CCM' ? 4000 : 5000;
    const transportAllowance = 1000;
    const flightPay = sampleFlightDuties.reduce((sum, duty) => sum + duty.flightPay, 0);
    const asbyPay = sampleFlightDuties.filter(duty => duty.dutyType === 'asby').length * (position === 'CCM' ? 200 : 248);
    const perDiemPay = 207.27; // Sample per diem from layover

    const totalFixed = basicSalary + housingAllowance + transportAllowance;
    const totalVariable = flightPay + perDiemPay + asbyPay;
    const totalSalary = totalFixed + totalVariable;

    return {
      id: 'test',
      userId: 'test-user',
      month: 1,
      year: 2025,
      basicSalary,
      housingAllowance,
      transportAllowance,
      totalDutyHours: sampleFlightDuties.reduce((sum, duty) => sum + duty.dutyHours, 0),
      flightPay,
      totalRestHours: 23.5,
      perDiemPay,
      asbyCount: sampleFlightDuties.filter(duty => duty.dutyType === 'asby').length,
      asbyPay,
      totalFixed,
      totalVariable,
      totalSalary,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  })();

  const handleEdit = (flightDuty: FlightDuty) => {
    salaryCalculator.flightUpdated(flightDuty.flightNumbers.length > 0 ? flightDuty.flightNumbers : ['ASBY']);
  };

  const handleDelete = (flightDuty: FlightDuty) => {
    salaryCalculator.flightDeleted(flightDuty.flightNumbers.length > 0 ? flightDuty.flightNumbers : ['ASBY']);
  };

  const handleBulkDelete = (flightDuties: FlightDuty[]) => {
    salaryCalculator.bulkDeleteSuccess(flightDuties.length);
  };

  // Generate a consistent test UUID for development testing
  // NOTE: This is for testing only - real app uses authenticated user ID
  // IMPORTANT: Temporary RLS policies have been added to allow this test UUID
  const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

  // CSV Upload handler
  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setIsUploading(true);
    setUploadResults(null);

    try {
      const result = await processCSVUpload(
        file,
        TEST_USER_ID, // Using valid UUID format for testing
        position, // User position for salary calculation
        (status: ProcessingStatusType) => setProcessingStatus(status)
      );

      setUploadResults(result);

      if (result.success) {
        salaryCalculator.csvUploadSuccess(file.name, result.flightDuties?.length || 0);
      } else {
        salaryCalculator.csvUploadError(result.errors?.[0] || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      salaryCalculator.csvUploadError('Unexpected error during upload');
    } finally {
      setIsUploading(false);
      setProcessingStatus(null);
    }
  };

  // Toast testing functions
  const testToastNotifications = () => {
    showSuccess('Success notification', { description: 'This is a success message with Skywage branding' });

    setTimeout(() => {
      showError('Error notification', { description: 'This is an error message with proper styling' });
    }, 1000);

    setTimeout(() => {
      showWarning('Warning notification', { description: 'This is a warning message for user attention' });
    }, 2000);

    setTimeout(() => {
      showInfo('Info notification', { description: 'This is an info message with Skywage primary color' });
    }, 3000);
  };

  const testSalaryCalculatorToasts = () => {
    salaryCalculator.csvUploadSuccess('roster_january_2025.csv', 14);

    setTimeout(() => {
      salaryCalculator.flightSaved(['FZ549', 'FZ550']);
    }, 1000);

    setTimeout(() => {
      salaryCalculator.calculationError('Sample calculation error for testing');
    }, 2000);
  };

  // Test function for CSV parsing fixes
  const testCSVParsingFixes = () => {
    console.log('🧪 Testing CSV parsing fixes for non-duty entries and time formats...');

    const testCSVContent = `flydubai,,,,,,,
,,,,,,,
January 2025,,,,,,,
,,,,,,,
Date,Duties,Details,Report times,Actual times/Delays,Debrief times,Indicators,Crew
01/01/2025,Day off,,,,,,
02/01/2025,FZ549 FZ550,DXB - CMB CMB - DXB,9:20,,21:15,,
03/01/2025,REST DAY,,,,,,
04/01/2025,FZ967,DXB - VKO,22:30,,05:45¹,,
05/01/2025,FZ1626,TLV - DXB,19:10,A04:03?¹/00:03,04:33?¹,,
06/01/2025,Additional Day OFF,,,,,,
07/01/2025,ASBY,Airport Standby,08:00,,12:00,,
Total Hours and Statistics,,,,,,,`;

    try {
      const result = parseFlightDutiesFromCSV(testCSVContent, 'test-user');

      const offDayWarnings = result.warnings?.filter(warning =>
        warning.includes('Day off') ||
        warning.includes('REST DAY') ||
        warning.includes('Additional Day OFF')
      ) || [];

      console.log('📊 Test Results:', {
        totalFlights: result.data?.length || 0,
        totalWarnings: result.warnings?.length || 0,
        offDayWarnings: offDayWarnings.length,
        success: offDayWarnings.length === 0
      });

      if (offDayWarnings.length === 0) {
        showSuccess('CSV Parsing Test Passed!', {
          description: `No warnings for non-duty entries. Parsed ${result.data?.length || 0} actual flights.`
        });
      } else {
        showError('CSV Parsing Test Failed!', {
          description: `Found ${offDayWarnings.length} warnings for non-duty entries.`
        });
      }

      console.log('All warnings:', result.warnings);

    } catch (error) {
      console.error('❌ Test failed:', error);
      showError('Test Error', { description: (error as Error).message });
    }
  };

  // Test function for time format validation fixes
  const testTimeFormatFixes = () => {
    console.log('🧪 Testing time format validation fixes for special characters...');

    const testCSVContent = `flydubai,,,,,,,
,,,,,,,
April 2025,,,,,,,
,,,,,,,
Date,Duties,Details,Report times,Actual times/Delays,Debrief times,Indicators,Crew
01/04/2025,FZ1626,TLV - DXB,19:10,,04:33?�,,
07/04/2025,FZ990,VKO - DXB,16:30,,00:22?�,,
08/04/2025,FZ734,GYD - DXB,17:20,,01:43?�,,
13/04/2025,FZ340,MUX - DXB,21:05,,05:22?�,,
Total Hours and Statistics,,,,,,,`;

    try {
      const result = parseFlightDutiesFromCSV(testCSVContent, 'test-user');

      const timeFormatErrors = result.errors?.filter(error =>
        error.includes('Invalid time format') ||
        error.includes('Invalid debrief time') ||
        error.includes('Invalid report time')
      ) || [];

      console.log('📊 Time Format Test Results:', {
        totalFlights: result.data?.length || 0,
        totalErrors: result.errors?.length || 0,
        timeFormatErrors: timeFormatErrors.length,
        success: timeFormatErrors.length === 0
      });

      if (timeFormatErrors.length === 0) {
        showSuccess('Time Format Test Passed!', {
          description: `Successfully parsed ${result.data?.length || 0} flights with special time characters (♦).`
        });
      } else {
        showError('Time Format Test Failed!', {
          description: `Found ${timeFormatErrors.length} time format errors. Check console for details.`
        });
        console.log('Time format errors:', timeFormatErrors);
      }

      console.log('All errors:', result.errors);
      console.log('All warnings:', result.warnings);

    } catch (error) {
      console.error('❌ Time format test failed:', error);
      showError('Time Format Test Error', { description: (error as Error).message });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Sparkles className="h-8 w-8" />
            Phase 6 UI/UX Showcase
          </h1>
          <p className="text-muted-foreground mt-1">
            Beautiful, clean design with enhanced user experience
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          Phase 6: Enhanced UI/UX
        </Badge>
      </div>

      {/* Design Improvements Alert */}
      <Alert className="border-green-200 bg-green-50">
        <Palette className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>🎯 NEW: Filtering + Bulk Operations + Toast Notifications!</strong> Filter by duty type, date range, and pay amount.
          Use &quot;Bulk Select&quot; to manage multiple flights at once. Toast notifications provide instant feedback for all actions!
        </AlertDescription>
      </Alert>

      {/* Toast Notification Testing */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Bell className="h-5 w-5" />
            🔔 Phase 6: Toast Notifications Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-2 text-blue-700">Basic Toasts</h4>
              <div className="space-y-2">
                <Button onClick={testToastNotifications} size="sm" className="w-full">
                  Test All Types
                </Button>
                <div className="grid grid-cols-2 gap-1">
                  <Button onClick={() => showSuccess('Success!')} variant="outline" size="sm">
                    Success
                  </Button>
                  <Button onClick={() => showError('Error!')} variant="outline" size="sm">
                    Error
                  </Button>
                  <Button onClick={() => showWarning('Warning!')} variant="outline" size="sm">
                    Warning
                  </Button>
                  <Button onClick={() => showInfo('Info!')} variant="outline" size="sm">
                    Info
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-blue-700">Salary Calculator</h4>
              <div className="space-y-2">
                <Button onClick={testSalaryCalculatorToasts} size="sm" className="w-full">
                  Test Calculator Toasts
                </Button>
                <div className="grid grid-cols-1 gap-1">
                  <Button onClick={() => salaryCalculator.csvUploadSuccess('test.csv', 12)} variant="outline" size="sm">
                    Upload Success
                  </Button>
                  <Button onClick={() => salaryCalculator.calculationError('Test error')} variant="outline" size="sm">
                    Calculation Error
                  </Button>
                  <Button onClick={testCSVParsingFixes} variant="outline" size="sm" className="bg-green-50 border-green-300 text-green-700">
                    Test CSV Parsing Fix
                  </Button>
                  <Button onClick={testTimeFormatFixes} variant="outline" size="sm" className="bg-blue-50 border-blue-300 text-blue-700">
                    Test Time Format Fix
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-blue-700">Interactive Testing</h4>
              <p className="text-sm text-blue-600 mb-2">
                Click Edit/Delete buttons on flights below to see toast notifications in action!
              </p>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Toast system active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 7: Real CSV Upload Testing */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Upload className="h-5 w-5" />
            🧪 Phase 7: Real CSV Upload Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-orange-300 bg-orange-100">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Ready for Real Data Testing!</strong> Upload your actual Flydubai roster CSV file to test the complete workflow with real data.
                This will test parsing, calculation, and database storage with authentic flight information.
                <br /><br />
                <strong>Note:</strong> This test page uses a temporary UUID (00000000-0000-0000-0000-000000000001) for testing purposes.
                In the real application, the authenticated user&apos;s ID is used automatically.
              </AlertDescription>
            </Alert>

            {!isUploading && !uploadResults && (
              <RosterUpload
                onFileSelect={handleFileUpload}
                disabled={isUploading}
                className="border-2 border-dashed border-orange-300 bg-white"
              />
            )}

            {isUploading && processingStatus && (
              <ProcessingStatus
                status={processingStatus}
                className="bg-white border border-orange-200"
              />
            )}

            {uploadResults && selectedFile && (
              <UploadResults
                result={uploadResults}
                fileName={selectedFile.name}
                onStartOver={() => {
                  setUploadResults(null);
                  setSelectedFile(null);
                  setProcessingStatus(null);
                }}
                className="bg-white border border-orange-200"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Flight Duties Table */}
      <FlightDutiesTable
        flightDuties={sampleFlightDuties}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        showActions={true}
      />

      {/* Enhanced Salary Breakdown */}
      <SalaryBreakdown
        calculation={sampleCalculation}
        position={position}
      />

      {/* Design Features */}
      <Card>
        <CardHeader>
          <CardTitle>🎨 Phase 6 Design Improvements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-700">🎯 NEW: Complete UI/UX Enhancement</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Advanced Filtering</strong> - Filter by duty type, date range, and pay amount</li>
                <li>• <strong>Bulk Selection Mode</strong> - Toggle bulk mode to select multiple flights</li>
                <li>• <strong>Select All Visible</strong> - Quickly select all filtered flights</li>
                <li>• <strong>Bulk Delete</strong> - Delete multiple flights at once</li>
                <li>• <strong>Toast Notifications</strong> - Instant feedback for all user actions</li>
                <li>• <strong>Smart Counters</strong> - Shows &quot;X of Y duties&quot; with active filters</li>
                <li>• <strong>Responsive Design</strong> - Works perfectly on all screen sizes</li>
                <li>• <strong>Skywage Branding</strong> - Consistent colors and styling throughout</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-red-700">❌ What We Fixed:</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Cluttered layout</strong> - Now clean and organized</li>
                <li>• <strong>Tiny buttons</strong> - Now prominent and labeled</li>
                <li>• <strong>Poor spacing</strong> - Now generous and breathable</li>
                <li>• <strong>Visual noise</strong> - Now minimal and focused</li>
                <li>• <strong>Hard to scan</strong> - Now easy to read</li>
                <li>• <strong>No sorting</strong> - Now sortable by key fields</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

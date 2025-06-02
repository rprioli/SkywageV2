'use client';

/**
 * Phase 4 Test Page for Skywage Salary Calculator
 * Manual Flight Entry Testing and Validation
 * Following existing test page patterns
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plane, 
  MapPin,
  Calculator,
  FileText,
  TestTube
} from 'lucide-react';

import { 
  ManualFlightEntry,
  FlightEntryForm,
  FlightTypeSelector,
  FlightNumberInput,
  SectorInput,
  TimeInput
} from '@/components/salary-calculator';

import {
  validateDate,
  validateFlightNumbers,
  validateSectors,
  validateTime,
  validateTimeSequence,
  validateManualEntry,
  type ManualFlightEntryData
} from '@/lib/salary-calculator/manual-entry-validation';

export default function Phase4TestPage() {
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});

  // Test data
  const testPosition = 'CCM';
  const validFlightData: ManualFlightEntryData = {
    date: '2025-01-15',
    dutyType: 'turnaround',
    flightNumbers: ['FZ123', 'FZ124'],
    sectors: ['DXB-CMB', 'CMB-DXB'],
    reportTime: '09:30',
    debriefTime: '17:45',
    isCrossDay: false
  };

  // Run validation tests
  const runValidationTests = () => {
    const results: { [key: string]: boolean } = {};

    try {
      // Test 1: Date validation
      results.dateValid = validateDate('2025-01-15').valid;
      results.dateInvalid = !validateDate('invalid-date').valid;
      results.dateFuture = !validateDate('2030-01-01').valid;

      // Test 2: Flight number validation
      results.flightNumberValid = validateFlightNumbers(['FZ123', 'FZ124'], 'turnaround').valid;
      results.flightNumberInvalid = !validateFlightNumbers(['INVALID'], 'turnaround').valid;
      results.flightNumberDuplicate = !validateFlightNumbers(['FZ123', 'FZ123'], 'turnaround').valid;

      // Test 3: Sector validation
      results.sectorValid = validateSectors(['DXB-CMB', 'CMB-DXB'], 'turnaround').valid;
      results.sectorInvalid = !validateSectors(['INVALID'], 'turnaround').valid;

      // Test 4: Time validation
      results.timeValid = validateTime('09:30', 'Report time').valid;
      results.timeInvalid = !validateTime('25:00', 'Report time').valid;

      // Test 5: Time sequence validation
      results.timeSequenceValid = validateTimeSequence('09:30', '17:45', false).valid;
      results.timeSequenceInvalid = !validateTimeSequence('17:45', '09:30', false).valid;
      results.timeSequenceCrossDay = validateTimeSequence('23:30', '05:45', true).valid;

      // Test 6: Complete form validation
      results.formValid = validateManualEntry(validFlightData, testPosition).valid;

      // Test 7: ASBY validation (no flight numbers/sectors required)
      const asbyData: ManualFlightEntryData = {
        ...validFlightData,
        dutyType: 'asby',
        flightNumbers: [],
        sectors: []
      };
      results.asbyValid = validateManualEntry(asbyData, testPosition).valid;

      // Test 8: Layover validation (single flight/sector)
      const layoverData: ManualFlightEntryData = {
        ...validFlightData,
        dutyType: 'layover',
        flightNumbers: ['FZ123'],
        sectors: ['DXB-CMB']
      };
      results.layoverValid = validateManualEntry(layoverData, testPosition).valid;

      setTestResults(results);
    } catch (error) {
      console.error('Test execution error:', error);
    }
  };

  // Mock form submission for testing
  const handleTestFormSubmit = async (data: ManualFlightEntryData) => {
    console.log('Test form submission:', data);
    alert('Test form submitted successfully!\nCheck console for data.');
  };

  const allTestsPassed = Object.values(testResults).every(result => result === true);
  const testsRun = Object.keys(testResults).length > 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary">
          Phase 4 Test Page
        </h1>
        <p className="text-muted-foreground">
          Manual Flight Entry Testing and Validation
        </p>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-primary" />
            Validation Tests
          </CardTitle>
          <CardDescription>
            Automated tests for manual entry validation functions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runValidationTests} className="w-full">
            <TestTube className="mr-2 h-4 w-4" />
            Run Validation Tests
          </Button>

          {testsRun && (
            <Alert className={cn(
              allTestsPassed ? 'border-accent bg-accent/10' : 'border-destructive bg-destructive/10'
            )}>
              <div className="flex items-center gap-2">
                {allTestsPassed ? (
                  <CheckCircle className="h-4 w-4 text-accent" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <AlertDescription className={allTestsPassed ? 'text-accent' : 'text-destructive'}>
                  {allTestsPassed 
                    ? 'All validation tests passed!' 
                    : 'Some validation tests failed. Check results below.'
                  }
                </AlertDescription>
              </div>
            </Alert>
          )}

          {testsRun && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(testResults).map(([test, passed]) => (
                <div key={test} className="flex items-center gap-2 p-2 rounded border">
                  {passed ? (
                    <CheckCircle className="h-4 w-4 text-accent" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm">{test}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Individual Component Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Individual Components
            </CardTitle>
            <CardDescription>
              Test individual form components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Flight Type Selector */}
            <div>
              <h4 className="font-medium mb-2">Flight Type Selector</h4>
              <FlightTypeSelector
                value="turnaround"
                onChange={(value) => console.log('Flight type:', value)}
                label="Test Flight Type"
              />
            </div>

            {/* Time Input */}
            <div>
              <h4 className="font-medium mb-2">Time Input</h4>
              <TimeInput
                value="09:30"
                onChange={(value) => console.log('Time:', value)}
                label="Test Time"
              />
            </div>

            {/* Flight Number Input */}
            <div>
              <h4 className="font-medium mb-2">Flight Number Input</h4>
              <FlightNumberInput
                value={['FZ123']}
                onChange={(value) => console.log('Flight numbers:', value)}
                label="Test Flight Numbers"
              />
            </div>

            {/* Sector Input */}
            <div>
              <h4 className="font-medium mb-2">Sector Input</h4>
              <SectorInput
                value={['DXB-CMB']}
                onChange={(value) => console.log('Sectors:', value)}
                label="Test Sectors"
              />
            </div>
          </CardContent>
        </Card>

        {/* Complete Form Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Complete Form Test
            </CardTitle>
            <CardDescription>
              Test the complete flight entry form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FlightEntryForm
              onSubmit={handleTestFormSubmit}
              position={testPosition}
              initialData={{
                date: '2025-01-15',
                dutyType: 'layover',
                flightNumbers: ['FZ123'],
                sectors: ['DXB-CMB'],
                reportTime: '09:30',
                debriefTime: '17:45'
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Full Component Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            Full Manual Entry Component
          </CardTitle>
          <CardDescription>
            Test the complete manual entry workflow (form submission disabled for testing)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4">
            <ManualFlightEntry 
              position={testPosition}
              onBack={() => console.log('Back clicked')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 4 Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">✅ Completed Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Manual entry validation utilities</li>
                <li>• Flight type selector component</li>
                <li>• Time input with formatting</li>
                <li>• Flight number input with suggestions</li>
                <li>• Sector input with validation</li>
                <li>• Complete flight entry form</li>
                <li>• Manual entry workflow component</li>
                <li>• Manual entry page with routing</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🎯 Key Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Real-time validation and feedback</li>
                <li>• Dynamic form based on flight type</li>
                <li>• Auto-suggestions for flight numbers/sectors</li>
                <li>• Cross-day flight support</li>
                <li>• Live calculation preview</li>
                <li>• Integration with existing components</li>
                <li>• Comprehensive error handling</li>
                <li>• Responsive design with Skywage branding</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

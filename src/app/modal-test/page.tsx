'use client';

/**
 * Modal Test Page - Test the new modal functionality
 * This page tests the Upload Roster and Add Flight modals
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function ModalTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Modal Functionality Test
        </h1>
        <p className="text-muted-foreground">
          Test the new Upload Roster and Add Flight modal functionality
        </p>
      </div>

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" />
            Test Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Upload Roster Modal Test (Fixed - No Duplicate Upload):</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Go to the main dashboard page (/dashboard)</li>
              <li>Click the "Upload Roster" button</li>
              <li>Verify that a modal opens (not a new page)</li>
              <li>Verify that ShadCN Select dropdown for month selection is shown</li>
              <li>Select a month from the dropdown (e.g., January)</li>
              <li>Verify that the file upload interface appears in the same modal</li>
              <li>Select/drop a CSV file - it should automatically start processing (no "Process File" button)</li>
              <li>Verify processing happens in modal with progress indicator</li>
              <li>Verify that modal closes automatically after successful upload</li>
              <li>Verify that dashboard shows updated flight duties and calculations</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Add Flight Modal Test:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Go to the main dashboard page (/dashboard)</li>
              <li>Click the "Add Flight" button</li>
              <li>Verify that a modal opens (not a new page)</li>
              <li>Verify that the manual flight entry form is displayed</li>
              <li>Test form functionality</li>
              <li>Verify that successful submission refreshes dashboard data</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              className="bg-[#4C49ED] hover:bg-[#4C49ED]/90"
              onClick={() => {
                window.location.href = '/dashboard';
                addTestResult('Navigated to main dashboard');
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = '/salary-calculator-phase6-test';
                addTestResult('Navigated to Phase 6 test page');
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Phase 6 Test Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expected Behavior */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Expected Behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Upload Roster Button (Streamlined):</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Should open a modal dialog (not navigate to new page)</li>
              <li>First step: Month selection with ShadCN Select dropdown</li>
              <li>Second step: File upload interface in same modal</li>
              <li>Processing shown within the modal</li>
              <li>Modal closes automatically after successful upload</li>
              <li>Results displayed on main dashboard (not in modal)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Add Flight Button:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Should open a modal dialog (not navigate to new page)</li>
              <li>Shows manual flight entry form immediately</li>
              <li>Form submission should refresh dashboard data</li>
              <li>Success should close modal and show updated flight list</li>
              <li>Modal can be closed at any time</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Test Results Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Test Results Log
            <Button variant="outline" size="sm" onClick={clearResults}>
              Clear Log
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <p className="text-muted-foreground text-sm">No test results yet...</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono bg-muted/50 p-2 rounded">
                  {result}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Implementation Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p><strong>Changes Made (Fixed Duplicate Upload Issue):</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Updated dashboard page to use modals instead of navigation</li>
              <li>Added month selection step using ShadCN Select component</li>
              <li>Improved Monthly Overview Card month selector with ShadCN Button components</li>
              <li>Streamlined upload workflow: month selection → file upload → processing (all in modal)</li>
              <li>Removed intermediate upload page and results page</li>
              <li><strong>FIXED: Removed duplicate "Process File" button - files now auto-process when selected</strong></li>
              <li>Modal closes automatically after successful upload</li>
              <li>Results displayed directly on main dashboard components</li>
              <li>Added automatic dashboard data refresh after upload</li>
              <li>Integrated existing ManualFlightEntry component</li>
              <li>Preserved all existing functionality and UI patterns</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

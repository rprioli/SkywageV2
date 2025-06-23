'use client';

/**
 * Roster Replacement Feature Test Page
 * Tests the new roster replacement functionality
 * Following existing test page patterns
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  checkExistingRosterData,
  replaceRosterData,
  validateMonthYear,
  getMonthName,
  createReplacementSummary,
  type ExistingDataCheck,
  type ReplacementResult
} from '@/lib/salary-calculator/roster-replacement';
import { useAuth } from '@/contexts/AuthProvider';

export default function RosterReplacementTestPage() {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [month, setMonth] = useState<number>(1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isChecking, setIsChecking] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [existingData, setExistingData] = useState<ExistingDataCheck | null>(null);
  const [replacementResult, setReplacementResult] = useState<ReplacementResult | null>(null);

  const handleCheckExistingData = async () => {
    if (!user?.id) {
      showError('Please log in to test roster replacement');
      return;
    }

    const validation = validateMonthYear(month, year);
    if (!validation.valid) {
      showError(validation.error || 'Invalid month/year');
      return;
    }

    setIsChecking(true);
    setExistingData(null);

    try {
      const result = await checkExistingRosterData(user.id, month, year);
      setExistingData(result);

      if (result.error) {
        showError(`Error checking data: ${result.error}`);
      } else if (result.exists) {
        showInfo(`Found ${result.flightCount} existing flights for ${getMonthName(month)} ${year}`);
      } else {
        showInfo(`No existing data found for ${getMonthName(month)} ${year}`);
      }
    } catch (error) {
      showError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleReplaceData = async () => {
    if (!user?.id || !existingData?.exists) {
      showError('No existing data to replace');
      return;
    }

    setIsReplacing(true);
    setReplacementResult(null);

    try {
      const result = await replaceRosterData(
        user.id, 
        month, 
        year, 
        `Test replacement from roster replacement test page`
      );
      
      setReplacementResult(result);

      if (result.success) {
        showSuccess(
          'Data replacement completed successfully',
          {
            description: `Deleted ${result.deletedFlights} flights, rest periods, and calculations`,
            duration: 6000
          }
        );
        // Clear existing data check since data was replaced
        setExistingData(null);
      } else {
        showError(`Replacement failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      showError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Roster Replacement Feature Test
        </h1>
        <p className="text-gray-600 mb-8">
          Test the new roster replacement functionality for the Skywage salary calculator
        </p>

        {/* Input Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Parameters</CardTitle>
            <CardDescription>
              Enter month and year to test roster replacement functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="month">Month (1-12)</Label>
                <Input
                  id="month"
                  type="number"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  min="2020"
                  max="2100"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={handleCheckExistingData}
                disabled={isChecking || !user?.id}
                variant="outline"
              >
                {isChecking ? 'Checking...' : 'Check Existing Data'}
              </Button>
              
              {existingData?.exists && (
                <Button 
                  onClick={handleReplaceData}
                  disabled={isReplacing}
                  variant="destructive"
                >
                  {isReplacing ? 'Replacing...' : 'Replace Data (TEST)'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Display */}
        {existingData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Existing Data Check Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Month/Year:</strong> {getMonthName(month)} {year}</p>
                <p><strong>Data Exists:</strong> {existingData.exists ? 'Yes' : 'No'}</p>
                <p><strong>Flight Count:</strong> {existingData.flightCount}</p>
                {existingData.error && (
                  <p className="text-red-600"><strong>Error:</strong> {existingData.error}</p>
                )}
                {existingData.exists && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800">
                      <strong>Replacement Summary:</strong><br />
                      {createReplacementSummary(month, year, existingData.flightCount)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {replacementResult && (
          <Card>
            <CardHeader>
              <CardTitle>Replacement Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Success:</strong> {replacementResult.success ? 'Yes' : 'No'}</p>
                <p><strong>Deleted Flights:</strong> {replacementResult.deletedFlights}</p>
                <p><strong>Deleted Rest Periods:</strong> {replacementResult.deletedRestPeriods > 0 ? 'Yes' : 'No'}</p>
                <p><strong>Deleted Calculation:</strong> {replacementResult.deletedCalculation ? 'Yes' : 'No'}</p>
                {replacementResult.errors.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800"><strong>Errors:</strong></p>
                    <ul className="list-disc list-inside mt-2">
                      {replacementResult.errors.map((error, index) => (
                        <li key={index} className="text-red-700">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!user?.id && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">
                Please log in to test roster replacement functionality
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

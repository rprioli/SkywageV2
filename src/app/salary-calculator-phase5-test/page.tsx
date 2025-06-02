'use client';

/**
 * Phase 5 Test Page for Skywage Salary Calculator
 * Tests edit functionality, recalculation engine, and audit trail
 * Following existing test page patterns
 */

import { useState, useEffect } from 'react';
import { FlightDuty, Position } from '@/types/salary-calculator';
import { useAuth } from '@/contexts/AuthProvider';
import { getFlightDutiesByMonth } from '@/lib/database/flights';
import { FlightDutiesManager } from '@/components/salary-calculator/FlightDutiesManager';
import { SalaryBreakdown } from '@/components/salary-calculator/SalaryBreakdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Calendar, 
  User, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function Phase5TestPage() {
  const { user } = useAuth();
  const [flightDuties, setFlightDuties] = useState<FlightDuty[]>([]);
  const [position, setPosition] = useState<Position>('CCM');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Load flight duties for selected month
  const loadFlightDuties = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getFlightDutiesByMonth(user.id, selectedMonth, selectedYear);
      
      if (result.error) {
        setError(result.error);
      } else {
        setFlightDuties(result.data || []);
        setLastRefresh(new Date());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flight duties');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when month/year changes
  useEffect(() => {
    loadFlightDuties();
  }, [user?.id, selectedMonth, selectedYear]);

  // Handle flight updated
  const handleFlightUpdated = (updatedFlight: FlightDuty) => {
    setFlightDuties(prev => 
      prev.map(flight => 
        flight.id === updatedFlight.id ? updatedFlight : flight
      )
    );
  };

  // Handle flight deleted
  const handleFlightDeleted = (deletedFlightId: string) => {
    setFlightDuties(prev => 
      prev.filter(flight => flight.id !== deletedFlightId)
    );
  };

  // Handle recalculation complete
  const handleRecalculationComplete = () => {
    // Reload data to get updated calculations
    loadFlightDuties();
  };

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleString('default', { month: 'long' })
  }));

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Authentication Required</h3>
              <p className="text-sm text-muted-foreground">
                Please sign in to test Phase 5 functionality.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Phase 5 Test Page</h1>
          <p className="text-muted-foreground mt-1">
            Edit Functionality & Real-time Recalculation Testing
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Phase 5: Edit & Recalculation
        </Badge>
      </div>

      {/* Test Status */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Phase 5 Features:</strong> Edit flight duties, real-time recalculation, 
          audit trail tracking, and cascading updates for monthly calculations.
        </AlertDescription>
      </Alert>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Test Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Position Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="CCM">CCM</option>
                <option value="SCCM">SCCM</option>
              </select>
            </div>

            {/* Month Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <Button
                onClick={loadFlightDuties}
                disabled={loading}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Last Refresh Info */}
          {lastRefresh && (
            <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Last refreshed: {lastRefresh.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Flight Duties Manager */}
      <FlightDutiesManager
        flightDuties={flightDuties}
        position={position}
        userId={user.id}
        loading={loading}
        onFlightUpdated={handleFlightUpdated}
        onFlightDeleted={handleFlightDeleted}
        onRecalculationComplete={handleRecalculationComplete}
      />

      {/* Salary Breakdown */}
      {flightDuties.length > 0 && (
        <SalaryBreakdown
          calculation={(() => {
            const basicSalary = position === 'CCM' ? 3275 : 4275;
            const housingAllowance = position === 'CCM' ? 4000 : 5000;
            const transportAllowance = 1000;
            const flightPay = flightDuties.reduce((sum, duty) => sum + duty.flightPay, 0);
            const asbyPay = flightDuties.filter(duty => duty.dutyType === 'asby').length * (position === 'CCM' ? 200 : 248);
            const perDiemPay = 0; // Will be calculated from layover rest periods

            const totalFixed = basicSalary + housingAllowance + transportAllowance;
            const totalVariable = flightPay + perDiemPay + asbyPay;
            const totalSalary = totalFixed + totalVariable;

            return {
              id: 'test',
              userId: user.id,
              month: selectedMonth,
              year: selectedYear,
              basicSalary,
              housingAllowance,
              transportAllowance,
              totalDutyHours: flightDuties.reduce((sum, duty) => sum + duty.dutyHours, 0),
              flightPay,
              totalRestHours: 0,
              perDiemPay,
              asbyCount: flightDuties.filter(duty => duty.dutyType === 'asby').length,
              asbyPay,
              totalFixed,
              totalVariable,
              totalSalary,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          })()}
          position={position}
          loading={loading}
        />
      )}

      {/* Phase 5 Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Phase 5 Testing Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">✅ Edit Functionality Testing:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Click the edit button (pencil icon) on any flight duty</li>
                <li>• Modify flight details and observe real-time validation</li>
                <li>• Save changes and verify automatic recalculation</li>
                <li>• Check that audit trail entries are created</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">✅ Delete Functionality Testing:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Click the delete button (trash icon) on any flight duty</li>
                <li>• Add a deletion reason and confirm</li>
                <li>• Verify the flight is removed and calculations updated</li>
                <li>• Check audit trail for deletion record</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">✅ Audit Trail Testing:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Click "View Activity History" to see audit trail</li>
                <li>• Expand entries to see detailed change information</li>
                <li>• Verify all edit and delete actions are tracked</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

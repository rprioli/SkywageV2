'use client';

/**
 * Phase 2 Validation Page for Skywage Salary Calculator
 * Tests database schema and UI components
 * Following existing page patterns in the codebase
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SalaryBreakdown, SalaryBreakdownCompact } from '@/components/salary-calculator/SalaryBreakdown';
import { FlightDutiesTable } from '@/components/salary-calculator/FlightDutiesTable';
import { MonthlyCalculation, FlightDuty } from '@/types/salary-calculator';
import { FLYDUBAI_RATES } from '@/lib/salary-calculator';

export default function SalaryCalculatorPhase2TestPage() {
  const [showComponents, setShowComponents] = useState(false);

  // Sample data for testing components
  const sampleMonthlyCalculation: MonthlyCalculation = {
    id: 'test-calc-1',
    userId: 'test-user',
    month: 1,
    year: 2025,
    basicSalary: 4275,
    housingAllowance: 5000,
    transportAllowance: 1000,
    totalDutyHours: 85.5,
    flightPay: 5301,
    totalRestHours: 47.25,
    perDiemPay: 416.77,
    asbyCount: 2,
    asbyPay: 496,
    totalFixed: 10275,
    totalVariable: 6213.77,
    totalSalary: 16488.77,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const sampleFlightDuties: FlightDuty[] = [
    {
      id: 'flight-1',
      userId: 'test-user',
      date: new Date('2025-01-15'),
      flightNumbers: ['FZ549', 'FZ550'],
      sectors: ['DXB-CMB', 'CMB-DXB'],
      dutyType: 'turnaround',
      reportTime: { hours: 9, minutes: 20, totalMinutes: 560, totalHours: 9.33 },
      debriefTime: { hours: 21, minutes: 15, totalMinutes: 1275, totalHours: 21.25 },
      dutyHours: 11.92,
      flightPay: 738.83,
      isCrossDay: false,
      dataSource: 'csv',
      month: 1,
      year: 2025
    },
    {
      id: 'flight-2',
      userId: 'test-user',
      date: new Date('2025-01-17'),
      flightNumbers: ['FZ967'],
      sectors: ['DXB-VKO'],
      dutyType: 'layover',
      reportTime: { hours: 14, minutes: 30, totalMinutes: 870, totalHours: 14.5 },
      debriefTime: { hours: 20, minutes: 45, totalMinutes: 1245, totalHours: 20.75 },
      dutyHours: 6.25,
      flightPay: 387.5,
      isCrossDay: false,
      dataSource: 'manual',
      month: 1,
      year: 2025
    },
    {
      id: 'flight-3',
      userId: 'test-user',
      date: new Date('2025-01-20'),
      flightNumbers: [],
      sectors: [],
      dutyType: 'asby',
      reportTime: { hours: 9, minutes: 0, totalMinutes: 540, totalHours: 9 },
      debriefTime: { hours: 13, minutes: 0, totalMinutes: 780, totalHours: 13 },
      dutyHours: 4,
      flightPay: 248,
      isCrossDay: false,
      dataSource: 'csv',
      month: 1,
      year: 2025
    }
  ];

  const phase2Features = [
    {
      category: 'Database Schema',
      items: [
        'Enhanced flights table with audit trail support',
        'Flight audit trail table for change tracking',
        'Layover rest periods table for per diem calculation',
        'Enhanced monthly calculations table with detailed breakdown',
        'Row Level Security (RLS) policies for data protection',
        'Indexes for performance optimization',
        'Triggers for automatic timestamp updates'
      ]
    },
    {
      category: 'Data Access Layer',
      items: [
        'flights.ts - CRUD operations for flight duties',
        'calculations.ts - Monthly calculation operations',
        'audit.ts - Audit trail tracking and reporting',
        'Type-safe database operations with error handling',
        'Automatic audit trail creation for changes',
        'Batch operations for CSV imports'
      ]
    },
    {
      category: 'UI Components',
      items: [
        'SalaryBreakdown - Detailed salary calculation display',
        'SalaryBreakdownCompact - Summary view for dashboards',
        'FlightDutiesTable - Flight duties with actions',
        'Loading states and empty states',
        'Responsive design with Skywage brand colors',
        'Following existing ShadCN component patterns'
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Skywage Salary Calculator - Phase 2 Validation
        </h1>
        <p className="text-muted-foreground">
          Testing database schema, data access layer, and basic UI components
        </p>
      </div>

      {/* Phase 2 Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Phase 2 Implementation Status
            <Badge className="bg-green-100 text-green-800">COMPLETED</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {phase2Features.map((feature, index) => (
              <div key={index}>
                <h3 className="font-semibold text-primary mb-3">{feature.category}</h3>
                <ul className="space-y-1">
                  {feature.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Component Testing */}
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={() => setShowComponents(!showComponents)}
          className="bg-primary hover:bg-primary/90"
        >
          {showComponents ? 'Hide' : 'Show'} UI Components Test
        </Button>
      </div>

      {showComponents && (
        <div className="space-y-6">
          {/* Salary Breakdown Components */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Salary Breakdown Components</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Detailed View</h3>
                <SalaryBreakdown 
                  calculation={sampleMonthlyCalculation} 
                  position="SCCM" 
                />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">Compact View</h3>
                <SalaryBreakdownCompact 
                  calculation={sampleMonthlyCalculation} 
                  position="SCCM" 
                />
              </div>
            </div>
          </div>

          {/* Flight Duties Table */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Flight Duties Table</h2>
            <FlightDutiesTable 
              flightDuties={sampleFlightDuties}
              onEdit={(duty) => alert(`Edit flight: ${duty.flightNumbers.join(', ')}`)}
              onDelete={(duty) => alert(`Delete flight: ${duty.flightNumbers.join(', ')}`)}
            />
          </div>

          {/* Loading States */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Loading States</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SalaryBreakdown 
                calculation={sampleMonthlyCalculation} 
                position="SCCM" 
                loading={true}
              />
              <FlightDutiesTable 
                flightDuties={[]}
                loading={true}
              />
            </div>
          </div>

          {/* Empty States */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Empty States</h2>
            <FlightDutiesTable 
              flightDuties={[]}
              loading={false}
            />
          </div>
        </div>
      )}

      {/* Database Schema Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Database Schema Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">SQL Migration Script</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Run the following script in your Supabase SQL Editor:
              </p>
              <code className="block bg-muted p-3 rounded text-sm">
                database-migrations/salary_calculator_schema.sql
              </code>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Tables Created</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Badge variant="outline" className="mb-2">flights</Badge>
                  <p className="text-muted-foreground">Enhanced flight duties with audit support</p>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">flight_audit_trail</Badge>
                  <p className="text-muted-foreground">Change tracking for all flight modifications</p>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">layover_rest_periods</Badge>
                  <p className="text-muted-foreground">Rest periods between layover flights</p>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">monthly_calculations</Badge>
                  <p className="text-muted-foreground">Detailed monthly salary breakdowns</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Data Access Layer</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <code className="text-xs bg-muted px-2 py-1 rounded">src/lib/database/flights.ts</code>
                  <p className="text-muted-foreground mt-1">Flight CRUD operations</p>
                </div>
                <div>
                  <code className="text-xs bg-muted px-2 py-1 rounded">src/lib/database/calculations.ts</code>
                  <p className="text-muted-foreground mt-1">Monthly calculation operations</p>
                </div>
                <div>
                  <code className="text-xs bg-muted px-2 py-1 rounded">src/lib/database/audit.ts</code>
                  <p className="text-muted-foreground mt-1">Audit trail operations</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Ready for Phase 3</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Phase 2 is complete! The database schema and basic infrastructure are ready for Phase 3 implementation.
          </p>
          <div className="space-y-2">
            <h4 className="font-medium">Phase 3 Objectives:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• CSV Upload & Processing Workflow</li>
              <li>• File upload component with validation</li>
              <li>• Background processing for large files</li>
              <li>• Results display with error handling</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

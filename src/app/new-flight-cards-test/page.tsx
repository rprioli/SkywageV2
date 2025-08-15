'use client';

/**
 * Test page for new flight cards with real FlightDuty data
 * This page tests the new card components with production-like data
 */

import React from 'react';
import { FlightDuty, TimeValue } from '@/types/salary-calculator';
import { NewFlightDutyCard } from '@/components/salary-calculator/NewFlightDutyCard';
import { FlightDutiesTable } from '@/components/salary-calculator/FlightDutiesTable';

// Helper function to create TimeValue
function createTimeValue(hours: number, minutes: number): TimeValue {
  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes
  };
}

// Sample FlightDuty data for testing
const sampleFlightDuties: FlightDuty[] = [
  // Turnaround flight
  {
    id: 'turnaround-1',
    userId: 'test-user',
    date: new Date('2024-08-04'),
    flightNumbers: ['FZ203', 'FZ204'],
    sectors: ['DXB-EBL', 'EBL-DXB'],
    dutyType: 'turnaround',
    reportTime: createTimeValue(8, 20),
    debriefTime: createTimeValue(16, 0),
    dutyHours: 8.083,
    flightPay: 404.17,
    isCrossDay: false,
    dataSource: 'manual',
    month: 8,
    year: 2024
  },
  
  // Layover outbound (DXB to ZAG)
  {
    id: 'layover-outbound-1',
    userId: 'test-user',
    date: new Date('2024-08-04'),
    flightNumbers: ['FZ1793'],
    sectors: ['DXB → ZAG'],
    dutyType: 'layover',
    reportTime: createTimeValue(8, 20),
    debriefTime: createTimeValue(16, 0),
    dutyHours: 7.667,
    flightPay: 383.33,
    isCrossDay: false,
    dataSource: 'csv',
    month: 8,
    year: 2024
  },

  // Layover inbound (ZAG to DXB) - paired with outbound
  {
    id: 'layover-inbound-1',
    userId: 'test-user',
    date: new Date('2024-08-05'),
    flightNumbers: ['FZ1794'],
    sectors: ['ZAG → DXB'],
    dutyType: 'layover',
    reportTime: createTimeValue(15, 30),
    debriefTime: createTimeValue(22, 45),
    dutyHours: 7.25,
    flightPay: 362.50,
    isCrossDay: false,
    dataSource: 'csv',
    month: 8,
    year: 2024
  },
  
  // Airport Standby
  {
    id: 'asby-1',
    userId: 'test-user',
    date: new Date('2024-08-06'),
    flightNumbers: [],
    sectors: [],
    dutyType: 'asby',
    reportTime: createTimeValue(9, 0),
    debriefTime: createTimeValue(13, 0),
    dutyHours: 4,
    flightPay: 200.00,
    isCrossDay: false,
    dataSource: 'manual',
    month: 8,
    year: 2024
  },
  
  // Recurrent Training
  {
    id: 'recurrent-1',
    userId: 'test-user',
    date: new Date('2024-08-07'),
    flightNumbers: [],
    sectors: [],
    dutyType: 'recurrent',
    reportTime: createTimeValue(8, 0),
    debriefTime: createTimeValue(17, 0),
    dutyHours: 9,
    flightPay: 450.00,
    isCrossDay: false,
    dataSource: 'manual',
    month: 8,
    year: 2024
  },
  
  // Home Standby
  {
    id: 'sby-1',
    userId: 'test-user',
    date: new Date('2024-08-08'),
    flightNumbers: [],
    sectors: [],
    dutyType: 'sby',
    reportTime: createTimeValue(6, 0),
    debriefTime: createTimeValue(18, 0),
    dutyHours: 12,
    flightPay: 0, // Home standby typically has no pay
    isCrossDay: false,
    dataSource: 'csv',
    month: 8,
    year: 2024
  },
  
  // Ground/Off Day
  {
    id: 'off-1',
    userId: 'test-user',
    date: new Date('2024-08-09'),
    flightNumbers: [],
    sectors: [],
    dutyType: 'off',
    reportTime: createTimeValue(0, 0),
    debriefTime: createTimeValue(0, 0),
    dutyHours: 0,
    flightPay: 0,
    isCrossDay: false,
    dataSource: 'csv',
    month: 8,
    year: 2024
  }
];

export default function NewFlightCardsTestPage() {
  const handleEdit = (flightDuty: FlightDuty) => {
    console.log('Edit flight duty:', flightDuty);
    alert(`Edit flight: ${flightDuty.flightNumbers.join(' ')} on ${flightDuty.date.toDateString()}`);
  };

  const handleDelete = (flightDuty: FlightDuty) => {
    console.log('Delete flight duty:', flightDuty);
    alert(`Delete flight: ${flightDuty.flightNumbers.join(' ')} on ${flightDuty.date.toDateString()}`);
  };

  const handleToggleSelection = (flightId: string) => {
    console.log('Toggle selection for flight:', flightId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            New Flight Cards Test Page
          </h1>
          <p className="text-lg text-gray-600">
            Testing new flight card components with real FlightDuty data
          </p>
        </div>

        {/* Individual Cards Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Individual Card Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8">
            {sampleFlightDuties.map((flightDuty, index) => (
              <div key={flightDuty.id} className="flex flex-col">
                <div className="mb-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    {flightDuty.dutyType.toUpperCase()} - {flightDuty.date.toDateString()}
                  </h3>
                </div>

                <NewFlightDutyCard
                  flightDuty={flightDuty}
                  allFlightDuties={sampleFlightDuties}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  showActions={true}
                  bulkMode={false}
                  isSelected={false}
                  onToggleSelection={handleToggleSelection}
                />
              </div>
            ))}
          </div>
        </div>

        {/* FlightDutiesTable Integration Test */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">FlightDutiesTable Integration</h2>
          <FlightDutiesTable
            flightDuties={sampleFlightDuties}
            loading={false}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={true}
            useNewCardDesign={true}
          />
        </div>

        {/* Test Information */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Card Types Tested:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Turnaround Flight (FZ203 FZ204)</li>
                <li>Layover Outbound (FZ1793 to ZAG)</li>
                <li>Layover Inbound (FZ1794 from ZAG)</li>
                <li>Airport Standby (ASBY)</li>
                <li>Recurrent Training</li>
                <li>Home Standby (SBY)</li>
                <li>Ground/Off Day</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Features Tested:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Uniform 120px card heights</li>
                <li>Top line layout (flight number, payment, duty badge)</li>
                <li>Layover connected cards with navigation</li>
                <li>Edit/Delete functionality</li>
                <li>Different duty type handling</li>
                <li>Data mapping from FlightDuty interface</li>
                <li>Responsive design</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

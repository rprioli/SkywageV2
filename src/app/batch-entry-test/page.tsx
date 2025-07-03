'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ManualFlightEntry } from '@/components/salary-calculator/ManualFlightEntry';
import { Position } from '@/types/salary-calculator';

export default function BatchEntryTestPage() {
  const [showModal, setShowModal] = useState(false);
  const [position] = useState<Position>('CCM');

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Batch Entry Test Page</h1>
        <p className="text-muted-foreground">
          Test the fixed batch duty entry workflow
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Entry Workflow Fix</CardTitle>
          <CardDescription>
            This test validates that users can save their batched duties even if they change their mind after clicking "Add Another Duty"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Test Scenario:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Fill out a complete flight duty form</li>
              <li>Click "Add Another Duty" button</li>
              <li>Notice the form clears and batch counter shows "1 flight duty added to batch"</li>
              <li>Start filling the new form but change your mind</li>
              <li>Click "Save 1 Flight Duty Only" button (new button)</li>
              <li>Verify only the first duty is saved, incomplete form is ignored</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Expected Behavior:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>✅ "Save X Flight Duties Only" button appears when batch count > 0</li>
              <li>✅ Button saves only completed duties in batch</li>
              <li>✅ Incomplete current form is ignored</li>
              <li>✅ No validation errors for incomplete form</li>
              <li>✅ User can exit batch mode with their valid duties</li>
            </ul>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium"
          >
            Open Manual Flight Entry
          </button>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ManualFlightEntry
              position={position}
              onBack={() => setShowModal(false)}
              onSuccess={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

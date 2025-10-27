'use client';

/**
 * Debug Page for Date-Aware Salary Rate System
 * Step-by-step debugging of rate selection and calculation functions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  getRatesForDate,
  getPositionRatesForDate,
  FLYDUBAI_RATES_LEGACY,
  FLYDUBAI_RATES_NEW,
  calculateMonthlySalary
} from '@/lib/salary-calculator';

export default function DebugRatesPage() {
  const [debugResults, setDebugResults] = useState<{ step: string; result: unknown; timestamp: string }[]>([]);

  const addDebugResult = (step: string, result: unknown) => {
    setDebugResults(prev => [...prev, { step, result, timestamp: new Date().toISOString() }]);
  };

  const runDebug = () => {
    setDebugResults([]);
    
    try {
      // Step 1: Test rate structures directly
      console.log('Step 1: Testing rate structures...');
      addDebugResult('FLYDUBAI_RATES_LEGACY.CCM', FLYDUBAI_RATES_LEGACY.CCM);
      addDebugResult('FLYDUBAI_RATES_NEW.CCM', FLYDUBAI_RATES_NEW.CCM);
      
      // Step 2: Test getRatesForDate function
      console.log('Step 2: Testing getRatesForDate...');
      const june2025Rates = getRatesForDate(2025, 6);
      const july2025Rates = getRatesForDate(2025, 7);
      
      addDebugResult('getRatesForDate(2025, 6)', june2025Rates);
      addDebugResult('getRatesForDate(2025, 7)', july2025Rates);
      
      // Step 3: Test getPositionRatesForDate function
      console.log('Step 3: Testing getPositionRatesForDate...');
      const ccmJune = getPositionRatesForDate('CCM', 2025, 6);
      const ccmJuly = getPositionRatesForDate('CCM', 2025, 7);
      
      addDebugResult('getPositionRatesForDate(CCM, 2025, 6)', ccmJune);
      addDebugResult('getPositionRatesForDate(CCM, 2025, 7)', ccmJuly);
      
      // Step 4: Test individual property access
      console.log('Step 4: Testing property access...');
      addDebugResult('ccmJune.basicSalary', ccmJune?.basicSalary);
      addDebugResult('ccmJune.housingAllowance', ccmJune?.housingAllowance);
      addDebugResult('ccmJuly.basicSalary', ccmJuly?.basicSalary);
      addDebugResult('ccmJuly.housingAllowance', ccmJuly?.housingAllowance);
      
      // Step 5: Test calculateMonthlySalary with detailed logging
      console.log('Step 5: Testing calculateMonthlySalary...');
      
      // Test June 2025
      const juneResult = calculateMonthlySalary([], [], 'CCM', 6, 2025, 'debug-user');
      addDebugResult('calculateMonthlySalary June 2025 - Full Result', juneResult);
      addDebugResult('calculateMonthlySalary June 2025 - Monthly Calculation', juneResult?.monthlyCalculation);
      addDebugResult('calculateMonthlySalary June 2025 - Basic Salary', juneResult?.monthlyCalculation?.basicSalary);
      addDebugResult('calculateMonthlySalary June 2025 - Housing Allowance', juneResult?.monthlyCalculation?.housingAllowance);

      // Test July 2025
      const julyResult = calculateMonthlySalary([], [], 'CCM', 7, 2025, 'debug-user');
      addDebugResult('calculateMonthlySalary July 2025 - Full Result', julyResult);
      addDebugResult('calculateMonthlySalary July 2025 - Monthly Calculation', julyResult?.monthlyCalculation);
      addDebugResult('calculateMonthlySalary July 2025 - Basic Salary', julyResult?.monthlyCalculation?.basicSalary);
      addDebugResult('calculateMonthlySalary July 2025 - Housing Allowance', julyResult?.monthlyCalculation?.housingAllowance);
      
      // Step 6: Test date comparison logic
      console.log('Step 6: Testing date comparison...');
      const effectiveDate = new Date(2025, 6, 1); // July 1, 2025
      const juneDate = new Date(2025, 5, 1); // June 1, 2025 (month is 0-indexed)
      const julyDate = new Date(2025, 6, 1); // July 1, 2025
      
      addDebugResult('Effective Date', effectiveDate.toISOString());
      addDebugResult('June Date', juneDate.toISOString());
      addDebugResult('July Date', julyDate.toISOString());
      addDebugResult('June >= Effective?', juneDate >= effectiveDate);
      addDebugResult('July >= Effective?', julyDate >= effectiveDate);
      
    } catch (error) {
      addDebugResult('ERROR', {
        message: (error as Error).message,
        stack: (error as Error).stack
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Debug: Date-Aware Salary Rate System</CardTitle>
          <p className="text-sm text-gray-600">
            Step-by-step debugging of rate selection and calculation functions
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={runDebug} className="w-full">
              Run Debug Tests
            </Button>
            
            {debugResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Debug Results</h3>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {debugResults.map((result, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded border bg-gray-50"
                    >
                      <div className="font-medium text-sm text-blue-600 mb-1">
                        {result.step}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {result.timestamp}
                      </div>
                      <div className="text-sm bg-white p-2 rounded border font-mono">
                        <pre>{JSON.stringify(result.result, null, 2)}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

/**
 * Date-Aware Salary Rate System Test Page
 * Tests the new rate system to ensure historical data preservation
 * and correct application of new rates from July 2025 onwards
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  getRatesForDate,
  getPositionRatesForDate,
  FLYDUBAI_RATES_LEGACY,
  FLYDUBAI_RATES_NEW,
  calculateFlightPay,
  calculatePerDiemPay,
  calculateAsbyPay,
  calculateRecurrentPay,
  calculateMonthlySalary
} from '@/lib/salary-calculator';

interface TestResult {
  test: string;
  result: string;
  passed: boolean;
}

export default function DateAwareRatesTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const addResult = (test: string, result: string, passed: boolean) => {
    setTestResults(prev => [...prev, { test, result, passed }]);
  };

  const runTests = () => {
    setTestResults([]);
    
    // Test 1: Rate Selection Logic
    console.log('Testing rate selection logic...');
    
    // Historical rates (June 2025 and earlier)
    const june2025Rates = getRatesForDate(2025, 6);
    const may2025Rates = getRatesForDate(2025, 5);
    addResult('June 2025 uses legacy rates', 
      `CCM Basic: ${june2025Rates.CCM.basicSalary}, Housing: ${june2025Rates.CCM.housingAllowance}`,
      june2025Rates.CCM.basicSalary === 3275 && june2025Rates.CCM.housingAllowance === 4000);
    
    addResult('May 2025 uses legacy rates', 
      `SCCM Basic: ${may2025Rates.SCCM.basicSalary}, Housing: ${may2025Rates.SCCM.housingAllowance}`,
      may2025Rates.SCCM.basicSalary === 4275 && may2025Rates.SCCM.housingAllowance === 5000);
    
    // New rates (July 2025 and later)
    const july2025Rates = getRatesForDate(2025, 7);
    const aug2025Rates = getRatesForDate(2025, 8);
    addResult('July 2025 uses new rates', 
      `CCM Basic: ${july2025Rates.CCM.basicSalary}, Housing: ${july2025Rates.CCM.housingAllowance}`,
      july2025Rates.CCM.basicSalary === 3405 && july2025Rates.CCM.housingAllowance === 4500);
    
    addResult('August 2025 uses new rates', 
      `SCCM Basic: ${aug2025Rates.SCCM.basicSalary}, Housing: ${aug2025Rates.SCCM.housingAllowance}`,
      aug2025Rates.SCCM.basicSalary === 4446 && aug2025Rates.SCCM.housingAllowance === 5500);

    // Test 2: Rate Values Verification
    console.log('Testing rate values...');
    
    addResult('Legacy CCM rates correct', 
      `Basic: ${FLYDUBAI_RATES_LEGACY.CCM.basicSalary}, Housing: ${FLYDUBAI_RATES_LEGACY.CCM.housingAllowance}`,
      FLYDUBAI_RATES_LEGACY.CCM.basicSalary === 3275 && FLYDUBAI_RATES_LEGACY.CCM.housingAllowance === 4000);
    
    addResult('New CCM rates correct', 
      `Basic: ${FLYDUBAI_RATES_NEW.CCM.basicSalary}, Housing: ${FLYDUBAI_RATES_NEW.CCM.housingAllowance}`,
      FLYDUBAI_RATES_NEW.CCM.basicSalary === 3405 && FLYDUBAI_RATES_NEW.CCM.housingAllowance === 4500);
    
    addResult('Legacy SCCM rates correct', 
      `Basic: ${FLYDUBAI_RATES_LEGACY.SCCM.basicSalary}, Housing: ${FLYDUBAI_RATES_LEGACY.SCCM.housingAllowance}`,
      FLYDUBAI_RATES_LEGACY.SCCM.basicSalary === 4275 && FLYDUBAI_RATES_LEGACY.SCCM.housingAllowance === 5000);
    
    addResult('New SCCM rates correct', 
      `Basic: ${FLYDUBAI_RATES_NEW.SCCM.basicSalary}, Housing: ${FLYDUBAI_RATES_NEW.SCCM.housingAllowance}`,
      FLYDUBAI_RATES_NEW.SCCM.basicSalary === 4446 && FLYDUBAI_RATES_NEW.SCCM.housingAllowance === 5500);

    // Test 3: Date-Aware Calculation Functions
    console.log('Testing date-aware calculations...');
    
    const dutyHours = 8;
    const restHours = 24;
    
    // Flight pay (hourly rates unchanged for now)
    const ccmFlightPayJune = calculateFlightPay(dutyHours, 'CCM', 2025, 6);
    const ccmFlightPayJuly = calculateFlightPay(dutyHours, 'CCM', 2025, 7);
    addResult('Flight pay calculation consistent', 
      `June: ${ccmFlightPayJune} AED, July: ${ccmFlightPayJuly} AED`,
      ccmFlightPayJune === ccmFlightPayJuly && ccmFlightPayJune === 400);
    
    // Per diem pay (rates unchanged)
    const ccmPerDiemJune = calculatePerDiemPay(restHours, 'CCM', 2025, 6);
    const ccmPerDiemJuly = calculatePerDiemPay(restHours, 'CCM', 2025, 7);
    addResult('Per diem calculation consistent', 
      `June: ${ccmPerDiemJune} AED, July: ${ccmPerDiemJuly} AED`,
      ccmPerDiemJune === ccmPerDiemJuly && ccmPerDiemJune === 211.68);
    
    // ASBY pay
    const ccmAsbyJune = calculateAsbyPay('CCM', 2025, 6);
    const ccmAsbyJuly = calculateAsbyPay('CCM', 2025, 7);
    addResult('ASBY pay calculation consistent', 
      `June: ${ccmAsbyJune} AED, July: ${ccmAsbyJuly} AED`,
      ccmAsbyJune === ccmAsbyJuly && ccmAsbyJune === 200);
    
    // Recurrent pay
    const sccmRecurrentJune = calculateRecurrentPay('SCCM', 2025, 6);
    const sccmRecurrentJuly = calculateRecurrentPay('SCCM', 2025, 7);
    addResult('Recurrent pay calculation consistent', 
      `June: ${sccmRecurrentJune} AED, July: ${sccmRecurrentJuly} AED`,
      sccmRecurrentJune === sccmRecurrentJuly && sccmRecurrentJune === 248);

    // Test 4: Backward Compatibility
    console.log('Testing backward compatibility...');
    
    const ccmFlightPayNoDate = calculateFlightPay(dutyHours, 'CCM');
    const ccmPerDiemNoDate = calculatePerDiemPay(restHours, 'CCM');
    addResult('Backward compatibility works', 
      `Flight: ${ccmFlightPayNoDate} AED, Per Diem: ${ccmPerDiemNoDate} AED`,
      ccmFlightPayNoDate === 400 && ccmPerDiemNoDate === 211.68);

    // Test 5: Monthly Salary Calculation
    console.log('Testing monthly salary calculation...');
    
    try {
      // Test with empty arrays to check fixed salary components
      const monthlySalaryJune = calculateMonthlySalary([], [], 'CCM', 6, 2025, 'test-user');
      const monthlySalaryJuly = calculateMonthlySalary([], [], 'CCM', 7, 2025, 'test-user');

      // Access the nested monthlyCalculation properties
      const juneCalc = monthlySalaryJune.monthlyCalculation;
      const julyCalc = monthlySalaryJuly.monthlyCalculation;

      const fixedSalaryJune = juneCalc.basicSalary + juneCalc.housingAllowance + juneCalc.transportAllowance;
      const fixedSalaryJuly = julyCalc.basicSalary + julyCalc.housingAllowance + julyCalc.transportAllowance;

      addResult('Monthly salary uses correct rates',
        `June Fixed: ${fixedSalaryJune} AED, July Fixed: ${fixedSalaryJuly} AED`,
        fixedSalaryJune === 8275 && fixedSalaryJuly === 8905); // June: 3275+4000+1000, July: 3405+4500+1000

      addResult('Basic salary change applied',
        `June: ${juneCalc.basicSalary}, July: ${julyCalc.basicSalary}`,
        juneCalc.basicSalary === 3275 && julyCalc.basicSalary === 3405);

      addResult('Housing allowance change applied',
        `June: ${juneCalc.housingAllowance}, July: ${julyCalc.housingAllowance}`,
        juneCalc.housingAllowance === 4000 && julyCalc.housingAllowance === 4500);
        
    } catch (error) {
      addResult('Monthly salary calculation error', 
        `Error: ${(error as Error).message}`,
        false);
    }

    console.log('All tests completed!');
  };

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Date-Aware Salary Rate System Test</CardTitle>
          <p className="text-sm text-gray-600">
            Testing the new rate system that applies different rates based on calculation dates.
            New rates are effective from July 2025 onwards.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={runTests} className="w-full">
              Run All Tests
            </Button>
            
            {testResults.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Test Results</h3>
                  <span className={`text-sm font-medium ${passedTests === totalTests ? 'text-green-600' : 'text-red-600'}`}>
                    {passedTests}/{totalTests} Passed
                  </span>
                </div>
                
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded border ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.test}</span>
                        <span className={`text-sm ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {result.passed ? '✓ PASS' : '✗ FAIL'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {result.result}
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

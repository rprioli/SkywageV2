'use client';

/**
 * Phase 1 Validation Page for Skywage Salary Calculator
 * Tests core calculation engine functionality
 * Following existing page patterns in the codebase
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  calculateFlightPay, 
  calculatePerDiemPay, 
  calculateAsbyPay,
  parseTimeString,
  calculateDuration,
  classifyFlightDuty,
  extractFlightNumbers,
  extractSectors,
  FLYDUBAI_RATES
} from '@/lib/salary-calculator';

export default function SalaryCalculatorTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (test: string, result: string, passed: boolean) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    setTestResults(prev => [...prev, `${status}: ${test} - ${result}`]);
  };

  const runTests = () => {
    setTestResults([]);
    
    // Test 1: Flight Pay Calculations
    const ccmPay = calculateFlightPay(8.5, 'CCM');
    addResult('CCM Flight Pay (8.5 hours)', `${ccmPay} AED (expected: 425)`, ccmPay === 425);
    
    const sccmPay = calculateFlightPay(10.25, 'SCCM');
    addResult('SCCM Flight Pay (10.25 hours)', `${sccmPay} AED (expected: 635.5)`, sccmPay === 635.5);

    // Test 2: Per Diem Calculations
    const perDiem = calculatePerDiemPay(23.5, 'CCM');
    addResult('Per Diem Pay (23.5 hours)', `${perDiem} AED (expected: 207.27)`, perDiem === 207.27);

    // Test 3: ASBY Pay
    const ccmAsby = calculateAsbyPay('CCM');
    const sccmAsby = calculateAsbyPay('SCCM');
    addResult('CCM ASBY Pay', `${ccmAsby} AED (expected: 200)`, ccmAsby === 200);
    addResult('SCCM ASBY Pay', `${sccmAsby} AED (expected: 248)`, sccmAsby === 248);

    // Test 4: Time Parsing
    const timeResult = parseTimeString('09:20');
    addResult('Time Parsing (09:20)', `Hours: ${timeResult.timeValue?.hours}, Minutes: ${timeResult.timeValue?.minutes}`, 
      timeResult.success && timeResult.timeValue?.hours === 9 && timeResult.timeValue?.minutes === 20);

    const crossDayResult = parseTimeString('05:45¹');
    addResult('Cross-day Time Parsing (05:45¹)', `Cross-day: ${crossDayResult.isCrossDay}`, 
      crossDayResult.success && crossDayResult.isCrossDay);

    // Test 5: Duration Calculation
    if (timeResult.timeValue) {
      const endTimeResult = parseTimeString('17:45');
      if (endTimeResult.timeValue) {
        const duration = calculateDuration(timeResult.timeValue, endTimeResult.timeValue, false);
        addResult('Duration Calculation (09:20 to 17:45)', `${duration.toFixed(2)} hours (expected: ~8.42)`, 
          Math.abs(duration - 8.416666666666666) < 0.01);
      }
    }

    // Test 6: Flight Classification
    const asbyClassification = classifyFlightDuty('ASBY', '', '09:00', '13:00');
    addResult('ASBY Classification', `Type: ${asbyClassification.dutyType}`, asbyClassification.dutyType === 'asby');

    const turnaroundClassification = classifyFlightDuty('FZ549 FZ550', 'DXB - CMB CMB - DXB');
    addResult('Turnaround Classification', `Type: ${turnaroundClassification.dutyType}`, turnaroundClassification.dutyType === 'turnaround');

    const layoverClassification = classifyFlightDuty('FZ967', 'DXB - VKO');
    addResult('Layover Classification', `Type: ${layoverClassification.dutyType}`, layoverClassification.dutyType === 'layover');

    // Test 7: Flight Number Extraction
    const flightNumbers = extractFlightNumbers('FZ549 FZ550');
    addResult('Flight Number Extraction', `Found: ${flightNumbers.join(', ')}`, 
      flightNumbers.length === 2 && flightNumbers.includes('FZ549') && flightNumbers.includes('FZ550'));

    // Test 8: Sector Extraction
    const sectors = extractSectors('DXB - CMB CMB - DXB');
    addResult('Sector Extraction', `Found: ${sectors.join(', ')}`, 
      sectors.length === 2 && sectors.includes('DXB-CMB') && sectors.includes('CMB-DXB'));

    // Test 9: Salary Rates Configuration
    const ccmRates = FLYDUBAI_RATES.CCM;
    addResult('CCM Rates Configuration', 
      `Basic: ${ccmRates.basicSalary}, Housing: ${ccmRates.housingAllowance}, Hourly: ${ccmRates.hourlyRate}`,
      ccmRates.basicSalary === 3275 && ccmRates.housingAllowance === 4000 && ccmRates.hourlyRate === 50);

    const sccmRates = FLYDUBAI_RATES.SCCM;
    addResult('SCCM Rates Configuration', 
      `Basic: ${sccmRates.basicSalary}, Housing: ${sccmRates.housingAllowance}, Hourly: ${sccmRates.hourlyRate}`,
      sccmRates.basicSalary === 4275 && sccmRates.housingAllowance === 5000 && sccmRates.hourlyRate === 62);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Skywage Salary Calculator - Phase 1 Validation
        </h1>
        <p className="text-muted-foreground">
          Testing core calculation engine functionality
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <Button onClick={runTests} className="bg-primary hover:bg-primary/90">
          Run All Tests
        </Button>
        <Button onClick={clearResults} variant="outline">
          Clear Results
        </Button>
      </div>

      {testResults.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded font-mono text-sm ${
                  result.startsWith('✅') 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {result}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded">
            <h3 className="font-semibold mb-2">Summary</h3>
            <p>
              Total Tests: {testResults.length} | 
              Passed: {testResults.filter(r => r.startsWith('✅')).length} | 
              Failed: {testResults.filter(r => r.startsWith('❌')).length}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Phase 1 Implementation Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-primary">✅ Completed</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Core calculation engine</li>
              <li>• Time parsing and calculations</li>
              <li>• Flight classification logic</li>
              <li>• CSV validation utilities</li>
              <li>• CSV parsing foundation</li>
              <li>• Flydubai-specific configuration</li>
              <li>• Type definitions</li>
              <li>• Basic unit tests</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-orange-600">🚧 Next Phase</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Database schema implementation</li>
              <li>• Data access layer</li>
              <li>• Basic UI components</li>
              <li>• File upload workflow</li>
              <li>• Results display components</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> This is a validation page for Phase 1 of the Skywage Salary Calculator implementation. 
          All core calculation logic has been implemented and is ready for Phase 2 (Database Schema & Basic Infrastructure).
        </p>
      </div>
    </div>
  );
}

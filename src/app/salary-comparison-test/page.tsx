'use client';

/**
 * Salary Comparison Test Page
 * Compares salary calculations between June 2025 (legacy rates) and July 2025 (new rates)
 * Shows the exact impact of the rate changes on monthly salary calculations
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  calculateMonthlySalary,
  getRatesForDate,
  FLYDUBAI_RATES_LEGACY,
  FLYDUBAI_RATES_NEW
} from '@/lib/salary-calculator';

interface SalaryComparison {
  position: 'CCM' | 'SCCM';
  june2025: any;
  july2025: any;
  differences: {
    basicSalary: number;
    housingAllowance: number;
    totalFixed: number;
  };
}

export default function SalaryComparisonTestPage() {
  const [comparisons, setComparisons] = useState<SalaryComparison[]>([]);
  const [loading, setLoading] = useState(false);

  const runComparison = async () => {
    setLoading(true);
    setComparisons([]);

    try {
      const positions: ('CCM' | 'SCCM')[] = ['CCM', 'SCCM'];
      const results: SalaryComparison[] = [];

      for (const position of positions) {
        // Calculate salary for June 2025 (legacy rates)
        const june2025 = calculateMonthlySalary([], [], position, 6, 2025, 'test-user');
        
        // Calculate salary for July 2025 (new rates)
        const july2025 = calculateMonthlySalary([], [], position, 7, 2025, 'test-user');

        // Calculate differences (access nested monthlyCalculation properties)
        const juneCalc = june2025.monthlyCalculation;
        const julyCalc = july2025.monthlyCalculation;

        const differences = {
          basicSalary: julyCalc.basicSalary - juneCalc.basicSalary,
          housingAllowance: julyCalc.housingAllowance - juneCalc.housingAllowance,
          totalFixed: (julyCalc.basicSalary + julyCalc.housingAllowance + julyCalc.transportAllowance) -
                     (juneCalc.basicSalary + juneCalc.housingAllowance + juneCalc.transportAllowance)
        };

        results.push({
          position,
          june2025,
          july2025,
          differences
        });
      }

      setComparisons(results);
    } catch (error) {
      console.error('Error running comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} AED`;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Salary Rate Change Impact Analysis</CardTitle>
          <p className="text-sm text-gray-600">
            Comparing salary calculations between June 2025 (legacy rates) and July 2025 (new rates).
            This shows the exact financial impact of the rate changes effective from July 2025.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Button onClick={runComparison} disabled={loading} className="w-full">
              {loading ? 'Calculating...' : 'Run Salary Comparison'}
            </Button>

            {/* Rate Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Legacy Rates (June 2025 & Earlier)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><strong>CCM:</strong></div>
                    <div>• Basic Salary: {formatCurrency(FLYDUBAI_RATES_LEGACY.CCM.basicSalary)}</div>
                    <div>• Housing Allowance: {formatCurrency(FLYDUBAI_RATES_LEGACY.CCM.housingAllowance)}</div>
                    <div><strong>SCCM:</strong></div>
                    <div>• Basic Salary: {formatCurrency(FLYDUBAI_RATES_LEGACY.SCCM.basicSalary)}</div>
                    <div>• Housing Allowance: {formatCurrency(FLYDUBAI_RATES_LEGACY.SCCM.housingAllowance)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">New Rates (July 2025 & Later)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><strong>CCM:</strong></div>
                    <div>• Basic Salary: {formatCurrency(FLYDUBAI_RATES_NEW.CCM.basicSalary)}</div>
                    <div>• Housing Allowance: {formatCurrency(FLYDUBAI_RATES_NEW.CCM.housingAllowance)}</div>
                    <div><strong>SCCM:</strong></div>
                    <div>• Basic Salary: {formatCurrency(FLYDUBAI_RATES_NEW.SCCM.basicSalary)}</div>
                    <div>• Housing Allowance: {formatCurrency(FLYDUBAI_RATES_NEW.SCCM.housingAllowance)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Results */}
            {comparisons.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Salary Comparison Results</h3>
                
                {comparisons.map((comparison) => (
                  <Card key={comparison.position}>
                    <CardHeader>
                      <CardTitle className="text-lg">{comparison.position} Position</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* June 2025 */}
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">June 2025 (Legacy)</h4>
                          <div className="space-y-1 text-sm">
                            <div>Basic Salary: {formatCurrency(comparison.june2025.monthlyCalculation.basicSalary)}</div>
                            <div>Housing Allowance: {formatCurrency(comparison.june2025.monthlyCalculation.housingAllowance)}</div>
                            <div>Transport Allowance: {formatCurrency(comparison.june2025.monthlyCalculation.transportAllowance)}</div>
                            <div className="border-t pt-1 font-semibold">
                              Total Fixed: {formatCurrency(comparison.june2025.monthlyCalculation.basicSalary + comparison.june2025.monthlyCalculation.housingAllowance + comparison.june2025.monthlyCalculation.transportAllowance)}
                            </div>
                          </div>
                        </div>

                        {/* July 2025 */}
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">July 2025 (New)</h4>
                          <div className="space-y-1 text-sm">
                            <div>Basic Salary: {formatCurrency(comparison.july2025.monthlyCalculation.basicSalary)}</div>
                            <div>Housing Allowance: {formatCurrency(comparison.july2025.monthlyCalculation.housingAllowance)}</div>
                            <div>Transport Allowance: {formatCurrency(comparison.july2025.monthlyCalculation.transportAllowance)}</div>
                            <div className="border-t pt-1 font-semibold">
                              Total Fixed: {formatCurrency(comparison.july2025.monthlyCalculation.basicSalary + comparison.july2025.monthlyCalculation.housingAllowance + comparison.july2025.monthlyCalculation.transportAllowance)}
                            </div>
                          </div>
                        </div>

                        {/* Differences */}
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2">Monthly Increase</h4>
                          <div className="space-y-1 text-sm">
                            <div className={comparison.differences.basicSalary > 0 ? 'text-green-600' : 'text-gray-500'}>
                              Basic Salary: +{formatCurrency(comparison.differences.basicSalary)}
                            </div>
                            <div className={comparison.differences.housingAllowance > 0 ? 'text-green-600' : 'text-gray-500'}>
                              Housing Allowance: +{formatCurrency(comparison.differences.housingAllowance)}
                            </div>
                            <div className="text-gray-500">Transport Allowance: +{formatCurrency(0)}</div>
                            <div className="border-t pt-1 font-semibold text-green-600">
                              Total Increase: +{formatCurrency(comparison.differences.totalFixed)}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Annual Increase: +{formatCurrency(comparison.differences.totalFixed * 12)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Rate Change Summary */}
            {comparisons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rate Change Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">CCM Changes:</h4>
                      <ul className="space-y-1">
                        <li>• Basic Salary: 3,275 → 3,405 AED (+130 AED/month)</li>
                        <li>• Housing Allowance: 4,000 → 4,500 AED (+500 AED/month)</li>
                        <li>• <strong>Total Monthly Increase: +630 AED</strong></li>
                        <li>• <strong>Total Annual Increase: +7,560 AED</strong></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">SCCM Changes:</h4>
                      <ul className="space-y-1">
                        <li>• Basic Salary: 4,275 → 4,446 AED (+171 AED/month)</li>
                        <li>• Housing Allowance: 5,000 → 5,500 AED (+500 AED/month)</li>
                        <li>• <strong>Total Monthly Increase: +671 AED</strong></li>
                        <li>• <strong>Total Annual Increase: +8,052 AED</strong></li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Variable rates (hourly, per diem) remain unchanged for now. 
                      Transport allowance remains at 1,000 AED for both positions.
                      These changes are effective from July 2025 onwards and do not affect historical calculations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

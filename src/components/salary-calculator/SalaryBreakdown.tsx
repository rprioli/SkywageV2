'use client';

/**
 * Salary Breakdown Component for Skywage Salary Calculator
 * Displays monthly salary calculation breakdown
 * Following existing component patterns in the codebase
 */

import { MonthlyCalculation } from '@/types/salary-calculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SalaryBreakdownProps {
  calculation: MonthlyCalculation;
  position: 'CCM' | 'SCCM';
  loading?: boolean;
}

export function SalaryBreakdown({ calculation, position, loading = false }: SalaryBreakdownProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
            <div className="h-5 w-16 bg-muted animate-pulse rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Salary Breakdown</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {monthNames[calculation.month - 1]} {calculation.year}
            </Badge>
            <Badge variant="secondary">{position}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fixed Components */}
        <div>
          <h3 className="font-semibold text-primary mb-3">Fixed Components</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Basic Salary</span>
              <span className="font-medium">{formatCurrency(calculation.basicSalary)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Housing Allowance</span>
              <span className="font-medium">{formatCurrency(calculation.housingAllowance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transport Allowance</span>
              <span className="font-medium">{formatCurrency(calculation.transportAllowance)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total Fixed</span>
                <span className="text-primary">{formatCurrency(calculation.totalFixed)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Variable Components */}
        <div>
          <h3 className="font-semibold text-primary mb-3">Variable Components</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Flight Pay ({calculation.totalDutyHours.toFixed(2)} hours)
              </span>
              <span className="font-medium">{formatCurrency(calculation.flightPay)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Per Diem ({calculation.totalRestHours.toFixed(2)} hours)
              </span>
              <span className="font-medium">{formatCurrency(calculation.perDiemPay)}</span>
            </div>
            {calculation.asbyCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  ASBY ({calculation.asbyCount} duties)
                </span>
                <span className="font-medium">{formatCurrency(calculation.asbyPay)}</span>
              </div>
            )}
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total Variable</span>
                <span className="text-accent">{formatCurrency(calculation.totalVariable)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Salary */}
        <div className="border-t pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total Monthly Salary</span>
            <span className="text-primary">{formatCurrency(calculation.totalSalary)}</span>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Duty Hours</span>
              <div className="font-medium">{calculation.totalDutyHours.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Rest Hours</span>
              <div className="font-medium">{calculation.totalRestHours.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">ASBY Duties</span>
              <div className="font-medium">{calculation.asbyCount}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Variable %</span>
              <div className="font-medium">
                {((calculation.totalVariable / calculation.totalSalary) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Date */}
        {calculation.updatedAt && (
          <div className="text-xs text-muted-foreground text-center">
            Last updated: {calculation.updatedAt.toLocaleDateString()} at {calculation.updatedAt.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for dashboard or summary views
 */
export function SalaryBreakdownCompact({ calculation, position }: SalaryBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {formatCurrency(calculation.totalSalary)}
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            {new Date(calculation.year, calculation.month - 1).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })} • {position}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">{formatCurrency(calculation.totalFixed)}</div>
              <div className="text-muted-foreground">Fixed</div>
            </div>
            <div>
              <div className="font-medium">{formatCurrency(calculation.totalVariable)}</div>
              <div className="text-muted-foreground">Variable</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            {calculation.totalDutyHours.toFixed(1)}h duty • {calculation.totalRestHours.toFixed(1)}h rest
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

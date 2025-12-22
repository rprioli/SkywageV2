/**
 * MonthSelector Component
 * 
 * Monthly overview card with interactive chart for month selection.
 * Displays salary data and allows users to select different months.
 * Extracted from dashboard page to reduce complexity.
 */

'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, XAxis, Bar, BarChart, Cell } from 'recharts';
import { MonthlyCalculation } from '@/types/salary-calculator';
import { MIN_SUPPORTED_YEAR } from '@/lib/constants/dates';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper function to get year range (current year ± 2, but never below MIN_SUPPORTED_YEAR)
const getYearRange = (): number[] => {
  const currentYear = new Date().getFullYear();
  const minYear = Math.max(MIN_SUPPORTED_YEAR, currentYear - 2);
  return [
    minYear,
    Math.max(minYear, currentYear - 1),
    Math.max(minYear, currentYear),
    currentYear + 1,
    currentYear + 2,
  ].filter((year, index, self) => self.indexOf(year) === index); // Remove duplicates
};

interface MonthSelectorProps {
  allMonthlyCalculations: MonthlyCalculation[];
  selectedOverviewMonth: number; // 0-based month
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onMonthSwitchingChange: (switching: boolean) => void;
  onUserSelectedChange: (selected: boolean) => void;
  loading: boolean;
  selectedData: {
    totalSalary: number;
    dutyHours: number;
    totalDuties: number;
  };
}

export const MonthSelector = memo<MonthSelectorProps>(({
  allMonthlyCalculations,
  selectedOverviewMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onMonthSwitchingChange,
  onUserSelectedChange,
  loading,
  selectedData,
}) => {

  // Hover state for enhanced interactivity
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Memoized month selection handler for smooth transitions
  const handleMonthSelection = useCallback((index: number) => {
    // Immediate month selection for smooth chart transition
    onMonthChange(index);
    onUserSelectedChange(true);
    // Set switching state for other UI elements (not chart)
    onMonthSwitchingChange(true);
  }, [onMonthChange, onUserSelectedChange, onMonthSwitchingChange]);

  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    const data = [];

    // Find the maximum salary to normalize the chart values
    const maxSalary = Math.max(...allMonthlyCalculations.map(calc => calc.totalSalary), 1);

    for (let i = 0; i < 12; i++) {
      const monthCalc = allMonthlyCalculations.find(calc =>
        calc.month === i + 1 && calc.year === selectedYear
      );

      // Normalize values to 0-100 range for better chart display
      const normalizedValue = monthCalc ? Math.round((monthCalc.totalSalary / maxSalary) * 100) : 0;

      data.push({
        month: MONTHS[i],
        value: normalizedValue
      });
    }

    return data;
  }, [allMonthlyCalculations, selectedYear]);

  // Enhanced color logic for smooth transitions
  const getBarColor = useCallback((index: number) => {
    if (index === selectedOverviewMonth) {
      return '#4C49ED'; // Active: Dark purple
    } else if (index === hoveredIndex) {
      return 'rgba(76, 73, 237, 0.4)'; // Hover: Medium purple
    } else {
      return 'rgba(76, 73, 237, 0.08)'; // Inactive: Light purple
    }
  }, [selectedOverviewMonth, hoveredIndex]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="bg-white rounded-3xl !border-0 !shadow-none overflow-hidden">
      <CardContent className="card-responsive-padding">
        {/* Header with Year Selector */}
        <div className="flex items-start justify-between mb-4 md:mb-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-responsive-2xl font-bold space-responsive-md" style={{ color: '#3A3780' }}>Overview</h2>
            <div className="text-responsive-5xl font-bold space-responsive-sm" style={{
              color: '#3A3780',
              transition: 'opacity 0.2s ease-in-out'
            }}>
              {loading ? '...' : formatCurrency(selectedData.totalSalary)}
            </div>
            <p className="text-responsive-sm text-gray-500">
              {selectedData.totalSalary === 0 && !loading ?
                `${MONTHS[selectedOverviewMonth]} - No Data` :
                (() => {
                  const nextMonth = selectedOverviewMonth === 11 ? 0 : selectedOverviewMonth + 1;
                  const nextYear = selectedOverviewMonth === 11 ? selectedYear + 1 : selectedYear;
                  return `Expected Salary for ${MONTHS[nextMonth]}, ${nextYear}`;
                })()
              }
            </p>
          </div>

          {/* Year Selector - Aligned with Overview heading */}
          <div className="flex-shrink-0 ml-4">
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => onYearChange(parseInt(value, 10))}
            >
              <SelectTrigger
                id="year-selector"
                className="w-[100px] h-7 text-sm border-gray-200 !px-2.5 !py-0 !justify-start [&>*]:!gap-0 [&_svg]:ml-auto"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getYearRange().map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart Area - Optimized for mobile with extended width */}
        <div className="h-56 md:h-48 w-full -mx-2 md:mx-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-responsive-sm">Loading chart data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 8,
                  left: 8,
                  bottom: 5
                }}
                barCategoryGap="12%"
              >
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: '#6B7280',
                    fontWeight: 500
                  }}
                  interval={0}
                  tickMargin={8}
                />
                <Bar
                  dataKey="value"
                  radius={[10, 10, 0, 0]}
                  isAnimationActive={!loading}
                  animationDuration={400}
                  animationEasing="ease-in-out"
                  animationBegin={0}
                  cursor="pointer"
                  maxBarSize={50}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColor(index)}
                      onClick={() => handleMonthSelection(index)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      role="button"
                      aria-label={`Select month ${entry.month}`}
                      style={{
                        cursor: 'pointer',
                        transition: 'fill 0.4s ease-in-out, transform 0.2s ease-in-out',
                        transformOrigin: 'bottom center'
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

MonthSelector.displayName = 'MonthSelector';


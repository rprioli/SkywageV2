/**
 * MonthSelector Component
 * 
 * Monthly overview card with interactive chart for month selection.
 * Displays salary data and allows users to select different months.
 * Uses shadcn/ui ChartContainer for consistent theming and tooltip support.
 */

'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { XAxis, Bar, BarChart, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
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
  ].filter((year, index, self) => self.indexOf(year) === index);
};

/** Chart color config – drives CSS variables via ChartContainer */
const chartConfig = {
  salary: {
    label: 'Salary',
    color: '#4C49ED',
  },
} satisfies ChartConfig;

/** Bar fill tokens derived from the brand purple */
const BAR_FILL = {
  active: 'var(--color-salary)',            // #4C49ED via chart config
  hover: 'rgba(76, 73, 237, 0.4)',
  inactive: 'rgba(76, 73, 237, 0.08)',
} as const;

interface ChartDataPoint {
  month: string;
  /** Normalized 0-100 value used for bar height aesthetics */
  value: number;
  /** Raw AED salary shown in the tooltip */
  totalSalary: number;
}

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

/** Format AED currency for display */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
  }).format(amount);

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Track desktop breakpoint for conditional tooltip
  React.useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.matchMedia('(min-width: 1280px)').matches);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Memoized month selection handler for smooth transitions
  const handleMonthSelection = useCallback((index: number) => {
    // Skip if re-clicking the already-selected month to avoid stuck switching state
    if (index === selectedOverviewMonth) return;

    onMonthChange(index);
    onUserSelectedChange(true);
    onMonthSwitchingChange(true);
  }, [onMonthChange, onUserSelectedChange, onMonthSwitchingChange, selectedOverviewMonth]);

  // Build chart data with both normalized height and raw salary for tooltip
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const maxSalary = Math.max(
      ...allMonthlyCalculations.map(calc => calc.totalSalary),
      1
    );

    return Array.from({ length: 12 }, (_, i) => {
      const monthCalc = allMonthlyCalculations.find(
        calc => calc.month === i + 1 && calc.year === selectedYear
      );

      return {
        month: MONTHS[i],
        value: monthCalc
          ? Math.round((monthCalc.totalSalary / maxSalary) * 100)
          : 0,
        totalSalary: monthCalc?.totalSalary ?? 0,
      };
    });
  }, [allMonthlyCalculations, selectedYear]);

  // Determine bar fill based on selected/hover state
  const getBarColor = useCallback((index: number) => {
    if (index === selectedOverviewMonth) return BAR_FILL.active;
    if (index === hoveredIndex) return BAR_FILL.hover;
    return BAR_FILL.inactive;
  }, [selectedOverviewMonth, hoveredIndex]);

  return (
    <Card className="bg-white rounded-3xl !border-0 !shadow-none overflow-hidden">
      <CardContent className="card-responsive-padding !pt-4">
        {/* Header with Year Selector */}
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-responsive-2xl font-bold mb-2 text-brand-ink">Overview</h2>
            <div
              className="text-responsive-5xl font-bold space-responsive-sm text-brand-ink"
              style={{ transition: 'opacity 0.2s ease-in-out' }}
            >
              {loading ? '...' : formatCurrency(selectedData.totalSalary)}
            </div>
            <p className="text-responsive-sm text-gray-500">
              {selectedData.totalSalary === 0 && !loading
                ? `${MONTHS[selectedOverviewMonth]} - No Data`
                : (() => {
                    const nextMonth = selectedOverviewMonth === 11 ? 0 : selectedOverviewMonth + 1;
                    const nextYear = selectedOverviewMonth === 11 ? selectedYear + 1 : selectedYear;
                    return `Expected Salary for ${MONTHS[nextMonth]}, ${nextYear}`;
                  })()
              }
            </p>
          </div>

          {/* Year Selector */}
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

        {/* Chart Area – ChartContainer handles ResponsiveContainer internally */}
        <div className="h-56 md:h-48 w-full -mx-2 md:mx-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-responsive-sm">Loading chart data...</div>
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="!aspect-auto h-full w-full"
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 20, right: 8, left: 8, bottom: 0 }}
                barCategoryGap="12%"
              >
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  interval={0}
                  tick={{ fontSize: 10, fontWeight: 500 }}
                />
                {isDesktop && (
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload as ChartDataPoint;
                      return (
                        <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl">
                          <p className="text-xs font-medium text-muted-foreground">{data.month}</p>
                          <p className="text-sm font-bold text-foreground">
                            {formatCurrency(data.totalSalary)}
                          </p>
                        </div>
                      );
                    }}
                  />
                )}
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
                      tabIndex={0}
                      aria-label={`${entry.month}: ${formatCurrency(entry.totalSalary)}. Click to select.`}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleMonthSelection(index);
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        transition: 'fill 0.4s ease-in-out',
                        outline: 'none',
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

MonthSelector.displayName = 'MonthSelector';

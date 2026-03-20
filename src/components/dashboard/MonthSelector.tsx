/**
 * MonthSelector Component
 *
 * Unified salary overview card with inline KPI stats and interactive chart.
 * Displays salary data, flight hours, flight pay, per diem, and allows
 * users to select different months via the bar chart.
 */

'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import { CardShell } from '@/components/salary-calculator/v2-cards/CardShell';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { XAxis, Bar, BarChart, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { Clock, Banknote, UtensilsCrossed } from 'lucide-react';
import { MonthlyCalculation } from '@/types/salary-calculator';
import { MIN_SUPPORTED_YEAR } from '@/lib/constants/dates';
import { INNER_PANEL_CLASS } from '@/components/salary-calculator/v2-cards/constants';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

const YEAR_RANGE = getYearRange();

const chartConfig = {
  salary: { label: 'Salary', color: '#4C49ED' },
} satisfies ChartConfig;

const BAR_FILL = {
  active: 'var(--color-salary)',
  hover: 'rgba(76, 73, 237, 0.4)',
  inactive: 'rgba(76, 73, 237, 0.08)',
} as const;

interface ChartDataPoint {
  month: string;
  value: number;
  totalSalary: number;
}

interface MonthSelectorProps {
  allMonthlyCalculations: MonthlyCalculation[];
  selectedOverviewMonth: number;
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
  flightPay: number;
  perDiemPay: number;
  isMonthSwitching: boolean;
}

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
  flightPay,
  perDiemPay,
  isMonthSwitching,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const kpiLoading = loading || isMonthSwitching;

  React.useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.matchMedia('(min-width: 1280px)').matches);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleMonthSelection = useCallback((index: number) => {
    if (index === selectedOverviewMonth) return;
    onMonthChange(index);
    onUserSelectedChange(true);
    onMonthSwitchingChange(true);
  }, [onMonthChange, onUserSelectedChange, onMonthSwitchingChange, selectedOverviewMonth]);

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
        value: monthCalc ? Math.round((monthCalc.totalSalary / maxSalary) * 100) : 0,
        totalSalary: monthCalc?.totalSalary ?? 0,
      };
    });
  }, [allMonthlyCalculations, selectedYear]);

  const getBarColor = useCallback((index: number) => {
    if (index === selectedOverviewMonth) return BAR_FILL.active;
    if (index === hoveredIndex) return BAR_FILL.hover;
    return BAR_FILL.inactive;
  }, [selectedOverviewMonth, hoveredIndex]);

  const kpiStats = useMemo(() => [
    { icon: Clock, label: 'Flight Hours', value: kpiLoading ? '...' : Math.floor(selectedData.dutyHours).toLocaleString('en-US') },
    { icon: Banknote, label: 'Flight Pay', value: kpiLoading ? '...' : formatCurrency(flightPay) },
    { icon: UtensilsCrossed, label: 'Per Diem', value: kpiLoading ? '...' : formatCurrency(perDiemPay) },
  ], [kpiLoading, selectedData.dutyHours, flightPay, perDiemPay]);

  return (
    <CardShell>
      <div className={`${INNER_PANEL_CLASS} p-3.5 md:p-6`}>
        {/* Top section: salary + stats + year selector */}
        <div className="relative border-b border-[#ECE9FA] pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A09ABD]">Overview</p>

          {/* Year selector — absolutely positioned to avoid affecting content flow */}
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => onYearChange(parseInt(value, 10))}
          >
            <SelectTrigger
              id="year-selector"
              className="absolute top-0 right-0 rounded-full border border-[#ECE8F8] bg-white/72 px-2.5 py-1 shadow-[0_8px_18px_rgba(103,84,214,0.05)] h-auto min-w-0 w-auto focus-visible:ring-0 gap-1"
            >
              <span className="hidden md:inline text-[13px] font-medium text-[#8B86A9]">Year</span>
              <span className="text-[13px] font-semibold text-[#332F8A]"><SelectValue /></span>
            </SelectTrigger>
            <SelectContent>
              {YEAR_RANGE.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Salary amount */}
          <div
            className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#332F8A] md:text-5xl"
            style={{ transition: 'opacity 0.2s ease-in-out' }}
          >
            {loading ? '...' : formatCurrency(selectedData.totalSalary)}
          </div>

          <p className="mt-2 text-[15px] text-[#827DA5]">
            {selectedData.totalSalary === 0 && !loading
              ? `${MONTHS[selectedOverviewMonth]} - No Data`
              : (() => {
                  const nextMonth = selectedOverviewMonth === 11 ? 0 : selectedOverviewMonth + 1;
                  const nextYear = selectedOverviewMonth === 11 ? selectedYear + 1 : selectedYear;
                  return <>Expected salary for <span className="font-semibold text-[#4C49ED]">{MONTHS[nextMonth]}, {nextYear}</span></>;
                })()
            }
          </p>

          {/* Inline KPI stats */}
          <div className="grid gap-3 pt-4 md:inline-grid md:grid-cols-3 md:gap-0">
            {kpiStats.map((item, index) => (
              <div key={item.label} className="flex min-w-0 items-center gap-2.5 md:px-3 first:md:pl-0 last:md:pr-0">
                <span className="flex h-5 w-5 items-center justify-center text-[#706AB5]">
                  <item.icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A6A1C3]">
                    {item.label}
                  </p>
                  <p className="truncate text-sm font-semibold tracking-[-0.02em] text-[#312D82] md:text-[15px]">
                    {item.value}
                  </p>
                </div>
                {index < 2 && (
                  <span className="ml-1 hidden h-6 w-px bg-[#ECE8F8] md:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chart area */}
        <div className="mt-4">
          <div className="h-56 md:h-48 w-full">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 text-sm">Loading chart data...</div>
                </div>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className="!aspect-auto h-full w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={chartData}
                    margin={{ top: 6, right: 8, left: 8, bottom: 0 }}
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
                      radius={[12, 12, 0, 0]}
                      isAnimationActive={!loading}
                      animationDuration={400}
                      animationEasing="ease-in-out"
                      animationBegin={0}
                      cursor="pointer"
                      maxBarSize={60}
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
        </div>
      </div>
    </CardShell>

  );
});

MonthSelector.displayName = 'MonthSelector';

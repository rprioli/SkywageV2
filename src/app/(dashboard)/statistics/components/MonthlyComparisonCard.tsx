/**
 * Monthly Comparisons Component
 * Shows current vs previous month performance and identifies best/worst months
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Award, AlertTriangle } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { MonthlyComparison, MonthlyTrendData } from '@/types/statistics';
import { formatCurrency, formatPercentage, CHART_COLORS, getMonthName } from '@/lib/statistics/chartHelpers';

interface MonthlyComparisonCardProps {
  data: MonthlyComparison;
  monthlyTrends: MonthlyTrendData[];
  loading?: boolean;
}

export function MonthlyComparisonCard({ data, monthlyTrends, loading = false }: MonthlyComparisonCardProps) {
  if (loading) {
    return (
      <Card className="rounded-3xl border-2 border-gray-100 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Monthly Comparisons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data (last 12 months)
  const chartData = monthlyTrends
    .slice(-12)
    .map(trend => ({
      month: trend.monthName,
      earnings: trend.totalEarnings,
      fill: trend.month === data.currentMonth.month && trend.year === data.currentMonth.year 
        ? CHART_COLORS.primary 
        : CHART_COLORS.neutral
    }));

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-primary">
            Earnings: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="rounded-3xl border-2 border-gray-100 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Monthly Comparisons
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current vs Previous Month */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current Month */}
          <div className="bg-primary/5 rounded-2xl p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-primary mb-1">
                {formatCurrency(data.currentMonth.totalEarnings)}
              </div>
              <div className="text-xs text-primary/70 mb-2">
                {getMonthName(data.currentMonth.month)} {data.currentMonth.year}
              </div>
              <div className="text-xs text-primary/50">Current Month</div>
            </div>
          </div>

          {/* Previous Month */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-700 mb-1">
                {data.previousMonth ? formatCurrency(data.previousMonth.totalEarnings) : 'N/A'}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                {data.previousMonth 
                  ? `${getMonthName(data.previousMonth.month)} ${data.previousMonth.year}`
                  : 'No Data'
                }
              </div>
              <div className="text-xs text-gray-400">Previous Month</div>
            </div>
          </div>
        </div>

        {/* Change Indicator */}
        {data.previousMonth && (
          <div className="text-center">
            <div className={`flex items-center justify-center gap-2 text-sm font-medium ${
              data.comparison.isIncrease ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.comparison.isIncrease ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {data.comparison.isIncrease ? '+' : ''}{formatCurrency(data.comparison.earningsChange)}
              </span>
              <span>
                ({data.comparison.isIncrease ? '+' : ''}{formatPercentage(data.comparison.earningsPercentChange)})
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Month-over-month change
            </div>
          </div>
        )}

        {/* Monthly Trend Chart */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Last 12 Months Trend</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  tickFormatter={(value) => formatCurrency(value, true)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="earnings" 
                  radius={[4, 4, 0, 0]}
                  fill={CHART_COLORS.neutral}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best and Worst Months */}
        <div className="grid grid-cols-2 gap-4">
          {/* Best Month */}
          <div className="bg-green-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Best Month</span>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-green-700 mb-1">
                {formatCurrency(data.bestMonth.totalEarnings)}
              </div>
              <div className="text-xs text-green-600">
                {getMonthName(data.bestMonth.month)} {data.bestMonth.year}
              </div>
            </div>
          </div>

          {/* Worst Month */}
          <div className="bg-orange-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">Lowest Month</span>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-orange-700 mb-1">
                {formatCurrency(data.worstMonth.totalEarnings)}
              </div>
              <div className="text-xs text-orange-600">
                {getMonthName(data.worstMonth.month)} {data.worstMonth.year}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <h4 className="text-sm font-medium text-blue-700 mb-2">Performance Insights</h4>
          <div className="space-y-2 text-xs text-blue-600">
            {data.previousMonth && (
              <div className="flex items-center gap-2">
                {data.comparison.isIncrease ? (
                  <ArrowUp className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-500" />
                )}
                <span>
                  {data.comparison.isIncrease ? 'Improved' : 'Decreased'} by{' '}
                  {formatPercentage(Math.abs(data.comparison.earningsPercentChange))} from last month
                </span>
              </div>
            )}
            
            {data.bestMonth.totalEarnings > 0 && (
              <div className="flex items-center gap-2">
                <Award className="h-3 w-3 text-yellow-500" />
                <span>
                  {data.currentMonth.totalEarnings === data.bestMonth.totalEarnings 
                    ? 'This is your best month!' 
                    : `${formatPercentage(((data.bestMonth.totalEarnings - data.currentMonth.totalEarnings) / data.bestMonth.totalEarnings) * 100)} below your best month`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Year-to-Date Earnings Breakdown Component
 * Displays YTD earnings with progression chart and comparison indicators
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { YTDData } from '@/types/statistics';
import { formatCurrency, formatPercentage, CHART_COLORS } from '@/lib/statistics/chartHelpers';

interface YTDEarningsCardProps {
  data: YTDData;
  loading?: boolean;
}

export function YTDEarningsCard({ data, loading = false }: YTDEarningsCardProps) {
  if (loading) {
    return (
      <Card className="bg-white rounded-3xl !border-0 !shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2" style={{ color: '#3A3780' }}>
            <TrendingUp className="h-5 w-5 text-primary" />
            Year-to-Date Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-primary/10 rounded w-1/2"></div>
            <div className="h-32 bg-primary/10 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-primary/10 rounded"></div>
              <div className="h-16 bg-primary/10 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentYear = new Date().getFullYear();
  const { comparisonToPreviousYear } = data;

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { monthlyEarnings: number } }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">
              <span className="text-primary">●</span> Cumulative: {formatCurrency(payload[0].value)}
            </p>
            <p className="text-sm">
              <span className="text-accent">●</span> Monthly: {formatCurrency(payload[0].payload.monthlyEarnings)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white rounded-3xl !border-0 !shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2" style={{ color: '#3A3780' }}>
          <TrendingUp className="h-5 w-5 text-primary" />
          Year-to-Date Earnings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* YTD Total with Comparison */}
        <div className="text-center">
          <div className="text-3xl font-bold mb-2" style={{ color: '#3A3780' }}>
            {formatCurrency(data.totalEarnings)}
          </div>
          <div className="text-sm text-muted-foreground mb-3">
            Total Earnings {currentYear}
          </div>
          
          {/* Previous Year Comparison */}
          {comparisonToPreviousYear.previousYearTotal > 0 && (
            <div className={`flex items-center justify-center gap-1 text-sm ${
              comparisonToPreviousYear.isIncrease ? 'text-green-600' : 'text-red-600'
            }`}>
              {comparisonToPreviousYear.isIncrease ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              <span>
                {formatPercentage(Math.abs(comparisonToPreviousYear.percentageChange))} vs {currentYear - 1}
              </span>
            </div>
          )}
        </div>

        {/* YTD Progression Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthlyProgression}>
              <defs>
                <linearGradient id="ytdGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="monthName" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => formatCurrency(value, true)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cumulativeEarnings"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                fill="url(#ytdGradient)"
                dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: CHART_COLORS.primary, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fixed vs Variable Breakdown */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* Fixed Earnings */}
          <div className="bg-white rounded-2xl p-3 md:p-4 text-center border border-gray-100">
            <div className="text-sm md:text-lg font-bold text-gray-700 mb-1 overflow-hidden text-ellipsis">
              {formatCurrency(data.fixedEarnings)}
            </div>
            <div className="text-sm md:text-xs text-gray-500 mb-2">Fixed Pay</div>
            <div className="text-sm md:text-xs text-gray-400">
              {data.totalEarnings > 0 ? formatPercentage((data.fixedEarnings / data.totalEarnings) * 100) : '0%'}
            </div>
          </div>

          {/* Variable Earnings */}
          <div className="bg-primary/5 rounded-2xl p-3 md:p-4 text-center">
            <div className="text-sm md:text-lg font-bold text-primary mb-1 overflow-hidden text-ellipsis">
              {formatCurrency(data.variableEarnings)}
            </div>
            <div className="text-sm md:text-xs text-primary/70 mb-2">Variable Pay</div>
            <div className="text-sm md:text-xs text-primary/50">
              {data.totalEarnings > 0 ? formatPercentage((data.variableEarnings / data.totalEarnings) * 100) : '0%'}
            </div>
          </div>
        </div>

        {/* Variable Pay Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Variable Pay Breakdown</h4>
          
          {/* Flight Pay */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-sm text-gray-600">Flight Pay</span>
            </div>
            <div className="text-sm font-medium">{formatCurrency(data.flightPay)}</div>
          </div>

          {/* Per Diem Pay */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent"></div>
              <span className="text-sm text-gray-600">Per Diem</span>
            </div>
            <div className="text-sm font-medium">{formatCurrency(data.perDiemPay)}</div>
          </div>

          {/* ASBY Pay */}
          {data.asbyPay > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-600">ASBY Pay</span>
              </div>
              <div className="text-sm font-medium">{formatCurrency(data.asbyPay)}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

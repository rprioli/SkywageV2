/**
 * Duty Types Analysis Component
 * Shows duty distribution with pie chart and profitability analysis
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Clock, DollarSign, Plane, Hotel, Users } from 'lucide-react';
import { Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { DutyTypeStats } from '@/types/statistics';
import { formatCurrency, formatPercentage, CHART_COLORS } from '@/lib/statistics/chartHelpers';

interface DutyTypesCardProps {
  data: DutyTypeStats;
  loading?: boolean;
}

// Color mapping for duty types
const DUTY_TYPE_COLORS = {
  turnaround: CHART_COLORS.primary,
  layover: CHART_COLORS.accent,
  asby: CHART_COLORS.secondary,
  recurrent: CHART_COLORS.tertiary,
  sby: CHART_COLORS.neutral,
  off: CHART_COLORS.light,
  business_promotion: CHART_COLORS.tertiary
};

// Icon mapping for duty types
const DUTY_TYPE_ICONS = {
  turnaround: Plane,
  layover: Hotel,
  asby: Users,
  recurrent: Clock,
  sby: Users,
  off: Clock,
  business_promotion: Clock
};

export function DutyTypesCard({ data, loading = false }: DutyTypesCardProps) {
  if (loading) {
    return (
      <Card className="bg-white rounded-3xl !border-0 !shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2" style={{ color: '#3A3780' }}>
            <PieChart className="h-5 w-5 text-primary" />
            Duty Types Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-primary/10 rounded-full mx-auto w-40"></div>
            <div className="space-y-2">
              <div className="h-4 bg-primary/10 rounded w-full"></div>
              <div className="h-4 bg-primary/10 rounded w-3/4"></div>
              <div className="h-4 bg-primary/10 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (data.dutyTypeBreakdown.length === 0) {
    return (
      <Card className="bg-white rounded-3xl !border-0 !shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2" style={{ color: '#3A3780' }}>
            <PieChart className="h-5 w-5 text-primary" />
            Duty Types Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <PieChart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-muted-foreground">No duty data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare pie chart data (exclude unpaid duties from chart)
  const pieChartData = data.dutyTypeBreakdown
    .filter(duty => duty.totalEarnings > 0) // Only show paid duties in pie chart
    .map(duty => ({
      name: duty.dutyType.charAt(0).toUpperCase() + duty.dutyType.slice(1),
      value: duty.count,
      earnings: duty.totalEarnings,
      percentage: duty.percentage,
      color: DUTY_TYPE_COLORS[duty.dutyType] || CHART_COLORS.neutral
    }));

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p>Count: {data.value} duties</p>
            <p>Earnings: {formatCurrency(data.earnings)}</p>
            <p>Share: {formatPercentage(data.percentage)}</p>
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
          <PieChart className="h-5 w-5 text-primary" />
          Duty Types Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Pie Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Duty Type Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Duty Distribution</h4>
          {data.dutyTypeBreakdown.map((duty) => {
            const Icon = DUTY_TYPE_ICONS[duty.dutyType];
            const color = DUTY_TYPE_COLORS[duty.dutyType];
            
            return (
              <div key={duty.dutyType} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="h-2 w-2 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium capitalize">
                      {duty.dutyType}
                    </div>
                    <div className="text-xs text-gray-500">
                      {duty.count} duties • {formatPercentage(duty.percentage)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {duty.dutyType === 'sby' ? 'No Pay' : formatCurrency(duty.totalEarnings)}
                  </div>
                  {duty.dutyType === 'sby' && (
                    <div className="text-xs text-gray-500">
                      Unpaid duty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>



        {/* Summary Stats */}
        <div className="bg-primary/5 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Total Duties</span>
          </div>
          <div className="text-lg font-bold text-primary">
            {data.totalDuties}
          </div>
        </div>


      </CardContent>
    </Card>
  );
}

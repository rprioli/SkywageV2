/**
 * Monthly Comparisons Component
 * Shows best/worst months and top 5 highest paying duties
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Award, AlertTriangle, Plane, Hotel } from 'lucide-react';
import { MonthlyComparison, TopDutyRankings } from '@/types/statistics';
import { formatCurrency, getMonthName } from '@/lib/statistics/chartHelpers';

interface MonthlyComparisonCardProps {
  data: MonthlyComparison;
  topDutyRankings: TopDutyRankings;
  loading?: boolean;
}

export function MonthlyComparisonCard({ data, topDutyRankings, loading = false }: MonthlyComparisonCardProps) {
  if (loading) {
    return (
      <Card className="bg-white rounded-3xl !border-0 !shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2" style={{ color: '#3A3780' }}>
            <Calendar className="h-5 w-5 text-primary" />
            Monthly Comparisons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-primary/10 rounded"></div>
              <div className="h-20 bg-primary/10 rounded"></div>
            </div>
            <div className="h-32 bg-primary/10 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-3xl !border-0 !shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2" style={{ color: '#3A3780' }}>
          <Calendar className="h-5 w-5 text-primary" />
          Monthly Comparisons
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Best and Worst Months */}
        <div className="grid grid-cols-2 gap-4">
          {/* Best Month */}
          <div className="bg-accent/5 rounded-2xl p-4">
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
          <div className="bg-white rounded-2xl p-4 border border-orange-200">
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

        {/* Top 5 Highest Paying Duties */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Top 5 Highest Paying Duties (Flight Pay)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Turnarounds Column */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Plane className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">Turnarounds</span>
              </div>
              
              {topDutyRankings.turnarounds.length > 0 ? (
                <div className="space-y-2">
                  {topDutyRankings.turnarounds.map((duty) => (
                    <div key={`turnaround-${duty.rank}`} className="bg-white rounded-lg p-3 border border-gray-100">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-primary">#{duty.rank}</span>
                            <span className="text-xs text-gray-500">
                              {duty.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 truncate" title={duty.routing}>
                            {duty.routing}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {duty.flightNumbers.join(', ')}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-primary whitespace-nowrap">
                          {formatCurrency(duty.flightPay)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">No turnarounds yet</p>
                </div>
              )}
            </div>

            {/* Layovers Column */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Hotel className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-accent">Layovers</span>
              </div>
              
              {topDutyRankings.layovers.length > 0 ? (
                <div className="space-y-2">
                  {topDutyRankings.layovers.map((duty) => (
                    <div key={`layover-${duty.rank}`} className="bg-white rounded-lg p-3 border border-gray-100">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-accent">#{duty.rank}</span>
                            <span className="text-xs text-gray-500">
                              {duty.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 truncate" title={duty.routing}>
                            {duty.routing}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {duty.flightNumbers.join(', ')}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-accent whitespace-nowrap">
                          {formatCurrency(duty.flightPay)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">No paired layovers yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

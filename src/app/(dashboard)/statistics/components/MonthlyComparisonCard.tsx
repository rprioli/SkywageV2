/**
 * Monthly Comparisons Component
 * Shows best/worst months and top 5 highest paying duties
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { MonthlyComparison, TopDutyRankings } from '@/types/statistics';
import { formatCurrency, getMonthName } from '@/lib/statistics/chartHelpers';

interface MonthlyComparisonCardProps {
  data: MonthlyComparison;
  topDutyRankings: TopDutyRankings;
  loading?: boolean;
}

/**
 * Extract destination airports from routing string
 * Example: "DXB - SJJ → SJJ - DXB" returns "SJJ"
 * Example: "DXB - VKO / VKO - DXB" returns "VKO"
 * Example: "DXB - SJJ → SJJ - BEG → BEG - DXB" returns "SJJ - BEG"
 */
const getDestinations = (routing: string): string => {
  // Split by both → and / to handle turnarounds and layovers
  const segments = routing.split(/\s*[→/]\s*/);
  const airports = new Set<string>();
  const baseAirport = 'DXB'; // Assuming DXB is always the base
  
  segments.forEach(segment => {
    const cities = segment.split(' - ').map(city => city.trim());
    cities.forEach(city => {
      if (city && city !== baseAirport) {
        airports.add(city);
      }
    });
  });
  
  return Array.from(airports).join(' - ');
};

type HighestPayingDuty = TopDutyRankings['turnarounds'][number];

const HighestPayingDutyRow = ({
  duty,
}: {
  duty: HighestPayingDuty;
}) => {
  return (
    <div className="p-4 bg-white rounded-2xl border border-gray-100/80 hover:bg-gray-50/40 transition-colors">
      <div className="flex flex-col gap-1.5">
        {/* Row 1: Destination */}
        <div className="flex items-center gap-3">
          <div className="text-base font-bold truncate text-brand-ink">
            {getDestinations(duty.routing)}
          </div>
        </div>

        {/* Row 2: Flight numbers (left) + Pay badge (right) */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-sm text-gray-600 truncate">
            {duty.flightNumbers.join(', ')}
          </div>
          <div
            className="flex-shrink-0 text-xs font-bold text-white rounded-full px-2 py-0.5"
            style={{ backgroundColor: '#6DDC91' }}
          >
            {formatCurrency(duty.flightPay)}
          </div>
        </div>

        {/* Row 3: Date */}
        <div className="text-sm text-gray-600">
          {duty.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export function MonthlyComparisonCard({ data, topDutyRankings, loading = false }: MonthlyComparisonCardProps) {
  if (loading) {
    return (
      <Card className="bg-white rounded-3xl !border-0 !shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-brand-ink">
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
        <CardTitle className="flex items-center gap-2 text-brand-ink">
          <Calendar className="h-5 w-5 text-primary" />
          Monthly Comparisons
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Best and Worst Months */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {/* Best Month */}
          <div className="bg-accent/5 rounded-2xl p-4 md:p-5 text-center transition-colors hover:bg-accent/10">
            <div className="text-sm md:text-lg font-bold text-green-700 mb-1">
                {formatCurrency(data.bestMonth.totalEarnings)}
              </div>
            <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">
              Best
            </div>
            <div className="text-xs font-medium text-green-600/70">
                {getMonthName(data.bestMonth.month)} {data.bestMonth.year}
            </div>
          </div>

          {/* Worst Month */}
          <div className="bg-orange-50/50 rounded-2xl p-4 md:p-5 text-center border border-orange-100/50 transition-colors hover:bg-orange-50">
            <div className="text-sm md:text-lg font-bold text-orange-700 mb-1">
                {formatCurrency(data.worstMonth.totalEarnings)}
              </div>
            <div className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-1">
              Lowest
            </div>
            <div className="text-xs font-medium text-orange-600/70">
                {getMonthName(data.worstMonth.month)} {data.worstMonth.year}
            </div>
          </div>
        </div>

        {/* Top 5 Highest Paying Duties */}
        <div>
          <h4 className="text-sm font-semibold text-brand-ink mb-4">
            Highest Paying Duties
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Turnarounds Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-brand-ink">Turnarounds</span>
              </div>
              
              {topDutyRankings.turnarounds.length > 0 ? (
                <div className="space-y-3">
                  {topDutyRankings.turnarounds.map((duty) => (
                    <HighestPayingDutyRow
                      key={`turnaround-${duty.rank}`}
                      duty={duty}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-gray-400 italic">
                  No turnarounds recorded
                </div>
              )}
            </div>

            {/* Layovers Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-brand-ink">Layovers</span>
              </div>
              
              {topDutyRankings.layovers.length > 0 ? (
                <div className="space-y-3">
                  {topDutyRankings.layovers.map((duty) => (
                    <HighestPayingDutyRow
                      key={`layover-${duty.rank}`}
                      duty={duty}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-gray-400 italic">
                  No paired layovers yet
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, AlertCircle } from 'lucide-react';
import { useStatisticsData } from '@/hooks/useStatisticsData';
import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import { YTDEarningsCard } from './components/YTDEarningsCard';
import { MonthlyComparisonCard } from './components/MonthlyComparisonCard';
import { DutyTypesCard } from './components/DutyTypesCard';
import { StatisticsHeader } from './components/StatisticsHeader';
import { YTDData, MonthlyComparison, TopDutyRankings, DutyTypeStats } from '@/types/statistics';
import { MIN_SUPPORTED_YEAR } from '@/lib/constants/dates';

export default function StatisticsPage() {
  // Year selector state (clamped to MIN_SUPPORTED_YEAR)
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(Math.max(currentYear, MIN_SUPPORTED_YEAR));

  // Use our custom statistics data hook with selected year
  const { data: statisticsData, loading, error, refresh, availableYears } = useStatisticsData(selectedYear);

  // Get mobile navigation context
  const { isDesktop, toggleSidebar, isSidebarOpen } = useMobileNavigation();

  // Determine content state
  const hasError = !!error;
  const isEmpty = !loading && !hasError && (!statisticsData || statisticsData.monthlyTrends.length === 0);

  return (
    <div className="space-y-4">
      {/* Header and Statistics - Grouped with consistent spacing */}
      <div className="space-y-6 pt-2">
        <StatisticsHeader
          isDesktop={isDesktop}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
      </div>

      {/* Main Content Area */}
      <div className="animate-in fade-in duration-500 motion-reduce:transition-none">
        {hasError ? (
          <Card className="bg-white rounded-3xl !border-0 !shadow-none">
            <CardContent className="card-responsive-padding text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-responsive-xl font-bold mb-2 text-red-700">Unable to Load Statistics</h3>
              <p className="text-responsive-base text-red-600 mb-4">{error}</p>
              <Button
                onClick={refresh}
                variant="destructive"
                className="rounded-xl"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : isEmpty ? (
          <Card className="bg-white rounded-3xl !border-0 !shadow-none">
            <CardContent className="card-responsive-padding text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50 text-gray-400" />
              <h3 className="text-responsive-xl font-bold mb-2 text-brand-ink">No Statistics Available</h3>
              <p className="text-responsive-base text-gray-600">
                Upload your roster files or add flights manually to see statistics here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Top Row - YTD Earnings (Full Width) */}
            <YTDEarningsCard
              data={statisticsData?.ytdData as YTDData}
              loading={loading}
              selectedYear={selectedYear}
              availableYears={availableYears}
              onYearChange={setSelectedYear}
              yearSelectorDisabled={loading}
            />

            {/* Bottom Row - Monthly Comparisons and Duty Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 responsive-gap">
              {/* Monthly Comparisons */}
              <MonthlyComparisonCard
                data={statisticsData?.monthlyComparison as MonthlyComparison}
                topDutyRankings={statisticsData?.topDutyRankings as TopDutyRankings}
                loading={loading}
              />

              {/* Duty Types Breakdown */}
              <DutyTypesCard
                data={statisticsData?.dutyTypeStats as DutyTypeStats}
                loading={loading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

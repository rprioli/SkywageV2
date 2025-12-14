'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Loader2, AlertCircle, Menu } from 'lucide-react';
import { useStatisticsData } from '@/hooks/useStatisticsData';
import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import { YTDEarningsCard } from './components/YTDEarningsCard';
import { MonthlyComparisonCard } from './components/MonthlyComparisonCard';
import { DutyTypesCard } from './components/DutyTypesCard';
import { YearSelector } from './components/YearSelector';
import { StatisticsHeader } from './components/StatisticsHeader';

export default function StatisticsPage() {
  // Year selector state
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Use our custom statistics data hook with selected year
  const { data: statisticsData, loading, error, refresh, availableYears } = useStatisticsData(selectedYear);

  // Get mobile navigation context
  const { isMobile, toggleSidebar, isSidebarOpen } = useMobileNavigation();

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-6 px-6 pt-6">
          <StatisticsHeader
            isMobile={isMobile}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </div>

        <div className="px-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading statistics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="space-y-6 px-6 pt-6">
          <StatisticsHeader
            isMobile={isMobile}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </div>

        <div className="px-6">
          <Card className="bg-white rounded-3xl !border-0 !shadow-none">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2 text-red-700">Unable to Load Statistics</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={refresh}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No data state
  if (!statisticsData || statisticsData.monthlyTrends.length === 0) {
    return (
      <div className="space-y-4">
        <div className="space-y-6 px-6 pt-6">
          <StatisticsHeader
            isMobile={isMobile}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </div>

        <div className="px-6">
          <Card className="bg-white rounded-3xl !border-0 !shadow-none">
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Statistics Available</h3>
              <p className="text-gray-600">Upload your roster files or add flights manually to see statistics here</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Statistics - Grouped with consistent spacing */}
      <div className="space-y-6 px-6 pt-6">
        <StatisticsHeader
          isMobile={isMobile}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />

        {/* Year Selector */}
        {availableYears.length > 0 && (
          <YearSelector
            selectedYear={selectedYear}
            availableYears={availableYears}
            onYearChange={setSelectedYear}
            disabled={loading}
          />
        )}
      </div>

      {/* Statistics Grid - Phase 1 Essential Features */}
      <div className="space-y-4 md:space-y-6 responsive-container">
        {/* Top Row - YTD Earnings (Full Width) */}
        <YTDEarningsCard
          data={statisticsData.ytdData}
          loading={loading}
        />

        {/* Bottom Row - Monthly Comparisons and Duty Types */}
        <div className="grid grid-cols-1 lg:grid-cols-2 responsive-gap">
          {/* Monthly Comparisons */}
          <MonthlyComparisonCard
            data={statisticsData.monthlyComparison}
            monthlyTrends={statisticsData.monthlyTrends}
            loading={loading}
          />

          {/* Duty Types Breakdown */}
          <DutyTypesCard
            data={statisticsData.dutyTypeStats}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

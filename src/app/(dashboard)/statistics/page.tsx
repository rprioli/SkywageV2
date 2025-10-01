'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, PieChart, Calendar, Loader2, AlertCircle, Menu } from 'lucide-react';
import { useStatisticsData } from '@/hooks/useStatisticsData';
import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import { YTDEarningsCard } from './components/YTDEarningsCard';
import { MonthlyComparisonCard } from './components/MonthlyComparisonCard';
import { DutyTypesCard } from './components/DutyTypesCard';

export default function StatisticsPage() {
  // Use our custom statistics data hook
  const { data: statisticsData, loading, error, refresh } = useStatisticsData();

  // Get mobile navigation context
  const { isMobile, toggleSidebar, isSidebarOpen } = useMobileNavigation();

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-6 px-6 pt-6">
          {/* Header with integrated hamburger menu on mobile */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-1" style={{ color: '#3A3780' }}>Statistics</h1>
              <p className="text-primary font-bold">
                Loading your earnings statistics and flight data analytics...
              </p>
            </div>

            {/* Hamburger Menu - Mobile Only */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className={`flex-shrink-0 p-3 rounded-lg touch-target transition-colors ${
                  isSidebarOpen
                    ? 'bg-primary/10 hover:bg-primary/20 text-primary'
                    : 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
                }`}
                aria-label="Toggle navigation menu"
                aria-expanded={isSidebarOpen}
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
          </div>
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
          {/* Header with integrated hamburger menu on mobile */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-1" style={{ color: '#3A3780' }}>Statistics</h1>
              <p className="text-primary font-bold">
                View your earnings statistics and flight data analytics.
              </p>
            </div>

            {/* Hamburger Menu - Mobile Only */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className={`flex-shrink-0 p-3 rounded-lg touch-target transition-colors ${
                  isSidebarOpen
                    ? 'bg-primary/10 hover:bg-primary/20 text-primary'
                    : 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
                }`}
                aria-label="Toggle navigation menu"
                aria-expanded={isSidebarOpen}
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
          </div>
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
          {/* Header with integrated hamburger menu on mobile */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-1" style={{ color: '#3A3780' }}>Statistics</h1>
              <p className="text-primary font-bold">
                View your earnings statistics and flight data analytics.
              </p>
            </div>

            {/* Hamburger Menu - Mobile Only */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className={`flex-shrink-0 p-3 rounded-lg touch-target transition-colors ${
                  isSidebarOpen
                    ? 'bg-primary/10 hover:bg-primary/20 text-primary'
                    : 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
                }`}
                aria-label="Toggle navigation menu"
                aria-expanded={isSidebarOpen}
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
          </div>
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
        {/* Header with integrated hamburger menu on mobile */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-1" style={{ color: '#3A3780' }}>Statistics</h1>
            <p className="text-primary font-bold">
              View your earnings statistics and flight data analytics.
            </p>
          </div>

          {/* Hamburger Menu - Mobile Only */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className={`flex-shrink-0 p-3 rounded-lg touch-target transition-colors ${
                isSidebarOpen
                  ? 'bg-primary/10 hover:bg-primary/20 text-primary'
                  : 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
              }`}
              aria-label="Toggle navigation menu"
              aria-expanded={isSidebarOpen}
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}
        </div>
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

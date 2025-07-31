'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, PieChart, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useStatisticsData } from '@/hooks/useStatisticsData';
import { YTDEarningsCard } from './components/YTDEarningsCard';
import { MonthlyComparisonCard } from './components/MonthlyComparisonCard';
import { DutyTypesCard } from './components/DutyTypesCard';

export default function StatisticsPage() {
  // Use our custom statistics data hook
  const { data: statisticsData, loading, error, refresh } = useStatisticsData();

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Statistics</h1>
          <p className="text-muted-foreground">
            Loading your earnings statistics and flight data analytics...
          </p>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Statistics</h1>
          <p className="text-muted-foreground">
            View your earnings statistics and flight data analytics.
          </p>
        </div>

        <Card className="rounded-3xl border-2 border-red-100 bg-red-50">
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
    );
  }

  // No data state
  if (!statisticsData || statisticsData.monthlyTrends.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Statistics</h1>
          <p className="text-muted-foreground">
            View your earnings statistics and flight data analytics.
          </p>
        </div>

        <Card className="rounded-3xl border-2 border-gray-100">
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Statistics Available</h3>
            <p className="text-gray-600">Upload your roster files or add flights manually to see statistics here</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Statistics</h1>
        <p className="text-muted-foreground">
          View your earnings statistics and flight data analytics.
        </p>
      </div>

      {/* Statistics Grid - Phase 1 Essential Features */}
      <div className="space-y-6">
        {/* Top Row - YTD Earnings (Full Width) */}
        <YTDEarningsCard
          data={statisticsData.ytdData}
          loading={loading}
        />

        {/* Bottom Row - Monthly Comparisons and Duty Types */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

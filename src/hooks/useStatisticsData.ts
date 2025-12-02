/**
 * Statistics Data Hook
 * Manages fetching, caching, and refreshing of statistics data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { getAllMonthlyCalculations } from '@/lib/database/calculations';
import { calculateStatistics } from '@/lib/statistics/calculations';
import {
  StatisticsCalculationResult,
  UseStatisticsDataReturn,
  MonthlyTrendData
} from '@/types/statistics';

/**
 * Hook for managing statistics data
 * Automatically refreshes when user data changes
 * Provides loading states and error handling
 */
export function useStatisticsData(): UseStatisticsDataReturn {
  const { user } = useAuth();
  const [data, setData] = useState<StatisticsCalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch and calculate statistics data
   */
  const fetchStatisticsData = useCallback(async () => {
    if (!user?.id) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all monthly calculations
      const calculationsResult = await getAllMonthlyCalculations(user.id);
      
      if (calculationsResult.error) {
        throw new Error(calculationsResult.error);
      }

      const monthlyCalculations = calculationsResult.data || [];

      // Calculate statistics
      const statisticsResult = calculateStatistics(monthlyCalculations);
      
      setData(statisticsResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Refresh statistics data
   */
  const refresh = useCallback(async () => {
    await fetchStatisticsData();
  }, [fetchStatisticsData]);

  // Initial data fetch
  useEffect(() => {
    fetchStatisticsData();
  }, [fetchStatisticsData]);

  // Listen for dashboard data updates (when user makes changes)
  useEffect(() => {
    const handleDataUpdate = () => {
      // Refresh statistics when dashboard data changes
      fetchStatisticsData();
    };

    // Listen for custom events from dashboard
    window.addEventListener('dashboardDataUpdated', handleDataUpdate);
    window.addEventListener('flightDataUpdated', handleDataUpdate);
    window.addEventListener('calculationUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('dashboardDataUpdated', handleDataUpdate);
      window.removeEventListener('flightDataUpdated', handleDataUpdate);
      window.removeEventListener('calculationUpdated', handleDataUpdate);
    };
  }, [fetchStatisticsData]);

  return {
    data,
    loading,
    error,
    refresh
  };
}

/**
 * Hook for chart-specific data transformations
 * Provides pre-formatted data for different chart types
 * Optimized with useMemo to prevent unnecessary recalculations
 */
export function useChartData(statisticsData: StatisticsCalculationResult | null) {
  // Use useMemo to only recalculate when statisticsData changes
  const chartData = useMemo(() => {
    if (!statisticsData) {
      return {
        ytdChartData: [],
        monthlyTrendData: [],
        payComponentData: [],
        dutyTypeChartData: [],
        loading: false
      };
    }

    return {
      loading: false,

      // YTD progression data for line/area charts
      ytdChartData: statisticsData.ytdData.monthlyProgression,

      // Monthly trend data for bar charts
      monthlyTrendData: statisticsData.monthlyTrends.map(trend => ({
        month: trend.monthName,
        earnings: trend.totalEarnings,
        trend: trend.totalEarnings
      })),

      // Pay component data for stacked area charts
      payComponentData: statisticsData.payComponentBreakdown.monthlyBreakdown.map(month => ({
        month: month.monthName,
        flightPay: month.flightPay,
        perDiemPay: month.perDiemPay,
        asbyPay: month.asbyPay,
        total: month.totalPay
      })),

      // Duty type data for pie charts
      dutyTypeChartData: statisticsData.dutyTypeStats.dutyTypeBreakdown.map(duty => ({
        name: duty.dutyType.charAt(0).toUpperCase() + duty.dutyType.slice(1),
        value: duty.count,
        fill: getDutyTypeColor(duty.dutyType)
      }))
    };
  }, [statisticsData]);

  return chartData;
}

/**
 * Get color for duty type in charts
 */
function getDutyTypeColor(dutyType: string): string {
  const colors = {
    turnaround: '#4C49ED', // Primary purple
    layover: '#6DDC91',    // Accent green
    asby: '#FF6B6B',       // Red
    recurrent: '#4ECDC4',  // Teal
    sby: '#95A5A6',        // Gray
    off: '#BDC3C7',        // Light gray
    business_promotion: '#4ECDC4'  // Teal (same as recurrent)
  };

  return colors[dutyType as keyof typeof colors] || '#95A5A6';
}

/**
 * Hook for statistics summary metrics
 * Provides key metrics for dashboard cards
 * Optimized with useMemo to prevent unnecessary recalculations
 */
export function useStatisticsSummary(statisticsData: StatisticsCalculationResult | null) {
  // Use useMemo to only recalculate when statisticsData changes
  return useMemo(() => {
    if (!statisticsData) {
      return {
        ytdTotal: 0,
        monthlyAverage: 0,
        bestMonth: 0,
        currentMonthRank: 0,
        totalFlights: 0,
        averageEarningsPerFlight: 0
      };
    }

    const { ytdData, monthlyComparison, monthlyTrends } = statisticsData;
    const monthsWithData = monthlyTrends.filter(trend => trend.totalEarnings > 0);

    return {
      ytdTotal: ytdData.totalEarnings,
      monthlyAverage: monthsWithData.length > 0 ? ytdData.totalEarnings / monthsWithData.length : 0,
      bestMonth: monthlyComparison.bestMonth.totalEarnings,
      currentMonthRank: calculateCurrentMonthRank(monthlyTrends, monthlyComparison.currentMonth),
      totalFlights: monthlyTrends.reduce((sum, trend) => sum + trend.flightCount, 0),
      averageEarningsPerFlight: 0 // Would need flight count data
    };
  }, [statisticsData]);
}

/**
 * Calculate current month's rank among all months
 */
function calculateCurrentMonthRank(
  monthlyTrends: MonthlyTrendData[],
  currentMonth: { month: number; year: number; totalEarnings: number }
): number {
  const sortedMonths = monthlyTrends
    .filter(trend => trend.totalEarnings > 0)
    .sort((a, b) => b.totalEarnings - a.totalEarnings);
  
  const currentMonthIndex = sortedMonths.findIndex(
    trend => trend.month === currentMonth.month && trend.year === currentMonth.year
  );
  
  return currentMonthIndex >= 0 ? currentMonthIndex + 1 : sortedMonths.length + 1;
}

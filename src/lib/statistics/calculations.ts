/**
 * Statistics Calculation Engine
 * Transforms raw monthly calculation data into statistics insights
 */

import { MonthlyCalculation, FlightDuty } from '@/types/salary-calculator';
import {
  YTDData,
  MonthlyComparison,
  PayComponentBreakdown,
  DutyTypeStats,
  MonthlyTrendData,
  StatisticsCalculationResult,
  MonthlyProgressionPoint,
  PayComponentMonth,
  DutyTypeBreakdownItem,
  DutyTypeProfitability
} from '@/types/statistics';

/**
 * Calculate Year-to-Date earnings data
 */
export function calculateYTDData(
  monthlyCalculations: MonthlyCalculation[],
  currentYear: number
): YTDData {
  // Filter for current year
  const currentYearData = monthlyCalculations.filter(calc => calc.year === currentYear);
  const previousYearData = monthlyCalculations.filter(calc => calc.year === currentYear - 1);

  // Calculate totals
  const totalEarnings = currentYearData.reduce((sum, calc) => sum + calc.totalSalary, 0);
  const fixedEarnings = currentYearData.reduce((sum, calc) => sum + calc.totalFixed, 0);
  const variableEarnings = currentYearData.reduce((sum, calc) => sum + calc.totalVariable, 0);
  const flightPay = currentYearData.reduce((sum, calc) => sum + calc.flightPay, 0);
  const perDiemPay = currentYearData.reduce((sum, calc) => sum + calc.perDiemPay, 0);
  const asbyPay = currentYearData.reduce((sum, calc) => sum + calc.asbyPay, 0);

  // Calculate monthly progression - only include months with data
  const monthlyProgression: MonthlyProgressionPoint[] = [];
  let cumulativeEarnings = 0;

  // Find the last month with actual data
  const lastMonthWithData = currentYearData.length > 0
    ? Math.max(...currentYearData.map(calc => calc.month))
    : new Date().getMonth() + 1; // Current month if no data

  for (let month = 1; month <= lastMonthWithData; month++) {
    const monthData = currentYearData.find(calc => calc.month === month);
    const monthlyEarnings = monthData?.totalSalary || 0;
    cumulativeEarnings += monthlyEarnings;

    monthlyProgression.push({
      month,
      monthName: new Date(currentYear, month - 1).toLocaleDateString('en-US', { month: 'short' }),
      cumulativeEarnings,
      monthlyEarnings,
      fixedEarnings: monthData?.totalFixed || 0,
      variableEarnings: monthData?.totalVariable || 0
    });
  }

  // Calculate comparison to previous year
  const previousYearTotal = previousYearData.reduce((sum, calc) => sum + calc.totalSalary, 0);
  const percentageChange = previousYearTotal > 0 ? ((totalEarnings - previousYearTotal) / previousYearTotal) * 100 : 0;

  return {
    totalEarnings,
    fixedEarnings,
    variableEarnings,
    flightPay,
    perDiemPay,
    asbyPay,
    monthlyProgression,
    comparisonToPreviousYear: {
      previousYearTotal,
      percentageChange,
      isIncrease: percentageChange > 0
    }
  };
}

/**
 * Calculate monthly comparison data
 */
export function calculateMonthlyComparison(
  monthlyCalculations: MonthlyCalculation[],
  currentMonth: number,
  currentYear: number
): MonthlyComparison {
  const currentMonthData = monthlyCalculations.find(
    calc => calc.month === currentMonth && calc.year === currentYear
  );

  // Get previous month (handle year boundary)
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const previousMonthData = monthlyCalculations.find(
    calc => calc.month === prevMonth && calc.year === prevYear
  );

  // Find best and worst months
  const sortedByEarnings = [...monthlyCalculations].sort((a, b) => b.totalSalary - a.totalSalary);
  const bestMonth = sortedByEarnings[0];
  const worstMonth = sortedByEarnings[sortedByEarnings.length - 1];

  // Calculate comparison
  const currentEarnings = currentMonthData?.totalSalary || 0;
  const previousEarnings = previousMonthData?.totalSalary || 0;
  const earningsChange = currentEarnings - previousEarnings;
  const earningsPercentChange = previousEarnings > 0 ? (earningsChange / previousEarnings) * 100 : 0;

  return {
    currentMonth: {
      month: currentMonth,
      year: currentYear,
      totalEarnings: currentEarnings,
      flightPay: currentMonthData?.flightPay || 0,
      perDiemPay: currentMonthData?.perDiemPay || 0,
      dutyHours: currentMonthData?.totalDutyHours || 0,
      flightCount: 0 // Will be calculated from flight duties if needed
    },
    previousMonth: previousMonthData ? {
      month: prevMonth,
      year: prevYear,
      totalEarnings: previousEarnings,
      flightPay: previousMonthData.flightPay,
      perDiemPay: previousMonthData.perDiemPay,
      dutyHours: previousMonthData.totalDutyHours,
      flightCount: 0
    } : null,
    comparison: {
      earningsChange,
      earningsPercentChange,
      isIncrease: earningsChange > 0
    },
    bestMonth: {
      month: bestMonth?.month || currentMonth,
      year: bestMonth?.year || currentYear,
      totalEarnings: bestMonth?.totalSalary || 0
    },
    worstMonth: {
      month: worstMonth?.month || currentMonth,
      year: worstMonth?.year || currentYear,
      totalEarnings: worstMonth?.totalSalary || 0
    }
  };
}

/**
 * Calculate pay component breakdown over time
 */
export function calculatePayComponentBreakdown(
  monthlyCalculations: MonthlyCalculation[]
): PayComponentBreakdown {
  const monthlyBreakdown: PayComponentMonth[] = monthlyCalculations.map(calc => {
    const totalPay = calc.flightPay + calc.perDiemPay + calc.asbyPay;
    
    return {
      month: calc.month,
      year: calc.year,
      monthName: new Date(calc.year, calc.month - 1).toLocaleDateString('en-US', { month: 'short' }),
      flightPay: calc.flightPay,
      perDiemPay: calc.perDiemPay,
      asbyPay: calc.asbyPay,
      totalPay,
      flightPayPercentage: totalPay > 0 ? (calc.flightPay / totalPay) * 100 : 0,
      perDiemPercentage: totalPay > 0 ? (calc.perDiemPay / totalPay) * 100 : 0,
      asbyPayPercentage: totalPay > 0 ? (calc.asbyPay / totalPay) * 100 : 0
    };
  });

  // Calculate overall balance and trend
  const totalFlightPay = monthlyCalculations.reduce((sum, calc) => sum + calc.flightPay, 0);
  const totalPerDiemPay = monthlyCalculations.reduce((sum, calc) => sum + calc.perDiemPay, 0);
  const totalAsbyPay = monthlyCalculations.reduce((sum, calc) => sum + calc.asbyPay, 0);
  const grandTotal = totalFlightPay + totalPerDiemPay + totalAsbyPay;

  // Determine trend (simplified - could be more sophisticated)
  const recentMonths = monthlyBreakdown.slice(-3);
  const avgRecentFlightPercentage = recentMonths.reduce((sum, month) => sum + month.flightPayPercentage, 0) / recentMonths.length;
  const avgRecentPerDiemPercentage = recentMonths.reduce((sum, month) => sum + month.perDiemPercentage, 0) / recentMonths.length;

  let trend: 'increasing_flight' | 'increasing_perdiem' | 'stable' = 'stable';
  if (Math.abs(avgRecentFlightPercentage - avgRecentPerDiemPercentage) > 10) {
    trend = avgRecentFlightPercentage > avgRecentPerDiemPercentage ? 'increasing_flight' : 'increasing_perdiem';
  }

  return {
    monthlyBreakdown,
    overallBalance: {
      flightPayPercentage: grandTotal > 0 ? (totalFlightPay / grandTotal) * 100 : 0,
      perDiemPercentage: grandTotal > 0 ? (totalPerDiemPay / grandTotal) * 100 : 0,
      asbyPercentage: grandTotal > 0 ? (totalAsbyPay / grandTotal) * 100 : 0,
      trend
    }
  };
}

/**
 * Calculate monthly trend data for charts
 */
export function calculateMonthlyTrends(
  monthlyCalculations: MonthlyCalculation[]
): MonthlyTrendData[] {
  return monthlyCalculations
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    })
    .map(calc => ({
      month: calc.month,
      year: calc.year,
      monthName: new Date(calc.year, calc.month - 1).toLocaleDateString('en-US', { month: 'short' }),
      totalEarnings: calc.totalSalary,
      flightPay: calc.flightPay,
      perDiemPay: calc.perDiemPay,
      asbyPay: calc.asbyPay,
      dutyHours: calc.totalDutyHours,
      flightCount: 0 // Would need flight duties data to calculate
    }));
}

/**
 * Calculate duty type statistics from monthly calculations
 * Note: This is a simplified version based on available data
 */
export function calculateDutyTypeStats(
  monthlyCalculations: MonthlyCalculation[]
): DutyTypeStats {
  // Since we don't have detailed flight duties data in this context,
  // we'll create estimates based on the monthly calculation data
  const totalFlightPay = monthlyCalculations.reduce((sum, calc) => sum + calc.flightPay, 0);
  const totalPerDiemPay = monthlyCalculations.reduce((sum, calc) => sum + calc.perDiemPay, 0);
  const totalAsbyPay = monthlyCalculations.reduce((sum, calc) => sum + calc.asbyPay, 0);
  const totalAsbyCount = monthlyCalculations.reduce((sum, calc) => sum + calc.asbyCount, 0);
  const totalDutyHours = monthlyCalculations.reduce((sum, calc) => sum + calc.totalDutyHours, 0);

  // Estimate duty counts (simplified approach)
  const estimatedTurnarounds = Math.round(totalFlightPay * 0.6 / 200); // Rough estimate
  const estimatedLayovers = Math.round(totalFlightPay * 0.4 / 300); // Rough estimate
  // Estimate standby duties based on total activity (independent of ASBY)
  const estimatedStandby = Math.max(2, Math.round((estimatedTurnarounds + estimatedLayovers) * 0.15)); // 15% of flight duties as standby
  const actualStandbyCount = Math.max(1, estimatedStandby); // Ensure at least 1 standby duty
  const totalDuties = estimatedTurnarounds + estimatedLayovers + totalAsbyCount + actualStandbyCount;
  const totalEarnings = totalFlightPay + totalPerDiemPay + totalAsbyPay;

  const dutyTypeBreakdown: DutyTypeBreakdownItem[] = [
    {
      dutyType: 'turnaround',
      count: estimatedTurnarounds,
      totalEarnings: totalFlightPay * 0.6,
      totalHours: totalDutyHours * 0.4,
      percentage: totalDuties > 0 ? (estimatedTurnarounds / totalDuties) * 100 : 0,
      averageEarningsPerDuty: estimatedTurnarounds > 0 ? (totalFlightPay * 0.6) / estimatedTurnarounds : 0,
      averageHoursPerDuty: estimatedTurnarounds > 0 ? (totalDutyHours * 0.4) / estimatedTurnarounds : 0
    },
    {
      dutyType: 'layover',
      count: estimatedLayovers,
      totalEarnings: (totalFlightPay * 0.4) + totalPerDiemPay,
      totalHours: totalDutyHours * 0.6,
      percentage: totalDuties > 0 ? (estimatedLayovers / totalDuties) * 100 : 0,
      averageEarningsPerDuty: estimatedLayovers > 0 ? ((totalFlightPay * 0.4) + totalPerDiemPay) / estimatedLayovers : 0,
      averageHoursPerDuty: estimatedLayovers > 0 ? (totalDutyHours * 0.6) / estimatedLayovers : 0
    },
    {
      dutyType: 'asby',
      count: totalAsbyCount,
      totalEarnings: totalAsbyPay,
      totalHours: totalAsbyCount * 4, // ASBY is typically 4 hours
      percentage: totalDuties > 0 ? (totalAsbyCount / totalDuties) * 100 : 0,
      averageEarningsPerDuty: totalAsbyCount > 0 ? totalAsbyPay / totalAsbyCount : 0,
      averageHoursPerDuty: 4
    },
    {
      dutyType: 'sby',
      count: actualStandbyCount, // Use the calculated actual standby count
      totalEarnings: 0, // Standby duties are not paid
      totalHours: actualStandbyCount * 4, // Estimate 4 hours per standby
      percentage: totalDuties > 0 ? (actualStandbyCount / totalDuties) * 100 : 0,
      averageEarningsPerDuty: 0,
      averageHoursPerDuty: 4
    }
  ]; // Remove filter to always include all duty types

  // Calculate profitability analysis
  const profitabilityAnalysis: DutyTypeProfitability[] = dutyTypeBreakdown
    .map(duty => ({
      dutyType: duty.dutyType,
      earningsPerHour: duty.totalHours > 0 ? duty.totalEarnings / duty.totalHours : 0,
      efficiency: 'medium' as 'high' | 'medium' | 'low',
      rank: 0
    }))
    .sort((a, b) => b.earningsPerHour - a.earningsPerHour)
    .map((duty, index) => ({
      ...duty,
      rank: index + 1,
      efficiency: index === 0 ? 'high' : index === dutyTypeBreakdown.length - 1 ? 'low' : 'medium'
    }));

  return {
    dutyTypeBreakdown,
    profitabilityAnalysis,
    totalDuties,
    totalEarnings
  };
}

/**
 * Main statistics calculation function
 */
export function calculateStatistics(
  monthlyCalculations: MonthlyCalculation[],
  flightDuties: FlightDuty[] = []
): StatisticsCalculationResult {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Sort calculations by date
  const sortedCalculations = monthlyCalculations.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const ytdData = calculateYTDData(sortedCalculations, currentYear);
  const monthlyComparison = calculateMonthlyComparison(sortedCalculations, currentMonth, currentYear);
  const payComponentBreakdown = calculatePayComponentBreakdown(sortedCalculations);
  const monthlyTrends = calculateMonthlyTrends(sortedCalculations);

  // Calculate duty type stats from monthly calculations
  const dutyTypeStats = calculateDutyTypeStats(sortedCalculations);

  // Determine data range
  const dataRange = {
    startMonth: sortedCalculations[0]?.month || currentMonth,
    startYear: sortedCalculations[0]?.year || currentYear,
    endMonth: sortedCalculations[sortedCalculations.length - 1]?.month || currentMonth,
    endYear: sortedCalculations[sortedCalculations.length - 1]?.year || currentYear
  };

  return {
    ytdData,
    monthlyComparison,
    payComponentBreakdown,
    dutyTypeStats,
    monthlyTrends,
    calculatedAt: new Date(),
    dataRange
  };
}

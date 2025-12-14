/**
 * Statistics Types for Skywage Application
 * Defines interfaces for statistics data structures and calculations
 */

// Year-to-Date earnings data
export interface YTDData {
  totalEarnings: number;
  fixedEarnings: number;
  variableEarnings: number;
  flightPay: number;
  perDiemPay: number;
  asbyPay: number;
  monthlyProgression: MonthlyProgressionPoint[];
  comparisonToPreviousYear: {
    previousYearTotal: number;
    percentageChange: number;
    isIncrease: boolean;
  };
}

// Monthly progression point for YTD chart
export interface MonthlyProgressionPoint {
  month: number;
  monthName: string;
  cumulativeEarnings: number;
  monthlyEarnings: number;
  fixedEarnings: number;
  variableEarnings: number;
}

// Monthly comparison data
export interface MonthlyComparison {
  currentMonth: {
    month: number;
    year: number;
    totalEarnings: number;
    flightPay: number;
    perDiemPay: number;
    dutyHours: number;
    flightCount: number;
  };
  previousMonth: {
    month: number;
    year: number;
    totalEarnings: number;
    flightPay: number;
    perDiemPay: number;
    dutyHours: number;
    flightCount: number;
  } | null;
  comparison: {
    earningsChange: number;
    earningsPercentChange: number;
    isIncrease: boolean;
  };
  bestMonth: {
    month: number;
    year: number;
    totalEarnings: number;
  };
  worstMonth: {
    month: number;
    year: number;
    totalEarnings: number;
  };
}

// Monthly trend data for charts
export interface MonthlyTrendData {
  month: number;
  year: number;
  monthName: string;
  totalEarnings: number;
  flightPay: number;
  perDiemPay: number;
  asbyPay: number;
  dutyHours: number;
  flightCount: number;
}

// Pay component breakdown data
export interface PayComponentBreakdown {
  monthlyBreakdown: PayComponentMonth[];
  overallBalance: {
    flightPayPercentage: number;
    perDiemPercentage: number;
    asbyPercentage: number;
    trend: 'increasing_flight' | 'increasing_perdiem' | 'stable';
  };
}

// Monthly pay component data
export interface PayComponentMonth {
  month: number;
  year: number;
  monthName: string;
  flightPay: number;
  perDiemPay: number;
  asbyPay: number;
  totalPay: number;
  flightPayPercentage: number;
  perDiemPercentage: number;
  asbyPayPercentage: number;
}

// Duty type statistics
export interface DutyTypeStats {
  dutyTypeBreakdown: DutyTypeBreakdownItem[];
  profitabilityAnalysis: DutyTypeProfitability[];
  totalDuties: number;
  totalEarnings: number;
}

// Individual duty type breakdown
export interface DutyTypeBreakdownItem {
  dutyType: 'turnaround' | 'layover' | 'asby' | 'recurrent' | 'sby' | 'off' | 'business_promotion';
  count: number;
  totalEarnings: number;
  totalHours: number;
  percentage: number;
  averageEarningsPerDuty: number;
  averageHoursPerDuty: number;
}

// Duty type profitability analysis
export interface DutyTypeProfitability {
  dutyType: 'turnaround' | 'layover' | 'asby' | 'recurrent' | 'sby' | 'off' | 'business_promotion';
  earningsPerHour: number;
  efficiency: 'high' | 'medium' | 'low';
  rank: number;
}

// Top duty rankings by flight pay
export interface TopDutyRankingEntry {
  rank: number;
  date: Date;
  flightPay: number;
  routing: string; // e.g., "DXB-ZAG" or "DXB → ZAG → DXB"
  flightNumbers: string[]; // e.g., ["FZ123", "FZ124"]
}

export interface TopDutyRankings {
  turnarounds: TopDutyRankingEntry[];
  layovers: TopDutyRankingEntry[];
}

// Chart data interfaces for visualization
export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
  [key: string]: unknown; // Allow additional chart properties (e.g., tooltips, metadata)
}

export interface AreaChartDataPoint {
  month: string;
  flightPay: number;
  perDiemPay: number;
  asbyPay: number;
  total: number;
}

export interface BarChartDataPoint {
  month: string;
  earnings: number;
  trend: number;
}

// Statistics calculation result
export interface StatisticsCalculationResult {
  ytdData: YTDData;
  monthlyComparison: MonthlyComparison;
  payComponentBreakdown: PayComponentBreakdown;
  dutyTypeStats: DutyTypeStats;
  monthlyTrends: MonthlyTrendData[];
  topDutyRankings: TopDutyRankings;
  calculatedAt: Date;
  dataRange: {
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
  };
}

// Hook return types
export interface UseStatisticsDataReturn {
  data: StatisticsCalculationResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  availableYears: number[];
}

export interface UseChartDataReturn {
  ytdChartData: MonthlyProgressionPoint[];
  monthlyTrendData: BarChartDataPoint[];
  payComponentData: AreaChartDataPoint[];
  dutyTypeChartData: ChartDataPoint[];
  loading: boolean;
}

// Utility types for calculations
export interface StatisticsFilters {
  startDate?: Date;
  endDate?: Date;
  dutyTypes?: ('turnaround' | 'layover' | 'asby' | 'recurrent' | 'sby' | 'off')[];
  includeCurrentMonth?: boolean;
}

export interface StatisticsConfig {
  currentYear: number;
  currentMonth: number;
  includeProjections: boolean;
  comparisonPeriod: 'month' | 'quarter' | 'year';
}

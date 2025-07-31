# Statistics Page Implementation Plan

## Overview

This document outlines the phased approach to building the Statistics page for the Skywage application. The page will provide comprehensive analytics and insights for airline crew members to track their earnings, flight operations, and performance trends.

## Phase 1: Essential Analytics (Core Features) ✅ COMPLETED

**Timeline: 1-2 weeks**
**Priority: HIGH - Must-have features**

### 1.1 Page Structure & Layout ✅

- [x] Create basic Statistics page layout with header and responsive grid system
- [x] Implement responsive design matching dashboard styling with rounded cards
- [x] Add proper loading states, error handling, and no-data states
- [x] Refined layout: YTD full-width top, Monthly Comparisons + Duty Types bottom row

### 1.2 Data Infrastructure ✅

- [x] Create comprehensive statistics data fetching hooks (`useStatisticsData.ts`)
- [x] Implement robust data transformation utilities for charts (`calculations.ts`)
- [x] Set up automatic refresh integration with existing dashboard patterns
- [x] Add complete TypeScript interfaces for statistics data structures (`statistics.ts`)
- [x] Create chart helper utilities with brand colors and formatting (`chartHelpers.ts`)

### 1.3 Year-to-Date Earnings Breakdown ✅

- [x] **YTD Total Earnings Card**
  - Current year total with comparison to previous year
  - Previous year percentage change indicator
  - Fixed vs Variable breakdown with percentages
- [x] **YTD Progression Chart**
  - Monthly cumulative earnings area chart with gradient
  - Smart chart logic: stops at last month with data (no empty months)
  - Interactive tooltips with monthly and cumulative breakdowns
- [x] **Variable Pay Breakdown**
  - Detailed Flight Pay, Per Diem, and ASBY pay components
  - Color-coded breakdown with totals

### 1.4 Monthly Comparisons ✅

- [x] **Performance Comparison Cards**
  - Current month vs previous month with change indicators
  - Visual trend indicators (up/down arrows)
  - Month-over-month percentage change
- [x] **Best/Worst Month Identification**
  - Highlighted best and worst performing months
  - Clear visual distinction with appropriate colors
- [x] **Monthly Trend Chart**
  - Bar chart showing last 12 months earnings
  - Current month highlighted in primary color
  - Interactive tooltips with detailed information
- [x] **Performance Insights**
  - Automated insights about performance trends
  - Comparison to best month performance

### 1.5 Breakdown by Duty Types ✅

- [x] **Duty Distribution Chart**
  - Interactive pie chart showing paid duty type frequency
  - Excludes unpaid duties from visual chart for clarity
  - Custom tooltips with count, earnings, and percentage
- [x] **Comprehensive Duty List**
  - All duty types including unpaid Standby (SBY) duties
  - Total earnings per duty type (or "No Pay" for standby)
  - Count and percentage for each duty type
  - Color-coded icons for easy identification
- [x] **Summary Statistics**
  - Total duties count in clean, focused display
  - Removed redundant total earnings to avoid duplication

### 1.6 Removed/Refined Features

- [x] **Removed Flight Pay vs Per Diem Component** - Redundant with YTD variable pay breakdown
- [x] **Removed Profitability Analysis** - Simplified duty types to focus on distribution
- [x] **Removed Key Insights** - Streamlined for cleaner presentation
- [x] **Removed Per Duty Calculations** - Focus on total amounts only

## Phase 2: Advanced Analytics (Enhanced Features)

**Timeline: 2-3 weeks**
**Priority: MEDIUM - Value-added features**

### 2.1 Flight Operations Analytics

- [ ] **Total Duty Hours Tracking**
  - Monthly and yearly duty hours charts
  - Duty hours vs flight hours comparison
  - Efficiency ratios and trends
- [ ] **Route Analysis**
  - Most frequent routes/sectors visualization
  - Route profitability analysis
  - Geographic distribution (if applicable)

### 2.2 Rest & Schedule Analytics

- [ ] **Rest Period Statistics**
  - Average layover duration trends
  - Rest time distribution charts
  - Per diem earnings correlation with rest time
- [ ] **Schedule Density Analysis**
  - Working days vs rest days ratio
  - Peak working periods identification
  - Workload intensity heatmap

### 2.3 Performance Insights

- [ ] **Peak Working Periods**
  - Seasonal pattern analysis
  - Busiest months/quarters identification
  - Earnings correlation with activity levels
- [ ] **Work-Life Balance Metrics**
  - Days worked vs days off tracking
  - Schedule regularity analysis
  - Burnout risk indicators

## Phase 3: Personal Records & Achievements

**Timeline: 1-2 weeks**
**Priority: LOW - Nice-to-have features**

### 3.1 Achievement Tracking

- [ ] **Personal Records Dashboard**
  - Highest monthly earnings badge
  - Most flight hours in a month
  - Longest layover record
  - Personal milestones timeline
- [ ] **Goal Setting & Tracking**
  - Monthly earnings targets
  - Annual goals progress
  - Achievement notifications

### 3.2 Advanced Visualizations

- [ ] **Interactive Charts**
  - Drill-down capabilities
  - Custom date range selection
  - Export functionality for charts
- [ ] **Comparative Analysis**
  - Year-over-year comparisons
  - Seasonal pattern overlays
  - Performance benchmarking

## Technical Implementation Details

### Data Sources

- **Primary**: `MonthlyCalculation` table for aggregated data
- **Secondary**: `FlightDuty` table for detailed flight information
- **Computed**: Real-time calculations for trends and comparisons

### Chart Libraries

- **Recharts**: Primary charting library (already used in dashboard)
- **Chart Types**: Area, Line, Bar, Pie, Stacked charts
- **Styling**: ShadCN UI components with brand colors

### State Management

```typescript
interface StatisticsState {
  allMonthlyCalculations: MonthlyCalculation[];
  yearToDateData: YTDData;
  monthlyComparisons: MonthlyComparison[];
  dutyTypeBreakdown: DutyTypeStats[];
  loading: boolean;
  error: string | null;
}
```

### Auto-Refresh Integration

- Leverage existing `getAllMonthlyCalculations()` pattern
- Listen for dashboard data updates
- Implement optimistic UI updates
- Cache frequently accessed calculations

## File Structure ✅ IMPLEMENTED

```
src/app/(dashboard)/statistics/
├── page.tsx                 # ✅ Main statistics page
├── components/
│   ├── YTDEarningsCard.tsx  # ✅ Implemented
│   ├── MonthlyComparisonCard.tsx # ✅ Implemented
│   ├── DutyTypesCard.tsx    # ✅ Implemented
│   └── [PayBreakdownCard.tsx] # ❌ Removed (redundant)
├── hooks/
│   └── useStatisticsData.ts # ✅ Implemented
├── lib/statistics/
│   ├── calculations.ts      # ✅ Implemented
│   └── chartHelpers.ts      # ✅ Implemented
└── types/
    └── statistics.ts        # ✅ Implemented
```

## Success Metrics

- **Phase 1**: Core analytics functional with real data
- **Phase 2**: Advanced insights providing actionable information
- **Phase 3**: Complete analytics suite with personal tracking

## Dependencies

- Existing dashboard data infrastructure
- ShadCN UI components
- Recharts library
- TypeScript interfaces from salary calculator

## Risk Mitigation

- **Data Consistency**: Use same data sources as dashboard
- **Performance**: Implement data caching and lazy loading
- **User Experience**: Progressive enhancement approach
- **Testing**: Unit tests for calculations, integration tests for data flow

---

## ✅ PHASE 1 COMPLETION STATUS

**Phase 1 Successfully Completed!** All essential analytics features have been implemented and refined based on user feedback.

### Key Achievements:

- **3 Core Components**: YTD Earnings, Monthly Comparisons, Duty Types Analysis
- **Smart Chart Logic**: YTD chart stops at last month with data
- **Clean UI/UX**: Refined layout with user-requested improvements
- **Complete Data Flow**: Auto-refresh integration with dashboard
- **Responsive Design**: Works across all screen sizes

### Refinements Made:

- Removed redundant Flight Pay vs Per Diem component
- Simplified Duty Types Analysis (removed profitability rankings)
- Added Standby duties to distribution list
- Removed per-duty calculations for cleaner display
- Optimized chart rendering for better performance

---

**Next Steps**: Phase 1 complete. Ready to proceed with Phase 2 (Advanced Analytics) or additional refinements as needed.

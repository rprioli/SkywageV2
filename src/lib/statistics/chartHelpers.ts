/**
 * Chart Helper Utilities
 * Formatting and utility functions for statistics charts
 */

/**
 * Format currency for chart displays
 */
export function formatCurrency(amount: number, compact: boolean = false): string {
  if (compact && amount >= 1000) {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      notation: 'compact'
    }).format(amount);
  }

  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0
  }).format(amount);
}

/**
 * Format percentage for displays
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get month name from month number
 */
export function getMonthName(month: number, short: boolean = true): string {
  const date = new Date(2024, month - 1, 1);
  return date.toLocaleDateString('en-US', { 
    month: short ? 'short' : 'long' 
  });
}

/**
 * Get month name with year (e.g., "Jan '25")
 */
export function getMonthYearLabel(month: number, year: number, short: boolean = true): string {
  const monthName = getMonthName(month, short);
  const yearShort = year.toString().slice(-2);
  return `${monthName} '${yearShort}`;
}

/**
 * Get brand colors for charts
 */
export const CHART_COLORS = {
  primary: '#4C49ED',      // Primary purple
  accent: '#6DDC91',       // Accent green
  secondary: '#FF6B6B',    // Red
  tertiary: '#4ECDC4',     // Teal
  quaternary: '#F39C12',   // Orange
  neutral: '#95A5A6',      // Gray
  light: '#BDC3C7',        // Light gray
  success: '#27AE60',      // Success green
  warning: '#F1C40F',      // Warning yellow
  danger: '#E74C3C'        // Danger red
};

/**
 * Get color palette for multi-series charts
 */
export function getColorPalette(count: number): string[] {
  const colors = Object.values(CHART_COLORS);
  const palette: string[] = [];
  
  for (let i = 0; i < count; i++) {
    palette.push(colors[i % colors.length]);
  }
  
  return palette;
}

/**
 * Calculate chart dimensions based on container
 */
export function getChartDimensions(containerWidth: number, aspectRatio: number = 0.6) {
  return {
    width: containerWidth,
    height: containerWidth * aspectRatio
  };
}

/**
 * Generate gradient definitions for area charts
 */
export function generateGradientDefs(colors: { [key: string]: string }) {
  return Object.entries(colors).map(([key, color]) => (
    `<defs>
      <linearGradient id="gradient${key}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="${color}" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="${color}" stopOpacity={0.1}/>
      </linearGradient>
    </defs>`
  )).join('');
}

/**
 * Custom tooltip formatter for currency values
 */
export function formatTooltipCurrency(value: number, name: string): [string, string] {
  return [formatCurrency(value), name];
}

/**
 * Custom label formatter for month/year
 */
export function formatMonthYearLabel(label: string, payload: unknown[]): string {
  if (payload && payload.length > 0) {
    const firstItem = payload[0] as { payload?: { year?: number; month?: number } };
    if (firstItem.payload) {
      const data = firstItem.payload;
      if (data.year && data.month) {
        return `${getMonthName(data.month)} ${data.year}`;
      }
    }
  }
  return label;
}

/**
 * Calculate Y-axis domain with padding
 */
export function calculateYAxisDomain(data: number[], padding: number = 0.1): [number, number] {
  if (data.length === 0) return [0, 100];
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  return [
    Math.max(0, min - (range * padding)),
    max + (range * padding)
  ];
}

/**
 * Generate tick values for Y-axis
 */
export function generateYAxisTicks(min: number, max: number, count: number = 5): number[] {
  const step = (max - min) / (count - 1);
  const ticks: number[] = [];
  
  for (let i = 0; i < count; i++) {
    ticks.push(min + (step * i));
  }
  
  return ticks;
}

/**
 * Format large numbers for axis labels
 */
export function formatAxisLabel(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Get responsive chart configuration
 */
export function getResponsiveConfig(screenSize: 'sm' | 'md' | 'lg' | 'xl') {
  const configs = {
    sm: {
      margin: { top: 10, right: 10, left: 10, bottom: 10 },
      fontSize: 10,
      strokeWidth: 1,
      dotSize: 3
    },
    md: {
      margin: { top: 15, right: 15, left: 15, bottom: 15 },
      fontSize: 12,
      strokeWidth: 2,
      dotSize: 4
    },
    lg: {
      margin: { top: 20, right: 20, left: 20, bottom: 20 },
      fontSize: 14,
      strokeWidth: 2,
      dotSize: 5
    },
    xl: {
      margin: { top: 25, right: 25, left: 25, bottom: 25 },
      fontSize: 16,
      strokeWidth: 3,
      dotSize: 6
    }
  };
  
  return configs[screenSize];
}

/**
 * Animation configuration for charts
 */
export const CHART_ANIMATIONS = {
  duration: 750,
  easing: 'ease-out',
  delay: 0
};

/**
 * Common chart props for consistency
 */
export const COMMON_CHART_PROPS = {
  margin: { top: 20, right: 30, left: 20, bottom: 20 },
  animationDuration: CHART_ANIMATIONS.duration
};

/**
 * Utility to determine if a value represents growth
 */
export function isGrowth(current: number, previous: number): boolean {
  return current > previous;
}

/**
 * Calculate growth percentage
 */
export function calculateGrowthPercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get trend indicator (up, down, stable)
 */
export function getTrendIndicator(current: number, previous: number): 'up' | 'down' | 'stable' {
  const threshold = 0.01; // 1% threshold for "stable"
  const change = calculateGrowthPercentage(current, previous);
  
  if (Math.abs(change) < threshold) return 'stable';
  return change > 0 ? 'up' : 'down';
}

/**
 * Format duration in hours and minutes
 */
export function formatDuration(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${wholeHours}h`;
  } else {
    return `${wholeHours}h ${minutes}m`;
  }
}

/**
 * Get color based on performance (good, average, poor)
 */
export function getPerformanceColor(value: number, benchmarks: { good: number; average: number }): string {
  if (value >= benchmarks.good) return CHART_COLORS.success;
  if (value >= benchmarks.average) return CHART_COLORS.warning;
  return CHART_COLORS.danger;
}

/**
 * Debounce function for chart resize events
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

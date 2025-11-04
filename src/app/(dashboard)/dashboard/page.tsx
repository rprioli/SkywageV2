'use client';

/**
 * Main Dashboard Page for Skywage - Enhanced UI with Salary Calculator
 * Modern dashboard design inspired by reference with gradient cards and visual hierarchy
 * Preserves all existing flight duty components and Phase 6 functionality
 */

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Upload, FileText, Plane, Trash2, Plus, Clock, Banknote, UtensilsCrossed, Menu } from 'lucide-react';
import { ResponsiveContainer, XAxis, Bar, BarChart, Cell } from 'recharts';
import { MonthlyCalculation, FlightDuty, Position } from '@/types/salary-calculator';

// Constants
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
import { getMonthlyCalculation, getAllMonthlyCalculations } from '@/lib/database/calculations';
import { getFlightDutiesByMonth, deleteFlightDuty } from '@/lib/database/flights';
import { FlightDutiesManager } from '@/components/salary-calculator/FlightDutiesManager';
import { ProcessingStatus } from '@/components/salary-calculator/ProcessingStatus';
import { ManualFlightEntry } from '@/components/salary-calculator/ManualFlightEntry';
import { useToast } from '@/hooks/use-toast';
import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import {
  processFileUploadWithReplacement,
  checkForExistingData,
  ProcessingStatus as ProcessingStatusType,
  validateFileQuick,
  type ExistingDataCheck
} from '@/lib/salary-calculator/upload-processor';
import { recalculateMonthlyTotals } from '@/lib/salary-calculator/recalculation-engine';
import { RosterReplacementDialog } from '@/components/salary-calculator/RosterReplacementDialog';
import { getProfile } from '@/lib/db';

// Monthly Overview Card Component - Extracted to prevent recreation on parent re-renders
const MonthlyOverviewCard = memo(({
  allMonthlyCalculations,
  selectedOverviewMonth,
  setSelectedOverviewMonth,
  setHasUserSelectedMonth,
  setIsMonthSwitching,
  monthlyDataLoading,
  selectedData
}: {
  allMonthlyCalculations: MonthlyCalculation[];
  selectedOverviewMonth: number;
  setSelectedOverviewMonth: (month: number) => void;
  setHasUserSelectedMonth: (selected: boolean) => void;
  setIsMonthSwitching: (switching: boolean) => void;
  monthlyDataLoading: boolean;
  isMonthSwitching: boolean;
  selectedData: { totalSalary: number; dutyHours: number; totalDuties: number };
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // Hover state for enhanced interactivity
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Memoized month selection handler for smooth transitions
  const handleMonthSelection = useCallback((index: number) => {
    // Immediate month selection for smooth chart transition
    setSelectedOverviewMonth(index);
    setHasUserSelectedMonth(true);
    // Set switching state for other UI elements (not chart)
    setIsMonthSwitching(true);
  }, [setSelectedOverviewMonth, setHasUserSelectedMonth, setIsMonthSwitching]);

  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    const data = [];

    // Find the maximum salary to normalize the chart values
    const maxSalary = Math.max(...allMonthlyCalculations.map(calc => calc.totalSalary), 1);

    for (let i = 0; i < 12; i++) {
      const monthCalc = allMonthlyCalculations.find(calc =>
        calc.month === i + 1 && calc.year === currentYear
      );

      // Normalize values to 0-100 range for better chart display
      const normalizedValue = monthCalc ? Math.round((monthCalc.totalSalary / maxSalary) * 100) : 0;

      data.push({
        month: MONTHS[i],
        value: normalizedValue
      });
    }

    return data;
  }, [allMonthlyCalculations, currentYear]);

  // Enhanced color logic for smooth transitions
  const getBarColor = (index: number) => {
    if (index === selectedOverviewMonth) {
      return '#4C49ED'; // Active: Dark purple
    } else if (index === hoveredIndex) {
      return 'rgba(76, 73, 237, 0.4)'; // Hover: Medium purple
    } else {
      return 'rgba(76, 73, 237, 0.08)'; // Inactive: Light purple
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="bg-white rounded-3xl !border-0 !shadow-none overflow-hidden">
      <CardContent className="card-responsive-padding">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 md:mb-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-responsive-2xl font-bold space-responsive-md" style={{ color: '#3A3780' }}>Overview</h2>
            <div className="text-responsive-5xl font-bold space-responsive-sm" style={{
              color: '#3A3780',
              transition: 'opacity 0.2s ease-in-out'
            }}>
              {monthlyDataLoading ? '...' : formatCurrency(selectedData.totalSalary)}
            </div>
            <p className="text-responsive-sm text-gray-500">
              {selectedData.totalSalary === 0 && !monthlyDataLoading ?
                `${MONTHS[selectedOverviewMonth]} - No Data` :
                (() => {
                  const nextMonth = selectedOverviewMonth === 11 ? 0 : selectedOverviewMonth + 1;
                  const nextYear = selectedOverviewMonth === 11 ? new Date().getFullYear() + 1 : new Date().getFullYear();
                  return `Expected Salary for ${MONTHS[nextMonth]}, ${nextYear}`;
                })()
              }
            </p>
          </div>
        </div>

        {/* Chart Area - Optimized for mobile with extended width */}
        <div className="h-56 md:h-48 w-full -mx-2 md:mx-0">
          {monthlyDataLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-responsive-sm">Loading chart data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 8,
                  left: 8,
                  bottom: 5
                }}
                barCategoryGap="12%"
              >
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: '#6B7280',
                    fontWeight: 500
                  }}
                  interval={0}
                  tickMargin={8}
                />
                <Bar
                  dataKey="value"
                  radius={[10, 10, 0, 0]}
                  isAnimationActive={!monthlyDataLoading}
                  animationDuration={400}
                  animationEasing="ease-in-out"
                  animationBegin={0}
                  cursor="pointer"
                  maxBarSize={50}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColor(index)}
                      onClick={() => handleMonthSelection(index)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      role="button"
                      aria-label={`Select month ${entry.month}`}
                      style={{
                        cursor: 'pointer',
                        transition: 'fill 0.4s ease-in-out, transform 0.2s ease-in-out',
                        transformOrigin: 'bottom center'
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

MonthlyOverviewCard.displayName = 'MonthlyOverviewCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const { salaryCalculator, showError } = useToast();
  const [currentMonthCalculation, setCurrentMonthCalculation] = useState<MonthlyCalculation | null>(null);
  const [flightDuties, setFlightDuties] = useState<FlightDuty[]>([]);
  const [loading, setLoading] = useState(true);
  const [allMonthlyCalculations, setAllMonthlyCalculations] = useState<MonthlyCalculation[]>([]);
  const [monthlyDataLoading, setMonthlyDataLoading] = useState(true);

  // Add state for overview month selection (lifted from MonthlyOverviewCard)
  const [selectedOverviewMonth, setSelectedOverviewMonth] = useState<number>(new Date().getMonth());
  const [hasUserSelectedMonth, setHasUserSelectedMonth] = useState<boolean>(false);
  const [isMonthSwitching, setIsMonthSwitching] = useState<boolean>(false);

  // Initialize overview month based on available data (only on first load)
  useEffect(() => {
    if (!monthlyDataLoading && allMonthlyCalculations.length > 0 && !hasUserSelectedMonth) {
      const currentMonthIndex = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const currentMonthData = allMonthlyCalculations.find(calc =>
        calc.month === currentMonthIndex + 1 && calc.year === currentYear
      );

      if (currentMonthData) {
        setSelectedOverviewMonth(currentMonthIndex);
      } else {
        // Use the most recent month with data (avoid mutating state array)
        const sortedCalculations = [...allMonthlyCalculations].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        setSelectedOverviewMonth(sortedCalculations[0].month - 1); // Convert to 0-based index
      }
    }
  }, [monthlyDataLoading, allMonthlyCalculations, hasUserSelectedMonth]);

  // Update currentMonthCalculation when selectedOverviewMonth changes
  useEffect(() => {
    if (allMonthlyCalculations.length > 0) {
      const currentYear = new Date().getFullYear();
      const selectedMonth = selectedOverviewMonth + 1; // Convert from 0-based to 1-based

      const selectedMonthData = allMonthlyCalculations.find(calc =>
        calc.month === selectedMonth && calc.year === currentYear
      );

      if (selectedMonthData) {
        setCurrentMonthCalculation(selectedMonthData);
      } else {
        setCurrentMonthCalculation(null);
      }
    }
  }, [selectedOverviewMonth, allMonthlyCalculations]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedFlightForDelete, setSelectedFlightForDelete] = useState<FlightDuty | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedFlightsForBulkDelete, setSelectedFlightsForBulkDelete] = useState<FlightDuty[]>([]);
  const [deleteProcessing, setDeleteProcessing] = useState(false);

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [manualEntryModalOpen, setManualEntryModalOpen] = useState(false);
  const [selectedUploadMonth, setSelectedUploadMonth] = useState<number | null>(null);

  // Upload states
  const [uploadState, setUploadState] = useState<'month' | 'upload' | 'processing'>('month');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType | null>(null);

  // Roster replacement state
  const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
  const [existingDataCheck, setExistingDataCheck] = useState<ExistingDataCheck | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [replacementProcessing, setReplacementProcessing] = useState(false);

  // User position state - load from database profile (source of truth)
  const [userPosition, setUserPosition] = useState<Position>('CCM');
  const [userPositionLoading, setUserPositionLoading] = useState(true);

  // Load user position from database profile (source of truth)
  useEffect(() => {
    const loadUserPosition = async () => {
      if (!user?.id) return;

      try {
        setUserPositionLoading(true);
        const { data: profile, error } = await getProfile(user.id);

        if (profile && !error && profile.position) {
          setUserPosition(profile.position as Position);
        } else {
          // Fallback to auth metadata if database fails
          console.warn('Failed to load position from profile, using auth metadata fallback');
          setUserPosition((user?.user_metadata?.position as Position) || 'CCM');
        }
      } catch (error) {
        console.error('Error loading user position:', error);
        // Fallback to auth metadata
        setUserPosition((user?.user_metadata?.position as Position) || 'CCM');
      } finally {
        setUserPositionLoading(false);
      }
    };

    loadUserPosition();
  }, [user?.id, user?.user_metadata?.position]);

  // Refresh data after deletion and trigger recalculation
  const refreshDataAfterDelete = useCallback(async () => {
    if (!user?.id) return;

    // Wait for user position to be loaded
    if (userPositionLoading) {
      showError("Loading Profile", {
        description: "Please wait for user profile to load before refreshing data.",
      });
      return;
    }

    try {
      const currentYear = new Date().getFullYear();
      const selectedMonth = selectedOverviewMonth + 1; // Convert from 0-based to 1-based

      console.log('🔄 REFRESH AFTER DELETE: Starting refresh for month', selectedMonth, 'year', currentYear);

      // CRITICAL FIX: Trigger recalculation FIRST before fetching updated data
      const recalcResult = await recalculateMonthlyTotals(user.id, selectedMonth, currentYear, userPosition as Position);

      if (!recalcResult.success) {
        console.log('🚨 REFRESH AFTER DELETE: Recalculation failed:', recalcResult.errors);
        showError("Recalculation Failed", {
          description: `Failed to recalculate monthly totals: ${recalcResult.errors.join(', ')}`,
        });
        return;
      }

      console.log('✅ REFRESH AFTER DELETE: Recalculation successful');

      // Now refresh monthly calculation for the currently selected month
      const calculationResult = await getMonthlyCalculation(
        user.id,
        selectedMonth,
        currentYear
      );

      if (calculationResult.data && !calculationResult.error) {
        setCurrentMonthCalculation(calculationResult.data);
        console.log('✅ REFRESH AFTER DELETE: Updated monthly calculation - Total Salary:', calculationResult.data.totalSalary, 'Per Diem:', calculationResult.data.perDiemPay);
      } else {
        console.log('⚠️ REFRESH AFTER DELETE: No monthly calculation found or error:', calculationResult.error);
        setCurrentMonthCalculation(null);
      }

      // Refresh all monthly calculations for chart data
      const allCalculationsResult = await getAllMonthlyCalculations(user.id);
      if (allCalculationsResult.data && !allCalculationsResult.error) {
        setAllMonthlyCalculations(allCalculationsResult.data);
        console.log('✅ REFRESH AFTER DELETE: Updated all monthly calculations count:', allCalculationsResult.data.length);
      }

      // Force refresh flight duties for the selected month
      const flightDutiesResult = await getFlightDutiesByMonth(user.id, selectedMonth, currentYear);
      if (flightDutiesResult.data && !flightDutiesResult.error) {
        setFlightDuties(flightDutiesResult.data);
        console.log('✅ REFRESH AFTER DELETE: Updated flight duties count:', flightDutiesResult.data.length);
      } else {
        setFlightDuties([]);
        console.log('⚠️ REFRESH AFTER DELETE: No flight duties found');
      }

    } catch (error) {
      showError("Refresh Failed", {
        description: error instanceof Error ? error.message : 'Unknown error occurred during refresh',
      });
    }
  }, [user?.id, userPositionLoading, selectedOverviewMonth, userPosition, showError]);

  // Refresh user position (can be called when position is updated)
  const refreshUserPosition = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: profile, error } = await getProfile(user.id);

      if (profile && !error && profile.position) {
        setUserPosition(profile.position as Position);

        // Refresh all data with new position
        await refreshDataAfterDelete();
      }
    } catch (error) {
      console.error('Error refreshing user position:', error);
    }
  }, [user?.id, refreshDataAfterDelete]);

  // Listen for position updates from profile page
  useEffect(() => {
    const handlePositionUpdate = () => {
      refreshUserPosition();
    };

    window.addEventListener('userPositionUpdated', handlePositionUpdate);

    return () => {
      window.removeEventListener('userPositionUpdated', handlePositionUpdate);
    };
  }, [user?.id, refreshUserPosition]);

  // Fetch current month's salary calculation and all monthly data
  useEffect(() => {
    const fetchCurrentCalculation = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // First try to fetch current month calculation
        const calculationResult = await getMonthlyCalculation(
          user.id,
          currentMonth,
          currentYear
        );

        // If no current month data, try to find the most recent month with data
        if (!calculationResult.data || calculationResult.error) {
          const allCalculationsResult = await getAllMonthlyCalculations(user.id);
          if (allCalculationsResult.data && allCalculationsResult.data.length > 0) {
            // Sort by year and month to get the most recent
            const sortedCalculations = [...allCalculationsResult.data].sort((a, b) => {
              if (a.year !== b.year) return b.year - a.year;
              return b.month - a.month;
            });
            const mostRecent = sortedCalculations[0];
            setCurrentMonthCalculation(mostRecent);
          }
        } else {
          setCurrentMonthCalculation(calculationResult.data);
        }

        // Note: Flight duties will be loaded by the month-synchronized useEffect
        // This ensures flight duties are always in sync with the selected overview month
      } catch (error) {
        console.error('Error fetching calculation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentCalculation();
  }, [user?.id]);

  // Synchronize flight duties with selected overview month
  useEffect(() => {
    let cancelled = false;
    const fetchFlightDutiesForSelectedMonth = async () => {
      if (!user?.id) return;

      try {
        const currentYear = new Date().getFullYear();
        const selectedMonth = selectedOverviewMonth + 1; // Convert from 0-based to 1-based

        // Coordinated loading: await duties before clearing switching flag
        const flightDutiesResult = await getFlightDutiesByMonth(user.id, selectedMonth, currentYear);

        if (!cancelled) {
          if (flightDutiesResult.data && !flightDutiesResult.error) {
            setFlightDuties(flightDutiesResult.data);
          } else {
            setFlightDuties([]);
          }
          setIsMonthSwitching(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching flight duties for selected month:', error);
          setFlightDuties([]);
          setIsMonthSwitching(false);
        }
      }
    };

    fetchFlightDutiesForSelectedMonth();
    return () => { cancelled = true; };
  }, [user?.id, selectedOverviewMonth]); // Re-run when user or selected month changes

  // Fetch all monthly calculations for chart data
  useEffect(() => {
    const fetchAllMonthlyData = async () => {
      if (!user?.id) return;

      try {
        setMonthlyDataLoading(true);
        const allCalculationsResult = await getAllMonthlyCalculations(user.id);

        if (allCalculationsResult.data && !allCalculationsResult.error) {
          setAllMonthlyCalculations(allCalculationsResult.data);
        }
      } catch (error) {
        console.error('Error fetching all monthly calculations:', error);
      } finally {
        setMonthlyDataLoading(false);
      }
    };

    fetchAllMonthlyData();
  }, [user?.id]);

  // Handle upload modal opening
  const handleUploadClick = () => {
    setUploadModalOpen(true);
    setUploadState('month');
    setSelectedUploadMonth(null);
    setProcessingStatus(null);
  };

  // Handle month selection for upload - automatically trigger file selection
  const handleMonthSelect = (month: number) => {
    setSelectedUploadMonth(month);
    setUploadState('upload');

    // Automatically trigger file selection after a brief delay
    setTimeout(() => {
      const fileInput = document.getElementById('roster-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }, 100);
  };

  // Refresh dashboard data after successful upload
  const refreshDashboardData = async (effectiveUserId: string, uploadMonth: number) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Refresh all monthly calculations for chart data first
    const allCalculationsResult = await getAllMonthlyCalculations(effectiveUserId);
    if (allCalculationsResult.data && !allCalculationsResult.error) {
      setAllMonthlyCalculations(allCalculationsResult.data);
    }

    // Check if the uploaded month matches the currently selected month
    const currentlySelectedMonth = selectedOverviewMonth + 1; // Convert from 0-based to 1-based
    const shouldUpdateDisplayedData = uploadMonth === currentlySelectedMonth;

    if (shouldUpdateDisplayedData) {
      // Only refresh displayed data if the uploaded month matches the user's selected month
      console.log(`Upload matches selected month (${uploadMonth}), refreshing displayed data`);

      // Refresh flight duties for the uploaded month
      const flightDutiesResult = await getFlightDutiesByMonth(
        effectiveUserId,
        uploadMonth,
        currentYear
      );
      if (flightDutiesResult.data && !flightDutiesResult.error) {
        setFlightDuties(flightDutiesResult.data);
      }

      // Refresh monthly calculation for the uploaded month
      const calculationResult = await getMonthlyCalculation(
        effectiveUserId,
        uploadMonth,
        currentYear
      );
      if (calculationResult.data && !calculationResult.error) {
        setCurrentMonthCalculation(calculationResult.data);
      }
    } else {
      // Upload was for a different month than currently selected
      console.log(`Upload for month ${uploadMonth}, but user has month ${currentlySelectedMonth} selected. Preserving user's selection.`);

      // Don't change the displayed data or month selector
      // The user can manually switch to the uploaded month if they want to see it

      // Optional: Show a subtle notification that data was uploaded to a different month
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      console.log(`Data uploaded to ${monthNames[uploadMonth - 1]}. Switch to ${monthNames[uploadMonth - 1]} to view the uploaded data.`);
    }

    // REMOVED: Automatic month switching that was overriding user selection
    // The month selector will stay on the user's selected month
  };

  // Handle file selection and start processing
  const handleFileSelect = async (file: File) => {
    if (!selectedUploadMonth) return;

    // Validate file first (unified validation for both CSV and Excel)
    const validation = validateFileQuick(file);
    if (!validation.valid) {
      salaryCalculator.csvUploadError(validation.errors?.join(', ') || "Please select a valid roster file.");
      return;
    }

    // Ensure user is authenticated before upload
    if (!user?.id) {
      salaryCalculator.csvUploadError('You must be logged in to upload roster files. Please sign in and try again.');
      return;
    }

    // Wait for user position to be loaded
    if (userPositionLoading) {
      salaryCalculator.csvUploadError('Loading user profile... Please try again in a moment.');
      return;
    }

    const effectiveUserId = user.id;
    const currentYear = new Date().getFullYear();

    // Check for existing data before processing
    try {
      const existingCheck = await checkForExistingData(effectiveUserId, selectedUploadMonth, currentYear);

      if (existingCheck.error) {
        salaryCalculator.csvUploadError(`Error checking existing data: ${existingCheck.error}`);
        return;
      }

      // If data exists, show replacement confirmation dialog
      if (existingCheck.exists) {
        setExistingDataCheck(existingCheck);
        setPendingFile(file);
        setReplacementDialogOpen(true);
        return;
      }

      // No existing data, proceed with normal upload
      await processFileUpload(file, effectiveUserId, false);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      salaryCalculator.csvUploadError(`Error during upload: ${errorMessage}`);
    }
  };

  // Process file upload (with or without replacement)
  const processFileUpload = async (file: File, userId: string, performReplacement: boolean) => {
    if (!selectedUploadMonth) return;

    setUploadState('processing');

    // Show loading toast
    const loadingToast = salaryCalculator.processingStarted(file.name);

    try {
      const currentYear = new Date().getFullYear();

      const result = await processFileUploadWithReplacement(
        file,
        userId,
        userPosition as Position,
        selectedUploadMonth,
        currentYear,
        (status) => {
          setProcessingStatus(status);
        },
        performReplacement
      );

      // Dismiss loading toast
      salaryCalculator.dismiss(loadingToast);

      if (result.success && result.flightDuties) {
        if (performReplacement && result.replacementPerformed) {
          salaryCalculator.csvUploadSuccess(
            file.name,
            result.flightDuties.length,
            `Replaced existing data and processed ${result.flightDuties.length} flights`
          );
        } else {
          salaryCalculator.csvUploadSuccess(file.name, result.flightDuties.length);
        }

        // Refresh dashboard data
        await refreshDashboardData(userId, selectedUploadMonth);

        // Close modal - user will see results on dashboard
        handleUploadModalClose();
      } else {
        salaryCalculator.csvUploadError(result.errors?.join(', ') || 'Unknown error occurred');
        setUploadState('upload');
      }
    } catch (error) {
      salaryCalculator.dismiss(loadingToast);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      salaryCalculator.csvUploadError(errorMessage);
      setUploadState('upload');
    }
  };

  // Handle upload modal close
  const handleUploadModalClose = () => {
    setUploadModalOpen(false);
    setUploadState('month');
    setSelectedUploadMonth(null);
    setProcessingStatus(null);
    // Reset replacement state
    setReplacementDialogOpen(false);
    setExistingDataCheck(null);
    setPendingFile(null);
    setReplacementProcessing(false);
  };

  // Handle replacement confirmation
  const handleReplacementConfirm = async () => {
    if (!pendingFile || !user?.id || !selectedUploadMonth) return;

    setReplacementProcessing(true);
    setReplacementDialogOpen(false);

    try {
      await processFileUpload(pendingFile, user.id, true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      salaryCalculator.csvUploadError(`Replacement failed: ${errorMessage}`);
    } finally {
      setReplacementProcessing(false);
      setPendingFile(null);
      setExistingDataCheck(null);
    }
  };

  // Handle replacement cancellation
  const handleReplacementCancel = () => {
    setReplacementDialogOpen(false);
    setPendingFile(null);
    setExistingDataCheck(null);
    setUploadState('month'); // Go back to month selection
  };

  // Handle manual entry modal
  const handleManualEntryClick = () => {
    setManualEntryModalOpen(true);
  };

  // Handle manual entry success - refresh data and close modal
  const handleManualEntrySuccess = async () => {
    // Refresh data for the currently selected month
    if (user?.id) {
      const currentYear = new Date().getFullYear();
      const selectedMonth = selectedOverviewMonth + 1; // Convert from 0-based to 1-based

      console.log('🔄 MANUAL ENTRY SUCCESS: Refreshing dashboard data for month', selectedMonth, 'year', currentYear);

      // CRITICAL: Add a small delay to ensure database updates are complete
      // The manual entry process calls recalculateMonthlyTotals() which needs time to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh flight duties for the currently selected month
      const flightDutiesResult = await getFlightDutiesByMonth(
        user.id,
        selectedMonth,
        currentYear
      );

      if (flightDutiesResult.data && !flightDutiesResult.error) {
        setFlightDuties(flightDutiesResult.data);
        console.log('✅ MANUAL ENTRY SUCCESS: Updated flight duties count:', flightDutiesResult.data.length);
      } else {
        setFlightDuties([]);
        console.log('⚠️ MANUAL ENTRY SUCCESS: No flight duties found or error:', flightDutiesResult.error);
      }

      // Refresh monthly calculation for the currently selected month
      const calculationResult = await getMonthlyCalculation(
        user.id,
        selectedMonth,
        currentYear
      );

      if (calculationResult.data && !calculationResult.error) {
        setCurrentMonthCalculation(calculationResult.data);
        console.log('✅ MANUAL ENTRY SUCCESS: Updated monthly calculation - Total Salary:', calculationResult.data.totalSalary, 'Per Diem:', calculationResult.data.perDiemPay);
      } else {
        console.log('⚠️ MANUAL ENTRY SUCCESS: No monthly calculation found or error:', calculationResult.error);
        setCurrentMonthCalculation(null);
      }

      // Refresh all monthly calculations for chart data
      const allCalculationsResult = await getAllMonthlyCalculations(user.id);
      if (allCalculationsResult.data && !allCalculationsResult.error) {
        setAllMonthlyCalculations(allCalculationsResult.data);
        console.log('✅ MANUAL ENTRY SUCCESS: Updated all monthly calculations count:', allCalculationsResult.data.length);
      } else {
        console.log('⚠️ MANUAL ENTRY SUCCESS: Error fetching all calculations:', allCalculationsResult.error);
      }
    }

    // Close modal
    setManualEntryModalOpen(false);
  };

  // Handle flight deleted callback from FlightDutiesManager
  const handleFlightDeleted = async (deletedFlightId: string) => {
    // Remove the deleted flight from the current state
    setFlightDuties(prevFlights => prevFlights.filter(flight => flight.id !== deletedFlightId));
  };

  // Handle recalculation complete callback from FlightDutiesManager
  const handleRecalculationComplete = async () => {
    // Refresh all data after recalculation
    await refreshDataAfterDelete();
  };

  // Confirm single flight deletion
  const confirmFlightDelete = async () => {
    if (!selectedFlightForDelete || !selectedFlightForDelete.id || !user?.id) return;

    setDeleteProcessing(true);
    try {
      const result = await deleteFlightDuty(
        selectedFlightForDelete.id,
        user.id,
        'Flight deleted from dashboard'
      );

      if (result.error) {
        showError("Delete Failed", {
          description: result.error,
        });
      } else {
        // Show success toast using the dedicated function
        salaryCalculator.flightDeleted(selectedFlightForDelete.flightNumbers);

        // Refresh data and trigger recalculation for the specific flight's month
        await refreshDataAfterBulkDelete([selectedFlightForDelete]);
      }
    } catch (error) {
      showError("Delete Failed", {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setDeleteProcessing(false);
      setDeleteDialogOpen(false);
      setSelectedFlightForDelete(null);
    }
  };

  // Confirm bulk flight deletion
  const confirmBulkFlightDelete = async () => {
    if (selectedFlightsForBulkDelete.length === 0 || !user?.id) return;

    setDeleteProcessing(true);
    try {
      const deletePromises = selectedFlightsForBulkDelete
        .filter(flight => flight.id) // Filter out flights without IDs
        .map(flight =>
          deleteFlightDuty(
            flight.id!,
            user.id,
            `Bulk delete operation - ${selectedFlightsForBulkDelete.length} flights`
          )
        );

      const results = await Promise.all(deletePromises);
      const errors = results.filter(result => result.error).map(result => result.error);

      if (errors.length > 0) {
        showError("Bulk Delete Failed", {
          description: `Failed to delete ${errors.length} of ${selectedFlightsForBulkDelete.length} flights.`,
        });
      } else {
        // Show success toast using the dedicated function
        salaryCalculator.bulkDeleteSuccess(selectedFlightsForBulkDelete.length);

        // Refresh data and trigger recalculation for affected months
        await refreshDataAfterBulkDelete(selectedFlightsForBulkDelete);
      }
    } catch (error) {
      showError("Bulk Delete Failed", {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setDeleteProcessing(false);
      setBulkDeleteDialogOpen(false);
      setSelectedFlightsForBulkDelete([]);
    }
  };

  // Refresh data after bulk deletion and trigger recalculation for affected months
  const refreshDataAfterBulkDelete = async (deletedFlights: FlightDuty[]) => {
    if (!user?.id) return;

    // Wait for user position to be loaded
    if (userPositionLoading) {
      showError("Loading Profile", {
        description: "Please wait for user profile to load before refreshing data.",
      });
      return;
    }

    try {
      // Get unique months/years from deleted flights
      const affectedMonths = new Map<string, { month: number; year: number }>();
      deletedFlights.forEach(flight => {
        const key = `${flight.month}-${flight.year}`;
        affectedMonths.set(key, { month: flight.month, year: flight.year });
      });

      // Recalculate each affected month
      for (const { month, year } of affectedMonths.values()) {
        const recalcResult = await recalculateMonthlyTotals(user.id, month, year, userPosition as Position);

        if (!recalcResult.success) {
          showError("Recalculation Failed", {
            description: `Failed to recalculate monthly totals for ${month}/${year}: ${recalcResult.errors.join(', ')}`,
          });
          continue; // Continue with other months
        }
      }

      // Refresh all monthly calculations for chart data
      const allCalculationsResult = await getAllMonthlyCalculations(user.id);
      if (allCalculationsResult.data && !allCalculationsResult.error) {
        setAllMonthlyCalculations(allCalculationsResult.data);
      }

      // Refresh current month calculation if it was affected
      const currentYear = new Date().getFullYear();
      const selectedMonth = selectedOverviewMonth + 1;
      const currentMonthKey = `${selectedMonth}-${currentYear}`;

      if (affectedMonths.has(currentMonthKey)) {
        const calculationResult = await getMonthlyCalculation(user.id, selectedMonth, currentYear);
        if (calculationResult.data && !calculationResult.error) {
          setCurrentMonthCalculation(calculationResult.data);
        } else {
          setCurrentMonthCalculation(null);
        }
      }

      // Force refresh flight duties for the currently selected month
      const flightDutiesResult = await getFlightDutiesByMonth(user.id, selectedMonth, currentYear);
      if (flightDutiesResult.data && !flightDutiesResult.error) {
        setFlightDuties(flightDutiesResult.data);
      } else {
        setFlightDuties([]);
      }

    } catch (error) {
      showError("Refresh Failed", {
        description: error instanceof Error ? error.message : 'Unknown error occurred during refresh',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Compact currency format for mobile metric cards (removes "AED" prefix)
  const formatCurrencyCompact = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getMonthName = (monthNumber: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  // Get data for selected month from real calculations
  const getSelectedMonthData = () => {
    const currentYear = new Date().getFullYear();
    const selectedMonthCalc = allMonthlyCalculations.find(calc =>
      calc.month === selectedOverviewMonth + 1 && calc.year === currentYear
    );

    if (selectedMonthCalc) {
      return {
        totalSalary: selectedMonthCalc.totalSalary,
        dutyHours: selectedMonthCalc.totalDutyHours,
        totalDuties: selectedMonthCalc.totalDutyHours > 0 ? Math.round(selectedMonthCalc.totalDutyHours / 8) : 0 // Estimate duties from hours
      };
    }

    // Return zeros for months with no data
    return {
      totalSalary: 0,
      dutyHours: 0,
      totalDuties: 0
    };
  };

  const selectedData = getSelectedMonthData();


  // Dynamic greeting based on current time
  const getTimeBasedGreeting = () => {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 6 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 18) {
      return 'Good Afternoon';
    } else if (hour >= 18 && hour < 24) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  };

  // Current date information
  const getCurrentDateInfo = () => {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNumber = now.getDate();
    return `${dayName} ${dayNumber}`;
  };

  // Get mobile navigation context
  const { isMobile, toggleSidebar, isSidebarOpen } = useMobileNavigation();

  return (
    <div className="space-y-4">
      {/* Header and Action Buttons - Grouped with consistent spacing */}
      <div className="space-y-6 px-6 pt-6">
        {/* Header with integrated hamburger menu on mobile */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-responsive-3xl font-bold space-responsive-sm" style={{ color: '#3A3780' }}>
              {getTimeBasedGreeting()}, {user?.user_metadata?.first_name || 'User'}
            </h1>
            <p className="text-responsive-base text-primary font-bold">
              {getCurrentDateInfo()}
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

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            className="bg-[#4C49ED] cursor-pointer rounded-2xl flex items-center gap-2 hover:opacity-90"
            onClick={handleManualEntryClick}
          >
            <Plus className="h-4 w-4" />
            <span>Add Flight</span>
          </Button>
          <Button
            variant="outline"
            className="border-[#4C49ED] text-[#4C49ED] cursor-pointer rounded-2xl flex items-center gap-2 hover:bg-transparent hover:opacity-80"
            onClick={handleUploadClick}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Roster</span>
          </Button>
        </div>
      </div>

      {/* Top Section - Monthly Overview + Side Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 responsive-container">
        {/* Monthly Overview - Large Card (2/3 width on desktop) */}
        <div className="xl:col-span-2">
          <MonthlyOverviewCard
            allMonthlyCalculations={allMonthlyCalculations}
            selectedOverviewMonth={selectedOverviewMonth}
            setSelectedOverviewMonth={setSelectedOverviewMonth}
            setHasUserSelectedMonth={setHasUserSelectedMonth}
            setIsMonthSwitching={setIsMonthSwitching}
            monthlyDataLoading={monthlyDataLoading}
            isMonthSwitching={isMonthSwitching}
            selectedData={selectedData}
          />
        </div>

        {/* Side Cards - Responsive stacking: 3 cols on mobile, 2 cols on tablet, 1 col on desktop */}
        <div className="grid grid-cols-3 sm:grid-cols-2 xl:grid-cols-1 gap-2 md:gap-6">
          {/* Flight Hours Card - Purple (Primary Brand Color) */}
          <Card className="bg-white rounded-3xl !border-0 !shadow-none">
            <CardContent className="p-2 md:p-6">
              <div className="flex flex-col md:flex-row items-center md:items-center gap-1.5 md:gap-4">
                <div className="w-9 h-9 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(76, 73, 237, 0.15)' }}>
                  <Clock className="h-4 w-4 md:h-8 md:w-8" style={{ color: '#4C49ED' }} />
                </div>
                <div className="min-w-0 flex-1 text-center md:text-left overflow-hidden">
                  {/* Mobile: Compact format */}
                  <div className="md:hidden text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: '#3A3780' }}>
                    {monthlyDataLoading || isMonthSwitching ? '...' : `${Math.floor(selectedData.dutyHours)}hr`}
                  </div>
                  {/* Desktop: Full format */}
                  <div className="hidden md:block text-responsive-3xl font-bold" style={{ color: '#3A3780' }}>
                    {monthlyDataLoading || isMonthSwitching ? '...' : `${Math.floor(selectedData.dutyHours)}`}
                  </div>
                  <div className="text-[10px] md:text-responsive-sm whitespace-nowrap" style={{ color: '#4C49ED' }}>Flight Hours</div>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Flight Pay Card - Green (Accent Brand Color) */}
          <Card className="bg-white rounded-3xl !border-0 !shadow-none">
            <CardContent className="p-2 md:p-6">
              <div className="flex flex-col md:flex-row items-center md:items-center gap-1.5 md:gap-4">
                <div className="w-9 h-9 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(109, 220, 145, 0.2)' }}>
                  <Banknote className="h-4 w-4 md:h-8 md:w-8" style={{ color: '#6DDC91' }} />
                </div>
                <div className="min-w-0 flex-1 text-center md:text-left overflow-hidden">
                  {/* Mobile: Compact format */}
                  <div className="md:hidden text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: '#059669' }}>
                    AED {currentMonthCalculation ? formatCurrencyCompact(currentMonthCalculation.flightPay) : formatCurrencyCompact(0)}
                  </div>
                  {/* Desktop: Full format */}
                  <div className="hidden md:block text-responsive-xl font-bold" style={{ color: '#059669' }}>
                    {currentMonthCalculation ? formatCurrency(currentMonthCalculation.flightPay) : formatCurrency(0)}
                  </div>
                  <div className="text-[10px] md:text-responsive-sm whitespace-nowrap" style={{ color: '#10b981' }}>Flight Pay</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per Diem Card - Teal (Complementary Color) */}
          <Card className="bg-white rounded-3xl !border-0 !shadow-none">
            <CardContent className="p-2 md:p-6">
              <div className="flex flex-col md:flex-row items-center md:items-center gap-1.5 md:gap-4">
                <div className="w-9 h-9 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(20, 184, 166, 0.15)' }}>
                  <UtensilsCrossed className="h-4 w-4 md:h-8 md:w-8" style={{ color: '#14b8a6' }} />
                </div>
                <div className="min-w-0 flex-1 text-center md:text-left overflow-hidden">
                  {/* Mobile: Compact format */}
                  <div className="md:hidden text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: '#0f766e' }}>
                    AED {currentMonthCalculation ? formatCurrencyCompact(currentMonthCalculation.perDiemPay) : formatCurrencyCompact(0)}
                  </div>
                  {/* Desktop: Full format */}
                  <div className="hidden md:block text-responsive-xl font-bold" style={{ color: '#0f766e' }}>
                    {currentMonthCalculation ? formatCurrency(currentMonthCalculation.perDiemPay) : formatCurrency(0)}
                  </div>
                  <div className="text-[10px] md:text-responsive-sm whitespace-nowrap" style={{ color: '#14b8a6' }}>Per Diem</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Flight Duties Section - Full Width with minimal horizontal padding */}
      <div className="px-2 md:px-4">
        {flightDuties.length > 0 ? (
          <FlightDutiesManager
            flightDuties={flightDuties}
            position={userPosition as Position}
            userId={user?.id || ''}
            loading={loading}
            onFlightDeleted={handleFlightDeleted}
            onRecalculationComplete={handleRecalculationComplete}
          />
        ) : (
          <Card className="bg-white rounded-3xl !border-0 !shadow-none overflow-hidden">
            <CardContent className="card-responsive-padding">
              <div className="text-center py-6 md:py-8" role="status" aria-label="No flight duties available">
                <Plane className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 md:mb-6 text-gray-400" />
                <h3 className="text-responsive-2xl font-bold space-responsive-md tracking-tight" style={{ color: '#3A3780' }}>
                  No Flight Duties Yet
                </h3>
                <p className="text-responsive-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Upload your roster file or add flights manually to see them here
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Roster Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={handleUploadModalClose}>
        <DialogContent className="modal-xl modal-touch-friendly max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Roster
            </DialogTitle>
            {uploadState === 'month' && (
              <DialogDescription>
                Select the month for your roster upload
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-6">
            {uploadState === 'month' && (
              <div className="w-full max-w-sm mx-auto space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <Select onValueChange={(value) => handleMonthSelect(parseInt(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {getMonthName(month)} {new Date().getFullYear()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {uploadState === 'upload' && selectedUploadMonth && (
              <div>
                {/* Hidden file input */}
                <input
                  id="roster-file-input"
                  type="file"
                  accept=".csv,.xlsx,.xlsm,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileSelect(file);
                    }
                  }}
                />
              </div>
            )}

            {uploadState === 'processing' && processingStatus && (
              <ProcessingStatus status={processingStatus} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Entry Modal */}
      <Dialog open={manualEntryModalOpen} onOpenChange={setManualEntryModalOpen}>
        <DialogContent className="modal-xl modal-form-compact max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Add Flight Manually
            </DialogTitle>
            <DialogDescription>
              Enter flight details manually for salary calculation
            </DialogDescription>
          </DialogHeader>

          {userPositionLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading user profile...</p>
              </div>
            </div>
          ) : (
            <ManualFlightEntry
              position={userPosition as Position}
              onBack={() => setManualEntryModalOpen(false)}
              onSuccess={handleManualEntrySuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Single Flight Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Flight
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete flight <strong>{selectedFlightForDelete?.flightNumbers}</strong>?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                This action cannot be undone. The flight will be permanently removed from your roster and salary calculations will be updated automatically.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmFlightDelete}
              disabled={deleteProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProcessing ? 'Deleting...' : 'Delete Flight'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Multiple Flights
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedFlightsForBulkDelete.length} flights</strong>?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                This action cannot be undone. All selected flights will be permanently removed from your roster and salary calculations will be updated automatically.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkFlightDelete}
              disabled={deleteProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProcessing ? 'Deleting...' : `Delete ${selectedFlightsForBulkDelete.length} Flights`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Roster Replacement Confirmation Dialog */}
      {existingDataCheck && selectedUploadMonth && (
        <RosterReplacementDialog
          open={replacementDialogOpen}
          onOpenChange={setReplacementDialogOpen}
          month={selectedUploadMonth}
          onConfirm={handleReplacementConfirm}
          onCancel={handleReplacementCancel}
          isProcessing={replacementProcessing}
        />
      )}
    </div>
  );
}

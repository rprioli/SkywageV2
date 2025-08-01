'use client';

/**
 * Main Dashboard Page for Skywage - Enhanced UI with Salary Calculator
 * Modern dashboard design inspired by reference with gradient cards and visual hierarchy
 * Preserves all existing flight duty components and Phase 6 functionality
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Upload, FileText, BarChart3, Plane, Calendar, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { MonthlyCalculation, FlightDuty, Position } from '@/types/salary-calculator';
import { getMonthlyCalculation, getAllMonthlyCalculations } from '@/lib/database/calculations';
import { getFlightDutiesByMonth, deleteFlightDuty } from '@/lib/database/flights';
import { FlightDutiesTable } from '@/components/salary-calculator/FlightDutiesTable';
import { RosterUpload } from '@/components/salary-calculator/RosterUpload';
import { ProcessingStatus } from '@/components/salary-calculator/ProcessingStatus';
import { ManualFlightEntry } from '@/components/salary-calculator/ManualFlightEntry';
import { useToast } from '@/hooks/use-toast';
import {
  processFileUpload,
  processFileUploadWithReplacement,
  checkForExistingData,
  ProcessingStatus as ProcessingStatusType,
  validateFileQuick,
  detectFileType,
  type ExistingDataCheck
} from '@/lib/salary-calculator/upload-processor';
import { recalculateMonthlyTotals } from '@/lib/salary-calculator/recalculation-engine';
import { RosterReplacementDialog } from '@/components/salary-calculator/RosterReplacementDialog';
import { cn } from '@/lib/utils';
import { getProfile } from '@/lib/db';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { salaryCalculator, showError, showSuccess } = useToast();
  const [currentMonthCalculation, setCurrentMonthCalculation] = useState<MonthlyCalculation | null>(null);
  const [flightDuties, setFlightDuties] = useState<FlightDuty[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('current');
  const [loading, setLoading] = useState(true);
  const [allMonthlyCalculations, setAllMonthlyCalculations] = useState<MonthlyCalculation[]>([]);
  const [monthlyDataLoading, setMonthlyDataLoading] = useState(true);

  // Add state for overview month selection (lifted from MonthlyOverviewCard)
  const [selectedOverviewMonth, setSelectedOverviewMonth] = useState<number>(new Date().getMonth());
  const [hasUserSelectedMonth, setHasUserSelectedMonth] = useState<boolean>(false);

  // Initialize overview month based on available data (only on first load)
  useEffect(() => {
    if (!monthlyDataLoading && allMonthlyCalculations.length > 0 && !hasUserSelectedMonth) {
      console.log('🔄 Auto-initializing month selector (user has not made manual selection)');
      const currentMonthIndex = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Check if current month has data
      const currentMonthData = allMonthlyCalculations.find(calc =>
        calc.month === currentMonthIndex + 1 && calc.year === currentYear
      );

      if (currentMonthData) {
        console.log(`📅 Setting month to current month: ${currentMonthIndex + 1}`);
        setSelectedOverviewMonth(currentMonthIndex);
      } else {
        // Use the most recent month with data
        const sortedCalculations = allMonthlyCalculations.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        console.log(`📅 Setting month to most recent with data: ${sortedCalculations[0].month}`);
        setSelectedOverviewMonth(sortedCalculations[0].month - 1); // Convert to 0-based index
      }
    } else if (hasUserSelectedMonth) {
      console.log('✋ Skipping auto month selection - user has made manual selection');
    }
  }, [monthlyDataLoading, allMonthlyCalculations, hasUserSelectedMonth]);

  // Update currentMonthCalculation when selectedOverviewMonth changes
  useEffect(() => {
    if (allMonthlyCalculations.length > 0) {
      const currentYear = new Date().getFullYear();
      const selectedMonth = selectedOverviewMonth + 1; // Convert from 0-based to 1-based

      console.log(`🔄 Updating currentMonthCalculation for month: ${selectedMonth}`);

      const selectedMonthData = allMonthlyCalculations.find(calc =>
        calc.month === selectedMonth && calc.year === currentYear
      );

      if (selectedMonthData) {
        console.log(`✅ Found data for month ${selectedMonth}:`, selectedMonthData);
        setCurrentMonthCalculation(selectedMonthData);
      } else {
        console.log(`❌ No data found for month ${selectedMonth}`);
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
  const [showMonthSelector, setShowMonthSelector] = useState(false);

  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
  const userAirline = user?.user_metadata?.airline || 'Flydubai';

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

  // Refresh user position (can be called when position is updated)
  const refreshUserPosition = async () => {
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
  };

  // Listen for position updates from profile page
  useEffect(() => {
    const handlePositionUpdate = () => {
      refreshUserPosition();
    };

    window.addEventListener('userPositionUpdated', handlePositionUpdate);

    return () => {
      window.removeEventListener('userPositionUpdated', handlePositionUpdate);
    };
  }, [user?.id]);

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
        let calculationResult = await getMonthlyCalculation(
          user.id,
          currentMonth,
          currentYear
        );

        let displayMonth = currentMonth;
        let displayYear = currentYear;

        // If no current month data, try to find the most recent month with data
        if (!calculationResult.data || calculationResult.error) {
          const allCalculationsResult = await getAllMonthlyCalculations(user.id);
          if (allCalculationsResult.data && allCalculationsResult.data.length > 0) {
            // Sort by year and month to get the most recent
            const sortedCalculations = allCalculationsResult.data.sort((a, b) => {
              if (a.year !== b.year) return b.year - a.year;
              return b.month - a.month;
            });
            const mostRecent = sortedCalculations[0];
            displayMonth = mostRecent.month;
            displayYear = mostRecent.year;
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
    const fetchFlightDutiesForSelectedMonth = async () => {
      if (!user?.id) return;

      try {
        const currentYear = new Date().getFullYear();
        const selectedMonth = selectedOverviewMonth + 1; // Convert from 0-based to 1-based

        const flightDutiesResult = await getFlightDutiesByMonth(
          user.id,
          selectedMonth,
          currentYear
        );

        if (flightDutiesResult.data && !flightDutiesResult.error) {
          setFlightDuties(flightDutiesResult.data);
        } else {
          setFlightDuties([]);
        }
      } catch (error) {
        console.error('Error fetching flight duties for selected month:', error);
        setFlightDuties([]);
      }
    };

    fetchFlightDutiesForSelectedMonth();
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
    setSelectedFile(null);
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

    setSelectedFile(file);
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
    setSelectedFile(null);
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

      // Refresh flight duties for the currently selected month
      const flightDutiesResult = await getFlightDutiesByMonth(
        user.id,
        selectedMonth,
        currentYear
      );

      if (flightDutiesResult.data && !flightDutiesResult.error) {
        setFlightDuties(flightDutiesResult.data);
      } else {
        setFlightDuties([]);
      }

      // Refresh monthly calculation for the currently selected month
      const calculationResult = await getMonthlyCalculation(
        user.id,
        selectedMonth,
        currentYear
      );

      if (calculationResult.data && !calculationResult.error) {
        setCurrentMonthCalculation(calculationResult.data);
      }

      // Refresh all monthly calculations for chart data
      const allCalculationsResult = await getAllMonthlyCalculations(user.id);
      if (allCalculationsResult.data && !allCalculationsResult.error) {
        setAllMonthlyCalculations(allCalculationsResult.data);
      }
    }

    // Close modal
    setManualEntryModalOpen(false);
  };

  // Handle flight deletion
  const handleFlightDelete = (flight: FlightDuty) => {
    setSelectedFlightForDelete(flight);
    setDeleteDialogOpen(true);
  };

  // Handle bulk flight deletion
  const handleBulkFlightDelete = (flights: FlightDuty[]) => {
    setSelectedFlightsForBulkDelete(flights);
    setBulkDeleteDialogOpen(true);
  };

  // Confirm single flight deletion
  const confirmFlightDelete = async () => {
    if (!selectedFlightForDelete || !user?.id) return;

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
      // Get unique months/years from the flights being deleted
      const affectedMonths = new Set(
        selectedFlightsForBulkDelete.map(flight => `${flight.month}-${flight.year}`)
      );



      const deletePromises = selectedFlightsForBulkDelete.map(flight =>
        deleteFlightDuty(
          flight.id,
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

  // Refresh data after deletion and trigger recalculation
  const refreshDataAfterDelete = async () => {
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

      // CRITICAL FIX: Trigger recalculation FIRST before fetching updated data
      const recalcResult = await recalculateMonthlyTotals(user.id, selectedMonth, currentYear, userPosition as Position);

      if (!recalcResult.success) {
        showError("Recalculation Failed", {
          description: `Failed to recalculate monthly totals: ${recalcResult.errors.join(', ')}`,
        });
        return;
      }

      // Now refresh monthly calculation for the currently selected month
      const calculationResult = await getMonthlyCalculation(
        user.id,
        selectedMonth,
        currentYear
      );

      if (calculationResult.data && !calculationResult.error) {
        setCurrentMonthCalculation(calculationResult.data);
      } else {
        setCurrentMonthCalculation(null);
      }

      // Refresh all monthly calculations for chart data
      const allCalculationsResult = await getAllMonthlyCalculations(user.id);
      if (allCalculationsResult.data && !allCalculationsResult.error) {
        setAllMonthlyCalculations(allCalculationsResult.data);
      }

      // Force refresh flight duties for the selected month
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

  const getCurrentMonthName = () => {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getMonthName = (monthNumber: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  // Monthly Overview Card Component
  const MonthlyOverviewCard = () => {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Initialize with current month, but if no data exists, default to most recent month with data
    const getInitialMonth = () => {
      if (allMonthlyCalculations.length > 0) {
        // Find if current month has data
        const currentMonthData = allMonthlyCalculations.find(calc =>
          calc.month === currentMonthIndex + 1 && calc.year === currentYear
        );
        if (currentMonthData) {
          return currentMonthIndex;
        }
        // Otherwise, use the most recent month with data
        const sortedCalculations = allMonthlyCalculations.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        return sortedCalculations[0].month - 1; // Convert to 0-based index
      }
      return currentMonthIndex;
    };

    // Use the lifted state from parent component
    // (selectedOverviewMonth and setSelectedOverviewMonth are now in parent scope)

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Generate chart data from real monthly calculations
    const generateChartData = () => {
      const chartData = [];

      // Find the maximum salary to normalize the chart values
      const maxSalary = Math.max(...allMonthlyCalculations.map(calc => calc.totalSalary), 1);

      for (let i = 0; i < 12; i++) {
        const monthCalc = allMonthlyCalculations.find(calc =>
          calc.month === i + 1 && calc.year === currentYear
        );

        // Normalize values to 0-100 range for better chart display
        const normalizedValue = monthCalc ? Math.round((monthCalc.totalSalary / maxSalary) * 100) : 0;

        chartData.push({
          month: months[i],
          value: normalizedValue
        });
      }

      return chartData;
    };

    const chartData = generateChartData();

    // Get data for selected month from real calculations
    const getSelectedMonthData = () => {
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

    return (
      <Card className="bg-[#4C49ED] text-white rounded-3xl shadow-xl border-0 overflow-hidden h-full">
        <CardContent className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Overview</h2>
          </div>

          {/* Chart Area */}
          <div className="h-32 w-full mb-6">
            {monthlyDataLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-white/70 text-sm">Loading chart data...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B9D" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FF6B9D" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                  />
                  <YAxis hide />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#FF6B9D"
                    strokeWidth={2}
                    fill="url(#colorGradient)"
                    dot={{ fill: '#FF6B9D', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#FF6B9D', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Month Selector */}
          <div className="flex justify-center gap-1 flex-wrap mb-8">
            {months.map((month, index) => (
              <Button
                key={month}
                variant={selectedOverviewMonth === index ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  console.log(`👤 User manually selected month: ${index + 1}`);
                  setSelectedOverviewMonth(index);
                  setHasUserSelectedMonth(true); // Mark that user has made a manual selection
                }}
                className={cn(
                  "h-8 px-3 text-xs font-medium transition-all",
                  selectedOverviewMonth === index
                    ? 'bg-white text-[#4C49ED] shadow-md hover:bg-white/90'
                    : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                )}
              >
                {month}
              </Button>
            ))}
          </div>

          {/* Bottom Metrics with Improved Hierarchy */}
          <div className="grid grid-cols-3 gap-4">
            {/* Left: Duty Hours */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center flex flex-col justify-center min-h-[80px]">
              <div className="text-2xl font-bold">
                {monthlyDataLoading ? '...' : `${Math.floor(selectedData.dutyHours)}h`}
              </div>
              <div className="text-xs text-white/70 mt-1">Duty Hours</div>
            </div>

            {/* Center: Total Salary (Prominent) */}
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
              <div className="text-3xl font-bold mb-1">
                {monthlyDataLoading ? '...' : formatCurrency(selectedData.totalSalary)}
              </div>
              <div className="text-sm text-white/80">
                {selectedData.totalSalary === 0 && !monthlyDataLoading ?
                  `${months[selectedOverviewMonth]} - No Data` :
                  'Total Salary'
                }
              </div>
            </div>

            {/* Right: Number of Duties */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center flex flex-col justify-center min-h-[80px]">
              <div className="text-2xl font-bold">
                {monthlyDataLoading ? '...' : selectedData.totalDuties}
              </div>
              <div className="text-xs text-white/70 mt-1">Total Duties</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">
          Welcome, {user?.user_metadata?.first_name || 'User'}
        </h1>
        <p className="text-muted-foreground">
          Your salary calculator dashboard - track earnings and manage flight duties
        </p>
      </div>

      {/* Top Section - Monthly Overview + Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Overview - Large Card (2/3 width) */}
        <div className="lg:col-span-2">
          <MonthlyOverviewCard />
        </div>

        {/* Side Cards - Stacked (1/3 width) */}
        <div className="space-y-6">
          {/* Top Side Card */}
          <Card className="bg-[#6DDC91] text-white rounded-3xl shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold mb-2">
                {flightDuties.length}
              </div>
              <div className="text-white/90 font-medium">Total Flights</div>
              <div className="text-sm text-white/70 mt-1">This Month</div>
            </CardContent>
          </Card>

          {/* Bottom Side Card - Salary Breakdown */}
          <Card className="bg-white border-2 border-gray-100 rounded-3xl shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-[#4C49ED] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-lg font-bold text-[#4C49ED]">
                  {currentMonthCalculation ? formatCurrency(currentMonthCalculation.flightPay) : formatCurrency(0)}
                </div>
                <div className="text-xs text-gray-600 font-medium">Flight Pay</div>
                <div className="text-lg font-bold text-[#6DDC91]">
                  {currentMonthCalculation ? formatCurrency(currentMonthCalculation.perDiemPay) : formatCurrency(0)}
                </div>
                <div className="text-xs text-gray-500">Per Diem</div>
              </div>
            </CardContent>
          </Card>
        </div>
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

      {/* Flight Duties Table */}
      {flightDuties.length > 0 ? (
        <FlightDutiesTable
          flightDuties={flightDuties}
          loading={loading}
          onDelete={handleFlightDelete}
          onBulkDelete={handleBulkFlightDelete}
          showActions={true}
        />
      ) : (
        <Card className="rounded-3xl border-2 border-gray-100">
          <CardContent className="p-8 text-center">
            <Plane className="h-16 w-16 mx-auto mb-4 opacity-50 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Flight Duties Yet</h3>
            <p className="text-gray-600">Upload your roster file or add flights manually to see them here</p>
          </CardContent>
        </Card>
      )}

      {/* Upload Roster Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={handleUploadModalClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          year={new Date().getFullYear()}
          existingFlightCount={existingDataCheck.flightCount}
          onConfirm={handleReplacementConfirm}
          onCancel={handleReplacementCancel}
          isProcessing={replacementProcessing}
        />
      )}
    </div>
  );
}

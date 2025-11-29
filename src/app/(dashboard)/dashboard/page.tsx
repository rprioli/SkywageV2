'use client';

/**
 * Main Dashboard Page for Skywage - Enhanced UI with Salary Calculator
 * Modern dashboard design inspired by reference with gradient cards and visual hierarchy
 * Refactored in Phase 3 to use extracted hooks and components
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Plane, Trash2, Clock, Banknote, UtensilsCrossed, Menu } from 'lucide-react';
import { FlightDuty, Position } from '@/types/salary-calculator';
import { deleteFlightDuty } from '@/lib/database/flights';
import { FlightDutiesManager } from '@/components/salary-calculator/FlightDutiesManager';
import { useToast } from '@/hooks/use-toast';
import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import { getProfile } from '@/lib/db';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { useFlightDuties } from '@/hooks/useFlightDuties';
import { useMonthlyCalculations } from '@/hooks/useMonthlyCalculations';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { RosterUploadSection } from '@/components/dashboard/RosterUploadSection';
import { ManualEntrySection } from '@/components/dashboard/ManualEntrySection';



export default function DashboardPage() {
  const { user } = useAuth();
  const { salaryCalculator, showError } = useToast();

  // Month selection state
  const [selectedOverviewMonth, setSelectedOverviewMonth] = useState<number>(new Date().getMonth());
  const [hasUserSelectedMonth, setHasUserSelectedMonth] = useState<boolean>(false);
  const [isMonthSwitching, setIsMonthSwitching] = useState<boolean>(false);

  // Year selection state
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFlightForDelete, setSelectedFlightForDelete] = useState<FlightDuty | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedFlightsForBulkDelete, setSelectedFlightsForBulkDelete] = useState<FlightDuty[]>([]);
  const [deleteProcessing, setDeleteProcessing] = useState(false);

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
          setUserPosition((user?.user_metadata?.position as Position) || 'CCM');
        }
      } catch {
        // Fallback to auth metadata
        setUserPosition((user?.user_metadata?.position as Position) || 'CCM');
      } finally {
        setUserPositionLoading(false);
      }
    };

    loadUserPosition();
  }, [user?.id, user?.user_metadata?.position]);

  // Use custom hooks for data fetching
  const {
    flightDuties,
    loading: flightDutiesLoading,
    refetch: refetchFlightDuties,
  } = useFlightDuties({
    userId: user?.id || '',
    month: selectedOverviewMonth,
    year: selectedYear,
    enabled: !!user?.id,
  });

  const {
    currentCalculation,
    allCalculations,
    loading: calculationsLoading,
    refetch: refetchCalculations,
    refetchCurrent: refetchCurrentCalculation,
    refetchAll: refetchAllCalculations,
  } = useMonthlyCalculations({
    userId: user?.id || '',
    month: selectedOverviewMonth,
    year: selectedYear,
    enabled: !!user?.id,
  });

  // Initialize overview month based on available data (only on first load)
  useEffect(() => {
    if (!calculationsLoading && allCalculations.length > 0 && !hasUserSelectedMonth) {
      const currentMonthIndex = new Date().getMonth();

      const currentMonthData = allCalculations.find(calc =>
        calc.month === currentMonthIndex + 1 && calc.year === selectedYear
      );

      if (currentMonthData) {
        setSelectedOverviewMonth(currentMonthIndex);
      } else {
        // Use the most recent month with data
        const sortedCalculations = [...allCalculations].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        setSelectedOverviewMonth(sortedCalculations[0].month - 1); // Convert to 0-based index
      }
    }
  }, [calculationsLoading, allCalculations, hasUserSelectedMonth, selectedYear]);

  // Initialize data refresh hook (for delete/upload/manual entry operations)
  const {
    refreshAfterDelete,
    refreshAfterBulkDelete,
    refreshAfterUpload,
    refreshAfterManualEntry,
  } = useDataRefresh({
    userId: user?.id || '',
    position: userPosition,
    selectedMonth: selectedOverviewMonth,
    selectedYear: selectedYear,
    userPositionLoading,
    onCalculationsUpdate: async () => {
      // Silently refetch calculations and flight duties (no loading state)
      // This prevents the chart from reloading when adding/deleting flights
      await Promise.all([
        refetchCurrentCalculation(), // Update current month calculation
        refetchAllCalculations(),    // Update chart data
        refetchFlightDuties(),        // Update flight duties table
      ]);
    },
    onFlightDutiesUpdate: async () => {
      // Only refetch flight duties (for operations that don't affect calculations)
      await refetchFlightDuties();
    },
    onError: (title, description) => {
      showError(title, { description });
    },
  });

  // Refresh user position (can be called when position is updated)
  const refreshUserPosition = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: profile, error } = await getProfile(user.id);

      if (profile && !error && profile.position) {
        setUserPosition(profile.position as Position);

        // Refresh all data with new position
        await Promise.all([refetchCalculations(), refetchFlightDuties()]);
      }
    } catch {
      // Silently handle position refresh errors
    }
  }, [user?.id, refetchCalculations, refetchFlightDuties]);

  // Listen for position updates from profile page
  useEffect(() => {
    const handlePositionUpdate = () => {
      refreshUserPosition();
    };

    window.addEventListener('userPositionUpdated', handlePositionUpdate);

    return () => {
      window.removeEventListener('userPositionUpdated', handlePositionUpdate);
    };
  }, [refreshUserPosition]);

  // Clear month switching flag when flight duties finish loading
  useEffect(() => {
    if (!flightDutiesLoading) {
      setIsMonthSwitching(false);
    }
  }, [flightDutiesLoading]);

  // Memoized callbacks for child components
  const handleMonthChange = useCallback((month: number) => {
    setSelectedOverviewMonth(month);
  }, []);

  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year);
  }, []);

  const handleMonthSwitchingChange = useCallback((switching: boolean) => {
    setIsMonthSwitching(switching);
  }, []);

  const handleUserSelectedChange = useCallback((selected: boolean) => {
    setHasUserSelectedMonth(selected);
  }, []);

  const handleUploadSuccess = useCallback(async () => {
    await refreshAfterUpload();
  }, [refreshAfterUpload]);

  const handleManualEntrySuccess = useCallback(async () => {
    await refreshAfterManualEntry();
  }, [refreshAfterManualEntry]);

  // Handle recalculation complete callback from FlightDutiesManager
  // This is called after flight deletion and handles all necessary refreshes
  const handleRecalculationComplete = useCallback(async () => {
    // Refresh all data after recalculation
    await refreshAfterDelete();
  }, [refreshAfterDelete]);

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
        await refreshAfterBulkDelete([selectedFlightForDelete]);
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
        await refreshAfterBulkDelete(selectedFlightsForBulkDelete);
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

  // Memoized selected month data
  const selectedData = useMemo(() => {
    return {
      totalSalary: currentCalculation?.totalSalary || 0,
      dutyHours: currentCalculation?.totalDutyHours || 0,
      totalDuties: flightDuties.length,
    };
  }, [currentCalculation, flightDuties]);


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
          <ManualEntrySection
            position={userPosition}
            userPositionLoading={userPositionLoading}
            selectedYear={selectedYear}
            onEntrySuccess={handleManualEntrySuccess}
          />
          <RosterUploadSection
            userId={user?.id || ''}
            position={userPosition}
            userPositionLoading={userPositionLoading}
            selectedYear={selectedYear}
            onUploadSuccess={handleUploadSuccess}
          />
        </div>
      </div>

      {/* Top Section - Monthly Overview + Side Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 responsive-container">
        {/* Monthly Overview - Large Card (2/3 width on desktop) */}
        <div className="xl:col-span-2">
          <MonthSelector
            allMonthlyCalculations={allCalculations}
            selectedOverviewMonth={selectedOverviewMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
            onMonthSwitchingChange={handleMonthSwitchingChange}
            onUserSelectedChange={handleUserSelectedChange}
            loading={calculationsLoading}
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
                    {calculationsLoading || isMonthSwitching ? '...' : `${Math.floor(selectedData.dutyHours)}hr`}
                  </div>
                  {/* Desktop: Full format */}
                  <div className="hidden md:block text-responsive-3xl font-bold" style={{ color: '#3A3780' }}>
                    {calculationsLoading || isMonthSwitching ? '...' : `${Math.floor(selectedData.dutyHours)}`}
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
                    AED {currentCalculation ? formatCurrencyCompact(currentCalculation.flightPay) : formatCurrencyCompact(0)}
                  </div>
                  {/* Desktop: Full format */}
                  <div className="hidden md:block text-responsive-xl font-bold" style={{ color: '#059669' }}>
                    {currentCalculation ? formatCurrency(currentCalculation.flightPay) : formatCurrency(0)}
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
                    AED {currentCalculation ? formatCurrencyCompact(currentCalculation.perDiemPay) : formatCurrencyCompact(0)}
                  </div>
                  {/* Desktop: Full format */}
                  <div className="hidden md:block text-responsive-xl font-bold" style={{ color: '#0f766e' }}>
                    {currentCalculation ? formatCurrency(currentCalculation.perDiemPay) : formatCurrency(0)}
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
            loading={flightDutiesLoading}
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
    </div>
  );
}

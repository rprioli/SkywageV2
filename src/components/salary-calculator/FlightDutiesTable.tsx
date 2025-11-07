'use client';

/**
 * Enhanced Flight Duties Table Component for Skywage Salary Calculator
 * Phase 6: Clean, beautiful design with improved UX
 * Following existing component patterns in the codebase
 */

import { useState } from 'react';
import { FlightDuty } from '@/types/salary-calculator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plane, CheckSquare, X, MoreHorizontal } from 'lucide-react';
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
import { FlightDutyCard } from './FlightDutyCard';
import { NewFlightDutyCard } from './NewFlightDutyCard';
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { identifyLayoverPairs } from '@/lib/salary-calculator/card-data-mapper';

interface FlightDutiesTableProps {
  flightDuties: FlightDuty[];
  loading?: boolean;
  onDelete?: (flightDuty: FlightDuty) => void;
  onBulkDelete?: (flightDuties: FlightDuty[]) => void;
  onDeleteAll?: () => void;
  showActions?: boolean;
  useNewCardDesign?: boolean; // Feature flag for new card design
}

export function FlightDutiesTable({
  flightDuties,
  loading = false,
  onDelete,
  onBulkDelete,
  onDeleteAll,
  showActions = true,
  useNewCardDesign = FEATURE_FLAGS.NEW_FLIGHT_CARDS
}: FlightDutiesTableProps) {




  // Bulk selection state
  const [selectedFlights, setSelectedFlights] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Delete All dialog state
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleteAllProcessing, setDeleteAllProcessing] = useState(false);









  // Bulk selection functions
  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    if (bulkMode) {
      setSelectedFlights(new Set());
    }
  };

  const toggleFlightSelection = (flightId: string) => {
    const newSelected = new Set(selectedFlights);
    if (newSelected.has(flightId)) {
      newSelected.delete(flightId);
    } else {
      newSelected.add(flightId);
    }
    setSelectedFlights(newSelected);
  };

  const selectAllVisible = () => {
    const visibleIds = new Set(flightDuties.map(flight => flight.id).filter((id): id is string => id !== undefined));
    setSelectedFlights(visibleIds);
  };

  const clearSelection = () => {
    setSelectedFlights(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedFlights.size > 0 && onBulkDelete) {
      const selectedFlightDuties = flightDuties.filter(flight => flight.id && selectedFlights.has(flight.id));
      onBulkDelete(selectedFlightDuties);
      setSelectedFlights(new Set());
    }
  };

  // Handle Delete All functionality
  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true);
  };

  const handleDeleteAllConfirm = async () => {
    if (!onDeleteAll) return;

    setDeleteAllProcessing(true);
    try {
      await onDeleteAll();
      setDeleteAllDialogOpen(false);
      // Clear bulk selection state since all flights are deleted
      setSelectedFlights(new Set());
      setBulkMode(false);
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Delete all failed:', error);
    } finally {
      setDeleteAllProcessing(false);
    }
  };

  // Filter out inbound layover flights that are already part of connected pairs
  const getFilteredFlightDuties = () => {
    if (!useNewCardDesign) {
      return flightDuties;
    }

    const layoverPairs = identifyLayoverPairs(flightDuties);
    const inboundLayoverIds = new Set(layoverPairs.map(pair => pair.inbound.id));

    return flightDuties.filter(duty => {
      // Skip off days (already handled in render)
      if (duty.dutyType === 'off') return true;

      // Skip inbound layover flights that are part of connected pairs
      if (duty.dutyType === 'layover' && inboundLayoverIds.has(duty.id)) {
        return false;
      }

      return true;
    });
  };

  const filteredFlightDuties = getFilteredFlightDuties();
  const isAllVisibleSelected = filteredFlightDuties.length > 0 && filteredFlightDuties.every(flight => flight.id && selectedFlights.has(flight.id));
  const isSomeSelected = selectedFlights.size > 0;



  if (loading) {
    return (
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-4 px-2 md:px-4">
          <h2 className="text-responsive-2xl font-bold" style={{ color: '#3A3780' }}>Flight Duties</h2>
        </CardHeader>
        <CardContent className="px-2 md:px-4">
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-6 bg-gray-50/50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="h-5 w-20 bg-gray-200 animate-pulse rounded-md"></div>
                      <div className="h-6 w-24 bg-gray-200 animate-pulse rounded-full"></div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-4 w-28 bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-lg"></div>
                    <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredFlightDuties.length === 0) {
    return (
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-4 px-2 md:px-4">
          <CardTitle className="text-responsive-xl font-semibold">Flight Duties</CardTitle>
        </CardHeader>
        <CardContent className="px-2 md:px-4">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plane className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-responsive-lg font-medium text-gray-900 space-responsive-sm">No flight duties found</h3>
            <p className="text-responsive-sm text-gray-500 max-w-sm mx-auto">
              Upload a roster CSV file or add flights manually to get started with your salary calculations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }



  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-2 px-2 md:px-4">
        <div className="flex flex-col space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-responsive-2xl font-bold" style={{ color: '#3A3780' }}>Flight Duties</h2>
              {bulkMode && isSomeSelected && (
                <Badge variant="default" className="px-3 py-1 text-sm font-medium bg-primary">
                  {selectedFlights.size} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {/* Three-dot menu for actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-transparent cursor-pointer"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={toggleBulkMode}
                    className="cursor-pointer"
                  >
                    {bulkMode ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Exit Selection
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Select Multiple
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteAllClick}
                    disabled={flightDuties.length === 0}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>


            </div>
          </div>



          {/* Bulk Actions Bar - Fixed height to prevent layout shift */}
          {bulkMode && (
            <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[56px] md:min-h-[64px]">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={isAllVisibleSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAllVisible();
                      } else {
                        clearSelection();
                      }
                    }}
                  />
                  <span className="text-sm text-gray-700">
                    Select All
                  </span>
                </div>
                {isSomeSelected && (
                  <span className="text-sm text-gray-500">
                    {selectedFlights.size} of {flightDuties.length}
                  </span>
                )}
              </div>

              {/* Always render button container to maintain fixed height */}
              <div className={`flex items-center space-x-2 transition-opacity duration-200 ${
                isSomeSelected ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="h-8 px-3 text-xs cursor-pointer hover:bg-transparent hover:opacity-80"
                  disabled={!isSomeSelected}
                >
                  Clear<span className="hidden md:inline"> Selection</span>
                </Button>
                {onBulkDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="h-8 px-3 text-xs cursor-pointer hover:bg-transparent hover:opacity-80"
                    disabled={!isSomeSelected}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-8 px-2 md:px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-4 md:gap-x-6">
          {filteredFlightDuties.map((duty, index) => {
            // Skip rendering off days when using new card design
            if (useNewCardDesign && duty.dutyType === 'off') {
              return null;
            }

            return (
              <div
                key={duty.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fade-in"
              >
                {useNewCardDesign ? (
                  <NewFlightDutyCard
                    flightDuty={duty}
                    allFlightDuties={flightDuties} // Use original array for layover pairing
                    onDelete={onDelete}
                    showActions={showActions}
                    bulkMode={bulkMode}
                    isSelected={duty.id ? selectedFlights.has(duty.id) : false}
                    onToggleSelection={toggleFlightSelection}
                  />
                ) : (
                  <FlightDutyCard
                    flightDuty={duty}
                    allFlightDuties={flightDuties}
                    onDelete={onDelete}
                    showActions={showActions}
                    bulkMode={bulkMode}
                    isSelected={duty.id ? selectedFlights.has(duty.id) : false}
                    onToggleSelection={toggleFlightSelection}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete All Flight Duties
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>all {flightDuties.length} flight duties</strong>?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                This action cannot be undone. All flight duties will be permanently removed from your roster and salary calculations will be updated automatically.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAllProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllConfirm}
              disabled={deleteAllProcessing}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteAllProcessing ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

'use client';

/**
 * Layover Connected Card Component - Two-segment layover interface with navigation
 * Based on the design created in flight-card-design-test
 */

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import { FlightDuty, TimeValue, Position } from '@/types/salary-calculator';
import {
  mapFlightDutyToCardData,
  findLayoverPair,
  formatCurrency,
  formatDutyHours
} from '@/lib/salary-calculator/card-data-mapper';
import { EditTimesDialog } from './EditTimesDialog';
import { updateFlightDuty } from '@/lib/database/flights';
import { recalculateMonthlyTotals } from '@/lib/salary-calculator/recalculation-engine';
import { useToast } from '@/hooks/use-toast';

const BRAND = { primary: "#4C49ED", accent: "#6DDC91", neutral: "#FFFFFF" };

interface LayoverConnectedCardProps {
  flightDuty: FlightDuty;
  allFlightDuties?: FlightDuty[];
  onDelete?: (flightDuty: FlightDuty) => void;
  showActions?: boolean;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (flightId: string) => void;
  userId?: string;
  position?: Position;
  onEditComplete?: () => void;
}

export function LayoverConnectedCard({
  flightDuty,
  allFlightDuties = [],
  onDelete,
  showActions = true,
  bulkMode = false,
  isSelected = false,
  onToggleSelection,
  userId,
  position,
  onEditComplete
}: LayoverConnectedCardProps) {
  const { showSuccess, showError } = useToast();
  const [currentSegment, setCurrentSegment] = useState<'outbound' | 'inbound'>('outbound');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Find layover pair
  const layoverPair = useMemo(() => {
    return findLayoverPair(flightDuty, allFlightDuties);
  }, [flightDuty, allFlightDuties]);

  // Determine current duty and segment
  const { currentDuty, isOutbound } = useMemo(() => {
    if (!layoverPair) {
      return { currentDuty: flightDuty, isOutbound: true };
    }

    // Check if the provided flightDuty is outbound or inbound
    const isFlightOutbound = layoverPair.outbound.id === flightDuty.id;

    // If we started with an inbound flight, default to showing inbound first
    if (!isFlightOutbound && currentSegment === 'outbound') {
      setCurrentSegment('inbound');
    }

    if (currentSegment === 'outbound') {
      return { currentDuty: layoverPair.outbound, isOutbound: true };
    } else {
      return { currentDuty: layoverPair.inbound, isOutbound: false };
    }
  }, [layoverPair, flightDuty, currentSegment]);

  const cardData = mapFlightDutyToCardData(currentDuty, allFlightDuties);

  // Handle multiple routing formats: "DXB → ZAG", "DXB - ZAG", and "DXB-ZAG" (manual entry)
  let routingParts: string[];
  if (cardData.routing.includes(' → ')) {
    // Roster format with arrows: "DXB → ZAG"
    routingParts = cardData.routing.split(' → ');
  } else if (cardData.routing.includes(' - ')) {
    // Roster format with spaces: "DXB - ZAG"
    routingParts = cardData.routing.split(' - ');
  } else if (cardData.routing.includes('-')) {
    // Manual entry format without spaces: "DXB-ZAG"
    routingParts = cardData.routing.split('-').map(part => part.trim());
  } else {
    // Fallback for other formats
    routingParts = [cardData.routing];
  }
  const [from, to] = routingParts;

  const handleDelete = () => {
    if (onDelete) onDelete(currentDuty);
  };

  const handleToggleSelection = () => {
    if (onToggleSelection && currentDuty.id) {
      onToggleSelection(currentDuty.id);
    }
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (
    flightId: string,
    newReportTime: TimeValue,
    newDebriefTime: TimeValue,
    isCrossDay: boolean
  ) => {
    if (!userId || !position) {
      showError('User information not available');
      return;
    }

    try {
      // Calculate new duty hours
      const reportMinutes = newReportTime.totalMinutes;
      const debriefMinutes = newDebriefTime.totalMinutes;
      let dutyMinutes = debriefMinutes - reportMinutes;
      if (isCrossDay) {
        dutyMinutes += 24 * 60; // Add 24 hours for cross-day
      }
      const dutyHours = dutyMinutes / 60;

      // Calculate new flight pay based on position
      const hourlyRate = position === 'SCCM' ? 62 : 50;
      const flightPay = dutyHours * hourlyRate;

      // Update flight duty in database
      const result = await updateFlightDuty(
        flightId,
        {
          reportTime: newReportTime,
          debriefTime: newDebriefTime,
          dutyHours,
          flightPay,
          isCrossDay
        },
        userId,
        'Manual time edit from dashboard'
      );

      if (result.error) {
        showError(`Failed to update flight: ${result.error}`);
        return;
      }

      // Recalculate monthly totals (this will also update layover rest periods)
      const month = currentDuty.date.getMonth() + 1; // Convert to 1-based
      const year = currentDuty.date.getFullYear();

      await recalculateMonthlyTotals(userId, month, year, position);

      showSuccess('Flight times updated successfully');

      // Notify parent to refresh data
      if (onEditComplete) {
        onEditComplete();
      }
    } catch {
      showError('Failed to update flight times');
    }
  };

  // If no layover pair found, show as single card
  if (!layoverPair) {
    return (
      <div className="relative">
        <Card
          className={`rounded-2xl border-0 bg-white shadow-none hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-gray-200 flight-card-uniform-height ${
            isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
          } ${bulkMode ? 'cursor-pointer' : ''}`}
          onClick={bulkMode ? handleToggleSelection : undefined}
        >
          <div className="px-4 py-3 h-full flex flex-col">
            {/* Single layover card content */}
            <div className="text-center text-sm text-gray-500">
              Layover (No pair found)
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Card container */}
      <div className="relative">
        <Card
          className={`rounded-2xl border-0 bg-white shadow-none hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-gray-200 flight-card-uniform-height ${
            isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
          } ${bulkMode ? 'cursor-pointer' : ''}`}
          onClick={bulkMode ? handleToggleSelection : undefined}
        >
          <div className="card-mobile-optimized h-full flex flex-col">

            {/* Navigation Arrows - Inside Card */}
            {layoverPair && (
              <>
                {/* Left Arrow */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSegment('outbound');
                  }}
                  disabled={currentSegment === 'outbound'}
                  className={`absolute left-2 top-1/2 transform -translate-y-1/2 p-1 transition-colors z-10 ${
                    currentSegment === 'outbound'
                      ? 'cursor-default opacity-30'
                      : 'cursor-pointer hover:opacity-70'
                  }`}
                  style={{ color: BRAND.primary }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Right Arrow */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSegment('inbound');
                  }}
                  disabled={currentSegment === 'inbound'}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 transition-colors z-10 ${
                    currentSegment === 'inbound'
                      ? 'cursor-default opacity-30'
                      : 'cursor-pointer hover:opacity-70'
                  }`}
                  style={{ color: BRAND.primary }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Actions Menu - Bottom Right */}
            {showActions && onDelete && (
              <div className="absolute bottom-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {userId && position && (
                      <DropdownMenuItem onClick={handleEditClick}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Times
                      </DropdownMenuItem>
                    )}
                    {onDelete !== undefined && (
                      <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Top row - Flight number and payment badge */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-bold">{cardData.flightNumber}</span>
              <div
                className="text-xs font-semibold text-white rounded-full px-2 py-0.5"
                style={{ backgroundColor: BRAND.accent }}
              >
                {cardData.pay}
              </div>
            </div>

            {/* Duty badge - separate row */}
            <div className="flex justify-center mb-1">
              <span
                className="inline-block text-white text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: BRAND.primary }}
              >
                {cardData.totalDuty} Duty
              </span>
            </div>
            
            {/* Main routing section - flex-based alignment */}
            <div className="flight-card-main-content">
              <div className="grid grid-cols-3 items-center gap-2">
              <div className="text-center">
                <div className="text-lg font-bold tracking-wide" style={{ color: 'rgb(58, 55, 128)' }}>{from}</div>
                <div className="text-xs text-gray-500 mt-0.5">{cardData.reporting}</div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 mb-1">
                  <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
                  <div className="text-sm" style={{ color: BRAND.primary }}>✈</div>
                  <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
                </div>
                <div className="text-xs font-semibold text-gray-700">
                  Layover
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold tracking-wide" style={{ color: 'rgb(58, 55, 128)' }}>{to}</div>
                <div className="text-xs text-gray-500 mt-0.5">{cardData.debriefing}</div>
              </div>
              </div>
            </div>

            {/* Bottom space reserved for layover details */}
            <div className="flex-1 flex items-end justify-center">
              {/* Layover details - only show on outbound */}
              {isOutbound && layoverPair && (
                <div className="text-xs text-gray-600 text-center">
                  {layoverPair.destination} {formatDutyHours(layoverPair.restHours)} - {formatCurrency(layoverPair.perDiemPay)}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Times Dialog */}
      <EditTimesDialog
        flightDuty={currentDuty}
        allFlightDuties={allFlightDuties}
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

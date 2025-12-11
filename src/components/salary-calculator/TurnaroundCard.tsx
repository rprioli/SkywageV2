'use client';

/**
 * Turnaround Card Component - New uniform design
 * Based on the design created in flight-card-design-test
 * Phase 3: Added edit times functionality
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Edit } from 'lucide-react';
import { FlightDuty, TimeValue, Position } from '@/types/salary-calculator';
import { mapFlightDutyToCardData } from '@/lib/salary-calculator/card-data-mapper';
import { EditTimesDialog } from './EditTimesDialog';
import { parseSectors } from './flight-duty-card/utils';
import { updateFlightDuty } from '@/lib/database/flights';
import { recalculateMonthlyTotals } from '@/lib/salary-calculator/recalculation-engine';
import { useToast } from '@/hooks/use-toast';

const BRAND = { primary: "#4C49ED", accent: "#6DDC91", neutral: "#FFFFFF" };

interface TurnaroundCardProps {
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

export function TurnaroundCard({
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
}: TurnaroundCardProps) {
  const { showSuccess, showError } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const cardData = mapFlightDutyToCardData(flightDuty, allFlightDuties);

  const getArrivalAirport = (sector?: string): string => {
    if (!sector) return '';
    const airports = parseSectors(sector);
    if (airports.length === 0) return sector;
    return airports[airports.length - 1] || sector;
  };

  // Parse turnaround routing correctly
  // Expected format: "DXB-KHI → KHI-DXB" should display as "DXB-KHI / KHI-DXB"
  const routingParts = cardData.routing.split(' → ');
  let from, to;

  if (routingParts.length === 2) {
    // Standard turnaround format: "DXB-KHI → KHI-DXB"
    from = routingParts[0]; // "DXB-KHI"
    to = routingParts[1];   // "KHI-DXB"
  } else {
    // Fallback for other formats
    from = routingParts[0] || '';
    to = routingParts[1] || '';
  }

  const outboundDestination = getArrivalAirport(flightDuty.sectors?.[0]);
  const inboundDestination = getArrivalAirport(flightDuty.sectors?.[flightDuty.sectors.length - 1]);
  const leftLabel = outboundDestination || from;
  const rightLabel = inboundDestination || to;

  const handleDelete = () => {
    if (onDelete) onDelete(flightDuty);
  };

  const handleToggleSelection = () => {
    if (onToggleSelection && flightDuty.id) {
      onToggleSelection(flightDuty.id);
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

      // Recalculate monthly totals
      const month = flightDuty.date.getMonth() + 1; // Convert to 1-based
      const year = flightDuty.date.getFullYear();

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

  return (
    <div className="relative">
      <Card
        className={`rounded-2xl border-0 bg-white shadow-none hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-gray-200 flight-card-uniform-height ${
          isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
        } ${bulkMode ? 'cursor-pointer' : ''}`}
        onClick={bulkMode ? handleToggleSelection : undefined}
      >
        <div className="card-mobile-optimized h-full flex flex-col">
          {/* Actions Menu - Bottom Right */}
          {showActions && (onDelete || userId) && (
            <div className="absolute bottom-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {userId && (
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
              <div className="text-lg font-bold tracking-wide" style={{ color: 'rgb(58, 55, 128)' }}>{leftLabel}</div>
              <div className="text-xs text-gray-500 mt-0.5">{cardData.reporting}</div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 mb-1">
                <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
                <div className="text-sm" style={{ color: BRAND.primary }}>✈</div>
                <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
              </div>
              <div className="text-xs font-semibold text-gray-700">
                Turnaround
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg font-bold tracking-wide" style={{ color: 'rgb(58, 55, 128)' }}>{rightLabel}</div>
              <div className="text-xs text-gray-500 mt-0.5">{cardData.debriefing}</div>
            </div>
            </div>
          </div>

          {/* Bottom spacer for consistent layout */}
          <div className="flex-1"></div>
        </div>
      </Card>

      {/* Edit Times Dialog */}
      {userId && (
        <EditTimesDialog
          flightDuty={flightDuty}
          allFlightDuties={allFlightDuties}
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

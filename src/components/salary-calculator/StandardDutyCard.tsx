'use client';

/**
 * Standard Duty Card Component - For non-layover, non-turnaround duties
 * Handles: asby, recurrent, sby, off duty types
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Timer, BookOpen, Clock, Camera, Edit } from 'lucide-react';
import { FlightDuty, TimeValue, Position } from '@/types/salary-calculator';
import { mapFlightDutyToCardData } from '@/lib/salary-calculator/card-data-mapper';
import { EditTimesDialog } from './EditTimesDialog';
import { updateFlightDuty } from '@/lib/database/flights';
import { recalculateMonthlyTotals } from '@/lib/salary-calculator/recalculation-engine';
import { useToast } from '@/hooks/use-toast';

const BRAND = { primary: "#4C49ED", accent: "#6DDC91", neutral: "#FFFFFF" };

interface StandardDutyCardProps {
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

export function StandardDutyCard({
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
}: StandardDutyCardProps) {
  const { showSuccess, showError } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const cardData = mapFlightDutyToCardData(flightDuty, allFlightDuties);

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

      // Calculate flight pay based on duty type
      let flightPay;
      if (flightDuty.dutyType === 'sby') {
        // SBY (Home Standby) is always unpaid
        flightPay = 0;
      } else if (flightDuty.dutyType === 'asby') {
        // ASBY (Airport Standby) has fixed 4-hour payment regardless of actual duty hours
        // Keep the existing payment (4 hours × hourly rate)
        flightPay = flightDuty.flightPay;
      } else {
        // Other duty types (shouldn't happen for StandardDutyCard, but fallback)
        const hourlyRate = position === 'SCCM' ? 62 : 50;
        flightPay = dutyHours * hourlyRate;
      }

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

  // Check if this duty type is editable (only ASBY and SBY)
  const isEditable = flightDuty.dutyType === 'asby' || flightDuty.dutyType === 'sby';

  // Get duty type specific information
  const getDutyTypeInfo = () => {
    switch (flightDuty.dutyType) {
      case 'layover':
        // In rare cases we intentionally render a single-segment layover duty as a standard card
        // (e.g., inbound segment belongs to a previous month and should not connect in this month).
        return {
          icon: Timer,
          label: 'Layover'
        };
      case 'asby':
        return {
          icon: Timer,
          label: 'Airport Standby'
        };
      case 'recurrent':
        return {
          icon: BookOpen,
          label: 'Recurrent Training'
        };
      case 'sby':
        return {
          icon: Clock,
          label: 'Home Standby'
        };
      case 'business_promotion':
        return {
          icon: Camera,
          label: 'Business Promotion'
        };
      default:
        return {
          icon: Timer,
          label: flightDuty.dutyType.toUpperCase()
        };
    }
  };

  const dutyInfo = getDutyTypeInfo();
  const DutyIcon = dutyInfo.icon;
  const routingLabel = cardData.routing?.trim();
  const primaryLabel =
    flightDuty.dutyType === 'layover' && routingLabel ? routingLabel : dutyInfo.label;

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
          {showActions && onDelete && (
            <div className="absolute bottom-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {userId && position && isEditable && (
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

          {/* Top row - Duty info and payment badge (if payment > 0) */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-bold">
              {cardData.flightNumber || dutyInfo.label}
            </span>
            {/* Only show payment badge if there's actual payment */}
            {flightDuty.flightPay > 0 && (
              <div
                className="text-xs font-semibold text-white rounded-full px-2 py-0.5"
                style={{ backgroundColor: BRAND.accent }}
              >
                {cardData.pay}
              </div>
            )}
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

          {/* Main content section - flex-based alignment */}
          <div className="flight-card-main-content">
            {flightDuty.dutyType === 'layover' && routingLabel ? (
              /* Layover grid layout to match flight cards */
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold tracking-wide" style={{ color: 'rgb(58, 55, 128)' }}>
                    {routingLabel.split(/[-→]/)[0]?.trim()}
                  </div>
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
                  <div className="text-lg font-bold tracking-wide" style={{ color: 'rgb(58, 55, 128)' }}>
                    {routingLabel.split(/[-→]/)[1]?.trim()}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{cardData.debriefing}</div>
                </div>
              </div>
            ) : (
              /* Standard centered layout for other duty types */
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 mb-2">
                  <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
                  <DutyIcon className="h-5 w-5" style={{ color: BRAND.primary }} />
                  <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
                </div>
                
                <div className="text-xs font-semibold text-gray-700">
                  {primaryLabel}
                </div>

                {/* Show times if available */}
                {cardData.reporting && cardData.debriefing && (
                  <div className="text-xs text-gray-500 mt-1">
                    {cardData.reporting} - {cardData.debriefing}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom spacer for consistent layout */}
          <div className="flex-1"></div>
        </div>
      </Card>

      {/* Edit Times Dialog - Only for ASBY and SBY */}
      {isEditable && (
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

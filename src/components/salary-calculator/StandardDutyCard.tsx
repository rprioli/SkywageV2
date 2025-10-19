'use client';

/**
 * Standard Duty Card Component - For non-layover, non-turnaround duties
 * Handles: asby, recurrent, sby, off duty types
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Timer, BookOpen, Clock, Calendar, Camera } from 'lucide-react';
import { FlightDuty } from '@/types/salary-calculator';
import { mapFlightDutyToCardData } from '@/lib/salary-calculator/card-data-mapper';

const BRAND = { primary: "#4C49ED", accent: "#6DDC91", neutral: "#FFFFFF" };

interface StandardDutyCardProps {
  flightDuty: FlightDuty;
  allFlightDuties?: FlightDuty[];
  onDelete?: (flightDuty: FlightDuty) => void;
  showActions?: boolean;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (flightId: string) => void;
}

export function StandardDutyCard({
  flightDuty,
  allFlightDuties = [],
  onDelete,
  showActions = true,
  bulkMode = false,
  isSelected = false,
  onToggleSelection
}: StandardDutyCardProps) {

  const cardData = mapFlightDutyToCardData(flightDuty, allFlightDuties);

  const handleDelete = () => {
    if (onDelete) onDelete(flightDuty);
  };

  const handleToggleSelection = () => {
    if (onToggleSelection && flightDuty.id) {
      onToggleSelection(flightDuty.id);
    }
  };

  // Get duty type specific information
  const getDutyTypeInfo = () => {
    switch (flightDuty.dutyType) {
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
                  {onDelete && (
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
            <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 mb-2">
              <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
              <DutyIcon className="h-5 w-5" style={{ color: BRAND.primary }} />
              <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
            </div>
            
            <div className="text-xs font-semibold text-gray-700">
              {dutyInfo.label}
            </div>

            {/* Show times if available */}
            {cardData.reporting && cardData.debriefing && (
              <div className="text-xs text-gray-500 mt-1">
                {cardData.reporting} - {cardData.debriefing}
              </div>
            )}
            </div>
          </div>

          {/* Bottom spacer for consistent layout */}
          <div className="flex-1"></div>
        </div>
      </Card>
    </div>
  );
}

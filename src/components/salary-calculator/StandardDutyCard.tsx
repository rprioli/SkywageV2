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
import { MoreVertical, Edit, Trash2, Timer, BookOpen, Clock, Calendar } from 'lucide-react';
import { FlightDuty } from '@/types/salary-calculator';
import { mapFlightDutyToCardData } from '@/lib/salary-calculator/card-data-mapper';

const BRAND = { primary: "#4C49ED", accent: "#6DDC91", neutral: "#FFFFFF" };

interface StandardDutyCardProps {
  flightDuty: FlightDuty;
  allFlightDuties?: FlightDuty[];
  onEdit?: (flightDuty: FlightDuty) => void;
  onDelete?: (flightDuty: FlightDuty) => void;
  showActions?: boolean;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (flightId: string) => void;
}

export function StandardDutyCard({
  flightDuty,
  allFlightDuties = [],
  onEdit,
  onDelete,
  showActions = true,
  bulkMode = false,
  isSelected = false,
  onToggleSelection
}: StandardDutyCardProps) {
  
  const cardData = mapFlightDutyToCardData(flightDuty, allFlightDuties);

  const handleEdit = () => {
    if (onEdit) onEdit(flightDuty);
  };

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
        className={`rounded-2xl border-0 bg-white shadow-none hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-gray-200 ${
          isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
        }`}
        style={{ minHeight: '120px', maxHeight: '120px' }}
      >
        <div className="px-4 py-3 h-full flex flex-col">
          {/* Bulk Selection Checkbox */}
          {bulkMode && onToggleSelection && flightDuty.id && (
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleToggleSelection}
                className="h-4 w-4"
              />
            </div>
          )}

          {/* Actions Menu - Bottom Right */}
          {showActions && (onEdit || onDelete) && (
            <div className="absolute bottom-2 right-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
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

          {/* Flight number/duty info, Payment badge, and Total duty badge - same line */}
          <div className="relative flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-bold">
              {cardData.flightNumber || dutyInfo.label}
            </span>
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white rounded-full px-2 py-0.5" 
              style={{ backgroundColor: BRAND.accent }}
            >
              {cardData.pay}
            </div>
            <span 
              className="inline-block text-white text-xs font-bold px-3 py-1 rounded-full" 
              style={{ backgroundColor: BRAND.primary }}
            >
              {cardData.totalDuty} Duty
            </span>
          </div>

          {/* Main content section */}
          <div className="flex flex-col items-center justify-center flex-1 text-center">
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
      </Card>
    </div>
  );
}

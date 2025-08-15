'use client';

/**
 * Turnaround Card Component - New uniform design
 * Based on the design created in flight-card-design-test
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
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { FlightDuty } from '@/types/salary-calculator';
import { mapFlightDutyToCardData } from '@/lib/salary-calculator/card-data-mapper';

const BRAND = { primary: "#4C49ED", accent: "#6DDC91", neutral: "#FFFFFF" };

interface TurnaroundCardProps {
  flightDuty: FlightDuty;
  allFlightDuties?: FlightDuty[];
  onEdit?: (flightDuty: FlightDuty) => void;
  onDelete?: (flightDuty: FlightDuty) => void;
  showActions?: boolean;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (flightId: string) => void;
}

export function TurnaroundCard({
  flightDuty,
  allFlightDuties = [],
  onEdit,
  onDelete,
  showActions = true,
  bulkMode = false,
  isSelected = false,
  onToggleSelection
}: TurnaroundCardProps) {
  
  const cardData = mapFlightDutyToCardData(flightDuty, allFlightDuties);

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

          {/* Flight number, Payment badge, and Total duty badge - same line */}
          <div className="relative flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-bold">{cardData.flightNumber}</span>
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

          {/* Main routing section */}
          <div className="grid grid-cols-3 items-center gap-2 flex-1">
            <div className="text-center">
              <div className="text-lg font-bold tracking-wide text-gray-900">{from}</div>
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
              <div className="text-lg font-bold tracking-wide text-gray-900">{to}</div>
              <div className="text-xs text-gray-500 mt-0.5">{cardData.debriefing}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

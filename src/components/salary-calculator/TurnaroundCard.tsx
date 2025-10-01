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
import { MoreVertical, Trash2 } from 'lucide-react';
import { FlightDuty } from '@/types/salary-calculator';
import { mapFlightDutyToCardData } from '@/lib/salary-calculator/card-data-mapper';

const BRAND = { primary: "#4C49ED", accent: "#6DDC91", neutral: "#FFFFFF" };

interface TurnaroundCardProps {
  flightDuty: FlightDuty;
  allFlightDuties?: FlightDuty[];
  onDelete?: (flightDuty: FlightDuty) => void;
  showActions?: boolean;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (flightId: string) => void;
}

export function TurnaroundCard({
  flightDuty,
  allFlightDuties = [],
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

          {/* Bottom spacer for consistent layout */}
          <div className="flex-1"></div>
        </div>
      </Card>
    </div>
  );
}

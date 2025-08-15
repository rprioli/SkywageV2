'use client';

/**
 * Layover Connected Card Component - Two-segment layover interface with navigation
 * Based on the design created in flight-card-design-test
 */

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { FlightDuty } from '@/types/salary-calculator';
import { 
  mapFlightDutyToCardData, 
  findLayoverPair,
  formatCurrency,
  formatDutyHours
} from '@/lib/salary-calculator/card-data-mapper';

const BRAND = { primary: "#4C49ED", accent: "#6DDC91", neutral: "#FFFFFF" };

interface LayoverConnectedCardProps {
  flightDuty: FlightDuty;
  allFlightDuties?: FlightDuty[];
  onEdit?: (flightDuty: FlightDuty) => void;
  onDelete?: (flightDuty: FlightDuty) => void;
  showActions?: boolean;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (flightId: string) => void;
}

export function LayoverConnectedCard({
  flightDuty,
  allFlightDuties = [],
  onEdit,
  onDelete,
  showActions = true,
  bulkMode = false,
  isSelected = false,
  onToggleSelection
}: LayoverConnectedCardProps) {
  
  const [currentSegment, setCurrentSegment] = useState<'outbound' | 'inbound'>('outbound');

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

  // Handle both routing formats: "DXB → ZAG" and "DXB - ZAG"
  const routingParts = cardData.routing.includes(' → ')
    ? cardData.routing.split(' → ')
    : cardData.routing.split(' - ');
  const [from, to] = routingParts;

  const handleEdit = () => {
    if (onEdit) onEdit(currentDuty);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(currentDuty);
  };

  const handleToggleSelection = () => {
    if (onToggleSelection && currentDuty.id) {
      onToggleSelection(currentDuty.id);
    }
  };

  // If no layover pair found, show as single card
  if (!layoverPair) {
    return (
      <div className="relative">
        <Card 
          className={`rounded-2xl border-0 bg-white shadow-none hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-gray-200 ${
            isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
          }`}
          style={{ minHeight: '120px', maxHeight: '120px' }}
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
          className={`rounded-2xl border-0 bg-white shadow-none hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-gray-200 ${
            isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
          }`}
          style={{ minHeight: '120px', maxHeight: '120px' }}
        >
          <div className="px-4 py-3 h-full flex flex-col">
            {/* Bulk Selection Checkbox */}
            {bulkMode && onToggleSelection && currentDuty.id && (
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={handleToggleSelection}
                  className="h-4 w-4"
                />
              </div>
            )}

            {/* Navigation Arrows - Inside Card */}
            {layoverPair && (
              <>
                {/* Left Arrow */}
                <button
                  onClick={() => setCurrentSegment('outbound')}
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
                  onClick={() => setCurrentSegment('inbound')}
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
            <div className="relative flex items-center justify-between mb-1">
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
            <div className="grid grid-cols-3 items-center gap-2 mb-1 flex-1">
              <div className="text-center">
                <div className="text-lg font-bold tracking-wide text-gray-900">{from}</div>
                <div className="text-xs text-gray-500 mt-0.5">{cardData.reporting}</div>
              </div>
              
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
                  <div className="text-sm" style={{ color: BRAND.primary }}>✈</div>
                  <div className="h-px w-6" style={{ backgroundColor: BRAND.primary }}></div>
                </div>
                <div className="text-xs font-semibold text-gray-700">
                  Layover
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold tracking-wide text-gray-900">{to}</div>
                <div className="text-xs text-gray-500 mt-0.5">{cardData.debriefing}</div>
              </div>
            </div>

            {/* Layover details - only show on outbound */}
            {isOutbound && layoverPair && (
              <div className="text-xs text-gray-600 text-center mt-0.5">
                {layoverPair.destination} {formatDutyHours(layoverPair.restHours)} - {formatCurrency(layoverPair.perDiemPay)}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

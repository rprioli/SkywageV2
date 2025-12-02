'use client';

/**
 * Flight Duty Card Component for Skywage Salary Calculator
 * Beautiful card design based on reference with floating icons and exact styling
 */

import { FlightDuty } from '@/types/salary-calculator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Hotel,
  Clock,
  Trash2
} from 'lucide-react';
import { calculateRestPeriod } from '@/lib/salary-calculator/time-calculator';
import {
  formatCurrency,
  formatTime,
  formatDecimalHoursToHHMM,
  formatHoursMinutes,
  getDestination,
  isOutboundFlight,
  isInboundFlight,
  getDutyTypeConfig,
  SectorDisplay
} from './flight-duty-card';

interface FlightDutyCardProps {
  flightDuty: FlightDuty;
  allFlightDuties?: FlightDuty[]; // For layover rest period calculation
  onDelete?: (flightDuty: FlightDuty) => void;
  showActions?: boolean;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (flightId: string) => void;
}

export function FlightDutyCard({
  flightDuty,
  allFlightDuties = [],
  onDelete,
  showActions = true,
  bulkMode = false,
  isSelected = false,
  onToggleSelection
}: FlightDutyCardProps) {
  // Helper to format time with date
  const formatTimeWithDate = (timeValue: { hours: number; minutes: number }, date: Date, isDebriefing = false) => {
    const timeStr = formatTime(timeValue);
    const displayDate = (isDebriefing && flightDuty.isCrossDay)
      ? new Date(date.getTime() + 24 * 60 * 60 * 1000)
      : date;
    const dateStr = displayDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    return `${timeStr} ${dateStr}`;
  };

  // Get layover rest period using extracted utilities
  const getLayoverRestPeriod = () => {
    if (flightDuty.dutyType !== 'layover') return null;
    if (!isOutboundFlight(flightDuty.sectors)) return null;
    if (!allFlightDuties.length) return null;

    const destination = getDestination(flightDuty.sectors);
    if (!destination) return null;

    const matchingInboundFlight = allFlightDuties.find(flight => {
      if (flight.dutyType !== 'layover') return false;
      if (!isInboundFlight(flight.sectors)) return false;
      if (getDestination(flight.sectors) !== destination) return false;
      if (flight.date.getTime() <= flightDuty.date.getTime()) return false;
      const daysDiff = (flight.date.getTime() - flightDuty.date.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 5;
    });

    if (!matchingInboundFlight) return null;

    try {
      const daysBetween = Math.floor((matchingInboundFlight.date.getTime() - flightDuty.date.getTime()) / (24 * 60 * 60 * 1000));
      const restHours = calculateRestPeriod(
        flightDuty.debriefTime,
        flightDuty.isCrossDay,
        matchingInboundFlight.reportTime,
        matchingInboundFlight.isCrossDay,
        daysBetween
      );
      const perDiemRate = 8.82;
      const perDiemPay = restHours * perDiemRate;
      return { restHours, perDiemPay, matchingFlight: matchingInboundFlight };
    } catch {
      return null;
    }
  };

  const dutyConfig = getDutyTypeConfig(flightDuty.dutyType);
  const DutyIcon = dutyConfig.icon;

  return (
    <div className="relative">
      {/* Floating Icon - centered at top of card, bigger size */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-10">
        <div className={`w-20 h-20 rounded-3xl ${dutyConfig.bgColor} flex items-center justify-center shadow-lg`}>
          <DutyIcon className={`h-10 w-10 ${dutyConfig.textColor}`} />
        </div>
      </div>

      <Card className={`relative group hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-gray-200 rounded-3xl overflow-hidden bg-white ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
        <CardContent className="p-6 pt-12">
          {/* Bulk Selection Checkbox */}
          {bulkMode && onToggleSelection && flightDuty.id && (
            <div className="absolute top-4 left-4">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(flightDuty.id!)}
                className="h-5 w-5"
              />
            </div>
          )}

          {/* Three Dots Menu - ShadCN Dropdown Menu */}
          {showActions && onDelete && !bulkMode && (
            <div className="absolute top-4 right-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 cursor-pointer hover:bg-transparent"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(flightDuty)}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

        {/* Main Content */}
        <div className="space-y-4 mt-1">
          {/* Duty Type and Date - very close to the floating icon like reference */}
          <div className="text-center space-y-0.5">
            <h3 className="font-bold text-lg text-gray-900">
              {dutyConfig.label}
            </h3>
            <p className="text-sm text-gray-500">
              {flightDuty.date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>

          {/* Flight Numbers and Sectors - always reserve space for consistent card height */}
          <div className="text-center min-h-[3rem] flex flex-col justify-center">
            {flightDuty.dutyType === 'recurrent' ? (
              <h4 className="font-semibold text-responsive-base text-gray-800 space-responsive-sm">
                Recurrent Training
              </h4>
            ) : flightDuty.dutyType === 'sby' ? (
              <>
                <h4 className="font-semibold text-responsive-base text-gray-800 space-responsive-sm">
                  SBY
                </h4>
                <div className="text-responsive-sm text-gray-500">
                  DXB
                </div>
              </>
            ) : flightDuty.flightNumbers.length > 0 ? (
              <h4 className="font-semibold text-responsive-base text-gray-800 space-responsive-sm">
                {flightDuty.dutyType === 'asby'
                  ? flightDuty.flightNumbers.join(' ') // No FZ prefix for standby duties
                  : flightDuty.flightNumbers.map(num => num.startsWith('FZ') ? num : `FZ${num}`).join(' ')
                }
              </h4>
            ) : null}
            {/* Only show sectors for non-recurrent and non-sby duties to avoid verbose descriptions */}
            {flightDuty.dutyType !== 'recurrent' && flightDuty.dutyType !== 'sby' && flightDuty.sectors.length > 0 && (
              <div className="text-sm text-gray-500">
                <SectorDisplay sectors={flightDuty.sectors} dutyType={flightDuty.dutyType} />
              </div>
            )}
          </div>

          {/* Times Section - Reporting and Debriefing */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Reporting:</span>
              </div>
              <span className="font-medium text-gray-900">
                {formatTimeWithDate(flightDuty.reportTime, flightDuty.date)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Debriefing:</span>
              </div>
              <span className="font-medium text-gray-900">
                {formatTimeWithDate(flightDuty.debriefTime, flightDuty.date, true)}
              </span>
            </div>
          </div>

          {/* Layover Rest Period - Only show on first card of layover pair */}
          {(() => {
            const restPeriod = getLayoverRestPeriod();
            if (!restPeriod) return null;

            return (
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1">
                    <Hotel className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Rest Period:</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatHoursMinutes(restPeriod.restHours)}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Bottom Row - Duration and Pay */}
          <div className="flex justify-between items-center pt-2">
            {/* Left side - Duration info */}
            <div className="text-sm">
              <span className="font-semibold text-gray-800">Total Duty:</span>
              <span className="text-gray-600 ml-1">{formatDecimalHoursToHHMM(flightDuty.dutyHours)}</span>
            </div>

            {/* Right side - Pay Badge (hidden for Home Standby since it's always 0) */}
            {flightDuty.dutyType !== 'sby' && flightDuty.dutyType !== 'asby' && (
              <Badge
                variant="secondary"
                className="bg-[#6DDC91] text-white border-[#6DDC91] text-xs px-3 py-1 rounded-full font-medium cursor-pointer"
              >
                {formatCurrency(flightDuty.flightPay)}
              </Badge>
            )}
          </div>

          {/* Per Diem Row - Only show on first card of layover pair */}
          {(() => {
            const restPeriod = getLayoverRestPeriod();
            if (!restPeriod) return null;

            return (
              <div className="flex justify-between items-center pt-1">
                {/* Left side - Per Diem label */}
                <div className="text-sm">
                  <span className="font-semibold text-gray-800">Per Diem:</span>
                  <span className="text-gray-600 ml-1">{formatHoursMinutes(restPeriod.restHours)}</span>
                </div>

                {/* Right side - Per Diem Amount Badge */}
                <Badge
                  variant="secondary"
                  className="bg-[#6DDC91] text-white border-[#6DDC91] text-xs px-3 py-1 rounded-full font-medium cursor-pointer"
                >
                  {formatCurrency(restPeriod.perDiemPay)}
                </Badge>
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
    </div>
  );
}

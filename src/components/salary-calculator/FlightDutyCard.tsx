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
  RotateCcw,
  Hotel,
  Timer,
  Clock,
  Calendar,
  BookOpen,
  Edit,
  Trash2,
  ArrowRight
} from 'lucide-react';

interface FlightDutyCardProps {
  flightDuty: FlightDuty;
  allFlightDuties?: FlightDuty[]; // For layover rest period calculation
  onEdit?: (flightDuty: FlightDuty) => void;
  onDelete?: (flightDuty: FlightDuty) => void;
  showActions?: boolean;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (flightId: string) => void;
}

export function FlightDutyCard({
  flightDuty,
  allFlightDuties = [],
  onEdit,
  onDelete,
  showActions = true,
  bulkMode = false,
  isSelected = false,
  onToggleSelection
}: FlightDutyCardProps) {



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (timeValue: { hours: number; minutes: number }) => {
    return `${timeValue.hours.toString().padStart(2, '0')}:${timeValue.minutes.toString().padStart(2, '0')}`;
  };

  const formatDecimalHoursToHHMM = (decimalHours: number) => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatTimeWithDate = (timeValue: { hours: number; minutes: number }, date: Date, isDebriefing = false) => {
    const timeStr = formatTime(timeValue);

    // For cross-day flights, debriefing time should show the next day's date
    const displayDate = (isDebriefing && flightDuty.isCrossDay)
      ? new Date(date.getTime() + 24 * 60 * 60 * 1000) // Add one day
      : date;

    const dateStr = displayDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit'
    });
    return `${timeStr} ${dateStr}`;
  };

  // Helper function to format hours and minutes
  const formatHoursMinutes = (decimalHours: number) => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };

  // Helper function to find matching layover flight and calculate rest period
  const getLayoverRestPeriod = () => {
    // Only calculate for layover duties
    if (flightDuty.dutyType !== 'layover' || !allFlightDuties.length) {
      return null;
    }

    // Check if this is an inbound flight (returning to DXB)
    // The last sector in the array should be DXB for inbound flights
    const isInboundToDXB = flightDuty.sectors[flightDuty.sectors.length - 1]?.toUpperCase() === 'DXB';

    // Don't show rest period on inbound flights returning to DXB
    if (isInboundToDXB) {
      return null;
    }

    // For now, return test data to verify the logic
    return {
      restHours: 23.5,
      perDiemPay: 207.27,
      matchingFlight: null
    };

    // Find the matching inbound flight (next layover flight with same user)
    const currentDate = flightDuty.date.getTime();
    const matchingFlight = allFlightDuties.find(flight =>
      flight.dutyType === 'layover' &&
      flight.userId === flightDuty.userId &&
      flight.id !== flightDuty.id &&
      flight.date.getTime() > currentDate &&
      Math.abs(flight.date.getTime() - currentDate) <= 3 * 24 * 60 * 60 * 1000 // Within 3 days
    );

    if (!matchingFlight) {
      return { error: 'Could not find matching layover flight' };
    }

    // Calculate rest period between debriefing of current flight and reporting of next flight
    const debriefMinutes = flightDuty.debriefTime.totalMinutes + (flightDuty.isCrossDay ? 24 * 60 : 0);
    const reportMinutes = matchingFlight.reportTime.totalMinutes;

    // Calculate days between flights
    const daysBetween = Math.floor((matchingFlight.date.getTime() - flightDuty.date.getTime()) / (24 * 60 * 60 * 1000));

    // Calculate total rest minutes
    let restMinutes = (daysBetween * 24 * 60) + reportMinutes - debriefMinutes;

    // If negative, add a day
    if (restMinutes < 0) {
      restMinutes += 24 * 60;
    }

    const restHours = restMinutes / 60;

    // Calculate per diem (using CCM rate as default - could be improved to use actual position)
    const perDiemRate = 8.82; // AED per hour
    const perDiemPay = restHours * perDiemRate;

    return {
      restHours,
      perDiemPay,
      matchingFlight
    };
  };

  const renderSectorsWithIcons = (sectors: string[], dutyType: string) => {
    if (sectors.length === 0) return null;

    if (dutyType === 'turnaround' && sectors.length > 1) {
      // For turnarounds, show simplified routing: DXB → CMB → DXB
      const airports = sectors.flatMap(sector => sector.split('-'));
      const uniqueAirports = [...new Set(airports)];
      if (uniqueAirports.length > 1) {
        return (
          <span className="flex items-center justify-center gap-1.5">
            {uniqueAirports.map((airport, index) => (
              <span key={index} className="flex items-center gap-1.5">
                <span>{airport}</span>
                {index < uniqueAirports.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-[#4C49ED]" />
                )}
              </span>
            ))}
          </span>
        );
      }
    }

    // For layovers or single sectors, show individual sectors with arrows
    if (sectors.length === 1) {
      const airports = sectors[0].split('-');
      if (airports.length === 2) {
        return (
          <span className="flex items-center justify-center gap-1.5">
            <span>{airports[0]}</span>
            <ArrowRight className="h-3 w-3 text-[#4C49ED]" />
            <span>{airports[1]}</span>
          </span>
        );
      }
    }

    // For layovers and other cases, show sectors with arrows
    if (sectors.length > 0) {
      const airports = sectors.flatMap(sector => sector.split('-'));
      if (airports.length >= 2) {
        return (
          <span className="flex items-center justify-center gap-1.5">
            {airports.map((airport, index) => (
              <span key={index} className="flex items-center gap-1.5">
                <span>{airport}</span>
                {index < airports.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-[#4C49ED]" />
                )}
              </span>
            ))}
          </span>
        );
      }
    }

    // Final fallback: show sectors as-is
    return <span>{sectors.join(', ')}</span>;
  };

  const getDutyTypeConfig = (dutyType: string) => {
    // All icons use primary purple background with white icons
    const baseConfig = {
      bgColor: 'bg-[#4C49ED]', // Skywage primary purple for ALL icons
      textColor: 'text-white'
    };

    switch (dutyType) {
      case 'turnaround':
        return {
          ...baseConfig,
          icon: RotateCcw,
          label: 'Turnaround'
        };
      case 'layover':
        return {
          ...baseConfig,
          icon: Hotel,
          label: 'Layover'
        };
      case 'asby':
        return {
          ...baseConfig,
          icon: Timer,
          label: 'Airport Standby'
        };
      case 'recurrent':
        return {
          ...baseConfig,
          icon: BookOpen,
          label: 'Ground Duty'
        };
      case 'sby':
        return {
          ...baseConfig,
          icon: Clock,
          label: 'Home Standby'
        };
      case 'off':
        return {
          ...baseConfig,
          icon: Calendar,
          label: 'Ground'
        };
      default:
        return {
          ...baseConfig,
          icon: Timer,
          label: dutyType.toUpperCase()
        };
    }
  };

  const getDataSourceBadge = (dataSource: string) => {
    switch (dataSource) {
      case 'csv':
        return { label: 'CSV', variant: 'secondary' as const };
      case 'manual':
        return { label: 'Manual', variant: 'outline' as const };
      case 'edited':
        return { label: 'Edited', variant: 'default' as const };
      default:
        return { label: dataSource.toUpperCase(), variant: 'secondary' as const };
    }
  };

  const dutyConfig = getDutyTypeConfig(flightDuty.dutyType);
  const DutyIcon = dutyConfig.icon;
  const dataSourceBadge = getDataSourceBadge(flightDuty.dataSource);

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
          {bulkMode && onToggleSelection && (
            <div className="absolute top-4 left-4">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(flightDuty.id)}
                className="h-5 w-5"
              />
            </div>
          )}

          {/* Three Dots Menu - ShadCN Dropdown Menu */}
          {showActions && (onEdit || onDelete) && !bulkMode && (
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
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(flightDuty)} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
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
              <h4 className="font-semibold text-base text-gray-800 mb-1">
                Recurrent Training
              </h4>
            ) : flightDuty.flightNumbers.length > 0 ? (
              <h4 className="font-semibold text-base text-gray-800 mb-1">
                {flightDuty.flightNumbers.map(num => num.startsWith('FZ') ? num : `FZ${num}`).join(' ')}
              </h4>
            ) : null}
            {flightDuty.sectors.length > 0 && (
              <div className="text-sm text-gray-500">
                {renderSectorsWithIcons(flightDuty.sectors, flightDuty.dutyType)}
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

            if (restPeriod.error) {
              return (
                <div className="text-xs text-red-500 text-center py-1">
                  {restPeriod.error}
                </div>
              );
            }

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

            {/* Right side - Pay Badge with accent brand color background and white text */}
            <Badge
              variant="secondary"
              className="bg-[#6DDC91] text-white border-[#6DDC91] text-xs px-3 py-1 rounded-full font-medium cursor-pointer"
            >
              {formatCurrency(flightDuty.flightPay)}
            </Badge>
          </div>

          {/* Per Diem Row - Only show on first card of layover pair */}
          {(() => {
            const restPeriod = getLayoverRestPeriod();
            if (!restPeriod || restPeriod.error) return null;

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

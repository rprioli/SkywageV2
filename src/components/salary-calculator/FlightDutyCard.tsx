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
  Trash2,
  ArrowRight
} from 'lucide-react';
import { calculateRestPeriod } from '@/lib/salary-calculator/time-calculator';

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

  // Helper function to get layover rest period using the same logic as calculation engine
  const getLayoverRestPeriod = () => {
    // Only show for layover duties
    if (flightDuty.dutyType !== 'layover') {
      return null;
    }

    // Helper function to parse sector string into array
    const parseSectors = (sectorString: string): string[] => {
      // Handle both single sector strings like "DXB  - ZAG" and multi-sector strings
      if (sectorString.includes(' → ')) {
        // Multi-sector format: "DXB  - EBL → EBL  - DXB"
        return sectorString.split(' → ').map(s => s.trim());
      } else {
        // Single sector format: Handle both "DXB - ZAG" and "DXB-ZAG" formats
        let parts: string[];
        if (sectorString.includes(' - ')) {
          // Format with spaces: "DXB - ZAG"
          parts = sectorString.split(' - ').map(s => s.trim());
        } else if (sectorString.includes('-')) {
          // Format without spaces: "DXB-ZAG" (manual entry format)
          parts = sectorString.split('-').map(s => s.trim());
        } else {
          // Fallback for other formats
          parts = [sectorString.trim()];
        }
        return parts.length >= 2 ? parts : [sectorString.trim()];
      }
    };

    // Helper function to extract destination from sectors
    const getDestination = (sectors: string[]): string => {
      // Parse the first sector string to get airports
      const firstSector = sectors[0] || '';
      const airports = parseSectors(firstSector);

      // For outbound flights: DXB → destination, return destination
      // For inbound flights: destination → DXB, return destination (first airport)
      if (airports.length >= 2) {
        return airports[0] === 'DXB' ? airports[1] : airports[0];
      }
      return '';
    };

    // Helper function to check if flight is outbound (DXB → destination)
    const isOutboundFlight = (sectors: string[]): boolean => {
      const firstSector = sectors[0] || '';
      const airports = parseSectors(firstSector);
      return airports.length >= 2 && airports[0] === 'DXB';
    };

    // Helper function to check if flight is inbound (destination → DXB)
    const isInboundFlight = (sectors: string[]): boolean => {
      const firstSector = sectors[0] || '';
      const airports = parseSectors(firstSector);
      return airports.length >= 2 && airports[airports.length - 1] === 'DXB';
    };

    // Only show rest period on outbound flights (DXB → destination)
    if (!isOutboundFlight(flightDuty.sectors)) {
      return null;
    }

    if (!allFlightDuties.length) {
      return null;
    }

    const destination = getDestination(flightDuty.sectors);
    if (!destination) {
      return null;
    }

    // Find the matching inbound flight for this destination using the same logic as calculation engine
    const matchingInboundFlight = allFlightDuties.find(flight => {
      // Must be a layover duty
      if (flight.dutyType !== 'layover') {
        return false;
      }

      // Must be an inbound flight
      if (!isInboundFlight(flight.sectors)) {
        return false;
      }

      // Must be the same destination
      if (getDestination(flight.sectors) !== destination) {
        return false;
      }

      // Must be after the outbound flight
      if (flight.date.getTime() <= flightDuty.date.getTime()) {
        return false;
      }

      // Must be within reasonable timeframe (within 5 days for layovers)
      const daysDiff = (flight.date.getTime() - flightDuty.date.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 5;
    });

    if (!matchingInboundFlight) {
      return null;
    }

    try {
      // Calculate days between flights
      const daysBetween = Math.floor((matchingInboundFlight.date.getTime() - flightDuty.date.getTime()) / (24 * 60 * 60 * 1000));

      // Use the existing calculateRestPeriod utility function for accurate calculation
      const restHours = calculateRestPeriod(
        flightDuty.debriefTime,
        flightDuty.isCrossDay,
        matchingInboundFlight.reportTime,
        matchingInboundFlight.isCrossDay,
        daysBetween
      );

      // Calculate per diem using the correct rate (8.82 AED per hour for both positions)
      const perDiemRate = 8.82; // AED per hour
      const perDiemPay = restHours * perDiemRate;

      return {
        restHours,
        perDiemPay,
        matchingFlight: matchingInboundFlight
      };
    } catch (error) {
      console.warn('Error calculating layover rest period:', error);
      return null; // Don't show error, just hide the rest period
    }
  };

  const renderSectorsWithIcons = (sectors: string[], dutyType: string) => {
    if (sectors.length === 0) return null;

    // Special handling for home standby - just show base location without arrows
    if (dutyType === 'sby' || dutyType === 'asby') {
      // For standby duties, extract just the base airport (usually DXB)
      const baseAirport = sectors[0]?.split('-')[0]?.trim() || 'DXB';
      return <span>{baseAirport}</span>;
    }

    // Check if this looks like a turnaround pattern regardless of duty type
    const isTurnaroundPattern = (sectors: string[]) => {
      if (sectors.length >= 2) {
        const airports = sectors.flatMap(sector => sector.split('-').map(airport => airport.trim()));
        // Check if it starts and ends with the same airport (typically DXB)
        return airports.length >= 3 && airports[0] === airports[airports.length - 1];
      }
      return false;
    };

    // Handle turnaround patterns (either classified as turnaround or looks like one)
    if (dutyType === 'turnaround' || isTurnaroundPattern(sectors)) {
      const airports = sectors.flatMap(sector => sector.split('-').map(airport => airport.trim()));
      if (airports.length >= 3) {
        // For turnaround, show origin → destination → origin
        const origin = airports[0];
        const destination = airports[1];
        const returnToOrigin = airports[airports.length - 1];

        // Create clean turnaround display: DXB → KTM → DXB
        const turnaroundRoute = [origin, destination, returnToOrigin];

        return (
          <span className="flex items-center justify-center gap-1.5">
            {turnaroundRoute.map((airport, index) => (
              <span key={index} className="flex items-center gap-1.5">
                <span>{airport}</span>
                {index < turnaroundRoute.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-[#4C49ED]" />
                )}
              </span>
            ))}
          </span>
        );
      }
    }

    if (dutyType === 'layover') {
      // For layovers, show each sector separately
      return (
        <div className="flex flex-col gap-1">
          {sectors.map((sector, index) => {
            const airports = sector.split('-').map(airport => airport.trim());
            if (airports.length === 2) {
              return (
                <span key={index} className="flex items-center justify-center gap-1.5">
                  <span>{airports[0]}</span>
                  <ArrowRight className="h-3 w-3 text-[#4C49ED]" />
                  <span>{airports[1]}</span>
                </span>
              );
            }
            return <span key={index}>{sector}</span>;
          })}
        </div>
      );
    }

    // For single sectors (any duty type), show with arrow
    if (sectors.length === 1) {
      const airports = sectors[0].split('-').map(airport => airport.trim());
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

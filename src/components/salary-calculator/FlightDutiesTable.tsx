'use client';

/**
 * Enhanced Flight Duties Table Component for Skywage Salary Calculator
 * Phase 6: Clean, beautiful design with improved UX
 * Following existing component patterns in the codebase
 */

import { useState } from 'react';
import { FlightDuty, DutyType } from '@/types/salary-calculator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Clock, Plane, MapPin, ArrowUpDown, Calendar, Filter, X, CheckSquare, Square, Trash } from 'lucide-react';
import { FlightDutyCard } from './FlightDutyCard';

interface FlightDutiesTableProps {
  flightDuties: FlightDuty[];
  loading?: boolean;
  onEdit?: (flightDuty: FlightDuty) => void;
  onDelete?: (flightDuty: FlightDuty) => void;
  onBulkDelete?: (flightDuties: FlightDuty[]) => void;
  showActions?: boolean;
}

export function FlightDutiesTable({
  flightDuties,
  loading = false,
  onEdit,
  onDelete,
  onBulkDelete,
  showActions = true
}: FlightDutiesTableProps) {
  const [sortBy, setSortBy] = useState<'date' | 'pay' | 'hours'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter state
  const [filterDutyType, setFilterDutyType] = useState<DutyType | 'all'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'week' | 'month' | 'last7'>('all');
  const [filterPayRange, setFilterPayRange] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Bulk selection state
  const [selectedFlights, setSelectedFlights] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);



  // Filter flights based on current filter settings
  const filterFlights = (flights: FlightDuty[]) => {
    return flights.filter(flight => {
      // Duty type filter
      if (filterDutyType !== 'all' && flight.dutyType !== filterDutyType) {
        return false;
      }

      // Date range filter
      if (filterDateRange !== 'all') {
        const now = new Date();
        const flightDate = flight.date;

        switch (filterDateRange) {
          case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay()); // Start of current week
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6); // End of current week
            if (flightDate < weekStart || flightDate > weekEnd) return false;
            break;
          case 'month':
            if (flightDate.getMonth() !== now.getMonth() || flightDate.getFullYear() !== now.getFullYear()) {
              return false;
            }
            break;
          case 'last7':
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 7);
            if (flightDate < sevenDaysAgo || flightDate > now) return false;
            break;
        }
      }

      // Pay range filter
      if (filterPayRange !== 'all') {
        const pay = flight.flightPay;
        switch (filterPayRange) {
          case 'high':
            if (pay <= 300) return false;
            break;
          case 'medium':
            if (pay <= 100 || pay > 300) return false;
            break;
          case 'low':
            if (pay > 100) return false;
            break;
        }
      }

      return true;
    });
  };

  const sortFlights = (flights: FlightDuty[]) => {
    return [...flights].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'pay':
          comparison = a.flightPay - b.flightPay;
          break;
        case 'hours':
          comparison = a.dutyHours - b.dutyHours;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const handleSort = (newSortBy: 'date' | 'pay' | 'hours') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterDutyType('all');
    setFilterDateRange('all');
    setFilterPayRange('all');
  };

  // Check if any filters are active
  const hasActiveFilters = filterDutyType !== 'all' || filterDateRange !== 'all' || filterPayRange !== 'all';

  // Bulk selection functions
  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    if (bulkMode) {
      setSelectedFlights(new Set());
    }
  };

  const toggleFlightSelection = (flightId: string) => {
    const newSelected = new Set(selectedFlights);
    if (newSelected.has(flightId)) {
      newSelected.delete(flightId);
    } else {
      newSelected.add(flightId);
    }
    setSelectedFlights(newSelected);
  };

  const selectAllVisible = () => {
    const visibleIds = new Set(sortedFlights.map(flight => flight.id));
    setSelectedFlights(visibleIds);
  };

  const clearSelection = () => {
    setSelectedFlights(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedFlights.size > 0 && onBulkDelete) {
      const selectedFlightDuties = sortedFlights.filter(flight => selectedFlights.has(flight.id));
      onBulkDelete(selectedFlightDuties);
      setSelectedFlights(new Set());
    }
  };

  // Apply filters and sorting first
  const filteredFlights = filterFlights(flightDuties);
  const sortedFlights = sortFlights(filteredFlights);

  const isAllVisibleSelected = sortedFlights.length > 0 && sortedFlights.every(flight => selectedFlights.has(flight.id));
  const isSomeSelected = selectedFlights.size > 0;



  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Flight Duties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-6 bg-gray-50/50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="h-5 w-20 bg-gray-200 animate-pulse rounded-md"></div>
                      <div className="h-6 w-24 bg-gray-200 animate-pulse rounded-full"></div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-4 w-28 bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-lg"></div>
                    <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (flightDuties.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Flight Duties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plane className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No flight duties found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Upload a roster CSV file or add flights manually to get started with your salary calculations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show filtered empty state
  if (filteredFlights.length === 0 && flightDuties.length > 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Flight Duties</h2>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                0 of {flightDuties.length} {flightDuties.length === 1 ? 'duty' : 'duties'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-3 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Filter className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No flights match your filters</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-4">
              Try adjusting your filter settings or clear all filters to see all flight duties.
            </p>
            <Button variant="outline" onClick={clearFilters} className="mt-2">
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-6">
        <div className="flex flex-col space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">Flight Duties</h2>
              {bulkMode && isSomeSelected && (
                <Badge variant="default" className="px-3 py-1 text-sm font-medium bg-primary">
                  {selectedFlights.size} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                {filteredFlights.length} of {flightDuties.length} {flightDuties.length === 1 ? 'duty' : 'duties'}
              </Badge>

              {/* Bulk Mode Toggle */}
              <Button
                variant={bulkMode ? "default" : "outline"}
                size="sm"
                onClick={toggleBulkMode}
                className="h-8 px-3 text-xs"
              >
                {bulkMode ? (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Exit Bulk
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Bulk Select
                  </>
                )}
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-3 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">Filter:</span>
              </div>

              {/* Duty Type Filter */}
              <Select value={filterDutyType} onValueChange={(value: DutyType | 'all') => setFilterDutyType(value)}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Duty Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="turnaround">Turnaround</SelectItem>
                  <SelectItem value="layover">Layover</SelectItem>
                  <SelectItem value="asby">Airport Standby</SelectItem>
                  <SelectItem value="sby">Home Standby</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={filterDateRange} onValueChange={(value: 'all' | 'week' | 'month' | 'last7') => setFilterDateRange(value)}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="last7">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>

              {/* Pay Range Filter */}
              <Select value={filterPayRange} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setFilterPayRange(value)}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="Pay Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pay</SelectItem>
                  <SelectItem value="high">High (&gt;300)</SelectItem>
                  <SelectItem value="medium">Medium (100-300)</SelectItem>
                  <SelectItem value="low">Low (&lt;100)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center space-x-1 text-sm">
              <span className="text-gray-500 mr-2">Sort by:</span>
              <Button
                variant={sortBy === 'date' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSort('date')}
                className="h-8 px-3 text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Date
                {sortBy === 'date' && (
                  <ArrowUpDown className="h-3 w-3 ml-1" />
                )}
              </Button>
              <Button
                variant={sortBy === 'hours' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSort('hours')}
                className="h-8 px-3 text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                Hours
                {sortBy === 'hours' && (
                  <ArrowUpDown className="h-3 w-3 ml-1" />
                )}
              </Button>
              <Button
                variant={sortBy === 'pay' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSort('pay')}
                className="h-8 px-3 text-xs"
              >
                Pay
                {sortBy === 'pay' && (
                  <ArrowUpDown className="h-3 w-3 ml-1" />
                )}
              </Button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {bulkMode && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={isAllVisibleSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAllVisible();
                      } else {
                        clearSelection();
                      }
                    }}
                  />
                  <span className="text-sm text-gray-700">
                    Select all visible ({sortedFlights.length})
                  </span>
                </div>
                {isSomeSelected && (
                  <span className="text-sm text-gray-500">
                    {selectedFlights.size} of {sortedFlights.length} selected
                  </span>
                )}
              </div>

              {isSomeSelected && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    className="h-8 px-3 text-xs"
                  >
                    Clear Selection
                  </Button>
                  {onBulkDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="h-8 px-3 text-xs"
                    >
                      <Trash className="h-3 w-3 mr-1" />
                      Delete Selected ({selectedFlights.size})
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-10 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8 mt-4">
          {sortedFlights.map((duty, index) => (
            <div
              key={duty.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-fade-in"
            >
              <FlightDutyCard
                flightDuty={duty}
                onEdit={onEdit}
                onDelete={onDelete}
                showActions={showActions}
                bulkMode={bulkMode}
                isSelected={selectedFlights.has(duty.id)}
                onToggleSelection={toggleFlightSelection}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { FlightDutiesTable };

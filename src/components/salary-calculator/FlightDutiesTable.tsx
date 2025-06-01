'use client';

/**
 * Flight Duties Table Component for Skywage Salary Calculator
 * Displays flight duties in a table format with actions
 * Following existing component patterns in the codebase
 */

import { FlightDuty } from '@/types/salary-calculator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, Clock, Plane, MapPin } from 'lucide-react';

interface FlightDutiesTableProps {
  flightDuties: FlightDuty[];
  loading?: boolean;
  onEdit?: (flightDuty: FlightDuty) => void;
  onDelete?: (flightDuty: FlightDuty) => void;
  showActions?: boolean;
}

export function FlightDutiesTable({ 
  flightDuties, 
  loading = false, 
  onEdit, 
  onDelete, 
  showActions = true 
}: FlightDutiesTableProps) {
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

  const getDutyTypeColor = (dutyType: string) => {
    switch (dutyType) {
      case 'turnaround':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'layover':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'asby':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'sby':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'off':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDataSourceIcon = (dataSource: string) => {
    switch (dataSource) {
      case 'csv':
        return '📄';
      case 'manual':
        return '✏️';
      case 'edited':
        return '📝';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flight Duties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (flightDuties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flight Duties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No flight duties found</h3>
            <p className="text-sm text-muted-foreground">
              Upload a roster CSV file or add flights manually to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Flight Duties</span>
          <Badge variant="outline">{flightDuties.length} duties</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {flightDuties.map((duty) => (
            <div
              key={duty.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4 flex-1">
                {/* Date */}
                <div className="text-sm font-medium min-w-[80px]">
                  {duty.date.toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: '2-digit' 
                  })}
                </div>

                {/* Duty Type */}
                <Badge className={getDutyTypeColor(duty.dutyType)} variant="outline">
                  {duty.dutyType.toUpperCase()}
                </Badge>

                {/* Flight Numbers */}
                <div className="flex items-center space-x-1 min-w-[120px]">
                  <Plane className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {duty.flightNumbers.length > 0 ? duty.flightNumbers.join(', ') : '-'}
                  </span>
                </div>

                {/* Sectors */}
                <div className="flex items-center space-x-1 min-w-[150px]">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {duty.sectors.length > 0 ? duty.sectors.join(' ') : '-'}
                  </span>
                </div>

                {/* Times */}
                <div className="flex items-center space-x-1 min-w-[120px]">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {formatTime(duty.reportTime)} - {formatTime(duty.debriefTime)}
                    {duty.isCrossDay && <span className="text-xs text-orange-600">¹</span>}
                  </span>
                </div>

                {/* Duty Hours */}
                <div className="text-sm font-medium min-w-[60px]">
                  {duty.dutyHours.toFixed(2)}h
                </div>

                {/* Flight Pay */}
                <div className="text-sm font-medium text-primary min-w-[80px]">
                  {formatCurrency(duty.flightPay)}
                </div>

                {/* Data Source */}
                <div className="text-xs text-muted-foreground min-w-[40px]" title={`Source: ${duty.dataSource}`}>
                  {getDataSourceIcon(duty.dataSource)}
                </div>
              </div>

              {/* Actions */}
              {showActions && (onEdit || onDelete) && (
                <div className="flex items-center space-x-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(duty)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(duty)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Duties</span>
              <div className="font-medium">{flightDuties.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Hours</span>
              <div className="font-medium">
                {flightDuties.reduce((sum, duty) => sum + duty.dutyHours, 0).toFixed(2)}h
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Pay</span>
              <div className="font-medium text-primary">
                {formatCurrency(flightDuties.reduce((sum, duty) => sum + duty.flightPay, 0))}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Hours/Duty</span>
              <div className="font-medium">
                {flightDuties.length > 0 
                  ? (flightDuties.reduce((sum, duty) => sum + duty.dutyHours, 0) / flightDuties.length).toFixed(2)
                  : '0.00'
                }h
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

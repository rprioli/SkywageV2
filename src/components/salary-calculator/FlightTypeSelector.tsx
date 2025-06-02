'use client';

/**
 * Flight Type Selector Component for Skywage Salary Calculator
 * Phase 4: Flight type selection with styled buttons
 * Following existing patterns and using styled buttons instead of radio buttons
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DutyType } from '@/types/salary-calculator';
import { 
  Plane, 
  Clock, 
  Users, 
  Coffee,
  ArrowRightLeft,
  MapPin
} from 'lucide-react';

interface FlightTypeOption {
  value: DutyType;
  label: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
  characteristics: string[];
}

interface FlightTypeSelectorProps {
  value: DutyType;
  onChange: (value: DutyType) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

const flightTypeOptions: FlightTypeOption[] = [
  {
    value: 'turnaround',
    label: 'Turnaround',
    description: 'Multiple flights returning to base on the same day',
    icon: <ArrowRightLeft className="h-5 w-5" />,
    examples: ['DXB-CMB-DXB', 'DXB-COK-DXB'],
    characteristics: [
      'Multiple flight numbers',
      'Multiple sectors',
      'Single report/debrief time',
      'Return to base same day'
    ]
  },
  {
    value: 'layover',
    label: 'Layover',
    description: 'Single flight with rest period at destination',
    icon: <MapPin className="h-5 w-5" />,
    examples: ['DXB-CMB (rest)', 'CMB-DXB (return)'],
    characteristics: [
      'Single flight number',
      'Single sector',
      'Rest period at destination',
      'Separate report/debrief'
    ]
  },
  {
    value: 'asby',
    label: 'Airport Standby',
    description: 'Standby duty at airport (4 hours fixed pay)',
    icon: <Clock className="h-5 w-5" />,
    examples: ['ASBY DXB', 'Standby duty'],
    characteristics: [
      'No flight numbers',
      'No sectors',
      'Fixed 4-hour payment',
      'Report/debrief times only'
    ]
  }
];

export function FlightTypeSelector({
  value,
  onChange,
  disabled = false,
  error,
  label,
  required = false,
  className
}: FlightTypeSelectorProps) {
  
  const handleTypeSelect = (type: DutyType) => {
    if (!disabled) {
      onChange(type);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {flightTypeOptions.map((option) => {
          const isSelected = value === option.value;
          
          return (
            <Card
              key={option.value}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected && 'ring-2 ring-primary bg-primary/5',
                disabled && 'opacity-50 cursor-not-allowed',
                error && !isSelected && 'border-destructive'
              )}
              onClick={() => handleTypeSelect(option.value)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className={cn(
                        'font-medium text-sm',
                        isSelected && 'text-primary'
                      )}>
                        {option.label}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  {/* Examples */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Examples:</p>
                    <div className="space-y-1">
                      {option.examples.map((example, index) => (
                        <p key={index} className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                          {example}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Characteristics */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Characteristics:</p>
                    <ul className="space-y-1">
                      {option.characteristics.map((characteristic, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="w-1 h-1 bg-muted-foreground rounded-full flex-shrink-0"></span>
                          {characteristic}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="flex items-center gap-1 text-primary">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-xs font-medium">Selected</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-destructive text-sm flex items-center gap-1">
          <span className="text-destructive">•</span>
          {error}
        </p>
      )}

      {/* Help text */}
      {!error && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Flight Type Guide:</p>
          <ul className="space-y-1 ml-2">
            <li>• <strong>Turnaround:</strong> Multiple flights in one duty period, returning to base</li>
            <li>• <strong>Layover:</strong> Single flight with rest period at destination</li>
            <li>• <strong>Airport Standby:</strong> Standby duty with fixed 4-hour payment</li>
          </ul>
        </div>
      )}
    </div>
  );
}

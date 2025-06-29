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
  MapPin,
  BookOpen
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
    description: '',
    icon: <ArrowRightLeft className="h-5 w-5" />,
    examples: [],
    characteristics: []
  },
  {
    value: 'layover',
    label: 'Layover',
    description: '',
    icon: <MapPin className="h-5 w-5" />,
    examples: [],
    characteristics: []
  },
  {
    value: 'asby',
    label: 'Airport Standby',
    description: '',
    icon: <Clock className="h-5 w-5" />,
    examples: [],
    characteristics: []
  },
  {
    value: 'recurrent',
    label: 'Recurrent',
    description: '',
    icon: <BookOpen className="h-5 w-5" />,
    examples: [],
    characteristics: []
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
            <Button
              key={option.value}
              type="button"
              variant={isSelected ? "default" : "outline"}
              className={cn(
                'h-auto p-3 flex items-center justify-center gap-2',
                disabled && 'opacity-50 cursor-not-allowed',
                error && !isSelected && 'border-destructive'
              )}
              onClick={() => handleTypeSelect(option.value)}
              disabled={disabled}
            >
              {option.icon}
              <span className="font-medium">{option.label}</span>
            </Button>
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


    </div>
  );
}

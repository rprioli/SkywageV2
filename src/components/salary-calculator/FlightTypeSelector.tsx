'use client';

/**
 * Flight Type Selector Component for Skywage Salary Calculator
 * Updated: Dropdown-based duty type selection for compact modal design
 * Following existing patterns and using ShadCN Select component
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DutyType } from '@/types/salary-calculator';
import {
  ArrowRightLeft,
  MapPin,
  Clock,
  BookOpen
} from 'lucide-react';

interface FlightTypeOption {
  value: DutyType;
  label: string;
  icon: React.ReactNode;
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
    icon: <ArrowRightLeft className="h-4 w-4" />
  },
  {
    value: 'layover',
    label: 'Layover',
    icon: <MapPin className="h-4 w-4" />
  },
  {
    value: 'asby',
    label: 'Airport Standby',
    icon: <Clock className="h-4 w-4" />
  },
  {
    value: 'recurrent',
    label: 'Recurrent',
    icon: <BookOpen className="h-4 w-4" />
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

  const handleValueChange = (newValue: string) => {
    if (!disabled) {
      onChange(newValue as DutyType);
    }
  };

  // Find the selected option to display icon and label
  const selectedOption = flightTypeOptions.find(option => option.value === value);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger className={cn(
          'w-full',
          error && 'border-destructive'
        )}>
          <SelectValue>
            {selectedOption && (
              <div className="flex items-center gap-2">
                {selectedOption.icon}
                <span>{selectedOption.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {flightTypeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}
    </div>
  );
}

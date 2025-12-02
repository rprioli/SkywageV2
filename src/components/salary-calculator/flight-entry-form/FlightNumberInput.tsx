'use client';

/**
 * Flight Number Input Component
 * Reusable input for entering flight numbers (digits only, max 4)
 */

import { Input } from '@/components/ui/input';
import { Plane } from 'lucide-react';

interface FlightNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export function FlightNumberInput({
  value,
  onChange,
  placeholder = '123',
  disabled = false,
  label
}: FlightNumberInputProps) {
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <div className="relative">
        <div className="input-icon-left">
          <Plane className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder={placeholder}
          disabled={disabled}
          className="input-with-left-icon"
          maxLength={4}
        />
      </div>
    </div>
  );
}


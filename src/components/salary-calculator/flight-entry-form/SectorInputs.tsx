'use client';

/**
 * Sector Inputs Component
 * Reusable grid of sector inputs (airports)
 */

import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

interface SectorInputsProps {
  sectors: string[];
  indices: number[];
  placeholders: string[];
  onChange: (newSectors: string[]) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  submitAttempted?: boolean;
}

export function SectorInputs({
  sectors,
  indices,
  placeholders,
  onChange,
  disabled = false,
  label,
  error,
  submitAttempted = false
}: SectorInputsProps) {
  const handleSectorChange = (index: number, value: string) => {
    const newSectors = [...sectors];
    while (newSectors.length <= index) {
      newSectors.push('');
    }
    newSectors[index] = value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
    onChange(newSectors);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <div className="grid grid-cols-2 gap-3">
        {indices.map((index, i) => (
          <div key={index} className="relative">
            <div className="input-icon-left">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              type="text"
              value={sectors[index] || ''}
              onChange={e => handleSectorChange(index, e.target.value)}
              placeholder={placeholders[i]}
              disabled={disabled}
              className="input-with-left-icon"
              maxLength={3}
            />
          </div>
        ))}
      </div>
      {error && submitAttempted && (
        <p className="text-destructive text-sm">{error}</p>
      )}
    </div>
  );
}


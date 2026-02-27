'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PositionSelect } from '@/components/ui/PositionSelect';
import { Position } from '@/types/salary-calculator';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const MIN_YEAR = 2025;
const MAX_YEAR = new Date().getFullYear() + 1;

const getYearOptions = () => {
  const years: number[] = [];
  for (let y = MIN_YEAR; y <= MAX_YEAR; y++) years.push(y);
  return years;
};

interface AddPositionChangeFormProps {
  onAdd: (position: Position, year: number, month: number) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function AddPositionChangeForm({ onAdd, onCancel, isLoading }: AddPositionChangeFormProps) {
  const now = new Date();
  const [selectedPosition, setSelectedPosition] = useState<'CCM' | 'SCCM' | ''>('');
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedPosition || (selectedPosition !== 'CCM' && selectedPosition !== 'SCCM')) {
      setError('Please select a position.');
      return;
    }
    setError(null);
    await onAdd(selectedPosition as Position, selectedYear, selectedMonth);
  };

  return (
    <div className="space-y-4 pt-2">
      <p className="text-sm text-muted-foreground">
        Set the position effective from a specific month. All calculations from that month forward will use the new position.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Position</label>
          <PositionSelect
            value={selectedPosition}
            onValueChange={(val) => setSelectedPosition(val as 'CCM' | 'SCCM')}
            className="w-full"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Effective Month</label>
          <Select
            value={String(selectedMonth)}
            onValueChange={(val) => setSelectedMonth(Number(val))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year</label>
          <Select
            value={String(selectedYear)}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {getYearOptions().map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Add Change'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

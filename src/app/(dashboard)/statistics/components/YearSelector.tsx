'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface YearSelectorProps {
  selectedYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
  disabled?: boolean;
}

export const YearSelector = ({
  selectedYear,
  availableYears,
  onYearChange,
  disabled = false,
}: YearSelectorProps) => {
  // Sort years in descending order (newest first)
  const sortedYears = [...availableYears].sort((a, b) => b - a);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Year:</span>
      <Select
        value={selectedYear.toString()}
        onValueChange={(value) => onYearChange(parseInt(value, 10))}
        disabled={disabled}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          {sortedYears.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};


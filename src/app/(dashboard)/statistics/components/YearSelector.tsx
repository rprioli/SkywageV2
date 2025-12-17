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
      <Select
        value={selectedYear.toString()}
        onValueChange={(value) => onYearChange(parseInt(value, 10))}
        disabled={disabled}
      >
        <SelectTrigger className="w-[100px] h-7 text-sm border-gray-200 !px-2.5 !py-0 !justify-start [&>*]:!gap-0 [&_svg]:ml-auto">
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


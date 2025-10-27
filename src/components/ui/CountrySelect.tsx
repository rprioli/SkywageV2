'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { countries } from 'countries-list';

// Convert countries object to array format for dropdown
const countryList = Object.entries(countries).map(([code, data]) => ({
  value: code,
  label: data.name,
}));

// Sort alphabetically by country name
countryList.sort((a, b) => a.label.localeCompare(b.label));

export type CountrySelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function CountrySelect({
  value,
  onValueChange,
  placeholder = 'Select your nationality',
  disabled = false,
  className,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter countries based on search query
  const filteredCountries = React.useMemo(() => {
    if (!searchQuery) return countryList;
    return countryList.filter((country) =>
      country.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Find the selected country label
  const selectedCountry = React.useMemo(() => {
    return countryList.find((country) => country.value === value);
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          {value ? selectedCountry?.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search country..."
            className="h-9"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {filteredCountries.map((country) => (
              <CommandItem
                key={country.value}
                value={country.value}
                onSelect={(currentValue) => {
                  onValueChange?.(currentValue);
                  setOpen(false);
                  setSearchQuery('');
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === country.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {country.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

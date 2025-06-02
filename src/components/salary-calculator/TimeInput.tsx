'use client';

/**
 * Time Input Component for Skywage Salary Calculator
 * Phase 4: Custom time input with validation and formatting
 * Following existing input patterns from the codebase
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  warning?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export function TimeInput({
  value,
  onChange,
  placeholder = 'HH:MM',
  disabled = false,
  error,
  warning,
  label,
  required = false,
  className
}: TimeInputProps) {
  const [internalValue, setInternalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Format time as user types
  const formatTimeInput = (input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) {
      return `${digits.slice(0, 2)}:${digits.slice(2)}`;
    }
    
    // Limit to 4 digits (HHMM)
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  };

  // Validate time format
  const validateTime = (timeStr: string): boolean => {
    if (!timeStr) return true; // Empty is valid (will be caught by required validation)
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatTimeInput(rawValue);
    
    setInternalValue(formattedValue);
    
    // Only call onChange if the formatted value is valid or empty
    if (formattedValue === '' || validateTime(formattedValue)) {
      onChange(formattedValue);
    }
  };

  // Handle blur - final validation and formatting
  const handleBlur = () => {
    setIsFocused(false);
    
    if (internalValue && !validateTime(internalValue)) {
      // Try to auto-correct common mistakes
      const digits = internalValue.replace(/\D/g, '');
      if (digits.length >= 3) {
        const hours = digits.slice(0, 2);
        const minutes = digits.slice(2, 4);
        const correctedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        
        if (validateTime(correctedTime)) {
          setInternalValue(correctedTime);
          onChange(correctedTime);
        }
      }
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle key press for better UX
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].includes(e.keyCode)) {
      return;
    }
    
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) {
      return;
    }
    
    // Only allow digits and colon
    if (!/[0-9:]/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Get current time for quick fill
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Handle quick fill with current time
  const handleQuickFill = () => {
    const currentTime = getCurrentTime();
    setInternalValue(currentTime);
    onChange(currentTime);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <Input
          type="text"
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pl-10 pr-20',
            error && 'border-destructive focus-visible:border-destructive',
            warning && !error && 'border-orange-500 focus-visible:border-orange-500'
          )}
          maxLength={5} // HH:MM format
        />
        
        {/* Quick fill button */}
        {!disabled && (
          <button
            type="button"
            onClick={handleQuickFill}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-primary hover:text-primary/80 transition-colors"
            tabIndex={-1}
          >
            Now
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-destructive text-sm flex items-center gap-1">
          <span className="text-destructive">•</span>
          {error}
        </p>
      )}

      {/* Warning message */}
      {warning && !error && (
        <p className="text-orange-600 text-sm flex items-center gap-1">
          <span className="text-orange-600">•</span>
          {warning}
        </p>
      )}

      {/* Help text */}
      {!error && !warning && isFocused && (
        <p className="text-muted-foreground text-xs">
          Enter time in HH:MM format (24-hour). Click "Now" for current time.
        </p>
      )}
    </div>
  );
}

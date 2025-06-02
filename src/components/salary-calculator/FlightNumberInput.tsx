'use client';

/**
 * Flight Number Input Component for Skywage Salary Calculator
 * Phase 4: Flight number input with validation and suggestions
 * Following existing input patterns and using Flydubai validation
 */

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plane, Plus, X } from 'lucide-react';
import { isValidFlydubaiFlightNumber } from '@/lib/salary-calculator';
import { getSuggestedFlightNumbers } from '@/lib/salary-calculator/manual-entry-processor';

interface FlightNumberInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  error?: string;
  warning?: string;
  label?: string;
  required?: boolean;
  maxFlights?: number;
  allowMultiple?: boolean;
  className?: string;
}

export function FlightNumberInput({
  value,
  onChange,
  disabled = false,
  error,
  warning,
  label,
  required = false,
  maxFlights = 4,
  allowMultiple = true,
  className
}: FlightNumberInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Ensure we have at least one input
  const flightNumbers = value.length === 0 ? [''] : value;

  // Update suggestions based on current input
  useEffect(() => {
    if (currentInput.length > 0) {
      const newSuggestions = getSuggestedFlightNumbers(currentInput);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setActiveSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [currentInput]);

  // Handle input change for a specific flight number
  const handleInputChange = (index: number, inputValue: string) => {
    const newFlightNumbers = [...flightNumbers];
    const formattedValue = inputValue.toUpperCase().trim();
    newFlightNumbers[index] = formattedValue;
    
    setCurrentInput(formattedValue);
    
    // Remove empty entries from the end, but keep at least one
    const cleanedNumbers = newFlightNumbers.filter((num, i) => 
      num !== '' || i === 0 || i < newFlightNumbers.length - 1
    );
    
    if (cleanedNumbers.length === 0) {
      cleanedNumbers.push('');
    }
    
    onChange(cleanedNumbers);
  };

  // Handle adding a new flight number input
  const handleAddFlight = () => {
    if (flightNumbers.length < maxFlights && allowMultiple) {
      const newFlightNumbers = [...flightNumbers, ''];
      onChange(newFlightNumbers);
      
      // Focus the new input after a short delay
      setTimeout(() => {
        const newIndex = newFlightNumbers.length - 1;
        inputRefs.current[newIndex]?.focus();
      }, 100);
    }
  };

  // Handle removing a flight number input
  const handleRemoveFlight = (index: number) => {
    if (flightNumbers.length > 1) {
      const newFlightNumbers = flightNumbers.filter((_, i) => i !== index);
      onChange(newFlightNumbers);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    if (focusedIndex >= 0) {
      const newFlightNumbers = [...flightNumbers];
      newFlightNumbers[focusedIndex] = suggestion;
      onChange(newFlightNumbers);
    }
    
    setShowSuggestions(false);
    setCurrentInput('');
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          handleSuggestionSelect(suggestions[activeSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  };

  // Handle input focus
  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    setCurrentInput(flightNumbers[index]);
  };

  // Handle input blur
  const handleBlur = (index: number) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setFocusedIndex(-1);
      setCurrentInput('');
    }, 200);
  };

  // Validate flight number
  const validateFlightNumber = (flightNumber: string): boolean => {
    if (!flightNumber) return true; // Empty is valid
    return isValidFlydubaiFlightNumber(flightNumber);
  };

  // Get validation state for a flight number
  const getValidationState = (flightNumber: string, index: number) => {
    if (!flightNumber) return { isValid: true, message: '' };
    
    const isValid = validateFlightNumber(flightNumber);
    if (!isValid) {
      return { 
        isValid: false, 
        message: 'Invalid format. Use FZ123 or FZ1234' 
      };
    }

    // Check for duplicates
    const duplicateIndex = flightNumbers.findIndex((num, i) => 
      i !== index && num === flightNumber && num !== ''
    );
    
    if (duplicateIndex >= 0) {
      return { 
        isValid: false, 
        message: 'Duplicate flight number' 
      };
    }

    return { isValid: true, message: '' };
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="space-y-2">
        {flightNumbers.map((flightNumber, index) => {
          const validation = getValidationState(flightNumber, index);
          
          return (
            <div key={index} className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Plane className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <Input
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    value={flightNumber}
                    onChange={e => handleInputChange(index, e.target.value)}
                    onFocus={() => handleFocus(index)}
                    onBlur={() => handleBlur(index)}
                    onKeyDown={e => handleKeyDown(e, index)}
                    placeholder={index === 0 ? 'FZ123' : 'FZ124'}
                    disabled={disabled}
                    className={cn(
                      'pl-10',
                      !validation.isValid && 'border-destructive focus-visible:border-destructive',
                      flightNumbers.length > 1 && 'pr-10'
                    )}
                    maxLength={6}
                  />

                  {/* Remove button for multiple flights */}
                  {flightNumbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFlight(index)}
                      disabled={disabled}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Field-level validation error */}
              {!validation.isValid && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <span className="text-destructive">•</span>
                  {validation.message}
                </p>
              )}

              {/* Suggestions dropdown */}
              {showSuggestions && focusedIndex === index && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto"
                >
                  {suggestions.map((suggestion, suggestionIndex) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors',
                        activeSuggestionIndex === suggestionIndex && 'bg-muted'
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Add flight button */}
        {allowMultiple && flightNumbers.length < maxFlights && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddFlight}
            disabled={disabled}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Flight
          </Button>
        )}
      </div>

      {/* General error message */}
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
      {!error && !warning && (
        <p className="text-muted-foreground text-xs">
          Enter Flydubai flight numbers (e.g., FZ123). 
          {allowMultiple && ' Add multiple flights for turnarounds.'}
        </p>
      )}
    </div>
  );
}

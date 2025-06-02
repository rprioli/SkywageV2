'use client';

/**
 * Sector Input Component for Skywage Salary Calculator
 * Phase 4: Sector input with validation and suggestions
 * Following existing input patterns and using Flydubai validation
 */

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MapPin, Plus, X } from 'lucide-react';
import { isValidFlydubaiSector } from '@/lib/salary-calculator';
import { getSuggestedSectors } from '@/lib/salary-calculator/manual-entry-processor';

interface SectorInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  error?: string;
  warning?: string;
  label?: string;
  required?: boolean;
  maxSectors?: number;
  allowMultiple?: boolean;
  className?: string;
}

export function SectorInput({
  value,
  onChange,
  disabled = false,
  error,
  warning,
  label,
  required = false,
  maxSectors = 4,
  allowMultiple = true,
  className
}: SectorInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Ensure we have at least one input
  const sectors = value.length === 0 ? [''] : value;

  // Update suggestions based on current input
  useEffect(() => {
    if (currentInput.length > 0) {
      const newSuggestions = getSuggestedSectors(currentInput);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setActiveSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [currentInput]);

  // Format sector input
  const formatSectorInput = (input: string): string => {
    // Convert to uppercase and remove invalid characters
    let formatted = input.toUpperCase().replace(/[^A-Z-]/g, '');
    
    // Auto-add dash if user types 3 letters
    if (formatted.length === 3 && !formatted.includes('-')) {
      formatted += '-';
    }
    
    // Limit to XXX-XXX format
    if (formatted.length > 7) {
      formatted = formatted.substring(0, 7);
    }
    
    return formatted;
  };

  // Handle input change for a specific sector
  const handleInputChange = (index: number, inputValue: string) => {
    const formattedValue = formatSectorInput(inputValue);
    const newSectors = [...sectors];
    newSectors[index] = formattedValue;
    
    setCurrentInput(formattedValue);
    
    // Remove empty entries from the end, but keep at least one
    const cleanedSectors = newSectors.filter((sector, i) => 
      sector !== '' || i === 0 || i < newSectors.length - 1
    );
    
    if (cleanedSectors.length === 0) {
      cleanedSectors.push('');
    }
    
    onChange(cleanedSectors);
  };

  // Handle adding a new sector input
  const handleAddSector = () => {
    if (sectors.length < maxSectors && allowMultiple) {
      const newSectors = [...sectors, ''];
      onChange(newSectors);
      
      // Focus the new input after a short delay
      setTimeout(() => {
        const newIndex = newSectors.length - 1;
        inputRefs.current[newIndex]?.focus();
      }, 100);
    }
  };

  // Handle removing a sector input
  const handleRemoveSector = (index: number) => {
    if (sectors.length > 1) {
      const newSectors = sectors.filter((_, i) => i !== index);
      onChange(newSectors);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    if (focusedIndex >= 0) {
      const newSectors = [...sectors];
      newSectors[focusedIndex] = suggestion;
      onChange(newSectors);
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
    setCurrentInput(sectors[index]);
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

  // Validate sector
  const validateSector = (sector: string): boolean => {
    if (!sector) return true; // Empty is valid
    return isValidFlydubaiSector(sector);
  };

  // Get validation state for a sector
  const getValidationState = (sector: string, index: number) => {
    if (!sector) return { isValid: true, message: '' };
    
    const isValid = validateSector(sector);
    if (!isValid) {
      return { 
        isValid: false, 
        message: 'Invalid format. Use XXX-XXX (e.g., DXB-CMB)' 
      };
    }

    // Check for duplicates
    const duplicateIndex = sectors.findIndex((s, i) => 
      i !== index && s === sector && s !== ''
    );
    
    if (duplicateIndex >= 0) {
      return { 
        isValid: false, 
        message: 'Duplicate sector' 
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
        {sectors.map((sector, index) => {
          const validation = getValidationState(sector, index);
          
          return (
            <div key={index} className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <Input
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    value={sector}
                    onChange={e => handleInputChange(index, e.target.value)}
                    onFocus={() => handleFocus(index)}
                    onBlur={() => handleBlur(index)}
                    onKeyDown={e => handleKeyDown(e, index)}
                    placeholder={index === 0 ? 'DXB-CMB' : 'CMB-DXB'}
                    disabled={disabled}
                    className={cn(
                      'pl-10',
                      !validation.isValid && 'border-destructive focus-visible:border-destructive',
                      sectors.length > 1 && 'pr-10'
                    )}
                    maxLength={7}
                  />

                  {/* Remove button for multiple sectors */}
                  {sectors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSector(index)}
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

        {/* Add sector button */}
        {allowMultiple && sectors.length < maxSectors && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSector}
            disabled={disabled}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Sector
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
          Enter sectors in XXX-XXX format (e.g., DXB-CMB). 
          {allowMultiple && ' Add multiple sectors for turnarounds.'}
        </p>
      )}
    </div>
  );
}

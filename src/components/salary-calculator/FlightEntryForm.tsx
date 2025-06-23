'use client';

/**
 * Flight Entry Form Component for Skywage Salary Calculator
 * Phase 7: Redesigned with clean, minimal UI matching Upload Roster design
 * Following ultra-streamlined workflow principles
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Save,
  AlertCircle,
  Loader2,
  Plane,
  MapPin
} from 'lucide-react';

import { FlightTypeSelector } from './FlightTypeSelector';
import { FlightNumberInput } from './FlightNumberInput';
import { SectorInput } from './SectorInput';
import { TimeInput } from './TimeInput';

import { DutyType, Position } from '@/types/salary-calculator';
import {
  ManualFlightEntryData,
  FormValidationResult
} from '@/lib/salary-calculator/manual-entry-validation';
import { validateManualEntryRealTime } from '@/lib/salary-calculator/manual-entry-processor';

interface FlightEntryFormProps {
  onSubmit: (data: ManualFlightEntryData) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  initialData?: Partial<ManualFlightEntryData>;
  position: Position;
  className?: string;
}

export function FlightEntryForm({
  onSubmit,
  loading = false,
  disabled = false,
  initialData,
  position,
  className
}: FlightEntryFormProps) {
  // Form state
  const [formData, setFormData] = useState<ManualFlightEntryData>({
    date: initialData?.date || '',
    dutyType: initialData?.dutyType || 'layover',
    flightNumbers: initialData?.flightNumbers || [''],
    sectors: initialData?.sectors || [''],
    reportTime: initialData?.reportTime || '',
    debriefTime: initialData?.debriefTime || '',
    isCrossDay: initialData?.isCrossDay || false
  });

  // Track which fields have been touched by the user
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Validation state
  const [validation, setValidation] = useState<FormValidationResult>({
    valid: false,
    errors: [],
    warnings: [],
    fieldErrors: {}
  });

  // Real-time validation
  useEffect(() => {
    const validationResult = validateManualEntryRealTime(formData, position);
    setValidation(validationResult);
  }, [formData, position]);

  // Handle form field changes
  const handleFieldChange = <K extends keyof ManualFlightEntryData>(
    field: K,
    value: ManualFlightEntryData[K]
  ) => {
    // Mark field as touched
    setTouchedFields(prev => new Set(prev).add(field));

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle duty type change - adjust form fields accordingly
  const handleDutyTypeChange = (dutyType: DutyType) => {
    // Mark duty type as touched
    setTouchedFields(prev => new Set(prev).add('dutyType'));

    setFormData(prev => {
      const newData = { ...prev, dutyType };

      // Clear flight numbers and sectors for ASBY
      if (dutyType === 'asby' || dutyType === 'sby' || dutyType === 'off') {
        newData.flightNumbers = [];
        newData.sectors = [];
      } else if (dutyType === 'layover') {
        // Ensure single flight/sector for layover
        newData.flightNumbers = [prev.flightNumbers[0] || ''];
        newData.sectors = [prev.sectors[0] || ''];
      } else if (dutyType === 'turnaround') {
        // Ensure at least two entries for turnaround
        if (prev.flightNumbers.length < 2) {
          newData.flightNumbers = [prev.flightNumbers[0] || '', ''];
        }
        if (prev.sectors.length < 2) {
          newData.sectors = [prev.sectors[0] || '', ''];
        }
      }

      return newData;
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation.valid || loading) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Get today's date for default
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const isFormDisabled = disabled || loading;
  const showFlightFields = formData.dutyType !== 'asby' && formData.dutyType !== 'sby' && formData.dutyType !== 'off';

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
          {/* Date */}
          <div className="space-y-2">
            <label htmlFor="date" className="block text-sm font-medium">
              Date <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={e => handleFieldChange('date', e.target.value)}
                disabled={isFormDisabled}
                className={cn(
                  validation.fieldErrors.date && touchedFields.has('date') && 'border-destructive focus-visible:border-destructive'
                )}
                max={getTodayDate()} // Prevent future dates beyond today
              />
              {!formData.date && (
                <button
                  type="button"
                  onClick={() => handleFieldChange('date', getTodayDate())}
                  disabled={isFormDisabled}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Today
                </button>
              )}
            </div>
            {validation.fieldErrors.date && touchedFields.has('date') && (
              <p className="text-destructive text-sm">{validation.fieldErrors.date}</p>
            )}
          </div>

          {/* Flight Type */}
          <FlightTypeSelector
            value={formData.dutyType}
            onChange={handleDutyTypeChange}
            disabled={isFormDisabled}
            label="Flight Type"
            required
          />

          {/* Flight Details Grid - only for flight duties */}
          {showFlightFields && (
            <div className="space-y-6">
              {/* Flight Numbers */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">
                  Flight Numbers <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {formData.flightNumbers.slice(0, formData.dutyType === 'layover' ? 1 : 4).map((flightNumber, index) => (
                    <div key={index} className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Plane className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        type="text"
                        value={flightNumber}
                        onChange={e => {
                          const newNumbers = [...formData.flightNumbers];
                          newNumbers[index] = e.target.value.replace(/[^0-9]/g, '');
                          handleFieldChange('flightNumbers', newNumbers);
                        }}
                        placeholder={index === 0 ? '123' : '124'}
                        disabled={isFormDisabled}
                        className="pl-10"
                        maxLength={4}
                      />
                    </div>
                  ))}
                </div>
                {validation.fieldErrors.flightNumbers && touchedFields.has('flightNumbers') && (
                  <p className="text-destructive text-sm">{validation.fieldErrors.flightNumbers}</p>
                )}
              </div>

              {/* Sectors */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">
                  Sectors <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Ensure we have the right number of sector inputs based on duty type */}
                  {Array.from({ length: formData.dutyType === 'layover' ? 2 : 4 }, (_, index) => {
                    const sector = formData.sectors[index] || '';
                    const placeholders = ['DXB', 'KHI', 'KHI', 'DXB'];

                    return (
                      <div key={index} className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                          type="text"
                          value={sector}
                          onChange={e => {
                            const newSectors = [...formData.sectors];
                            // Ensure array is long enough
                            while (newSectors.length <= index) {
                              newSectors.push('');
                            }
                            newSectors[index] = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
                            handleFieldChange('sectors', newSectors);
                          }}
                          placeholder={placeholders[index]}
                          disabled={isFormDisabled}
                          className="pl-10"
                          maxLength={3}
                        />
                      </div>
                    );
                  })}
                </div>
                {validation.fieldErrors.sectors && touchedFields.has('sectors') && (
                  <p className="text-destructive text-sm">{validation.fieldErrors.sectors}</p>
                )}
              </div>
            </div>
          )}

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <TimeInput
              value={formData.reportTime}
              onChange={value => handleFieldChange('reportTime', value)}
              disabled={isFormDisabled}
              error={validation.fieldErrors.reportTime && touchedFields.has('reportTime') ? validation.fieldErrors.reportTime : undefined}
              label="Reporting"
              required
            />

            <TimeInput
              value={formData.debriefTime}
              onChange={value => handleFieldChange('debriefTime', value)}
              disabled={isFormDisabled}
              error={validation.fieldErrors.debriefTime && touchedFields.has('debriefTime') ? validation.fieldErrors.debriefTime : undefined}
              label="Debriefing"
              required
            />
          </div>

          {/* Cross-day checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="crossDay"
              checked={formData.isCrossDay}
              onCheckedChange={checked => handleFieldChange('isCrossDay', !!checked)}
              disabled={isFormDisabled}
            />
            <label
              htmlFor="crossDay"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Cross-day flight (debrief time is next day)
            </label>
          </div>

          {/* Time sequence error */}
          {validation.fieldErrors.timeSequence && (touchedFields.has('reportTime') || touchedFields.has('debriefTime')) && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {validation.fieldErrors.timeSequence}
              </p>
            </div>
          )}



          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!validation.valid || isFormDisabled}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Flight...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Flight Duty
              </>
            )}
          </Button>


    </form>
  );
}

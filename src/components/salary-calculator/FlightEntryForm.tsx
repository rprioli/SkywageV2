'use client';

/**
 * Flight Entry Form Component for Skywage Salary Calculator
 * Phase 4: Complete form for manual flight entry
 * Following existing form patterns and integrating all input components
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  Save, 
  Calculator, 
  AlertCircle,
  CheckCircle,
  Loader2
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle duty type change - adjust form fields accordingly
  const handleDutyTypeChange = (dutyType: DutyType) => {
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
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Manual Flight Entry
        </CardTitle>
        <CardDescription>
          Enter flight duty details manually for salary calculation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  validation.fieldErrors.date && 'border-destructive focus-visible:border-destructive'
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
            {validation.fieldErrors.date && (
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

          {/* Flight Numbers - only for flight duties */}
          {showFlightFields && (
            <FlightNumberInput
              value={formData.flightNumbers}
              onChange={value => handleFieldChange('flightNumbers', value)}
              disabled={isFormDisabled}
              error={validation.fieldErrors.flightNumbers}
              label="Flight Numbers"
              required
              allowMultiple={formData.dutyType === 'turnaround'}
              maxFlights={formData.dutyType === 'layover' ? 1 : 4}
            />
          )}

          {/* Sectors - only for flight duties */}
          {showFlightFields && (
            <SectorInput
              value={formData.sectors}
              onChange={value => handleFieldChange('sectors', value)}
              disabled={isFormDisabled}
              error={validation.fieldErrors.sectors}
              label="Sectors"
              required
              allowMultiple={formData.dutyType === 'turnaround'}
              maxSectors={formData.dutyType === 'layover' ? 1 : 4}
            />
          )}

          {/* Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TimeInput
              value={formData.reportTime}
              onChange={value => handleFieldChange('reportTime', value)}
              disabled={isFormDisabled}
              error={validation.fieldErrors.reportTime}
              label="Report Time"
              required
            />
            
            <TimeInput
              value={formData.debriefTime}
              onChange={value => handleFieldChange('debriefTime', value)}
              disabled={isFormDisabled}
              error={validation.fieldErrors.debriefTime}
              label="Debrief Time"
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
          {validation.fieldErrors.timeSequence && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {validation.fieldErrors.timeSequence}
              </p>
            </div>
          )}

          {/* Calculation Preview */}
          {validation.valid && validation.calculatedDutyHours && validation.estimatedPay && (
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-accent">Calculation Preview</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Duty Hours:</span>
                  <span className="ml-2 font-medium">{validation.calculatedDutyHours.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estimated Pay:</span>
                  <span className="ml-2 font-medium text-accent">{validation.estimatedPay.toFixed(2)} AED</span>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="space-y-1">
                {validation.warnings.map((warning, index) => (
                  <p key={index} className="text-orange-700 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {warning}
                  </p>
                ))}
              </div>
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

          {/* Form validation summary */}
          {!validation.valid && validation.errors.length > 0 && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Please fix the errors above to save the flight duty
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

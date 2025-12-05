'use client';

/**
 * Flight Entry Form Component for Skywage Salary Calculator
 * Phase 7: Redesigned with clean, minimal UI matching Upload Roster design
 * Following ultra-streamlined workflow principles
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  Plane,
  MapPin,
  Sunrise
} from 'lucide-react';
import { FormActions, FlightNumberInput, SectorInputs } from './flight-entry-form';

import { FlightTypeSelector } from './FlightTypeSelector';
import { TimeInput } from './TimeInput';

import { DutyType, Position } from '@/types/salary-calculator';
import {
  ManualFlightEntryData,
  FormValidationResult
} from '@/lib/salary-calculator/manual-entry-validation';
import { validateManualEntryRealTime } from '@/lib/salary-calculator/manual-entry-processor';

interface FlightEntryFormProps {
  onSubmit: (data: ManualFlightEntryData) => Promise<void>;
  onAddToBatch?: (data: ManualFlightEntryData) => void;
  onSaveBatchOnly?: () => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  initialData?: Partial<ManualFlightEntryData>;
  position: Position;
  selectedYear: number;
  batchCount?: number;
  className?: string;

}

export function FlightEntryForm({
  onSubmit,
  onAddToBatch,
  onSaveBatchOnly,
  loading = false,
  disabled = false,
  initialData,
  position,
  selectedYear,
  batchCount = 0,
  className
}: FlightEntryFormProps) {
  const { showError, showSuccess } = useToast();

  // Form state
  const [formData, setFormData] = useState<ManualFlightEntryData>({
    date: initialData?.date || '',
    dutyType: initialData?.dutyType || 'turnaround',
    flightNumbers: initialData?.flightNumbers || [''],
    sectors: initialData?.sectors || [''],
    reportTime: initialData?.reportTime || '',
    debriefTime: initialData?.debriefTime || '',
    isCrossDay: initialData?.isCrossDay || false,
    // Layover-specific fields
    inboundDate: initialData?.inboundDate || '',
    reportTimeInbound: initialData?.reportTimeInbound || '',
    debriefTimeOutbound: initialData?.debriefTimeOutbound || ''
  });

  // Track whether form submission has been attempted
  const [submitAttempted, setSubmitAttempted] = useState(false);



  // Validation state
  const [validation, setValidation] = useState<FormValidationResult>({
    valid: false,
    errors: [],
    warnings: [],
    fieldErrors: {}
  });

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date || '',
        dutyType: initialData.dutyType || 'turnaround',
        flightNumbers: initialData.flightNumbers || [''],
        sectors: initialData.sectors || [''],
        reportTime: initialData.reportTime || '',
        debriefTime: initialData.debriefTime || '',
        isCrossDay: initialData.isCrossDay || false,
        // Layover-specific fields
        inboundDate: initialData.inboundDate || '',
        reportTimeInbound: initialData.reportTimeInbound || '',
        debriefTimeOutbound: initialData.debriefTimeOutbound || ''
      });
    }
  }, [initialData]);

  // Real-time validation (for internal use, not display)
  useEffect(() => {
    const validationResult = validateManualEntryRealTime(formData, position, selectedYear);
    setValidation(validationResult);
  }, [formData, position, selectedYear]);

  // Initialize form fields based on default duty type on mount
  useEffect(() => {
    if ((formData.dutyType === 'turnaround' || formData.dutyType === 'layover') && formData.flightNumbers.length < 2) {
      setFormData(prev => ({
        ...prev,
        flightNumbers: ['', ''],
        sectors: formData.dutyType === 'layover' ? ['', '', '', ''] : ['', '', '']
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount to initialize form
  }, []);

  // Auto-sync isCrossDay with detected value for proper real-time validation
  // This fixes the issue where cross-day flights (e.g., report 16:00, debrief 01:00 next day)
  // were failing validation because isCrossDay wasn't being updated when times changed
  useEffect(() => {
    // Helper to detect if debrief is on the next day (when debrief time < report time)
    const detectCrossDay = (reportTime: string, debriefTime: string): boolean => {
      if (!reportTime || !debriefTime) return false;
      const [reportHour, reportMin] = reportTime.split(':').map(Number);
      const [debriefHour, debriefMin] = debriefTime.split(':').map(Number);
      if (isNaN(reportHour) || isNaN(reportMin) || isNaN(debriefHour) || isNaN(debriefMin)) return false;
      const reportMinutes = reportHour * 60 + reportMin;
      const debriefMinutes = debriefHour * 60 + debriefMin;
      return debriefMinutes < reportMinutes;
    };

    const detectedCrossDay = formData.dutyType === 'layover'
      ? detectCrossDay(formData.reportTimeInbound || '', formData.debriefTime)
      : detectCrossDay(formData.reportTime, formData.debriefTime);
    
    // Only update if both times are filled and there's a change
    const hasRequiredTimes = formData.dutyType === 'layover'
      ? (formData.reportTimeInbound && formData.debriefTime)
      : (formData.reportTime && formData.debriefTime);

    if (hasRequiredTimes && detectedCrossDay !== formData.isCrossDay) {
      setFormData(prev => ({
        ...prev,
        isCrossDay: detectedCrossDay
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only react to time changes, not isCrossDay itself to avoid loops
  }, [formData.reportTime, formData.debriefTime, formData.reportTimeInbound, formData.dutyType]);

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
    // Reset submit attempted state when duty type changes
    setSubmitAttempted(false);

    setFormData(prev => {
      const newData = { ...prev, dutyType };

      // Clear flight numbers and sectors for ASBY, Recurrent, SBY, OFF, Business Promotion
      if (dutyType === 'asby' || dutyType === 'recurrent' || dutyType === 'sby' || dutyType === 'off' || dutyType === 'business_promotion') {
        newData.flightNumbers = [];
        newData.sectors = [];
      } else if (dutyType === 'layover') {
        // Ensure two flights and four sectors for layover
        newData.flightNumbers = [prev.flightNumbers[0] || '', prev.flightNumbers[1] || ''];
        newData.sectors = [prev.sectors[0] || '', prev.sectors[1] || '', prev.sectors[2] || '', prev.sectors[3] || ''];
        // Set default inbound date to same as outbound date if not already set
        if (!newData.inboundDate && newData.date) {
          newData.inboundDate = newData.date;
        }
      } else if (dutyType === 'turnaround') {
        // Ensure at least two flight numbers and three sectors for turnaround
        if (prev.flightNumbers.length < 2) {
          newData.flightNumbers = [prev.flightNumbers[0] || '', ''];
        }
        if (prev.sectors.length < 3) {
          newData.sectors = [prev.sectors[0] || '', prev.sectors[1] || '', prev.sectors[2] || ''];
        }
      }

      return newData;
    });
  };

  // Clear form while keeping duty type
  const clearFormKeepDutyType = () => {
    const currentDutyType = formData.dutyType;
    setFormData({
      date: '',
      dutyType: currentDutyType,
      flightNumbers: currentDutyType === 'turnaround' || currentDutyType === 'layover' ? ['', ''] : [''],
      sectors: currentDutyType === 'turnaround' || currentDutyType === 'layover' ? ['', '', '', ''] : [''],
      reportTime: '',
      debriefTime: '',
      isCrossDay: false,
      inboundDate: '',
      reportTimeInbound: '',
      debriefTimeOutbound: ''
    });
    setSubmitAttempted(false);
  };

  // Handle adding to batch
  const handleAddToBatch = () => {
    // Mark that submission has been attempted for validation
    setSubmitAttempted(true);

    // Validate before adding to batch
    if (!validation.valid) {
      const errorCount = Object.keys(validation.fieldErrors).length;
      const errorMessage = errorCount === 1
        ? 'Please fix the validation error before adding to batch'
        : `Please fix ${errorCount} validation errors before adding to batch`;

      showError("Validation Error", {
        description: errorMessage,
      });
      return;
    }

    // Add to batch and clear form
    if (onAddToBatch) {
      // Automatically set cross-day flags for batch entry too
      const batchData = {
        ...formData,
        isCrossDay: formData.dutyType === 'layover' ? isInboundNextDay : isTurnaroundNextDay,
        isCrossDayOutbound: isOutboundNextDay,
        isCrossDayInbound: isInboundNextDay
      };

      onAddToBatch(batchData);
      clearFormKeepDutyType();

      showSuccess("Added to Batch", {
        description: `Flight duty added to batch. Total: ${batchCount + 1}`,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark that submission has been attempted
    setSubmitAttempted(true);

    // If validation fails, don't proceed but show errors
    if (!validation.valid) {
      // Show toast notification about validation errors
      const errorCount = Object.keys(validation.fieldErrors).length;
      const errorMessage = errorCount === 1
        ? 'Please fix the validation error to continue'
        : `Please fix ${errorCount} validation errors to continue`;

      showError("Validation Error", {
        description: errorMessage,
      });

      return;
    }

    if (loading) {
      return;
    }

    try {
      // Automatically set cross-day flags based on time detection
      const submissionData = {
        ...formData,
        isCrossDay: formData.dutyType === 'layover' ? isInboundNextDay : isTurnaroundNextDay,
        isCrossDayOutbound: isOutboundNextDay,
        isCrossDayInbound: isInboundNextDay
      };

      await onSubmit(submissionData);
      // Reset submit attempted state on successful submission
      setSubmitAttempted(false);
    } catch {
      // Form submission error handled by parent
    }
  };

  // Get today's date for default
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get start of selected year for min date
  const getStartOfSelectedYear = () => {
    return `${selectedYear}-01-01`;
  };

  // Get end of selected year for max date
  const getEndOfSelectedYear = () => {
    return `${selectedYear}-12-31`;
  };

  // Helper to compute inbound max date (allow up to next year for cross-year layovers)
  const getInboundMaxDate = (outboundDate?: string): string => {
    if (!outboundDate) {
      // Allow up to end of next year
      return `${selectedYear + 1}-12-31`;
    }
    // No upper limit - layovers can have rest periods up to 96 hours
    return `${selectedYear + 1}-12-31`;
  };

  // Outbound must be in selectedYear
  const isOutboundInSelectedYear = (dateString: string): boolean => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return d.getFullYear() === selectedYear;
  };

  // Smart cross-day detection
  const isNextDay = (reportTime: string, debriefTime: string): boolean => {
    if (!reportTime || !debriefTime) return false;

    const [reportHour, reportMin] = reportTime.split(':').map(Number);
    const [debriefHour, debriefMin] = debriefTime.split(':').map(Number);

    const reportMinutes = reportHour * 60 + reportMin;
    const debriefMinutes = debriefHour * 60 + debriefMin;

    return debriefMinutes < reportMinutes;
  };

  // Helper function to get next day date string in DD/MM/YY format
  const getNextDayDate = (baseDate: string): string => {
    if (!baseDate) return '';

    const currentDate = new Date(baseDate);
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);

    const day = nextDay.getDate().toString().padStart(2, '0');
    const month = (nextDay.getMonth() + 1).toString().padStart(2, '0');
    const year = nextDay.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  };

  // Auto-detect cross-day for different time pairs using appropriate dates
  const isOutboundNextDay = isNextDay(formData.reportTime, formData.debriefTimeOutbound || '');
  const isInboundNextDay = isNextDay(formData.reportTimeInbound || '', formData.debriefTime);
  const isTurnaroundNextDay = isNextDay(formData.reportTime, formData.debriefTime);

  // Get next day dates for each sector
  const outboundNextDayDate = getNextDayDate(formData.date);
  const inboundNextDayDate = getNextDayDate(formData.inboundDate || formData.date);
  const turnaroundNextDayDate = getNextDayDate(formData.date);

  const isFormDisabled = disabled || loading;
  const showFlightFields = formData.dutyType !== 'asby' && formData.dutyType !== 'recurrent' && formData.dutyType !== 'sby' && formData.dutyType !== 'off' && formData.dutyType !== 'business_promotion';

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3 md:space-y-4', className)}>
          {/* Flight Type - Moved to top */}
          <FlightTypeSelector
            value={formData.dutyType}
            onChange={handleDutyTypeChange}
            disabled={isFormDisabled}
            label="Duty Type"
          />

          {/* Outbound Sector Header for Layover - Right below duty type */}
          {formData.dutyType === 'layover' && (
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#4C49ED' }}>
              <Plane className="h-4 w-4" />
              OUTBOUND SECTOR
            </div>
          )}

          {/* Date - Below outbound header for layover, below duty type for others */}
          <div className="form-field-spacing-sm">
            <label htmlFor="date" className="form-label-responsive block">
              Date
            </label>
            <div className="relative">
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={e => handleFieldChange('date', e.target.value)}
                disabled={isFormDisabled}
                className={cn(
                  validation.fieldErrors.date && submitAttempted && 'border-destructive focus-visible:border-destructive'
                )}
                min={getStartOfSelectedYear()}
                max={getEndOfSelectedYear()}
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
            {formData.date && !isOutboundInSelectedYear(formData.date) && (
              <p className="text-orange-500 text-sm">
                Outbound date must be in {selectedYear}
              </p>
            )}
            {validation.fieldErrors.date && submitAttempted && (
              <p className="text-destructive form-error-responsive">{validation.fieldErrors.date}</p>
            )}
          </div>

          {/* Flight Details - Different layouts for different duty types */}
          {showFlightFields && formData.dutyType === 'layover' && (
            <div className="space-y-6">
              {/* Outbound Flight Details */}
              <div className="space-y-4">
                <FlightNumberInput
                  value={formData.flightNumbers[0] || ''}
                  onChange={value => {
                    const newNumbers = [...formData.flightNumbers];
                    newNumbers[0] = value;
                    handleFieldChange('flightNumbers', newNumbers);
                  }}
                  placeholder="123"
                  disabled={isFormDisabled}
                  label="Flight Number"
                />

                <SectorInputs
                  sectors={formData.sectors}
                  indices={[0, 1]}
                  placeholders={['DXB', 'KHI']}
                  onChange={newSectors => handleFieldChange('sectors', newSectors)}
                  disabled={isFormDisabled}
                  label="Sector"
                />

                {/* Outbound Times */}
                <div className="grid grid-cols-2 gap-4">
                  <TimeInput
                    value={formData.reportTime}
                    onChange={value => handleFieldChange('reportTime', value)}
                    disabled={isFormDisabled}
                    error={validation.fieldErrors.reportTime && submitAttempted ? validation.fieldErrors.reportTime : undefined}
                    label="Reporting"
                  />

                  <div className="relative">
                    <TimeInput
                      value={formData.debriefTimeOutbound || ''}
                      onChange={value => handleFieldChange('debriefTimeOutbound', value)}
                      disabled={isFormDisabled}
                      error={validation.fieldErrors.debriefTimeOutbound && submitAttempted ? validation.fieldErrors.debriefTimeOutbound : undefined}
                      label="Debriefing"
                    />
                    {isOutboundNextDay && outboundNextDayDate && (
                      <div className="absolute right-3 top-9 flex items-center gap-1 text-orange-500 pointer-events-none">
                        <span className="text-sm font-medium">{outboundNextDayDate}</span>
                        <Sunrise className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* INBOUND SECTOR */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#4C49ED' }}>
                  <Plane className="h-4 w-4" />
                  INBOUND SECTOR
                </div>

                {/* Inbound Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={formData.inboundDate}
                    onChange={e => handleFieldChange('inboundDate', e.target.value)}
                    disabled={isFormDisabled}
                    className={cn(
                      validation.fieldErrors.inboundDate && submitAttempted && 'border-destructive focus-visible:border-destructive'
                    )}
                    min={formData.date || getStartOfSelectedYear()}
                    max={getInboundMaxDate(formData.date)}
                  />
                  {validation.fieldErrors.inboundDate && submitAttempted && (
                    <p className="text-destructive text-sm">{validation.fieldErrors.inboundDate}</p>
                  )}
                </div>

                <FlightNumberInput
                  value={formData.flightNumbers[1] || ''}
                  onChange={value => {
                    const newNumbers = [...formData.flightNumbers];
                    while (newNumbers.length <= 1) {
                      newNumbers.push('');
                    }
                    newNumbers[1] = value;
                    handleFieldChange('flightNumbers', newNumbers);
                  }}
                  placeholder="124"
                  disabled={isFormDisabled}
                  label="Flight Number"
                />

                <SectorInputs
                  sectors={formData.sectors}
                  indices={[2, 3]}
                  placeholders={['KHI', 'DXB']}
                  onChange={newSectors => handleFieldChange('sectors', newSectors)}
                  disabled={isFormDisabled}
                  label="Sector"
                />

                {/* Inbound Times */}
                <div className="grid grid-cols-2 gap-4">
                  <TimeInput
                    value={formData.reportTimeInbound || ''}
                    onChange={value => handleFieldChange('reportTimeInbound', value)}
                    disabled={isFormDisabled}
                    error={validation.fieldErrors.reportTimeInbound && submitAttempted ? validation.fieldErrors.reportTimeInbound : undefined}
                    label="Reporting"
                  />

                  <div className="relative">
                    <TimeInput
                      value={formData.debriefTime}
                      onChange={value => handleFieldChange('debriefTime', value)}
                      disabled={isFormDisabled}
                      error={validation.fieldErrors.debriefTime && submitAttempted ? validation.fieldErrors.debriefTime : undefined}
                      label="Debriefing"
                    />
                    {isInboundNextDay && inboundNextDayDate && (
                      <div className="absolute right-3 top-9 flex items-center gap-1 text-orange-500 pointer-events-none">
                        <span className="text-sm font-medium">{inboundNextDayDate}</span>
                        <Sunrise className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Flight Details for Non-Layover duties */}
          {showFlightFields && formData.dutyType !== 'layover' && (
            <div className="space-y-4">
              {/* Flight Numbers */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">
                  Flight Numbers
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {formData.flightNumbers.slice(0, 4).map((flightNumber, index) => (
                    <div key={index} className="relative">
                      <div className="input-icon-left">
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
                        className="input-with-left-icon"
                        maxLength={4}
                      />
                    </div>
                  ))}
                </div>
                {validation.fieldErrors.flightNumbers && submitAttempted && (
                  <p className="text-destructive text-sm">{validation.fieldErrors.flightNumbers}</p>
                )}
              </div>

              {/* Sectors */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">
                  Sectors
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }, (_, index) => {
                    const sector = formData.sectors[index] || '';
                    const placeholders = ['DXB', 'BOM', 'DXB'];

                    return (
                      <div key={index} className="relative">
                        <div className="input-icon-left">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                          type="text"
                          value={sector}
                          onChange={e => {
                            const newSectors = [...formData.sectors];
                            while (newSectors.length <= index) {
                              newSectors.push('');
                            }
                            newSectors[index] = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
                            handleFieldChange('sectors', newSectors);
                          }}
                          placeholder={placeholders[index]}
                          disabled={isFormDisabled}
                          className="input-with-left-icon"
                          maxLength={3}
                        />
                      </div>
                    );
                  })}
                </div>
                {validation.fieldErrors.sectors && submitAttempted && (
                  <p className="text-destructive text-sm">{validation.fieldErrors.sectors}</p>
                )}
              </div>
            </div>
          )}

          {/* Times for Non-Layover duties (not shown for Day Off) */}
          {formData.dutyType !== 'layover' && formData.dutyType !== 'off' && (
            // Turnaround/ASBY: 2 time fields (report/debrief)
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <TimeInput
                  value={formData.reportTime}
                  onChange={value => handleFieldChange('reportTime', value)}
                  disabled={isFormDisabled}
                  error={validation.fieldErrors.reportTime && submitAttempted ? validation.fieldErrors.reportTime : undefined}
                  label="Reporting"
                />

                <div className="relative">
                  <TimeInput
                    value={formData.debriefTime}
                    onChange={value => handleFieldChange('debriefTime', value)}
                    disabled={isFormDisabled}
                    error={validation.fieldErrors.debriefTime && submitAttempted ? validation.fieldErrors.debriefTime : undefined}
                    label="Debriefing"
                  />
                  {isTurnaroundNextDay && turnaroundNextDayDate && (
                    <div className="absolute right-3 top-9 flex items-center gap-1 text-orange-500 pointer-events-none">
                      <span className="text-sm font-medium">{turnaroundNextDayDate}</span>
                      <Sunrise className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>


            </div>
          )}

          {/* Time sequence error (not shown for Day Off) */}
          {formData.dutyType !== 'off' && validation.fieldErrors.timeSequence && submitAttempted && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {validation.fieldErrors.timeSequence}
              </p>
            </div>
          )}

          {/* Form Actions */}
          <FormActions
            loading={loading}
            disabled={disabled}
            batchCount={batchCount}
            onAddToBatch={onAddToBatch ? handleAddToBatch : undefined}
            onSaveBatchOnly={onSaveBatchOnly}
          />


    </form>
  );
}

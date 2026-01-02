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
  Sunrise,
  ArrowRight
} from 'lucide-react';
import { FormActions, FlightNumberInput, SectorInputs } from './flight-entry-form';

import { FlightTypeSelector } from './FlightTypeSelector';
import { TimeInput } from './TimeInput';

import { DutyType, Position } from '@/types/salary-calculator';
import {
  ManualFlightEntryData,
  FormValidationResult,
  validateDestination
} from '@/lib/salary-calculator/manual-entry-validation';
import { validateManualEntryRealTime } from '@/lib/salary-calculator/manual-entry-processor';
import { 
  destinationToSectors, 
  destinationToLayoverSectors, 
  extractDestination,
  destinationToDoubleSectorTurnaround,
  extractTurnaroundDestinations,
  detectTurnaroundMode
} from '@/lib/salary-calculator/input-transformers';

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

  // Turnaround mode state (standard or double-sector)
  const [turnaroundMode, setTurnaroundMode] = useState<'standard' | 'double'>(() => {
    // Detect mode from existing sectors if editing
    if (initialData?.dutyType === 'turnaround' && initialData?.sectors && initialData.sectors.length > 0) {
      return detectTurnaroundMode(initialData.sectors) === 'double' ? 'double' : 'standard';
    }
    return 'standard';
  });

  // Destination state for simplified turnaround entry
  const [destination, setDestination] = useState(() => {
    // Initialize from existing sectors if editing
    if (initialData?.sectors && initialData.sectors.length > 0) {
      const destinations = extractTurnaroundDestinations(initialData.sectors);
      return destinations[0] || '';
    }
    return '';
  });

  // Second destination state for double-sector turnaround
  const [destination2, setDestination2] = useState(() => {
    // Initialize from existing sectors if editing (double-sector)
    if (initialData?.dutyType === 'turnaround' && initialData?.sectors && initialData.sectors.length > 0) {
      const destinations = extractTurnaroundDestinations(initialData.sectors);
      return destinations[1] || '';
    }
    return '';
  });



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
      
      // Extract destination(s) from sectors for turnaround/layover edit mode
      if ((initialData.dutyType === 'turnaround' || initialData.dutyType === 'layover') && initialData.sectors && initialData.sectors.length > 0) {
        const destinations = extractTurnaroundDestinations(initialData.sectors);
        setDestination(destinations[0] || '');
        
        // Handle double-sector turnaround edit mode
        if (initialData.dutyType === 'turnaround') {
          const mode = detectTurnaroundMode(initialData.sectors);
          setTurnaroundMode(mode === 'double' ? 'double' : 'standard');
          setDestination2(destinations[1] || '');
        }
      }
    }
  }, [initialData]);

  // Real-time validation (for internal use, not display)
  useEffect(() => {
    const validationResult = validateManualEntryRealTime(formData, position, selectedYear);
    setValidation(validationResult);
  }, [formData, position, selectedYear]);

  // Sync sectors when destination changes for layover
  useEffect(() => {
    if (formData.dutyType !== 'layover') {
      return;
    }

    if (destination.length === 3 && destination !== 'DXB') {
      const layoverSectors = destinationToLayoverSectors(destination);
      const current = formData.sectors.join(',');
      const next = layoverSectors.join(',');
      if (current !== next) {
        setFormData(prev => ({
          ...prev,
          sectors: layoverSectors
        }));
      }
    } else if (formData.sectors.length > 0) {
      // Clear sectors if destination is incomplete/invalid
      setFormData(prev => ({
        ...prev,
        sectors: []
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on destination & dutyType
  }, [destination, formData.dutyType]);

  // Initialize form fields based on default duty type on mount
  useEffect(() => {
    if (formData.dutyType === 'layover' && formData.flightNumbers.length < 2) {
      // Layover needs 4 sectors
      setFormData(prev => ({
        ...prev,
        flightNumbers: ['', ''],
        sectors: ['', '', '', '']
      }));
    } else if (formData.dutyType === 'turnaround') {
      // Turnaround: initialize flight numbers based on mode
      const requiredCount = turnaroundMode === 'double' ? 4 : 2;
      if (formData.flightNumbers.length < requiredCount) {
        setFormData(prev => ({
          ...prev,
          flightNumbers: Array(requiredCount).fill('')
        }));
      }
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
        // Ensure two flights; sectors derived from destination
        newData.flightNumbers = [prev.flightNumbers[0] || '', prev.flightNumbers[1] || ''];
        if (destination.length === 3 && destination !== 'DXB') {
          newData.sectors = destinationToLayoverSectors(destination);
        } else {
          newData.sectors = [];
        }
        // Set default inbound date to same as outbound date if not already set
        if (!newData.inboundDate && newData.date) {
          newData.inboundDate = newData.date;
        }
      } else if (dutyType === 'turnaround') {
        // Turnaround: initialize flight numbers based on mode
        const requiredCount = turnaroundMode === 'double' ? 4 : 2;
        if (prev.flightNumbers.length < requiredCount) {
          newData.flightNumbers = Array(requiredCount).fill('').map((_, i) => prev.flightNumbers[i] || '');
        }
        // Generate sectors from destination(s) based on mode
        if (turnaroundMode === 'double' && destination && destination2) {
          newData.sectors = destinationToDoubleSectorTurnaround(destination, destination2);
        } else if (destination) {
          newData.sectors = destinationToSectors(destination);
        } else {
          newData.sectors = [];
        }
      }

      return newData;
    });

    // Clear destination when switching to non-flight duties
    if (dutyType !== 'layover' && dutyType !== 'turnaround') {
      setDestination('');
      setDestination2('');
    }
  };

  // Handle turnaround mode change (Standard <-> Double Sector)
  const handleTurnaroundModeChange = (mode: 'standard' | 'double') => {
    setTurnaroundMode(mode);
    setSubmitAttempted(false);

    setFormData(prev => {
      const newData = { ...prev };
      
      if (mode === 'double') {
        // Expand to 4 flight numbers
        newData.flightNumbers = [
          prev.flightNumbers[0] || '',
          prev.flightNumbers[1] || '',
          prev.flightNumbers[2] || '',
          prev.flightNumbers[3] || ''
        ];
        // Update sectors if both destinations are set
        if (destination && destination.length === 3 && destination !== 'DXB' &&
            destination2 && destination2.length === 3 && destination2 !== 'DXB') {
          newData.sectors = destinationToDoubleSectorTurnaround(destination, destination2);
        } else if (destination && destination.length === 3 && destination !== 'DXB') {
          // Keep first destination, wait for second
          newData.sectors = [];
        } else {
          newData.sectors = [];
        }
      } else {
        // Shrink to 2 flight numbers (keep first two)
        newData.flightNumbers = [prev.flightNumbers[0] || '', prev.flightNumbers[1] || ''];
        // Update sectors to standard pattern
        if (destination && destination.length === 3 && destination !== 'DXB') {
          newData.sectors = destinationToSectors(destination);
        } else {
          newData.sectors = [];
        }
        // Clear second destination when switching to standard
        setDestination2('');
      }

      return newData;
    });
  };

  // Clear form while keeping duty type (and turnaround mode)
  const clearFormKeepDutyType = () => {
    const currentDutyType = formData.dutyType;
    const flightNumberCount = currentDutyType === 'turnaround' 
      ? (turnaroundMode === 'double' ? 4 : 2)
      : (currentDutyType === 'layover' ? 2 : 1);
    
    setFormData({
      date: '',
      dutyType: currentDutyType,
      flightNumbers: Array(flightNumberCount).fill(''),
      sectors: [], // Sectors derived from destination for turnaround/layover
      reportTime: '',
      debriefTime: '',
      isCrossDay: false,
      inboundDate: '',
      reportTimeInbound: '',
      debriefTimeOutbound: ''
    });
    setDestination(''); // Clear destinations
    setDestination2('');
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
              {/* Destination for Layover */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Destination</label>
                <div className="relative">
                  <div className="input-icon-left">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    type="text"
                    value={destination}
                    onChange={e => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
                      setDestination(val);
                      if (val.length === 3 && val !== 'DXB') {
                        handleFieldChange('sectors', destinationToLayoverSectors(val));
                      } else {
                        handleFieldChange('sectors', []);
                      }
                    }}
                    placeholder="KHI"
                    disabled={isFormDisabled}
                    className={cn(
                      'input-with-left-icon pr-40',
                      (destination === 'DXB' || (submitAttempted && destination && validateDestination(destination).error)) && 'border-destructive'
                    )}
                    maxLength={3}
                  />
                  {/* DXB error inside input */}
                  {destination === 'DXB' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <span className="text-xs text-destructive font-medium">Not the base</span>
                    </div>
                  )}
                  {/* Route preview inside input when valid */}
                  {destination && destination.length === 3 && destination !== 'DXB' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-xs font-semibold" style={{ color: '#4C49ED' }}>
                      <div className="flex items-center gap-1">
                        <span>DXB</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{destination}</span>
                      </div>
                      <span className="text-muted-foreground">|</span>
                      <div className="flex items-center gap-1">
                        <span>{destination}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>DXB</span>
                      </div>
                    </div>
                  )}
                </div>
                {submitAttempted && destination && destination !== 'DXB' && validateDestination(destination).error && (
                  <p className="text-destructive text-sm">{validateDestination(destination).error}</p>
                )}
                {submitAttempted && !destination && (
                  <p className="text-destructive text-sm">Destination is required</p>
                )}
                {submitAttempted && validation.fieldErrors.sectors && (
                  <p className="text-destructive text-sm">{validation.fieldErrors.sectors}</p>
                )}
              </div>

              {/* Outbound Flight Details */}
              <div className="space-y-4">
                <FlightNumberInput
                  value={formData.flightNumbers[0] || ''}
                  onChange={value => {
                    const newNumbers = [...formData.flightNumbers];
                    newNumbers[0] = value;
                    // Auto-suggest inbound flight number (+1) when outbound is complete (3-4 digits)
                    const isComplete = value.length >= 3 && value.length <= 4;
                    if (isComplete) {
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue)) {
                        newNumbers[1] = (numValue + 1).toString();
                      }
                    }
                    handleFieldChange('flightNumbers', newNumbers);
                  }}
                  placeholder="123"
                  disabled={isFormDisabled}
                  label="Flight Number"
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
                    min={getStartOfSelectedYear()}
                    max={getEndOfSelectedYear()}
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

          {/* Flight Details for Turnaround - Supports Standard and Double Sector modes */}
          {showFlightFields && formData.dutyType === 'turnaround' && (
            <div className="space-y-4">
              {/* Turnaround Mode Toggle */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Turnaround Type</label>
                <div className="flex rounded-lg border border-input overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleTurnaroundModeChange('standard')}
                    disabled={isFormDisabled}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm font-medium transition-colors',
                      turnaroundMode === 'standard'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    )}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTurnaroundModeChange('double')}
                    disabled={isFormDisabled}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm font-medium transition-colors',
                      turnaroundMode === 'double'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    )}
                  >
                    Double Sector
                  </button>
                </div>
              </div>

              {/* Standard Turnaround: Single Destination */}
              {turnaroundMode === 'standard' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Destination</label>
                    <div className="relative">
                      <div className="input-icon-left">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        type="text"
                        value={destination}
                        onChange={e => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
                          setDestination(val);
                          if (val.length === 3 && val !== 'DXB') {
                            handleFieldChange('sectors', destinationToSectors(val));
                          } else {
                            handleFieldChange('sectors', []);
                          }
                        }}
                        placeholder="KHI"
                        disabled={isFormDisabled}
                        className={cn(
                          'input-with-left-icon pr-36',
                          (destination === 'DXB' || (submitAttempted && destination && validateDestination(destination).error)) && 'border-destructive'
                        )}
                        maxLength={3}
                      />
                      {destination === 'DXB' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <span className="text-xs text-destructive font-medium">Not the base airport</span>
                        </div>
                      )}
                      {destination && destination.length === 3 && destination !== 'DXB' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                          <span className="text-xs font-semibold" style={{ color: '#4C49ED' }}>DXB</span>
                          <ArrowRight className="h-3 w-3" style={{ color: '#4C49ED' }} />
                          <span className="text-xs font-semibold" style={{ color: '#4C49ED' }}>{destination}</span>
                          <ArrowRight className="h-3 w-3" style={{ color: '#4C49ED' }} />
                          <span className="text-xs font-semibold" style={{ color: '#4C49ED' }}>DXB</span>
                        </div>
                      )}
                    </div>
                    {submitAttempted && destination && destination !== 'DXB' && validateDestination(destination).error && (
                      <p className="text-destructive text-sm">{validateDestination(destination).error}</p>
                    )}
                    {submitAttempted && !destination && (
                      <p className="text-destructive text-sm">Destination is required</p>
                    )}
                    {submitAttempted && validation.fieldErrors.sectors && (
                      <p className="text-destructive text-sm">{validation.fieldErrors.sectors}</p>
                    )}
                  </div>

                  {/* Standard Flight Numbers (2) */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium">Flight Numbers</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <div className="input-icon-left">
                          <Plane className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                          type="text"
                          value={formData.flightNumbers[0] || ''}
                          onChange={e => {
                            const newValue = e.target.value.replace(/[^0-9]/g, '');
                            const newNumbers = [...formData.flightNumbers];
                            newNumbers[0] = newValue;
                            const isComplete = newValue.length >= 3 && newValue.length <= 4;
                            if (isComplete) {
                              const numValue = parseInt(newValue, 10);
                              if (!isNaN(numValue)) {
                                newNumbers[1] = (numValue + 1).toString();
                              }
                            }
                            handleFieldChange('flightNumbers', newNumbers);
                          }}
                          placeholder="123"
                          disabled={isFormDisabled}
                          className="input-with-left-icon"
                          maxLength={4}
                        />
                      </div>
                      <div className="relative">
                        <div className="input-icon-left">
                          <Plane className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                          type="text"
                          value={formData.flightNumbers[1] || ''}
                          onChange={e => {
                            const newNumbers = [...formData.flightNumbers];
                            newNumbers[1] = e.target.value.replace(/[^0-9]/g, '');
                            handleFieldChange('flightNumbers', newNumbers);
                          }}
                          placeholder="124"
                          disabled={isFormDisabled}
                          className="input-with-left-icon"
                          maxLength={4}
                        />
                      </div>
                    </div>
                    {validation.fieldErrors.flightNumbers && submitAttempted && (
                      <p className="text-destructive text-sm">{validation.fieldErrors.flightNumbers}</p>
                    )}
                  </div>
                </>
              )}

              {/* Double Sector Turnaround: Two Destinations */}
              {turnaroundMode === 'double' && (
                <>
                  {/* First Leg */}
                  <div className="space-y-4 p-3 rounded-lg bg-muted/30 border border-muted">
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#4C49ED' }}>
                      <Plane className="h-4 w-4" />
                      FIRST LEG
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Destination 1</label>
                      <div className="relative">
                        <div className="input-icon-left">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                          type="text"
                          value={destination}
                          onChange={e => {
                            const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
                            setDestination(val);
                            // Update sectors if both destinations are valid
                            if (val.length === 3 && val !== 'DXB' && destination2.length === 3 && destination2 !== 'DXB') {
                              handleFieldChange('sectors', destinationToDoubleSectorTurnaround(val, destination2));
                            } else {
                              handleFieldChange('sectors', []);
                            }
                          }}
                          placeholder="KHI"
                          disabled={isFormDisabled}
                          className={cn(
                            'input-with-left-icon pr-28',
                            (destination === 'DXB' || (submitAttempted && destination && validateDestination(destination).error)) && 'border-destructive'
                          )}
                          maxLength={3}
                        />
                        {destination === 'DXB' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <span className="text-xs text-destructive font-medium">Not the base</span>
                          </div>
                        )}
                        {destination && destination.length === 3 && destination !== 'DXB' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                            <span className="text-xs font-semibold" style={{ color: '#4C49ED' }}>DXB</span>
                            <ArrowRight className="h-3 w-3" style={{ color: '#4C49ED' }} />
                            <span className="text-xs font-semibold" style={{ color: '#4C49ED' }}>{destination}</span>
                            <ArrowRight className="h-3 w-3" style={{ color: '#4C49ED' }} />
                            <span className="text-xs font-semibold" style={{ color: '#4C49ED' }}>DXB</span>
                          </div>
                        )}
                      </div>
                      {submitAttempted && destination && destination !== 'DXB' && validateDestination(destination).error && (
                        <p className="text-destructive text-sm">{validateDestination(destination).error}</p>
                      )}
                      {submitAttempted && !destination && (
                        <p className="text-destructive text-sm">Destination 1 is required</p>
                      )}
                    </div>

                    {/* First Leg Flight Numbers */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <div className="input-icon-left">
                          <Plane className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                          type="text"
                          value={formData.flightNumbers[0] || ''}
                          onChange={e => {
                            const newValue = e.target.value.replace(/[^0-9]/g, '');
                            const newNumbers = [...formData.flightNumbers];
                            while (newNumbers.length < 4) newNumbers.push('');
                            newNumbers[0] = newValue;
                            const isComplete = newValue.length >= 3 && newValue.length <= 4;
                            if (isComplete) {
                              const numValue = parseInt(newValue, 10);
                              if (!isNaN(numValue)) {
                                newNumbers[1] = (numValue + 1).toString();
                              }
                            }
                            handleFieldChange('flightNumbers', newNumbers);
                          }}
                          placeholder="123"
                          disabled={isFormDisabled}
                          className="input-with-left-icon"
                          maxLength={4}
                        />
                      </div>
                      <div className="relative">
                        <div className="input-icon-left">
                          <Plane className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                          type="text"
                          value={formData.flightNumbers[1] || ''}
                          onChange={e => {
                            const newNumbers = [...formData.flightNumbers];
                            while (newNumbers.length < 4) newNumbers.push('');
                            newNumbers[1] = e.target.value.replace(/[^0-9]/g, '');
                            handleFieldChange('flightNumbers', newNumbers);
                          }}
                          placeholder="124"
                          disabled={isFormDisabled}
                          className="input-with-left-icon"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Second Leg */}
                  <div className="space-y-4 p-3 rounded-lg bg-muted/30 border border-muted">
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#4C49ED' }}>
                      <Plane className="h-4 w-4" />
                      SECOND LEG
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Destination 2</label>
                      <div className="relative">
                        <div className="input-icon-left">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                          type="text"
                          value={destination2}
                          onChange={e => {
                            const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
                            setDestination2(val);
                            // Update sectors if both destinations are valid
                            if (destination.length === 3 && destination !== 'DXB' && val.length === 3 && val !== 'DXB') {
                              handleFieldChange('sectors', destinationToDoubleSectorTurnaround(destination, val));
                            } else {
                              handleFieldChange('sectors', []);
                            }
                          }}
                          placeholder="MCT"
                          disabled={isFormDisabled}
                          className={cn(
                            'input-with-left-icon pr-28',
                            (destination2 === 'DXB' || (submitAttempted && destination2 && validateDestination(destination2).error)) && 'border-destructive'
                          )}
                          maxLength={3}
                        />
                        {destination2 === 'DXB' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <span className="text-xs text-destructive font-medium">Not the base</span>
                          </div>
                        )}
                        {destination2 && destination2.length === 3 && destination2 !== 'DXB' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                            <span className="text-xs font-semibold" style={{ color: '#4C49ED' }}>DXB</span>
                            <ArrowRight className="h-3 w-3" style={{ color: '#4C49ED' }} />
                            <span className="text-xs font-semibold" style={{ color: '#4C49ED' }}>{destination2}</span>
                            <ArrowRight className="h-3 w-3" style={{ color: '#4C49ED' }} />
                            <span className="text-xs font-semibold" style={{ color: '#4C49ED' }}>DXB</span>
                          </div>
                        )}
                      </div>
                      {submitAttempted && destination2 && destination2 !== 'DXB' && validateDestination(destination2).error && (
                        <p className="text-destructive text-sm">{validateDestination(destination2).error}</p>
                      )}
                      {submitAttempted && !destination2 && (
                        <p className="text-destructive text-sm">Destination 2 is required</p>
                      )}
                    </div>

                    {/* Second Leg Flight Numbers */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <div className="input-icon-left">
                          <Plane className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                          type="text"
                          value={formData.flightNumbers[2] || ''}
                          onChange={e => {
                            const newValue = e.target.value.replace(/[^0-9]/g, '');
                            const newNumbers = [...formData.flightNumbers];
                            while (newNumbers.length < 4) newNumbers.push('');
                            newNumbers[2] = newValue;
                            const isComplete = newValue.length >= 3 && newValue.length <= 4;
                            if (isComplete) {
                              const numValue = parseInt(newValue, 10);
                              if (!isNaN(numValue)) {
                                newNumbers[3] = (numValue + 1).toString();
                              }
                            }
                            handleFieldChange('flightNumbers', newNumbers);
                          }}
                          placeholder="345"
                          disabled={isFormDisabled}
                          className="input-with-left-icon"
                          maxLength={4}
                        />
                      </div>
                      <div className="relative">
                        <div className="input-icon-left">
                          <Plane className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                          type="text"
                          value={formData.flightNumbers[3] || ''}
                          onChange={e => {
                            const newNumbers = [...formData.flightNumbers];
                            while (newNumbers.length < 4) newNumbers.push('');
                            newNumbers[3] = e.target.value.replace(/[^0-9]/g, '');
                            handleFieldChange('flightNumbers', newNumbers);
                          }}
                          placeholder="346"
                          disabled={isFormDisabled}
                          className="input-with-left-icon"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Full route preview for double sector */}
                  {destination && destination.length === 3 && destination !== 'DXB' && 
                   destination2 && destination2.length === 3 && destination2 !== 'DXB' && (
                    <div className="p-2 rounded-md bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-center gap-1 text-xs font-semibold" style={{ color: '#4C49ED' }}>
                        <span>DXB</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{destination}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>DXB</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{destination2}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>DXB</span>
                      </div>
                    </div>
                  )}

                  {/* Route validation errors (e.g., Dest1 must differ from Dest2) */}
                  {submitAttempted && validation.fieldErrors.sectors && (
                    <p className="text-destructive text-sm">{validation.fieldErrors.sectors}</p>
                  )}

                  {validation.fieldErrors.flightNumbers && submitAttempted && (
                    <p className="text-destructive text-sm">{validation.fieldErrors.flightNumbers}</p>
                  )}
                </>
              )}
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

/**
 * Manual Entry Processor for Skywage Salary Calculator
 * Phase 4: Processes manual flight entries and saves to database
 * Following existing patterns from upload-processor.ts
 */

import {
  FlightDuty,
  MonthlyCalculationResult,
  Position
} from '@/types/salary-calculator';
import {
  calculateMonthlySalary,
  calculateLayoverRestPeriods,
  classifyFlightDuty,
  parseTimeString,
  calculateDuration,
  calculateFlightPay
} from '@/lib/salary-calculator';
import { createFlightDuties } from '@/lib/database/flights';
import { 
  createLayoverRestPeriods, 
  upsertMonthlyCalculation 
} from '@/lib/database/calculations';
import {
  ManualFlightEntryData,
  validateManualEntry,
  FormValidationResult
} from './manual-entry-validation';
import {
  transformFlightNumbers,
  transformSectors
} from './input-transformers';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

// Processing result for manual entry
export interface ManualEntryResult {
  success: boolean;
  flightDuty?: FlightDuty;
  monthlyCalculation?: MonthlyCalculationResult;
  errors?: string[];
  warnings?: string[];
}

// Batch processing result
export interface BatchManualEntryResult {
  success: boolean;
  processedCount: number;
  flightDuties?: FlightDuty[];
  monthlyCalculation?: MonthlyCalculationResult;
  errors?: string[];
  warnings?: string[];
}

/**
 * Legacy conversion function - backup for rollback safety
 */
function convertToFlightDutyLegacy(
  data: ManualFlightEntryData,
  userId: string,
  position: Position
): FlightDuty[] | null {
  try {
    // Handle layover duties - create 2 separate duties (LEGACY FORMAT)
    if (data.dutyType === 'layover') {
      console.log('🔧 LEGACY: Creating layover duties with legacy format');

      // Validate layover data
      if (!data.inboundDate || !data.reportTimeInbound || !data.debriefTimeOutbound) {
        throw new Error('Missing required layover fields');
      }

      if (data.flightNumbers.length !== 2) {
        throw new Error('Layover duties must have exactly 2 flight numbers');
      }

      if (data.sectors.length !== 4) {
        throw new Error('Layover duties must have exactly 4 sectors');
      }

      // Parse outbound date and times
      const outboundDate = new Date(data.date);
      const outboundMonth = outboundDate.getMonth() + 1;
      const outboundYear = outboundDate.getFullYear();

      const outboundReportTime = parseTimeString(data.reportTime);
      const outboundDebriefTime = parseTimeString(data.debriefTimeOutbound);

      if (!outboundReportTime.success || !outboundDebriefTime.success || !outboundReportTime.timeValue || !outboundDebriefTime.timeValue) {
        throw new Error(`Invalid outbound time format: ${outboundReportTime.error || outboundDebriefTime.error}`);
      }

      const outboundDutyHours = calculateDuration(outboundReportTime.timeValue, outboundDebriefTime.timeValue, data.isCrossDayOutbound);
      const outboundFlightPay = calculateFlightPay(outboundDutyHours, position);

      const outboundDuty: FlightDuty = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        date: outboundDate,
        month: outboundMonth,
        year: outboundYear,
        dutyType: 'layover',
        flightNumbers: [data.flightNumbers[0]], // LEGACY: Raw flight number
        sectors: [data.sectors[0], data.sectors[1]], // LEGACY: Array format
        reportTime: outboundReportTime.timeValue,
        debriefTime: outboundDebriefTime.timeValue,
        dutyHours: outboundDutyHours,
        flightPay: outboundFlightPay,
        isCrossDay: data.isCrossDayOutbound || false,
        dataSource: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Parse inbound date and times
      const inboundDate = new Date(data.inboundDate);
      const inboundMonth = inboundDate.getMonth() + 1;
      const inboundYear = inboundDate.getFullYear();

      const inboundReportTime = parseTimeString(data.reportTimeInbound);
      const inboundDebriefTime = parseTimeString(data.debriefTime);

      if (!inboundReportTime.success || !inboundDebriefTime.success || !inboundReportTime.timeValue || !inboundDebriefTime.timeValue) {
        throw new Error(`Invalid inbound time format: ${inboundReportTime.error || inboundDebriefTime.error}`);
      }

      const inboundDutyHours = calculateDuration(inboundReportTime.timeValue, inboundDebriefTime.timeValue, data.isCrossDayInbound);
      const inboundFlightPay = calculateFlightPay(inboundDutyHours, position);

      const inboundDuty: FlightDuty = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        date: inboundDate,
        month: inboundMonth,
        year: inboundYear,
        dutyType: 'layover',
        flightNumbers: [data.flightNumbers[1]], // LEGACY: Raw flight number
        sectors: [data.sectors[2], data.sectors[3]], // LEGACY: Array format
        reportTime: inboundReportTime.timeValue,
        debriefTime: inboundDebriefTime.timeValue,
        dutyHours: inboundDutyHours,
        flightPay: inboundFlightPay,
        isCrossDay: data.isCrossDayInbound || false,
        dataSource: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('🔧 LEGACY: Created outbound duty:', outboundDuty);
      console.log('🔧 LEGACY: Created inbound duty:', inboundDuty);

      return [outboundDuty, inboundDuty];
    }

    // Handle non-layover duties (existing logic)
    const flightDate = new Date(data.date);
    const month = flightDate.getMonth() + 1;
    const year = flightDate.getFullYear();

    const reportTimeResult = parseTimeString(data.reportTime);
    const debriefTimeResult = parseTimeString(data.debriefTime);

    if (!reportTimeResult.success || !debriefTimeResult.success || !reportTimeResult.timeValue || !debriefTimeResult.timeValue) {
      throw new Error(`Invalid time format: ${reportTimeResult.error || debriefTimeResult.error || 'Unknown time parsing error'}`);
    }

    const dutyHours = calculateDuration(reportTimeResult.timeValue, debriefTimeResult.timeValue, data.isCrossDay);
    let flightPay = 0;

    if (data.dutyType === 'asby') {
      flightPay = calculateFlightPay(4, position); // ASBY is fixed 4 hours
    } else if (data.dutyType === 'recurrent') {
      // Check if this is ELD (e-learning Day) which is unpaid
      const isELD = data.flightNumbers.some(fn => fn.toUpperCase().includes('ELD')) ||
                    data.sectors.some(s => s.toUpperCase().includes('ELD'));
      if (isELD) {
        flightPay = 0; // ELD is unpaid recurrent training
      } else {
        flightPay = calculateFlightPay(4, position); // Other recurrent training is equivalent to 4 flying hours
      }
    } else if (data.dutyType === 'business_promotion') {
      flightPay = calculateFlightPay(5, position); // Business Promotion is equivalent to 5 flying hours
    } else if (data.dutyType !== 'sby' && data.dutyType !== 'off') {
      flightPay = calculateFlightPay(dutyHours, position);
    }

    const flightNumbers = transformFlightNumbers(data.flightNumbers);
    const sectors = transformSectors(data.sectors);

    const flightDuty: FlightDuty = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      date: flightDate,
      month,
      year,
      flightNumbers,
      sectors,
      dutyType: data.dutyType,
      reportTime: reportTimeResult.timeValue,
      debriefTime: debriefTimeResult.timeValue,
      dutyHours,
      flightPay,
      isCrossDay: data.isCrossDay,
      dataSource: 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const dutiesString = flightNumbers.join(' ');
    const sectorsString = sectors.join(' ');
    const classification = classifyFlightDuty(dutiesString, sectorsString, data.reportTime, data.debriefTime);

    if (classification.dutyType !== flightDuty.dutyType) {
      flightDuty.dutyType = classification.dutyType;
    }

    return [flightDuty];
  } catch (error) {
    console.error('🔧 LEGACY: Error converting manual entry to flight duty:', error);
    return null;
  }
}

/**
 * Converts manual entry data to FlightDuty object
 */
export function convertToFlightDuty(
  data: ManualFlightEntryData,
  userId: string,
  position: Position
): FlightDuty[] | null {
  try {
    // Feature flag check - use legacy function if flag is disabled
    if (!FEATURE_FLAGS.LAYOVER_PAIRING_FIX) {
      console.log('🔧 FEATURE FLAG: Using legacy layover conversion');
      return convertToFlightDutyLegacy(data, userId, position);
    }

    // Handle layover duties - create 2 separate duties (NEW FORMAT)
    if (data.dutyType === 'layover') {
      console.log('🔧 LAYOVER DEBUG: Processing layover with data:', {
        dutyType: data.dutyType,
        flightNumbers: data.flightNumbers,
        sectors: data.sectors,
        hasInboundDate: !!data.inboundDate,
        hasReportTimeInbound: !!data.reportTimeInbound,
        hasDebriefTimeOutbound: !!data.debriefTimeOutbound
      });
      console.log('=== CREATING LAYOVER DUTIES (NEW FORMAT) ===');

      // Validate layover data
      if (!data.inboundDate || !data.reportTimeInbound || !data.debriefTimeOutbound) {
        throw new Error('Missing required layover fields');
      }

      if (data.flightNumbers.length !== 2) {
        throw new Error('Layover duties must have exactly 2 flight numbers');
      }

      if (data.sectors.length !== 4) {
        throw new Error('Layover duties must have exactly 4 sectors');
      }

      // Validate sector format for layover pairing
      if (data.sectors[0] !== 'DXB') {
        throw new Error('Layover outbound flight must start from DXB');
      }

      if (data.sectors[2] !== data.sectors[1]) {
        throw new Error('Layover inbound flight must start from outbound destination');
      }

      if (data.sectors[3] !== 'DXB') {
        throw new Error('Layover inbound flight must return to DXB');
      }

      console.log('✅ LAYOVER VALIDATION: Route validation passed - DXB → ' + data.sectors[1] + ' → DXB');

      // Create outbound duty
      const outboundDate = new Date(data.date);
      const outboundMonth = outboundDate.getMonth() + 1;
      const outboundYear = outboundDate.getFullYear();

      const outboundReportTime = parseTimeString(data.reportTime);
      const outboundDebriefTime = parseTimeString(data.debriefTimeOutbound);

      if (!outboundReportTime.success || !outboundDebriefTime.success || !outboundReportTime.timeValue || !outboundDebriefTime.timeValue) {
        throw new Error(`Invalid outbound time format: ${outboundReportTime.error || outboundDebriefTime.error}`);
      }

      // Calculate outbound duty hours and pay
      const outboundDutyHours = calculateDuration(outboundReportTime.timeValue, outboundDebriefTime.timeValue, data.isCrossDayOutbound);
      const outboundFlightPay = calculateFlightPay(outboundDutyHours, position);

      const outboundDuty: FlightDuty = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        date: outboundDate,
        month: outboundMonth,
        year: outboundYear,
        dutyType: 'layover',
        flightNumbers: transformFlightNumbers([data.flightNumbers[0]]), // Apply FZ prefix
        sectors: [`${data.sectors[0]}-${data.sectors[1]}`], // Create sector string format
        reportTime: outboundReportTime.timeValue,
        debriefTime: outboundDebriefTime.timeValue,
        dutyHours: outboundDutyHours,
        flightPay: outboundFlightPay,
        isCrossDay: data.isCrossDayOutbound || false,
        dataSource: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create inbound duty
      const inboundDate = new Date(data.inboundDate);
      const inboundMonth = inboundDate.getMonth() + 1;
      const inboundYear = inboundDate.getFullYear();

      const inboundReportTime = parseTimeString(data.reportTimeInbound);
      const inboundDebriefTime = parseTimeString(data.debriefTime);

      if (!inboundReportTime.success || !inboundDebriefTime.success || !inboundReportTime.timeValue || !inboundDebriefTime.timeValue) {
        throw new Error(`Invalid inbound time format: ${inboundReportTime.error || inboundDebriefTime.error}`);
      }

      // Calculate inbound duty hours and pay
      const inboundDutyHours = calculateDuration(inboundReportTime.timeValue, inboundDebriefTime.timeValue, data.isCrossDayInbound);
      const inboundFlightPay = calculateFlightPay(inboundDutyHours, position);

      const inboundDuty: FlightDuty = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        date: inboundDate,
        month: inboundMonth,
        year: inboundYear,
        dutyType: 'layover',
        flightNumbers: transformFlightNumbers([data.flightNumbers[1]]), // Apply FZ prefix
        sectors: [`${data.sectors[2]}-${data.sectors[3]}`], // Create sector string format
        reportTime: inboundReportTime.timeValue,
        debriefTime: inboundDebriefTime.timeValue,
        dutyHours: inboundDutyHours,
        flightPay: inboundFlightPay,
        isCrossDay: data.isCrossDayInbound || false,
        dataSource: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('✅ NEW FORMAT: Created outbound duty:', {
        id: outboundDuty.id,
        flightNumbers: outboundDuty.flightNumbers,
        sectors: outboundDuty.sectors,
        date: outboundDuty.date.toDateString()
      });
      console.log('✅ NEW FORMAT: Created inbound duty:', {
        id: inboundDuty.id,
        flightNumbers: inboundDuty.flightNumbers,
        sectors: inboundDuty.sectors,
        date: inboundDuty.date.toDateString()
      });
      console.log('=== END LAYOVER CREATION (NEW FORMAT) ===');

      return [outboundDuty, inboundDuty];
    }

    // Handle non-layover duties (existing logic)
    // Parse date
    const flightDate = new Date(data.date);
    const month = flightDate.getMonth() + 1; // 1-based month
    const year = flightDate.getFullYear();

    // Parse times
    const reportTimeResult = parseTimeString(data.reportTime);
    const debriefTimeResult = parseTimeString(data.debriefTime);

    if (!reportTimeResult.success || !debriefTimeResult.success || !reportTimeResult.timeValue || !debriefTimeResult.timeValue) {
      throw new Error(`Invalid time format: ${reportTimeResult.error || debriefTimeResult.error || 'Unknown time parsing error'}`);
    }

    // Calculate duty hours
    const dutyHours = calculateDuration(reportTimeResult.timeValue, debriefTimeResult.timeValue, data.isCrossDay);

    // Calculate flight pay based on duty type and position
    let flightPay = 0;
    if (data.dutyType === 'asby') {
      // ASBY is paid at fixed 4 hours at hourly rate
      const rates = { CCM: { hourlyRate: 50, asbyHours: 4 }, SCCM: { hourlyRate: 62, asbyHours: 4 } };
      flightPay = rates[position].asbyHours * rates[position].hourlyRate;
    } else if (data.dutyType === 'recurrent') {
      // Check if this is ELD (e-learning Day) which is unpaid
      const isELD = data.flightNumbers.some(fn => fn.toUpperCase().includes('ELD')) ||
                    data.sectors.some(s => s.toUpperCase().includes('ELD'));
      if (isELD) {
        flightPay = 0; // ELD is unpaid recurrent training
      } else {
        // Other recurrent training is paid at fixed 4 hours at hourly rate
        const rates = { CCM: { hourlyRate: 50 }, SCCM: { hourlyRate: 62 } };
        flightPay = 4 * rates[position].hourlyRate;
      }
    } else if (data.dutyType === 'business_promotion') {
      // Business Promotion is paid at fixed 5 hours at hourly rate
      const rates = { CCM: { hourlyRate: 50 }, SCCM: { hourlyRate: 62 } };
      flightPay = 5 * rates[position].hourlyRate;
    } else if (data.dutyType === 'turnaround' || data.dutyType === 'layover') {
      // Regular flight duties are paid at hourly rate for actual duty hours
      flightPay = calculateFlightPay(dutyHours, position);
    }
    // No pay for 'sby' or 'off' duty types

    // Transform simplified input to expected format
    const flightNumbers = transformFlightNumbers(data.flightNumbers);
    const sectors = transformSectors(data.sectors);

    // Create flight duty object
    const flightDuty: FlightDuty = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      date: flightDate,
      month,
      year,
      flightNumbers,
      sectors,
      dutyType: data.dutyType,
      reportTime: reportTimeResult.timeValue,
      debriefTime: debriefTimeResult.timeValue,
      dutyHours,
      flightPay,
      isCrossDay: data.isCrossDay,
      dataSource: 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Only classify flight duties (not ground duties like asby, recurrent, sby, off, business_promotion)
    const isGroundDuty = ['asby', 'recurrent', 'sby', 'off', 'business_promotion'].includes(data.dutyType);

    if (!isGroundDuty) {
      // Classify the flight duty based on flight numbers and sectors
      const dutiesString = flightNumbers.join(' ');
      const sectorsString = sectors.join(' ');
      const classification = classifyFlightDuty(dutiesString, sectorsString, data.reportTime, data.debriefTime);

      // Update duty type based on classification if needed
      if (classification.dutyType !== flightDuty.dutyType) {
        flightDuty.dutyType = classification.dutyType;
      }
    }

    return [flightDuty];
  } catch (error) {
    console.error('🚨 NEW FORMAT ERROR: Error converting manual entry to flight duty:', error);

    // Fallback to legacy function if new format fails
    if (FEATURE_FLAGS.LAYOVER_PAIRING_FIX) {
      console.log('🔄 FALLBACK: Attempting legacy conversion due to error');
      try {
        return convertToFlightDutyLegacy(data, userId, position);
      } catch (legacyError) {
        console.error('🚨 LEGACY FALLBACK FAILED:', legacyError);
      }
    }

    return null;
  }
}

/**
 * Processes a single manual flight entry
 */
export async function processManualEntry(
  data: ManualFlightEntryData,
  userId: string,
  position: Position
): Promise<ManualEntryResult> {
  const warnings: string[] = [];

  try {
    // Validate the entry
    const validation = validateManualEntry(data, position);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    warnings.push(...validation.warnings);

    // Convert to FlightDuty array
    const flightDuties = convertToFlightDuty(data, userId, position);
    if (!flightDuties || flightDuties.length === 0) {
      return {
        success: false,
        errors: ['Failed to convert entry to flight duty'],
        warnings
      };
    }

    // Save to database
    const saveResult = await createFlightDuties(flightDuties, userId);
    if (saveResult.error) {
      return {
        success: false,
        errors: [`Failed to save flight duty: ${saveResult.error}`],
        warnings
      };
    }

    // Recalculate monthly totals for the entire month (not just the new flight)
    const { recalculateMonthlyTotals } = await import('@/lib/salary-calculator/recalculation-engine');
    const firstDuty = flightDuties[0];
    const recalcResult = await recalculateMonthlyTotals(
      userId,
      firstDuty.month,
      firstDuty.year,
      position
    );

    if (!recalcResult.success) {
      warnings.push('Flight saved but monthly calculation update failed');
    }

    const monthlyCalculation = recalcResult.monthlyCalculation;

    return {
      success: true,
      flightDuty: firstDuty, // Return first duty for backward compatibility
      monthlyCalculation,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      errors: [errorMessage],
      warnings
    };
  }
}

/**
 * Processes multiple manual flight entries as a batch
 */
export async function processBatchManualEntries(
  entries: ManualFlightEntryData[],
  userId: string,
  position: Position
): Promise<BatchManualEntryResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const flightDuties: FlightDuty[] = [];

  try {
    // Validate all entries first
    for (let i = 0; i < entries.length; i++) {
      const validation = validateManualEntry(entries[i], position);
      if (!validation.valid) {
        errors.push(`Entry ${i + 1}: ${validation.errors.join(', ')}`);
      } else {
        warnings.push(...validation.warnings.map(w => `Entry ${i + 1}: ${w}`));
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        processedCount: 0,
        errors,
        warnings
      };
    }

    // Convert all entries to FlightDuty objects
    for (let i = 0; i < entries.length; i++) {
      const flightDuty = convertToFlightDuty(entries[i], userId, position);
      if (!flightDuty) {
        errors.push(`Entry ${i + 1}: Failed to convert to flight duty`);
      } else {
        flightDuties.push(flightDuty);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        processedCount: 0,
        errors,
        warnings
      };
    }

    // Save all flight duties to database
    const saveResult = await createFlightDuties(flightDuties, userId);
    if (saveResult.error) {
      return {
        success: false,
        processedCount: 0,
        errors: [`Failed to save flight duties: ${saveResult.error}`],
        warnings
      };
    }

    // Calculate layover rest periods
    const layoverRestPeriods = calculateLayoverRestPeriods(flightDuties, userId, position);

    // Save layover rest periods if any
    if (layoverRestPeriods.length > 0) {
      const restSaveResult = await createLayoverRestPeriods(layoverRestPeriods, userId);
      if (restSaveResult.error) {
        warnings.push(`Warning: Failed to save rest periods: ${restSaveResult.error}`);
      }
    }

    // Calculate monthly totals
    const firstFlight = flightDuties[0];
    const monthlyCalculation = calculateMonthlySalary(
      flightDuties,
      layoverRestPeriods,
      position,
      firstFlight.month,
      firstFlight.year,
      userId
    );

    // Save monthly calculation
    const calculationSaveResult = await upsertMonthlyCalculation(
      monthlyCalculation.calculation, 
      userId
    );
    if (calculationSaveResult.error) {
      warnings.push(`Warning: Failed to save monthly calculation: ${calculationSaveResult.error}`);
    }

    return {
      success: true,
      processedCount: flightDuties.length,
      flightDuties,
      monthlyCalculation,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      processedCount: 0,
      errors: [errorMessage],
      warnings
    };
  }
}

/**
 * Processes multiple manual flight entries as a batch
 */
export async function processManualEntryBatch(
  entries: ManualFlightEntryData[],
  userId: string,
  position: Position
): Promise<BatchManualEntryResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const flightDuties: FlightDuty[] = [];

  try {
    // Validate and convert all entries
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Validate the entry
      const validation = validateManualEntry(entry, position);
      if (!validation.valid) {
        errors.push(`Entry ${i + 1}: ${validation.errors.join(', ')}`);
        continue;
      }

      warnings.push(...validation.warnings.map(w => `Entry ${i + 1}: ${w}`));

      // Convert to FlightDuty
      const entryFlightDuties = convertToFlightDuty(entry, userId, position);
      if (!entryFlightDuties || entryFlightDuties.length === 0) {
        errors.push(`Entry ${i + 1}: Failed to convert entry to flight duty`);
        continue;
      }

      flightDuties.push(...entryFlightDuties); // Spread array to handle layovers
    }

    // If no valid flight duties, return error
    if (flightDuties.length === 0) {
      return {
        success: false,
        processedCount: 0,
        errors: errors.length > 0 ? errors : ['No valid flight duties to process'],
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    // Save all flight duties to database
    const saveResult = await createFlightDuties(flightDuties, userId);
    if (saveResult.error) {
      return {
        success: false,
        processedCount: 0,
        errors: [`Failed to save flight duties: ${saveResult.error}`],
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    // Recalculate monthly totals for all affected months
    const monthlyGroups = new Map<string, FlightDuty[]>();
    flightDuties.forEach(duty => {
      const key = `${duty.year}-${duty.month}`;
      if (!monthlyGroups.has(key)) {
        monthlyGroups.set(key, []);
      }
      monthlyGroups.get(key)!.push(duty);
    });

    // Recalculate for each affected month
    const { recalculateMonthlyTotals } = await import('@/lib/salary-calculator/recalculation-engine');
    let monthlyCalculation;

    for (const duties of monthlyGroups.values()) {
      const firstDuty = duties[0];
      const recalcResult = await recalculateMonthlyTotals(
        userId,
        firstDuty.month,
        firstDuty.year,
        position
      );

      if (!recalcResult.success) {
        warnings.push(`Monthly calculation update failed for ${firstDuty.month}/${firstDuty.year}`);
      }

      // Return the calculation for the first month (most common case)
      if (!monthlyCalculation) {
        monthlyCalculation = recalcResult.monthlyCalculation;
      }
    }

    return {
      success: true,
      processedCount: flightDuties.length,
      flightDuties,
      monthlyCalculation,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      processedCount: 0,
      errors: [errorMessage],
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
}

/**
 * Validates manual entry data in real-time
 */
export function validateManualEntryRealTime(
  data: Partial<ManualFlightEntryData>,
  position: Position
): FormValidationResult {
  // Create a complete data object with defaults for validation
  const completeData: ManualFlightEntryData = {
    date: data.date || '',
    dutyType: data.dutyType || 'layover',
    flightNumbers: data.flightNumbers || [],
    sectors: data.sectors || [],
    reportTime: data.reportTime || '',
    debriefTime: data.debriefTime || '',
    isCrossDay: data.isCrossDay || false,
    // Include layover-specific fields
    inboundDate: data.inboundDate || '',
    reportTimeInbound: data.reportTimeInbound || '',
    debriefTimeOutbound: data.debriefTimeOutbound || '',
    isCrossDayOutbound: data.isCrossDayOutbound || false,
    isCrossDayInbound: data.isCrossDayInbound || false
  };

  return validateManualEntry(completeData, position);
}

/**
 * Gets suggested flight numbers based on partial input
 */
export function getSuggestedFlightNumbers(partial: string): string[] {
  if (!partial || partial.length < 2) {
    return [];
  }

  // Simple suggestions based on Flydubai pattern
  const suggestions: string[] = [];
  const upperPartial = partial.toUpperCase();

  if (upperPartial.startsWith('FZ')) {
    const numberPart = upperPartial.substring(2);
    if (numberPart.length > 0 && /^\d+$/.test(numberPart)) {
      // Suggest common flight numbers
      const baseNumber = parseInt(numberPart);
      for (let i = 0; i < 5; i++) {
        const suggestedNumber = baseNumber + i;
        if (suggestedNumber >= 100 && suggestedNumber <= 9999) {
          suggestions.push(`FZ${suggestedNumber}`);
        }
      }
    }
  } else if (/^\d/.test(upperPartial)) {
    // If user starts with number, suggest FZ prefix
    suggestions.push(`FZ${upperPartial}`);
  }

  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

/**
 * Gets suggested sectors based on partial input
 */
export function getSuggestedSectors(partial: string): string[] {
  if (!partial || partial.length < 2) {
    return [];
  }

  // Common Flydubai destinations
  const commonSectors = [
    'DXB-CMB', 'CMB-DXB', 'DXB-CCJ', 'CCJ-DXB',
    'DXB-COK', 'COK-DXB', 'DXB-TRV', 'TRV-DXB',
    'DXB-BOM', 'BOM-DXB', 'DXB-DEL', 'DEL-DXB',
    'DXB-KTM', 'KTM-DXB', 'DXB-DAC', 'DAC-DXB'
  ];

  const upperPartial = partial.toUpperCase();
  return commonSectors.filter(sector => 
    sector.startsWith(upperPartial)
  ).slice(0, 5);
}

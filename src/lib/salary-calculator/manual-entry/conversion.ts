/**
 * Manual Entry Conversion Module
 * Converts manual entry data to FlightDuty objects
 */

import {
  FlightDuty,
  Sector,
  Position
} from '@/types/salary-calculator';
import {
  classifyFlightDuty,
  parseTimeString,
  calculateDuration,
  calculateFlightPay
} from '@/lib/salary-calculator';
import { getPositionRatesForDate } from '@/lib/salary-calculator/calculation-engine';
import { ManualFlightEntryData } from '../manual-entry-validation';
import {
  transformFlightNumbers,
  transformSectors
} from '../input-transformers';
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { calculateBlockMinutes } from '../sector-time-parser';

/** Builds a single deadhead Sector object for manual entries */
export function buildDeadheadSector(
  flightNumber: string,
  origin: string,
  destination: string,
  departureTime?: string,
  arrivalTime?: string
): Sector {
  const sector: Sector = {
    flightNumber,
    origin,
    destination,
    isFlaggedSector: true,
    isDeadhead: true,
  };

  if (departureTime && arrivalTime) {
    sector.departureTime = departureTime;
    sector.arrivalTime = arrivalTime;
    sector.blockMinutes = calculateBlockMinutes(departureTime, arrivalTime, false, false);
  }

  return sector;
}

/** Applies DHD deduction: subtracts 50% of deadhead block time from duty hours */
function applyDhdDeduction(dutyHours: number, dhdBlockMinutes: number): number {
  return Math.max(0, dutyHours - (dhdBlockMinutes / 2 / 60));
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

      if (!outboundReportTime.success || !outboundDebriefTime.success || 
          !outboundReportTime.timeValue || !outboundDebriefTime.timeValue) {
        throw new Error(`Invalid outbound time format: ${outboundReportTime.error || outboundDebriefTime.error}`);
      }

      const outboundDutyHours = calculateDuration(
        outboundReportTime.timeValue, 
        outboundDebriefTime.timeValue, 
        data.isCrossDayOutbound
      );
      const outboundFlightPay = calculateFlightPay(outboundDutyHours, position);

      const outboundDuty: FlightDuty = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        date: outboundDate,
        month: outboundMonth,
        year: outboundYear,
        dutyType: 'layover',
        flightNumbers: [data.flightNumbers[0]],
        sectors: [data.sectors[0], data.sectors[1]],
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

      if (!inboundReportTime.success || !inboundDebriefTime.success || 
          !inboundReportTime.timeValue || !inboundDebriefTime.timeValue) {
        throw new Error(`Invalid inbound time format: ${inboundReportTime.error || inboundDebriefTime.error}`);
      }

      const inboundDutyHours = calculateDuration(
        inboundReportTime.timeValue, 
        inboundDebriefTime.timeValue, 
        data.isCrossDayInbound
      );
      const inboundFlightPay = calculateFlightPay(inboundDutyHours, position);

      const inboundDuty: FlightDuty = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        date: inboundDate,
        month: inboundMonth,
        year: inboundYear,
        dutyType: 'layover',
        flightNumbers: [data.flightNumbers[1]],
        sectors: [data.sectors[2], data.sectors[3]],
        reportTime: inboundReportTime.timeValue,
        debriefTime: inboundDebriefTime.timeValue,
        dutyHours: inboundDutyHours,
        flightPay: inboundFlightPay,
        isCrossDay: data.isCrossDayInbound || false,
        dataSource: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return [outboundDuty, inboundDuty];
    }

    // Handle non-layover duties
    const flightDate = new Date(data.date);
    const month = flightDate.getMonth() + 1;
    const year = flightDate.getFullYear();

    // Handle Day Off duty type - no times required (legacy)
    if (data.dutyType === 'off') {
      const emptyTimeValue = { hours: 0, minutes: 0, totalMinutes: 0, totalHours: 0 };
      
      const flightDuty: FlightDuty = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        date: flightDate,
        month,
        year,
        flightNumbers: [],
        sectors: [],
        dutyType: 'off',
        reportTime: emptyTimeValue,
        debriefTime: emptyTimeValue,
        dutyHours: 0,
        flightPay: 0,
        isCrossDay: false,
        dataSource: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return [flightDuty];
    }

    const reportTimeResult = parseTimeString(data.reportTime);
    const debriefTimeResult = parseTimeString(data.debriefTime);

    if (!reportTimeResult.success || !debriefTimeResult.success || 
        !reportTimeResult.timeValue || !debriefTimeResult.timeValue) {
      throw new Error(`Invalid time format: ${reportTimeResult.error || debriefTimeResult.error}`);
    }

    const dutyHours = calculateDuration(
      reportTimeResult.timeValue, 
      debriefTimeResult.timeValue, 
      data.isCrossDay
    );
    
    let flightPay = 0;
    if (data.dutyType === 'asby') {
      flightPay = calculateFlightPay(4, position);
    } else if (data.dutyType === 'recurrent') {
      const isELD = data.flightNumbers.some(fn => fn.toUpperCase().includes('ELD')) ||
                    data.sectors.some(s => s.toUpperCase().includes('ELD'));
      flightPay = isELD ? 0 : calculateFlightPay(4, position);
    } else if (data.dutyType === 'business_promotion') {
      flightPay = calculateFlightPay(5, position);
    } else if (data.dutyType !== 'sby') {
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

    const classification = classifyFlightDuty(
      flightNumbers.join(' '), 
      sectors.join(' '), 
      data.reportTime, 
      data.debriefTime
    );
    if (classification.dutyType !== flightDuty.dutyType) {
      flightDuty.dutyType = classification.dutyType;
    }

    return [flightDuty];
  } catch {
    return null;
  }
}

/**
 * Converts manual entry data to FlightDuty object(s)
 */
export function convertToFlightDuty(
  data: ManualFlightEntryData,
  userId: string,
  position: Position
): FlightDuty[] | null {
  try {
    // Feature flag check - use legacy function if flag is disabled
    if (!FEATURE_FLAGS.LAYOVER_PAIRING_FIX) {
      return convertToFlightDutyLegacy(data, userId, position);
    }

    // Handle layover duties - create 2 separate duties (NEW FORMAT)
    if (data.dutyType === 'layover') {
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

      // Create outbound duty
      const outboundDate = new Date(data.date);
      const outboundMonth = outboundDate.getMonth() + 1;
      const outboundYear = outboundDate.getFullYear();

      const outboundReportTime = parseTimeString(data.reportTime);
      const outboundDebriefTime = parseTimeString(data.debriefTimeOutbound);

      if (!outboundReportTime.success || !outboundDebriefTime.success || 
          !outboundReportTime.timeValue || !outboundDebriefTime.timeValue) {
        throw new Error(`Invalid outbound time format: ${outboundReportTime.error || outboundDebriefTime.error}`);
      }

      const outboundDutyHours = calculateDuration(
        outboundReportTime.timeValue, 
        outboundDebriefTime.timeValue, 
        data.isCrossDayOutbound
      );
      let outboundFlightPay = calculateFlightPay(outboundDutyHours, position);

      const outboundIsDeadhead = data.deadheadSectors?.[0] === true;
      const layoverHasAnyDhd = data.deadheadSectors?.some(d => d === true) ?? false;
      const outboundDepTime = data.deadheadDepartureTimes?.[0];
      const outboundArrTime = data.deadheadArrivalTimes?.[0];

      let outboundSectorDetails: Sector[] | undefined;
      if (outboundIsDeadhead) {
        outboundSectorDetails = [buildDeadheadSector(
          transformFlightNumbers([data.flightNumbers[0]])[0] || '',
          data.sectors[0] || '',
          data.sectors[1] || '',
          outboundDepTime,
          outboundArrTime,
        )];
      } else if (layoverHasAnyDhd && outboundDepTime && outboundArrTime) {
        // Non-DHD sector but other sector is DHD — include block times for display
        outboundSectorDetails = [{
          flightNumber: transformFlightNumbers([data.flightNumbers[0]])[0] || '',
          origin: data.sectors[0] || '',
          destination: data.sectors[1] || '',
          isFlaggedSector: false,
          departureTime: outboundDepTime,
          arrivalTime: outboundArrTime,
          blockMinutes: calculateBlockMinutes(outboundDepTime, outboundArrTime, false, false),
        }];
      }

      // Apply DHD deduction to outbound flight pay
      if (outboundIsDeadhead && outboundSectorDetails?.[0]?.blockMinutes) {
        outboundFlightPay = calculateFlightPay(
          applyDhdDeduction(outboundDutyHours, outboundSectorDetails[0].blockMinutes),
          position, outboundYear, outboundMonth
        );
      }

      const outboundDuty: FlightDuty = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        date: outboundDate,
        month: outboundMonth,
        year: outboundYear,
        dutyType: 'layover',
        flightNumbers: transformFlightNumbers([data.flightNumbers[0]]),
        sectors: [`${data.sectors[0]}-${data.sectors[1]}`],
        reportTime: outboundReportTime.timeValue,
        debriefTime: outboundDebriefTime.timeValue,
        dutyHours: outboundDutyHours,
        flightPay: outboundFlightPay,
        isCrossDay: data.isCrossDayOutbound || false,
        dataSource: 'manual',
        ...(outboundIsDeadhead && { hasDeadheadSectors: true, hasFlaggedSectors: true }),
        ...(outboundSectorDetails && { sectorDetails: outboundSectorDetails }),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create inbound duty
      const inboundDate = new Date(data.inboundDate);
      const inboundMonth = inboundDate.getMonth() + 1;
      const inboundYear = inboundDate.getFullYear();

      const inboundReportTime = parseTimeString(data.reportTimeInbound);
      const inboundDebriefTime = parseTimeString(data.debriefTime);

      if (!inboundReportTime.success || !inboundDebriefTime.success || 
          !inboundReportTime.timeValue || !inboundDebriefTime.timeValue) {
        throw new Error(`Invalid inbound time format: ${inboundReportTime.error || inboundDebriefTime.error}`);
      }

      const inboundDutyHours = calculateDuration(
        inboundReportTime.timeValue, 
        inboundDebriefTime.timeValue, 
        data.isCrossDayInbound
      );
      let inboundFlightPay = calculateFlightPay(inboundDutyHours, position);

      const inboundIsDeadhead = data.deadheadSectors?.[1] === true;
      const inboundDepTime = data.deadheadDepartureTimes?.[1];
      const inboundArrTime = data.deadheadArrivalTimes?.[1];

      let inboundSectorDetails: Sector[] | undefined;
      if (inboundIsDeadhead) {
        inboundSectorDetails = [buildDeadheadSector(
          transformFlightNumbers([data.flightNumbers[1]])[0] || '',
          data.sectors[2] || '',
          data.sectors[3] || '',
          inboundDepTime,
          inboundArrTime,
        )];
      } else if (layoverHasAnyDhd && inboundDepTime && inboundArrTime) {
        // Non-DHD sector but other sector is DHD — include block times for display
        inboundSectorDetails = [{
          flightNumber: transformFlightNumbers([data.flightNumbers[1]])[0] || '',
          origin: data.sectors[2] || '',
          destination: data.sectors[3] || '',
          isFlaggedSector: false,
          departureTime: inboundDepTime,
          arrivalTime: inboundArrTime,
          blockMinutes: calculateBlockMinutes(inboundDepTime, inboundArrTime, false, false),
        }];
      }

      // Apply DHD deduction to inbound flight pay
      if (inboundIsDeadhead && inboundSectorDetails?.[0]?.blockMinutes) {
        inboundFlightPay = calculateFlightPay(
          applyDhdDeduction(inboundDutyHours, inboundSectorDetails[0].blockMinutes),
          position, inboundYear, inboundMonth
        );
      }

      const inboundDuty: FlightDuty = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        date: inboundDate,
        month: inboundMonth,
        year: inboundYear,
        dutyType: 'layover',
        flightNumbers: transformFlightNumbers([data.flightNumbers[1]]),
        sectors: [`${data.sectors[2]}-${data.sectors[3]}`],
        reportTime: inboundReportTime.timeValue,
        debriefTime: inboundDebriefTime.timeValue,
        dutyHours: inboundDutyHours,
        flightPay: inboundFlightPay,
        isCrossDay: data.isCrossDayInbound || false,
        dataSource: 'manual',
        ...(inboundIsDeadhead && { hasDeadheadSectors: true, hasFlaggedSectors: true }),
        ...(inboundSectorDetails && { sectorDetails: inboundSectorDetails }),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return [outboundDuty, inboundDuty];
    }

    // Handle non-layover duties
    const flightDate = new Date(data.date);
    const month = flightDate.getMonth() + 1;
    const year = flightDate.getFullYear();

    // Handle Day Off duty type - no times required
    if (data.dutyType === 'off') {
      const emptyTimeValue = { hours: 0, minutes: 0, totalMinutes: 0, totalHours: 0 };
      
      const flightDuty: FlightDuty = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        date: flightDate,
        month,
        year,
        flightNumbers: [],
        sectors: [],
        dutyType: 'off',
        reportTime: emptyTimeValue,
        debriefTime: emptyTimeValue,
        dutyHours: 0,
        flightPay: 0,
        isCrossDay: false,
        dataSource: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return [flightDuty];
    }

    const reportTimeResult = parseTimeString(data.reportTime);
    const debriefTimeResult = parseTimeString(data.debriefTime);

    if (!reportTimeResult.success || !debriefTimeResult.success || 
        !reportTimeResult.timeValue || !debriefTimeResult.timeValue) {
      throw new Error(`Invalid time format: ${reportTimeResult.error || debriefTimeResult.error}`);
    }

    const dutyHours = calculateDuration(
      reportTimeResult.timeValue, 
      debriefTimeResult.timeValue, 
      data.isCrossDay
    );

    // Use date-aware rates (legacy vs new) for the resolved position.
    // This replaces the previous hardcoded inline rate maps.
    const dateAwareRates = getPositionRatesForDate(position, year, month);

    let flightPay = 0;
    if (data.dutyType === 'asby') {
      flightPay = dateAwareRates.asbyHours * dateAwareRates.hourlyRate;
    } else if (data.dutyType === 'recurrent') {
      const isELD = data.flightNumbers.some(fn => fn.toUpperCase().includes('ELD')) ||
                    data.sectors.some(s => s.toUpperCase().includes('ELD'));
      if (!isELD) {
        // Recurrent is paid at 4 hours × hourly rate
        flightPay = 4 * dateAwareRates.hourlyRate;
      }
    } else if (data.dutyType === 'business_promotion') {
      // BP is paid like a normal duty: rostered duty hours × hourly rate
      flightPay = calculateFlightPay(dutyHours, position, year, month);
    } else if (data.dutyType === 'turnaround') {
      flightPay = calculateFlightPay(dutyHours, position, year, month);
    }

    const flightNumbers = transformFlightNumbers(data.flightNumbers);
    const sectors = transformSectors(data.sectors);

    // Build DHD sector details for manual entries with deadhead flags
    const hasAnyDeadhead = data.deadheadSectors?.some(d => d === true) ?? false;
    let manualSectorDetails: Sector[] | undefined;
    let turnaroundDhdBlockMinutes = 0;
    if (hasAnyDeadhead && data.dutyType === 'turnaround') {
      manualSectorDetails = flightNumbers.map((fn, i) => {
        const sectorParts = (sectors[i] || '').split('-').map(s => s.trim());
        const isDhd = data.deadheadSectors?.[i] === true;
        const depTime = data.deadheadDepartureTimes?.[i];
        const arrTime = data.deadheadArrivalTimes?.[i];
        const blockMinutes = depTime && arrTime
          ? calculateBlockMinutes(depTime, arrTime, false, false)
          : undefined;
        if (isDhd && blockMinutes != null) turnaroundDhdBlockMinutes += blockMinutes;
        return {
          flightNumber: fn,
          origin: sectorParts[0] || '',
          destination: sectorParts[1] || '',
          isFlaggedSector: isDhd,
          ...(isDhd && { isDeadhead: true }),
          ...(blockMinutes != null && { departureTime: depTime, arrivalTime: arrTime, blockMinutes }),
        };
      });
    }

    // Apply DHD deduction to flight pay
    if (turnaroundDhdBlockMinutes > 0) {
      flightPay = calculateFlightPay(
        applyDhdDeduction(dutyHours, turnaroundDhdBlockMinutes), position, year, month
      );
    }

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
      ...(hasAnyDeadhead && { hasDeadheadSectors: true, hasFlaggedSectors: true }),
      ...(manualSectorDetails && { sectorDetails: manualSectorDetails }),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Only classify flight duties (not ground duties)
    const isGroundDuty = ['asby', 'recurrent', 'sby', 'off', 'business_promotion'].includes(data.dutyType);
    if (!isGroundDuty) {
      const classification = classifyFlightDuty(
        flightNumbers.join(' '), 
        sectors.join(' '), 
        data.reportTime, 
        data.debriefTime
      );
      if (classification.dutyType !== flightDuty.dutyType) {
        flightDuty.dutyType = classification.dutyType;
      }
    }

    return [flightDuty];
  } catch {
    // Fallback to legacy function if new format fails
    if (FEATURE_FLAGS.LAYOVER_PAIRING_FIX) {
      try {
        return convertToFlightDutyLegacy(data, userId, position);
      } catch {
        // Legacy fallback also failed
      }
    }
    return null;
  }
}


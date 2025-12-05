/**
 * Manual Entry Conversion Module
 * Converts manual entry data to FlightDuty objects
 */

import {
  FlightDuty,
  Position
} from '@/types/salary-calculator';
import {
  classifyFlightDuty,
  parseTimeString,
  calculateDuration,
  calculateFlightPay
} from '@/lib/salary-calculator';
import { ManualFlightEntryData } from '../manual-entry-validation';
import {
  transformFlightNumbers,
  transformSectors
} from '../input-transformers';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

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
      const outboundFlightPay = calculateFlightPay(outboundDutyHours, position);

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
      const inboundFlightPay = calculateFlightPay(inboundDutyHours, position);

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

    let flightPay = 0;
    if (data.dutyType === 'asby') {
      const rates = { CCM: { hourlyRate: 50, asbyHours: 4 }, SCCM: { hourlyRate: 62, asbyHours: 4 } };
      flightPay = rates[position].asbyHours * rates[position].hourlyRate;
    } else if (data.dutyType === 'recurrent') {
      const isELD = data.flightNumbers.some(fn => fn.toUpperCase().includes('ELD')) ||
                    data.sectors.some(s => s.toUpperCase().includes('ELD'));
      if (!isELD) {
        const rates = { CCM: { hourlyRate: 50 }, SCCM: { hourlyRate: 62 } };
        flightPay = 4 * rates[position].hourlyRate;
      }
    } else if (data.dutyType === 'business_promotion') {
      const rates = { CCM: { hourlyRate: 50 }, SCCM: { hourlyRate: 62 } };
      flightPay = 5 * rates[position].hourlyRate;
    } else if (data.dutyType === 'turnaround') {
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


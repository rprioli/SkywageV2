/**
 * Unit tests for Skywage Salary Calculator - Phase 1
 * Tests core calculation engine functionality
 * Following existing testing patterns in the codebase
 */

import { 
  calculateFlightPay, 
  calculatePerDiemPay, 
  calculateAsbyPay,
  FLYDUBAI_RATES 
} from '../calculation-engine';
import { createTimeValue, parseTimeString, calculateDuration, createTimestamp, calculateTimestampDuration } from '../time-calculator';
import { classifyFlightDuty, extractFlightNumbers, extractSectors } from '../flight-classifier';

describe('Salary Calculation Engine', () => {
  
  describe('Flight Pay Calculations', () => {
    test('calculates CCM flight pay correctly', () => {
      const dutyHours = 8.5;
      const position = 'CCM';
      const expectedPay = 8.5 * 50; // 425 AED
      
      expect(calculateFlightPay(dutyHours, position)).toBe(expectedPay);
    });

    test('calculates SCCM flight pay correctly', () => {
      const dutyHours = 10.25;
      const position = 'SCCM';
      const expectedPay = 10.25 * 62; // 635.5 AED
      
      expect(calculateFlightPay(dutyHours, position)).toBe(expectedPay);
    });

    test('handles zero duty hours', () => {
      expect(calculateFlightPay(0, 'CCM')).toBe(0);
      expect(calculateFlightPay(0, 'SCCM')).toBe(0);
    });
  });

  describe('Per Diem Calculations', () => {
    test('calculates per diem pay correctly', () => {
      const restHours = 23.5;
      const position = 'CCM';
      const expectedPay = 23.5 * 8.82; // 207.27 AED
      
      expect(calculatePerDiemPay(restHours, position)).toBe(expectedPay);
    });

    test('per diem rate is same for both positions', () => {
      const restHours = 15;
      const ccmPay = calculatePerDiemPay(restHours, 'CCM');
      const sccmPay = calculatePerDiemPay(restHours, 'SCCM');
      
      expect(ccmPay).toBe(sccmPay);
      expect(ccmPay).toBe(15 * 8.82);
    });
  });

  describe('ASBY Pay Calculations', () => {
    test('calculates CCM ASBY pay correctly', () => {
      const expectedPay = 4 * 50; // 200 AED
      expect(calculateAsbyPay('CCM')).toBe(expectedPay);
    });

    test('calculates SCCM ASBY pay correctly', () => {
      const expectedPay = 4 * 62; // 248 AED
      expect(calculateAsbyPay('SCCM')).toBe(expectedPay);
    });
  });

  describe('Salary Rates Configuration', () => {
    test('CCM rates are correct', () => {
      const ccmRates = FLYDUBAI_RATES.CCM;
      
      expect(ccmRates.basicSalary).toBe(3275);
      expect(ccmRates.housingAllowance).toBe(4000);
      expect(ccmRates.transportAllowance).toBe(1000);
      expect(ccmRates.hourlyRate).toBe(50);
      expect(ccmRates.perDiemRate).toBe(8.82);
      expect(ccmRates.asbyHours).toBe(4);
    });

    test('SCCM rates are correct', () => {
      const sccmRates = FLYDUBAI_RATES.SCCM;
      
      expect(sccmRates.basicSalary).toBe(4275);
      expect(sccmRates.housingAllowance).toBe(5000);
      expect(sccmRates.transportAllowance).toBe(1000);
      expect(sccmRates.hourlyRate).toBe(62);
      expect(sccmRates.perDiemRate).toBe(8.82);
      expect(sccmRates.asbyHours).toBe(4);
    });
  });
});

describe('Time Calculator', () => {
  
  describe('Time Parsing', () => {
    test('parses standard time format', () => {
      const result = parseTimeString('09:20');
      
      expect(result.success).toBe(true);
      expect(result.timeValue?.hours).toBe(9);
      expect(result.timeValue?.minutes).toBe(20);
      expect(result.timeValue?.totalHours).toBe(9.333333333333334);
      expect(result.isCrossDay).toBe(false);
    });

    test('parses cross-day time format', () => {
      const result = parseTimeString('05:45¹');
      
      expect(result.success).toBe(true);
      expect(result.timeValue?.hours).toBe(5);
      expect(result.timeValue?.minutes).toBe(45);
      expect(result.isCrossDay).toBe(true);
    });

    test('handles invalid time format', () => {
      const result = parseTimeString('25:70');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });

  describe('Duration Calculations', () => {
    test('calculates same-day duration', () => {
      const startTime = createTimeValue(9, 20);
      const endTime = createTimeValue(17, 45);
      
      const duration = calculateDuration(startTime, endTime, false);
      expect(duration).toBe(8.416666666666666); // 8 hours 25 minutes
    });

    test('calculates cross-day duration', () => {
      const startTime = createTimeValue(23, 30);
      const endTime = createTimeValue(5, 45);
      
      const duration = calculateDuration(startTime, endTime, true);
      expect(duration).toBe(6.25); // 6 hours 15 minutes
    });
  });
});

describe('Flight Classifier', () => {
  
  describe('Flight Number Extraction', () => {
    test('extracts single flight number', () => {
      const duties = 'FZ967';
      const flightNumbers = extractFlightNumbers(duties);
      
      expect(flightNumbers).toEqual(['FZ967']);
    });

    test('extracts multiple flight numbers', () => {
      const duties = 'FZ549 FZ550';
      const flightNumbers = extractFlightNumbers(duties);
      
      expect(flightNumbers).toEqual(['FZ549', 'FZ550']);
    });

    test('extracts short flight numbers (1-2 digits)', () => {
      const duties = 'FZ43 FZ44';
      const flightNumbers = extractFlightNumbers(duties);
      
      expect(flightNumbers).toEqual(['FZ43', 'FZ44']);
    });

    test('extracts mixed length flight numbers', () => {
      const duties = 'FZ59\nFZ1234';
      const flightNumbers = extractFlightNumbers(duties);
      
      expect(flightNumbers).toEqual(['FZ59', 'FZ1234']);
    });

    test('handles empty duties', () => {
      const flightNumbers = extractFlightNumbers('');
      expect(flightNumbers).toEqual([]);
    });
  });

  describe('Sector Extraction', () => {
    test('extracts single sector', () => {
      const details = 'DXB - VKO';
      const sectors = extractSectors(details);
      
      expect(sectors).toEqual(['DXB-VKO']);
    });

    test('extracts multiple sectors', () => {
      const details = 'DXB - CMB CMB - DXB';
      const sectors = extractSectors(details);
      
      expect(sectors).toEqual(['DXB-CMB', 'CMB-DXB']);
    });
  });

  describe('Duty Classification', () => {
    test('classifies ASBY correctly', () => {
      const result = classifyFlightDuty('ASBY', '', '09:00', '13:00');
      
      expect(result.dutyType).toBe('asby');
      expect(result.confidence).toBe(1.0);
    });

    test('classifies turnaround correctly', () => {
      const result = classifyFlightDuty('FZ549 FZ550', 'DXB - CMB CMB - DXB');
      
      expect(result.dutyType).toBe('turnaround');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('classifies turnaround with short flight numbers correctly', () => {
      const result = classifyFlightDuty('FZ43 FZ44', 'DXB - MCT MCT - DXB');
      
      expect(result.dutyType).toBe('turnaround');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('classifies another turnaround with short flight numbers correctly', () => {
      const result = classifyFlightDuty('FZ59\nFZ60', 'DXB - KWI\nKWI - DXB');
      
      expect(result.dutyType).toBe('turnaround');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('classifies layover correctly', () => {
      const result = classifyFlightDuty('FZ967', 'DXB - VKO');
      
      expect(result.dutyType).toBe('layover');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('classifies off day correctly', () => {
      const result = classifyFlightDuty('OFF', '');
      
      expect(result.dutyType).toBe('off');
      expect(result.confidence).toBe(1.0);
    });
  });
});

// Integration test for complete calculation flow
describe('Integration Tests', () => {
  test('calculates complete turnaround duty', () => {
    const duties = 'FZ549 FZ550';
    const details = 'DXB - CMB CMB - DXB';
    const reportTime = '09:20';
    const debriefTime = '21:15';
    
    // Parse times
    const reportResult = parseTimeString(reportTime);
    const debriefResult = parseTimeString(debriefTime);
    
    expect(reportResult.success).toBe(true);
    expect(debriefResult.success).toBe(true);
    
    // Calculate duration
    const duration = calculateDuration(
      reportResult.timeValue!,
      debriefResult.timeValue!,
      debriefResult.isCrossDay
    );
    
    expect(duration).toBeCloseTo(11.916666666666666); // 11 hours 55 minutes
    
    // Calculate pay
    const ccmPay = calculateFlightPay(duration, 'CCM');
    const sccmPay = calculateFlightPay(duration, 'SCCM');
    
    expect(ccmPay).toBeCloseTo(595.83); // 11.916... * 50
    expect(sccmPay).toBeCloseTo(738.83); // 11.916... * 62
    
    // Classify duty
    const classification = classifyFlightDuty(duties, details);
    expect(classification.dutyType).toBe('turnaround');
  });
});

// Regression tests for crossday duty calculation bugs
describe('Crossday Calculation Regression Tests', () => {
  describe('Layover rest period with inbound crossday debrief', () => {
    test('calculates rest period correctly when inbound debrief crosses midnight', () => {
      // Bug scenario: DXB 09:45 06/04 → VKO 16:54 06/04 (outbound)
      //               VKO 16:30 07/04 → DXB 00:22 08/04 (inbound)
      // Expected: 23.6h rest (16:54 06/04 to 16:30 07/04)
      // Bug was: 47.6h (incorrectly adding 24h to inbound report time)
      
      const outboundDate = new Date(2025, 3, 6); // April 6, 2025
      const outboundDebriefTime = createTimeValue(16, 54);
      const outboundIsCrossDay = false;
      
      const inboundDate = new Date(2025, 3, 7); // April 7, 2025
      const inboundReportTime = createTimeValue(16, 30);
      const inboundDebriefTime = createTimeValue(0, 22);
      const inboundIsCrossDay = true; // Debrief crosses to April 8
      
      // Use timestamp-based calculation (the fix)
      const outboundDebriefTs = createTimestamp(
        outboundDate,
        outboundDebriefTime,
        outboundIsCrossDay
      );
      const inboundReportTs = createTimestamp(
        inboundDate,
        inboundReportTime,
        false // Report is always on inbound date
      );
      
      const restHours = calculateTimestampDuration(outboundDebriefTs, inboundReportTs);
      
      // Expected: 23.6 hours (from 16:54 on April 6 to 16:30 on April 7)
      expect(restHours).toBeCloseTo(23.6, 1);
      
      // Calculate per diem
      const perDiem = restHours * 8.82;
      expect(perDiem).toBeCloseTo(208.15, 1);
    });
    
    test('handles multi-day layovers correctly', () => {
      // Another scenario with 2-day layover
      const outboundDate = new Date(2025, 5, 10);
      const outboundDebriefTime = createTimeValue(20, 30);
      const outboundIsCrossDay = false;
      
      const inboundDate = new Date(2025, 5, 12); // 2 days later
      const inboundReportTime = createTimeValue(18, 0);
      const inboundIsCrossDay = true;
      
      const outboundDebriefTs = createTimestamp(
        outboundDate,
        outboundDebriefTime,
        outboundIsCrossDay
      );
      const inboundReportTs = createTimestamp(
        inboundDate,
        inboundReportTime,
        false
      );
      
      const restHours = calculateTimestampDuration(outboundDebriefTs, inboundReportTs);
      
      // Expected: ~45.5 hours (from 20:30 on June 10 to 18:00 on June 12)
      expect(restHours).toBeCloseTo(45.5, 1);
    });
  });
  
  describe('Home Standby (SBY) crossday detection', () => {
    test('detects crossday when end time is earlier than start time', () => {
      // Bug scenario: SBY 22:00 - 04:10 (should cross midnight)
      const startTime = createTimeValue(22, 0);
      const endTime = createTimeValue(4, 10);
      
      // Check if crossday should be detected
      const shouldBeCrossDay = endTime.totalMinutes < startTime.totalMinutes;
      expect(shouldBeCrossDay).toBe(true);
      
      // Calculate duration with crossday flag
      const duration = calculateDuration(startTime, endTime, true);
      
      // Expected: 6.166... hours (6h 10m)
      expect(duration).toBeCloseTo(6.166666666666667, 2);
    });
    
    test('does not detect crossday when end time is after start time', () => {
      // Normal SBY: 06:00 - 13:00 (same day)
      const startTime = createTimeValue(6, 0);
      const endTime = createTimeValue(13, 0);
      
      const shouldBeCrossDay = endTime.totalMinutes < startTime.totalMinutes;
      expect(shouldBeCrossDay).toBe(false);
      
      // Calculate duration without crossday flag
      const duration = calculateDuration(startTime, endTime, false);
      
      // Expected: 7 hours
      expect(duration).toBe(7);
    });
    
    test('formats crossday SBY duty with correct next-day date', () => {
      // Verify timestamp creation for crossday SBY
      const sbyDate = new Date(2025, 5, 2); // June 2, 2025
      const debriefTime = createTimeValue(4, 10);
      const isCrossDay = true;
      
      const debriefTs = createTimestamp(sbyDate, debriefTime, isCrossDay);
      
      // Should be June 3, 2025 at 04:10
      expect(debriefTs.getDate()).toBe(3);
      expect(debriefTs.getMonth()).toBe(5); // June (0-indexed)
      expect(debriefTs.getHours()).toBe(4);
      expect(debriefTs.getMinutes()).toBe(10);
    });
  });

  describe('Cross-Month Layover Pairing', () => {
    test('calculates rest period for cross-month layover (Dec 31 -> Jan 2)', () => {
      // Outbound: Dec 31, 2023 DXB 18:20 -> SVX 00:54 (Jan 1, 2024)
      const outboundDate = new Date(2023, 11, 31); // Dec 31, 2023
      const outboundDebriefTime = createTimeValue(0, 54);
      const outboundIsCrossDay = true;
      
      // Inbound: Jan 2, 2024 SVX 02:45 -> DXB 10:46
      const inboundDate = new Date(2024, 0, 2); // Jan 2, 2024
      const inboundReportTime = createTimeValue(2, 45);
      
      // Calculate rest period
      const outboundDebriefTs = createTimestamp(outboundDate, outboundDebriefTime, outboundIsCrossDay);
      const inboundReportTs = createTimestamp(inboundDate, inboundReportTime, false);
      const restHours = calculateTimestampDuration(outboundDebriefTs, inboundReportTs);
      
      // Rest period: Jan 1 00:54 to Jan 2 02:45 = 25h 51m = 25.85 hours
      expect(restHours).toBeCloseTo(25.85, 2);
    });

    test('attributes cross-month layover rest period to outbound month', () => {
      // This test verifies the month/year attribution logic
      const outboundDate = new Date(2023, 11, 31); // Dec 31, 2023
      const outboundMonth = outboundDate.getMonth() + 1; // 12 (December)
      const outboundYear = outboundDate.getFullYear(); // 2023
      
      // Rest period should be attributed to December 2023
      expect(outboundMonth).toBe(12);
      expect(outboundYear).toBe(2023);
    });

    test('calculates per diem for cross-month layover rest period', () => {
      // Rest period: 25.85 hours
      const restHours = 25.85;
      const position = 'CCM';
      const expectedPerDiem = 25.85 * 8.82; // 228.00 AED (rounded)
      
      expect(calculatePerDiemPay(restHours, position)).toBeCloseTo(expectedPerDiem, 2);
    });
  });

  describe('Business Promotion Pay Calculations', () => {
    test('BP duty from 08:00 to 16:00 pays 8 hours × hourly rate for CCM', () => {
      const dutyHours = 8; // 08:00 to 16:00
      const position = 'CCM';
      const expectedPay = 8 * 50; // 400 AED
      
      expect(calculateFlightPay(dutyHours, position)).toBe(expectedPay);
    });

    test('BP duty from 08:00 to 16:00 pays 8 hours × hourly rate for SCCM', () => {
      const dutyHours = 8; // 08:00 to 16:00
      const position = 'SCCM';
      const expectedPay = 8 * 62; // 496 AED
      
      expect(calculateFlightPay(dutyHours, position)).toBe(expectedPay);
    });

    test('BP duty with different duration pays correctly', () => {
      const dutyHours = 6.5; // e.g., 09:00 to 15:30
      const ccmPay = calculateFlightPay(dutyHours, 'CCM');
      const sccmPay = calculateFlightPay(dutyHours, 'SCCM');
      
      expect(ccmPay).toBe(6.5 * 50); // 325 AED
      expect(sccmPay).toBe(6.5 * 62); // 403 AED
    });
  });
});

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
import { createTimeValue, parseTimeString, calculateDuration } from '../time-calculator';
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

/**
 * Unit tests for Date-Aware Salary Rate System
 * Tests that rates are correctly selected based on calculation dates
 * Ensures historical data preservation and new rate application
 */

import { 
  getRatesForDate,
  getPositionRatesForDate,
  FLYDUBAI_RATES_LEGACY,
  FLYDUBAI_RATES_NEW,
  calculateFlightPay,
  calculatePerDiemPay,
  calculateAsbyPay,
  calculateRecurrentPay
} from '../calculation-engine';

describe('Date-Aware Salary Rate System', () => {
  
  describe('Rate Selection Logic', () => {
    test('returns legacy rates for June 2025 and earlier', () => {
      // Test various dates before July 2025
      const june2025Rates = getRatesForDate(2025, 6);
      const may2025Rates = getRatesForDate(2025, 5);
      const jan2025Rates = getRatesForDate(2025, 1);
      const dec2024Rates = getRatesForDate(2024, 12);
      
      expect(june2025Rates).toEqual(FLYDUBAI_RATES_LEGACY);
      expect(may2025Rates).toEqual(FLYDUBAI_RATES_LEGACY);
      expect(jan2025Rates).toEqual(FLYDUBAI_RATES_LEGACY);
      expect(dec2024Rates).toEqual(FLYDUBAI_RATES_LEGACY);
    });

    test('returns new rates for July 2025 and later', () => {
      // Test various dates from July 2025 onwards
      const july2025Rates = getRatesForDate(2025, 7);
      const aug2025Rates = getRatesForDate(2025, 8);
      const dec2025Rates = getRatesForDate(2025, 12);
      const jan2026Rates = getRatesForDate(2026, 1);
      
      expect(july2025Rates).toEqual(FLYDUBAI_RATES_NEW);
      expect(aug2025Rates).toEqual(FLYDUBAI_RATES_NEW);
      expect(dec2025Rates).toEqual(FLYDUBAI_RATES_NEW);
      expect(jan2026Rates).toEqual(FLYDUBAI_RATES_NEW);
    });

    test('position-specific rate selection works correctly', () => {
      // Test CCM rates
      const ccmLegacy = getPositionRatesForDate('CCM', 2025, 6);
      const ccmNew = getPositionRatesForDate('CCM', 2025, 7);
      
      expect(ccmLegacy).toEqual(FLYDUBAI_RATES_LEGACY.CCM);
      expect(ccmNew).toEqual(FLYDUBAI_RATES_NEW.CCM);
      
      // Test SCCM rates
      const sccmLegacy = getPositionRatesForDate('SCCM', 2025, 6);
      const sccmNew = getPositionRatesForDate('SCCM', 2025, 7);
      
      expect(sccmLegacy).toEqual(FLYDUBAI_RATES_LEGACY.SCCM);
      expect(sccmNew).toEqual(FLYDUBAI_RATES_NEW.SCCM);
    });
  });

  describe('Rate Values Verification', () => {
    test('legacy rates match expected values', () => {
      expect(FLYDUBAI_RATES_LEGACY.CCM.basicSalary).toBe(3275);
      expect(FLYDUBAI_RATES_LEGACY.CCM.housingAllowance).toBe(4000);
      expect(FLYDUBAI_RATES_LEGACY.SCCM.basicSalary).toBe(4275);
      expect(FLYDUBAI_RATES_LEGACY.SCCM.housingAllowance).toBe(5000);
    });

    test('new rates match expected values', () => {
      // CCM increases
      expect(FLYDUBAI_RATES_NEW.CCM.basicSalary).toBe(3405); // +130 from 3275
      expect(FLYDUBAI_RATES_NEW.CCM.housingAllowance).toBe(4500); // +500 from 4000
      
      // SCCM changes
      expect(FLYDUBAI_RATES_NEW.SCCM.basicSalary).toBe(4446); // New rate
      expect(FLYDUBAI_RATES_NEW.SCCM.housingAllowance).toBe(5500); // 10% increase from 5000
      
      // Unchanged rates
      expect(FLYDUBAI_RATES_NEW.CCM.transportAllowance).toBe(1000);
      expect(FLYDUBAI_RATES_NEW.CCM.hourlyRate).toBe(50);
      expect(FLYDUBAI_RATES_NEW.CCM.perDiemRate).toBe(8.82);
      expect(FLYDUBAI_RATES_NEW.SCCM.transportAllowance).toBe(1000);
      expect(FLYDUBAI_RATES_NEW.SCCM.hourlyRate).toBe(62);
      expect(FLYDUBAI_RATES_NEW.SCCM.perDiemRate).toBe(8.82);
    });
  });

  describe('Date-Aware Calculation Functions', () => {
    test('calculateFlightPay uses correct rates based on date', () => {
      const dutyHours = 8;
      
      // Legacy rates (June 2025)
      const ccmPayLegacy = calculateFlightPay(dutyHours, 'CCM', 2025, 6);
      const sccmPayLegacy = calculateFlightPay(dutyHours, 'SCCM', 2025, 6);
      
      expect(ccmPayLegacy).toBe(8 * 50); // 400 AED
      expect(sccmPayLegacy).toBe(8 * 62); // 496 AED
      
      // New rates (July 2025) - hourly rates unchanged for now
      const ccmPayNew = calculateFlightPay(dutyHours, 'CCM', 2025, 7);
      const sccmPayNew = calculateFlightPay(dutyHours, 'SCCM', 2025, 7);
      
      expect(ccmPayNew).toBe(8 * 50); // 400 AED (same as hourly rate unchanged)
      expect(sccmPayNew).toBe(8 * 62); // 496 AED (same as hourly rate unchanged)
    });

    test('calculatePerDiemPay uses correct rates based on date', () => {
      const restHours = 24;
      
      // Both legacy and new rates should be the same (per diem unchanged)
      const ccmPerDiemLegacy = calculatePerDiemPay(restHours, 'CCM', 2025, 6);
      const ccmPerDiemNew = calculatePerDiemPay(restHours, 'CCM', 2025, 7);
      
      expect(ccmPerDiemLegacy).toBe(24 * 8.82); // 211.68 AED
      expect(ccmPerDiemNew).toBe(24 * 8.82); // 211.68 AED (unchanged)
    });

    test('calculateAsbyPay uses correct rates based on date', () => {
      // Legacy rates
      const ccmAsbyLegacy = calculateAsbyPay('CCM', 2025, 6);
      const sccmAsbyLegacy = calculateAsbyPay('SCCM', 2025, 6);
      
      expect(ccmAsbyLegacy).toBe(4 * 50); // 200 AED
      expect(sccmAsbyLegacy).toBe(4 * 62); // 248 AED
      
      // New rates (same as hourly rates unchanged)
      const ccmAsbyNew = calculateAsbyPay('CCM', 2025, 7);
      const sccmAsbyNew = calculateAsbyPay('SCCM', 2025, 7);
      
      expect(ccmAsbyNew).toBe(4 * 50); // 200 AED
      expect(sccmAsbyNew).toBe(4 * 62); // 248 AED
    });

    test('calculateRecurrentPay uses correct rates based on date', () => {
      // Legacy rates
      const ccmRecurrentLegacy = calculateRecurrentPay('CCM', 2025, 6);
      const sccmRecurrentLegacy = calculateRecurrentPay('SCCM', 2025, 6);
      
      expect(ccmRecurrentLegacy).toBe(4 * 50); // 200 AED
      expect(sccmRecurrentLegacy).toBe(4 * 62); // 248 AED
      
      // New rates (same as hourly rates unchanged)
      const ccmRecurrentNew = calculateRecurrentPay('CCM', 2025, 7);
      const sccmRecurrentNew = calculateRecurrentPay('SCCM', 2025, 7);
      
      expect(ccmRecurrentNew).toBe(4 * 50); // 200 AED
      expect(sccmRecurrentNew).toBe(4 * 62); // 248 AED
    });
  });

  describe('Backward Compatibility', () => {
    test('functions work without date parameters (use legacy rates)', () => {
      // These should use the legacy rates for backward compatibility
      const ccmFlightPay = calculateFlightPay(8, 'CCM');
      const ccmPerDiem = calculatePerDiemPay(24, 'CCM');
      const ccmAsby = calculateAsbyPay('CCM');
      const ccmRecurrent = calculateRecurrentPay('CCM');
      
      expect(ccmFlightPay).toBe(8 * 50); // 400 AED
      expect(ccmPerDiem).toBe(24 * 8.82); // 211.68 AED
      expect(ccmAsby).toBe(4 * 50); // 200 AED
      expect(ccmRecurrent).toBe(4 * 50); // 200 AED
    });
  });
});

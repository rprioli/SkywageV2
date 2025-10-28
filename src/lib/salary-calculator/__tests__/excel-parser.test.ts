/**
 * Unit tests for Excel Parser utilities
 * Tests basic Excel reading and parsing functionality
 * Following existing testing patterns in the codebase
 */

import {
  parseExcelTime,
  parseExcelDateRange,
  parseEmployeeInfo,
  validateExcelFile,
  createExcelError
} from '../excel-parser';
import { ExcelErrorType } from '@/types/excel-config';

describe('Excel Parser Utilities', () => {
  describe('parseExcelTime', () => {
    test('parses regular time correctly', () => {
      const result = parseExcelTime('07:35');
      
      expect(result.time).toBe('07:35');
      expect(result.isCrossDay).toBe(false);
      expect(result.originalValue).toBe('07:35');
    });
    
    test('parses cross-day time correctly', () => {
      const result = parseExcelTime('08:50⁺¹');
      
      expect(result.time).toBe('08:50');
      expect(result.isCrossDay).toBe(true);
      expect(result.originalValue).toBe('08:50⁺¹');
    });
    
    test('handles time with spaces', () => {
      const result = parseExcelTime('  19:05  ');
      
      expect(result.time).toBe('19:05');
      expect(result.isCrossDay).toBe(false);
    });
    
    test('throws error for invalid time format', () => {
      expect(() => parseExcelTime('25:00')).toThrow('Invalid time format');
      expect(() => parseExcelTime('12:60')).toThrow('Invalid time format');
      expect(() => parseExcelTime('invalid')).toThrow('Invalid time format');
    });
    
    test('throws error for empty input', () => {
      expect(() => parseExcelTime('')).toThrow('Invalid time string provided');
      expect(() => parseExcelTime(null as unknown as string)).toThrow('Invalid time string provided');
    });
  });
  
  describe('parseExcelDateRange', () => {
    test('parses date range correctly', () => {
      const result = parseExcelDateRange('01/07/2025 - 31/07/2025 (All times in Local Base)');
      
      expect(result.month).toBe(7);
      expect(result.year).toBe(2025);
      expect(result.startDate).toEqual(new Date(2025, 6, 1)); // Month is 0-based
      expect(result.endDate).toEqual(new Date(2025, 6, 31));
      expect(result.originalValue).toBe('01/07/2025 - 31/07/2025 (All times in Local Base)');
    });
    
    test('parses date range without extra text', () => {
      const result = parseExcelDateRange('01/06/2025 - 30/06/2025');
      
      expect(result.month).toBe(6);
      expect(result.year).toBe(2025);
    });
    
    test('throws error for invalid date range format', () => {
      expect(() => parseExcelDateRange('invalid format')).toThrow('Invalid date range format');
      expect(() => parseExcelDateRange('01/07/2025')).toThrow('Invalid date range format');
    });
    
    test('throws error for empty input', () => {
      expect(() => parseExcelDateRange('')).toThrow('Invalid date range string provided');
    });
  });
  
  describe('parseEmployeeInfo', () => {
    test('parses employee info correctly for CCM', () => {
      const result = parseEmployeeInfo('7818 TEIXEIRA RAFAEL DXB,CM,73H');
      
      expect(result.employeeId).toBe('7818');
      expect(result.name).toBe('RAFAEL TEIXEIRA');
      expect(result.base).toBe('DXB');
      expect(result.position).toBe('CCM');
      expect(result.aircraftType).toBe('73H');
      expect(result.rawInfo).toBe('7818 TEIXEIRA RAFAEL DXB,CM,73H');
    });
    
    test('parses employee info correctly for SCCM', () => {
      const result = parseEmployeeInfo('1234 SMITH JOHN DXB,SCM,737');
      
      expect(result.employeeId).toBe('1234');
      expect(result.name).toBe('JOHN SMITH');
      expect(result.position).toBe('SCCM');
    });
    
    test('throws error for invalid format', () => {
      expect(() => parseEmployeeInfo('invalid format')).toThrow('Invalid employee info format');
      expect(() => parseEmployeeInfo('7818 TEIXEIRA')).toThrow('Invalid employee info format');
    });
    
    test('throws error for unknown position code', () => {
      expect(() => parseEmployeeInfo('7818 TEIXEIRA RAFAEL DXB,UNKNOWN,73H')).toThrow('Unknown position code');
    });
    
    test('throws error for empty input', () => {
      expect(() => parseEmployeeInfo('')).toThrow('Invalid employee info string provided');
    });
  });
  
  describe('validateExcelFile', () => {
    test('validates correct Excel file', () => {
      const file = new File(['test'], 'roster.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const result = validateExcelFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.fileInfo?.format).toBe('xlsx');
    });
    
    test('validates XLSM file', () => {
      const file = new File(['test'], 'roster.xlsm', { type: 'application/vnd.ms-excel.sheet.macroEnabled.12' });
      const result = validateExcelFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.fileInfo?.format).toBe('xlsm');
    });
    
    test('rejects invalid file format', () => {
      const file = new File(['test'], 'roster.csv', { type: 'text/csv' });
      const result = validateExcelFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File must be one of: .xlsx, .xlsm');
    });
    
    test('rejects empty file', () => {
      const file = new File([], 'roster.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const result = validateExcelFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File is empty');
    });
    
    test('rejects oversized file', () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join(''); // 11MB
      const file = new File([largeContent], 'roster.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const result = validateExcelFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum allowed size');
    });
  });
  
  describe('createExcelError', () => {
    test('creates Excel error with all properties', () => {
      const originalError = new Error('Original error');
      const error = createExcelError(
        ExcelErrorType.CELL_REFERENCE_ERROR,
        'Cell reference error',
        'A1',
        10,
        originalError
      );
      
      expect(error.type).toBe(ExcelErrorType.CELL_REFERENCE_ERROR);
      expect(error.message).toBe('Cell reference error');
      expect(error.cellReference).toBe('A1');
      expect(error.rowNumber).toBe(10);
      expect(error.originalError).toBe(originalError);
    });
    
    test('creates Excel error with minimal properties', () => {
      const error = createExcelError(
        ExcelErrorType.VALIDATION_ERROR,
        'Validation failed'
      );
      
      expect(error.type).toBe(ExcelErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Validation failed');
      expect(error.cellReference).toBeUndefined();
      expect(error.rowNumber).toBeUndefined();
      expect(error.originalError).toBeUndefined();
    });
  });
});

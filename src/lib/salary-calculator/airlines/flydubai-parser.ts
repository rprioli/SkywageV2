/**
 * Flydubai-specific CSV parser for Skywage Salary Calculator
 * Implements Flydubai roster parsing rules and validation
 * Following existing parser patterns in the codebase
 */

import { CSVParser, ValidationResult } from '@/types/airline-config';
import { CSVParseResult } from '@/types/salary-calculator';
import { validateCompleteCSV } from '../csv-validator';
import { parseFlightDutiesFromCSV, extractMonthFromCSV, parseCSVContent } from '../csv-parser';
import { 
  FLYDUBAI_CSV_VALIDATION, 
  FLYDUBAI_TIME_FORMATS,
  isValidFlydubaiFlightNumber,
  isValidFlydubaiSector 
} from './flydubai-config';

export class FlydubaiCSVParser implements CSVParser {
  
  /**
   * Validates Flydubai CSV file format and content
   */
  async validateFile(content: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Parse CSV content
      const rows = parseCSVContent(content);
      
      if (rows.length < 5) {
        errors.push('Flydubai CSV must have at least 5 rows');
        return { valid: false, errors, warnings };
      }

      // Validate A1 cell contains "flydubai"
      const a1Cell = rows[0]?.[0]?.toLowerCase().trim();
      if (!a1Cell?.includes('flydubai')) {
        errors.push('A1 cell must contain "flydubai" to validate as Flydubai roster');
      }

      // Validate C2 cell exists for month extraction
      if (rows.length > 1) {
        const c2Cell = rows[1]?.[2];
        if (!c2Cell || c2Cell.trim() === '') {
          warnings.push('C2 cell is empty - month extraction may fail');
        }
      } else {
        errors.push('Missing C2 cell for month extraction');
      }

      // Check for data section
      let dataFound = false;
      for (let i = 4; i < Math.min(rows.length, 10); i++) {
        const row = rows[i];
        if (row.length >= 5 && row[0] && row[0].trim() !== '') {
          dataFound = true;
          break;
        }
      }

      if (!dataFound) {
        warnings.push('No data rows found in expected location (rows 5-10)');
      }

      // Validate some sample data rows
      const sampleRows = rows.slice(4, Math.min(rows.length, 14)); // Check first 10 data rows
      for (let i = 0; i < sampleRows.length; i++) {
        const row = sampleRows[i];
        const rowNum = i + 5; // Actual row number (1-based)

        if (row.length < 5) {
          warnings.push(`Row ${rowNum}: Expected 5 columns, found ${row.length}`);
          continue;
        }

        const [date, duties, details, reportTime, debriefTime] = row;

        // Skip empty rows
        if (!date && !duties && !details && !reportTime && !debriefTime) {
          continue;
        }

        // Validate date format
        if (date && date.trim() !== '') {
          if (!/^\d{1,2}[\/\-\.]\d{1,2}([\/\-\.]\d{2,4})?$/.test(date.trim())) {
            warnings.push(`Row ${rowNum}: Date format "${date}" may not be recognized`);
          }
        }

        // Validate flight numbers
        if (duties && duties.trim() !== '') {
          const flightNumbers = duties.match(/\b[A-Z]{2}\d{3,4}\b/g);
          if (flightNumbers) {
            for (const flightNumber of flightNumbers) {
              if (!isValidFlydubaiFlightNumber(flightNumber)) {
                warnings.push(`Row ${rowNum}: "${flightNumber}" is not a valid Flydubai flight number`);
              }
            }
          }
        }

        // Validate sectors
        if (details && details.trim() !== '') {
          const sectors = details.match(/\b[A-Z]{3}\s*-\s*[A-Z]{3}\b/g);
          if (sectors) {
            for (const sector of sectors) {
              if (!isValidFlydubaiSector(sector)) {
                warnings.push(`Row ${rowNum}: "${sector}" is not a valid sector format`);
              }
            }
          }
        }

        // Validate time formats
        if (reportTime && reportTime.trim() !== '') {
          if (!FLYDUBAI_TIME_FORMATS.standard.test(reportTime.trim()) && 
              !FLYDUBAI_TIME_FORMATS.crossDay.test(reportTime.trim())) {
            warnings.push(`Row ${rowNum}: Report time "${reportTime}" format not recognized`);
          }
        }

        if (debriefTime && debriefTime.trim() !== '') {
          if (!FLYDUBAI_TIME_FORMATS.standard.test(debriefTime.trim()) && 
              !FLYDUBAI_TIME_FORMATS.crossDay.test(debriefTime.trim())) {
            warnings.push(`Row ${rowNum}: Debrief time "${debriefTime}" format not recognized`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      errors.push(`Validation error: ${(error as Error).message}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Extracts month and year from Flydubai CSV
   */
  extractMonth(content: string): { month: number; year: number } | null {
    try {
      return extractMonthFromCSV(content);
    } catch (error) {
      console.error('Error extracting month from Flydubai CSV:', error);
      return null;
    }
  }

  /**
   * Parses Flydubai CSV into flight duties
   */
  parseFlightDuties(content: string, userId: string): CSVParseResult {
    try {
      // Use the generic parser with Flydubai-specific validation
      const result = parseFlightDutiesFromCSV(content, userId);
      
      // Add Flydubai-specific post-processing
      if (result.success && result.data) {
        result.data = this.postProcessFlydubaiData(result.data);
      }

      return result;

    } catch (error) {
      return {
        success: false,
        errors: [`Flydubai parsing error: ${(error as Error).message}`],
        warnings: [],
        totalRows: 0,
        processedRows: 0
      };
    }
  }

  /**
   * Post-processes parsed data with Flydubai-specific rules
   */
  private postProcessFlydubaiData(flightDuties: any[]): any[] {
    return flightDuties.map(duty => {
      // Apply Flydubai-specific business rules
      
      // Validate duty hours against Flydubai limits
      if (duty.dutyHours > 14) {
        duty.warnings = duty.warnings || [];
        duty.warnings.push(`Duty hours (${duty.dutyHours.toFixed(2)}) exceed Flydubai maximum (14 hours)`);
      }

      // Validate flight numbers are Flydubai flights
      if (duty.flightNumbers) {
        for (const flightNumber of duty.flightNumbers) {
          if (!isValidFlydubaiFlightNumber(flightNumber)) {
            duty.warnings = duty.warnings || [];
            duty.warnings.push(`Flight number ${flightNumber} is not a valid Flydubai flight`);
          }
        }
      }

      // Validate sectors for Flydubai routes
      if (duty.sectors) {
        for (const sector of duty.sectors) {
          if (!isValidFlydubaiSector(sector)) {
            duty.warnings = duty.warnings || [];
            duty.warnings.push(`Sector ${sector} format not recognized`);
          }
        }
      }

      return duty;
    });
  }

  /**
   * Validates specific Flydubai CSV structure
   */
  private validateFlydubaiStructure(rows: string[][]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum rows
    if (rows.length < 5) {
      errors.push('Flydubai CSV must have at least 5 rows (header + data)');
    }

    // Validate header structure
    if (rows.length > 0) {
      const headerRow = rows[0];
      if (headerRow.length < 5) {
        warnings.push(`Header row has ${headerRow.length} columns, expected at least 5`);
      }
    }

    // Check for month information in C2
    if (rows.length > 1) {
      const secondRow = rows[1];
      if (secondRow.length < 3 || !secondRow[2] || secondRow[2].trim() === '') {
        warnings.push('C2 cell (month information) is missing or empty');
      }
    }

    // Validate data section starts around row 5
    if (rows.length > 4) {
      const dataStartRow = rows[4];
      if (dataStartRow.length < 5) {
        warnings.push('Data section (row 5) does not have expected 5 columns');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Cleans Flydubai-specific time format
   */
  private cleanFlydubaiTime(timeStr: string): string {
    if (!timeStr) return timeStr;
    
    // Remove Flydubai-specific special characters
    let cleaned = timeStr;
    for (const char of FLYDUBAI_TIME_FORMATS.specialCharacters) {
      cleaned = cleaned.replace(new RegExp(char, 'g'), '');
    }
    
    return cleaned.trim();
  }

  /**
   * Validates Flydubai flight number format
   */
  private validateFlydubaiFlightNumber(flightNumber: string): boolean {
    return isValidFlydubaiFlightNumber(flightNumber);
  }

  /**
   * Validates Flydubai sector format
   */
  private validateFlydubaiSector(sector: string): boolean {
    return isValidFlydubaiSector(sector);
  }
}

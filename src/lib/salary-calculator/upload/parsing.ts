/**
 * Upload Parsing Module
 * File content parsing for CSV and Excel files
 */

import { FlightDuty } from '@/types/salary-calculator';
import {
  FlydubaiCSVParser,
  parseFlydubaiExcelFile
} from '@/lib/salary-calculator';
import { UnifiedParseResult, FileType } from './types';
import { detectFileType, readFileContent } from './validation';

/**
 * Unified file parsing for both CSV and Excel files
 */
export async function parseFileContent(
  file: File,
  userId: string,
  targetMonth?: number,
  targetYear?: number
): Promise<UnifiedParseResult> {
  const fileType: FileType = detectFileType(file);

  try {
    if (fileType === 'excel') {
      // Parse Excel file
      const excelResult = await parseFlydubaiExcelFile(file, targetMonth, targetYear);

      return {
        success: excelResult.success,
        data: excelResult.data as FlightDuty[] | undefined,
        errors: excelResult.errors,
        warnings: excelResult.warnings,
        totalRows: excelResult.totalRows,
        processedRows: excelResult.processedRows,
        month: excelResult.month,
        year: excelResult.year
      };
    } else {
      // Parse CSV file with target month/year for boundary filtering
      const content = await readFileContent(file);
      const parser = new FlydubaiCSVParser();
      const csvResult = parser.parseFlightDuties(content, userId, targetMonth, targetYear);

      // Extract month/year from CSV content for fallback
      const monthExtraction = parser.extractMonth(content);

      return {
        success: csvResult.success,
        data: csvResult.data,
        errors: csvResult.errors,
        warnings: csvResult.warnings,
        totalRows: csvResult.totalRows,
        processedRows: csvResult.processedRows,
        month: csvResult.month || monthExtraction?.month,
        year: csvResult.year || monthExtraction?.year
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    return {
      success: false,
      errors: [errorMessage],
      warnings: []
    };
  }
}


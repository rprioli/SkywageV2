/**
 * Flydubai Excel Parser
 * Parses Flydubai Excel roster files into FlightDuty objects
 * Based on real-world analysis of Jul25ScheduleReport.xlsx
 * Optimized for small files (<25KB typical size)
 */

import * as XLSX from 'xlsx';
import {
  ExcelParsingConfig,
  ExcelParseResult,
  ExcelFlightDuty,
  ExcelEmployeeInfo,
  ExcelParsingContext,
  DEFAULT_EXCEL_CONFIG,
  ExcelErrorType,
  ExcelError
} from '@/types/excel-config';
import {
  FlightDuty,
  DutyType,
  Position,
  DataSource
} from '@/types/salary-calculator';
import {
  readExcelFile,
  getFirstWorksheet,
  getCellValue,
  validateExcelFile,
  validateExcelContent,
  parseExcelTime,
  parseTrainingTimeRange,
  parseExcelDateRange,
  parseEmployeeInfo,
  createExcelError,
  hasWorksheetData,
  detectExcelStructureFlexible,
  FlexibleExcelStructure
} from './excel-parser';
import { classifyFlightDuty } from './flight-classifier';
import { createTimeValue, parseTimeStringWithCrossDay } from './time-calculator';

/**
 * Main Flydubai Excel Parser Class
 */
export class FlydubaiExcelParser {
  private config: ExcelParsingConfig;
  private context: ExcelParsingContext | null = null;
  private flexibleStructure: FlexibleExcelStructure | null = null;

  constructor(config: ExcelParsingConfig = DEFAULT_EXCEL_CONFIG) {
    this.config = config;
  }

  /**
   * Parse Excel file and return flight duties
   */
  async parseExcelFile(
    file: File,
    targetMonth?: number,
    targetYear?: number
  ): Promise<ExcelParseResult> {
    try {
      // Step 1: Validate file
      const fileValidation = validateExcelFile(file, this.config);
      if (!fileValidation.valid) {
        return {
          success: false,
          data: [],
          errors: fileValidation.errors,
          warnings: fileValidation.warnings,
          totalRows: 0,
          processedRows: 0
        };
      }

      // Step 2: Read Excel file
      const workbook = await readExcelFile(file);
      const worksheet = getFirstWorksheet(workbook);

      // Step 3: Validate content structure
      const contentValidation = validateExcelContent(worksheet, this.config);
      if (!contentValidation.valid) {
        return {
          success: false,
          data: [],
          errors: contentValidation.errors,
          warnings: contentValidation.warnings,
          totalRows: 0,
          processedRows: 0
        };
      }

      // Step 4: Check if worksheet has data
      if (!hasWorksheetData(worksheet)) {
        return {
          success: false,
          data: [],
          errors: ['Excel file appears to be empty or corrupted'],
          warnings: [],
          totalRows: 0,
          processedRows: 0
        };
      }

      // Step 5: Detect flexible Excel structure
      this.flexibleStructure = detectExcelStructureFlexible(worksheet);

      if (!this.flexibleStructure) {
        // Fall back to hardcoded structure if flexible detection fails
        console.warn('Flexible structure detection failed, using hardcoded configuration');
        this.flexibleStructure = null;
      } else {
        console.log('Flexible structure detected:', this.flexibleStructure);
      }

      // Step 6: Initialize parsing context
      const dataStartRow = this.flexibleStructure?.dataStartRow || this.config.dataStartRow;
      this.context = {
        worksheet,
        config: this.config,
        currentRow: dataStartRow,
        totalRows: 0,
        errors: [...contentValidation.errors],
        warnings: [...contentValidation.warnings]
      };

      // Step 7: Extract metadata
      const { month, year, employeeInfo } = this.extractMetadata();

      // Use target month/year if provided, otherwise use extracted values
      const finalMonth = targetMonth || month;
      const finalYear = targetYear || year;

      // Step 8: Parse flight duties
      const excelFlightDuties = this.parseFlightDuties();

      // Step 8: Convert to FlightDuty objects
      const flightDuties = this.convertToFlightDuties(
        excelFlightDuties,
        finalMonth,
        finalYear,
        employeeInfo?.position
      );

      return {
        success: this.context.errors.length === 0,
        data: flightDuties,
        errors: this.context.errors,
        warnings: this.context.warnings,
        month: finalMonth,
        year: finalYear,
        totalRows: this.context.totalRows,
        processedRows: excelFlightDuties.length,
        employeeInfo
      };

    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [`Failed to parse Excel file: ${(error as Error).message}`],
        warnings: [],
        totalRows: 0,
        processedRows: 0
      };
    }
  }

  /**
   * Extract metadata from Excel file using flexible structure detection
   */
  private extractMetadata(): {
    month: number;
    year: number;
    employeeInfo?: ExcelEmployeeInfo;
  } {
    if (!this.context) {
      throw new Error('Parser context not initialized');
    }

    let month = new Date().getMonth() + 1;
    let year = new Date().getFullYear();
    let employeeInfo: ExcelEmployeeInfo | undefined;

    try {
      // Try flexible date range extraction first
      if (this.flexibleStructure?.dateRangeLocation) {
        const dateRange = parseExcelDateRange(this.flexibleStructure.dateRangeLocation.value);
        month = dateRange.month;
        year = dateRange.year;
      } else {
        // Fall back to hardcoded location
        const dateRangeCell = getCellValue(this.context.worksheet, this.config.dateRangeCell);
        if (dateRangeCell.value) {
          const dateRange = parseExcelDateRange(dateRangeCell.value.toString());
          month = dateRange.month;
          year = dateRange.year;
        }
      }
    } catch (error) {
      this.context.warnings.push(`Could not parse date range: ${(error as Error).message}`);
    }

    try {
      // Try flexible employee info extraction first
      if (this.flexibleStructure?.employeeInfoLocation) {
        employeeInfo = parseEmployeeInfo(this.flexibleStructure.employeeInfoLocation.value);
      } else {
        // Fall back to hardcoded location
        const employeeCell = getCellValue(this.context.worksheet, this.config.employeeInfoCell);
        if (employeeCell.value) {
          employeeInfo = parseEmployeeInfo(employeeCell.value.toString());
        }
      }
    } catch (error) {
      this.context.warnings.push(`Could not parse employee info: ${(error as Error).message}`);
    }

    return { month, year, employeeInfo };
  }

  /**
   * Parse flight duties from Excel rows using flexible structure
   */
  private parseFlightDuties(): ExcelFlightDuty[] {
    if (!this.context) {
      throw new Error('Parser context not initialized');
    }

    const flightDuties: ExcelFlightDuty[] = [];
    const dataStartRow = this.flexibleStructure?.dataStartRow || this.config.dataStartRow;
    let currentRow = dataStartRow;
    let emptyRowCount = 0;
    const maxEmptyRows = 5; // Stop after 5 consecutive empty rows

    while (emptyRowCount < maxEmptyRows) {
      try {
        const rowData = this.parseRow(currentRow);
        
        if (rowData) {
          flightDuties.push(rowData);
          emptyRowCount = 0; // Reset empty row counter
        } else {
          emptyRowCount++;
        }
        
        currentRow++;
        this.context.totalRows = currentRow - this.config.dataStartRow;
        
      } catch (error) {
        this.context.errors.push(
          `Error parsing row ${currentRow}: ${(error as Error).message}`
        );
        currentRow++;
        emptyRowCount++;
      }
    }

    return flightDuties;
  }

  /**
   * Parse a single row of data using flexible column mapping
   */
  private parseRow(rowNumber: number): ExcelFlightDuty | null {
    if (!this.context) {
      throw new Error('Parser context not initialized');
    }

    // Use flexible column mapping if available, otherwise fall back to hardcoded positions
    const columnMapping = this.flexibleStructure?.columnMapping;

    const dateColumn = columnMapping?.date || 'A';
    const dutiesColumn = columnMapping?.duties || 'C';
    const detailsColumn = columnMapping?.details || 'F';
    const reportTimeColumn = columnMapping?.reportTime || 'L';
    const debriefTimeColumn = columnMapping?.debriefTime || 'Q';
    const actualTimesColumn = columnMapping?.actualTimes || 'M';
    const indicatorsColumn = columnMapping?.indicators || 'U';

    console.log(`📊 Column mapping for row ${rowNumber}: actualTimes=${actualTimesColumn}, duties=${dutiesColumn}`);



    // Read row data using dynamic column positions
    const dateCell = getCellValue(this.context.worksheet, `${dateColumn}${rowNumber}`);
    const dutiesCell = getCellValue(this.context.worksheet, `${dutiesColumn}${rowNumber}`);
    const detailsCell = getCellValue(this.context.worksheet, `${detailsColumn}${rowNumber}`);
    const reportTimeCell = getCellValue(this.context.worksheet, `${reportTimeColumn}${rowNumber}`);
    const debriefTimeCell = getCellValue(this.context.worksheet, `${debriefTimeColumn}${rowNumber}`);
    const actualTimesCell = getCellValue(this.context.worksheet, `${actualTimesColumn}${rowNumber}`);
    const indicatorsCell = getCellValue(this.context.worksheet, `${indicatorsColumn}${rowNumber}`);

    // Skip empty rows
    if (!dateCell.value && !dutiesCell.value) {
      return null;
    }

    // Skip rows without date
    if (!dateCell.value) {
      return null;
    }

    const dateStr = dateCell.value ? String(dateCell.value) : '';
    const dutiesStr = dutiesCell.value ? String(dutiesCell.value) : '';
    const detailsStr = detailsCell.value ? String(detailsCell.value) : '';
    const reportTimeStr = reportTimeCell.value ? String(reportTimeCell.value) : '';
    const debriefTimeStr = debriefTimeCell.value ? String(debriefTimeCell.value) : '';

    // Debug actual times extraction for recurrent training
    if (dutiesStr.includes('ELD') || dutiesStr.includes('SEPR') || dutiesStr.includes('GS') || dutiesStr.includes('IFX') || dutiesStr.includes('CSR')) {
      console.log(`🎓 TRAINING ROW ${rowNumber}: duties="${dutiesStr}", actualTimes="${actualTimesCell.value?.toString()}"`);
    }

    // Skip non-duty rows (headers, empty, etc.)
    if (this.shouldSkipRow(dateStr, dutiesStr)) {
      return null;
    }

    // Parse flight numbers and sectors from multi-line cells
    const flightNumbers = this.parseMultiLineCell(dutiesStr);
    const sectors = this.parseMultiLineCell(detailsStr);

    // Determine duty type
    const dutyType = this.determineDutyType(dutiesStr, detailsStr, flightNumbers);

    // Enhanced cross-day detection using both explicit indicators and logical detection
    let isCrossDay = false;
    if (reportTimeStr && debriefTimeStr) {
      const timeParseResult = parseTimeStringWithCrossDay(reportTimeStr, debriefTimeStr);
      isCrossDay = timeParseResult.isCrossDay;
      console.log(`Excel Debug - Cross-day detection for row ${rowNumber}: Report "${reportTimeStr}", Debrief "${debriefTimeStr}" → ${isCrossDay ? 'NEXT DAY' : 'SAME DAY'}`);
    } else {
      // Fallback to explicit symbol detection if times are missing
      isCrossDay = String(debriefTimeStr || '').includes('⁺¹');
    }

    return {
      rowNumber,
      date: dateStr,
      duties: dutiesStr,
      details: detailsStr,
      reportTime: reportTimeStr,
      debriefTime: debriefTimeStr,
      actualTimes: actualTimesCell.value?.toString(),
      indicators: indicatorsCell.value?.toString(),
      dutyType,
      flightNumbers,
      sectors,
      isCrossDay,
      originalData: {
        row: [dateCell, dutiesCell, detailsCell, reportTimeCell, debriefTimeCell],
        cellReferences: {
          date: `${dateColumn}${rowNumber}`,
          duties: `${dutiesColumn}${rowNumber}`,
          details: `${detailsColumn}${rowNumber}`,
          reportTime: `${reportTimeColumn}${rowNumber}`,
          debriefTime: `${debriefTimeColumn}${rowNumber}`
        }
      }
    };
  }

  /**
   * Check if row should be skipped
   */
  private shouldSkipRow(dateStr: string, dutiesStr: string): boolean {
    // Ensure we have safe strings
    const safeDateStr = dateStr ? String(dateStr) : '';
    const safeDutiesStr = dutiesStr ? String(dutiesStr) : '';

    // Skip header rows
    if (safeDateStr.toLowerCase().includes('date') || safeDateStr.toLowerCase().includes('schedule')) {
      return true;
    }

    // Skip rows without proper date format
    if (!safeDateStr.match(/\d{2}\/\d{2}\/\d{4}/)) {
      return true;
    }

    // Skip if duties is empty
    if (!safeDutiesStr.trim()) {
      return true;
    }

    return false;
  }

  /**
   * Parse multi-line cell content (flight numbers or sectors)
   */
  private parseMultiLineCell(cellContent: string): string[] {
    if (!cellContent) return [];

    // Ensure we have a string
    const safeContent = String(cellContent);

    return safeContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  /**
   * Determine duty type from cell content
   */
  private determineDutyType(dutiesStr: string, detailsStr: string, flightNumbers: string[]): DutyType {
    // Ensure dutiesStr is a string and handle null/undefined
    const safeString = dutiesStr ? String(dutiesStr) : '';
    const dutiesUpper = safeString.toUpperCase();
    const detailsUpper = detailsStr ? String(detailsStr).toUpperCase() : '';

    console.log(`🔍 determineDutyType: duties="${dutiesStr}", details="${detailsStr}"`);

    // Check for specific duty codes
    if (dutiesUpper.includes('XSBY')) return 'asby';
    if (dutiesUpper.includes('SBY')) return 'sby';
    if (dutiesUpper.includes('OFF')) return 'off';

    // Enhanced recurrent training detection
    if (dutiesUpper.includes('RECURRENT') || dutiesUpper.includes('TRAINING') ||
        detailsUpper.includes('RECURRENT') || detailsUpper.includes('TRAINING') ||
        dutiesUpper.includes('IFX') || dutiesUpper.includes('CSR') ||
        dutiesUpper.includes('RTC') || dutiesUpper.includes('ELD') ||
        dutiesUpper.includes('SEPR') || dutiesUpper.includes('GS')) {
      console.log(`✅ Classified as recurrent training`);
      return 'recurrent';
    }

    // If we have flight numbers, determine if turnaround or layover
    if (flightNumbers.length > 0) {
      // For now, assume turnaround (layover detection would need more complex logic)
      return 'turnaround';
    }

    return 'off'; // Default fallback
  }

  /**
   * Convert Excel flight duties to FlightDuty objects
   * Includes month boundary filtering to prevent duplicate duties from overlapping months
   */
  private convertToFlightDuties(
    excelDuties: ExcelFlightDuty[],
    month: number,
    year: number,
    position?: Position
  ): FlightDuty[] {
    const flightDuties: FlightDuty[] = [];

    for (const excelDuty of excelDuties) {
      try {
        const flightDuty = this.convertSingleDuty(excelDuty, month, year, position);
        if (flightDuty) {
          flightDuties.push(flightDuty);
        }
      } catch (error) {
        if (this.context) {
          this.context.errors.push(
            `Error converting row ${excelDuty.rowNumber}: ${(error as Error).message}`
          );
        }
      }
    }

    // Apply month boundary filtering to prevent duplicate duties from overlapping months
    const filteredDuties = flightDuties.filter(duty => {
      const dutyMonth = duty.date.getUTCMonth() + 1; // Convert to 1-based month
      const dutyYear = duty.date.getUTCFullYear();

      const belongsToTargetMonth = dutyMonth === month && dutyYear === year;

      if (!belongsToTargetMonth && this.context) {
        this.context.warnings.push(
          `Filtered out duty from ${duty.date.toISOString().split('T')[0]} (belongs to ${dutyMonth}/${dutyYear}, target: ${month}/${year})`
        );
      }

      return belongsToTargetMonth;
    });

    if (this.context && filteredDuties.length !== flightDuties.length) {
      this.context.warnings.push(
        `Month boundary filtering: ${flightDuties.length - filteredDuties.length} duties filtered out (${filteredDuties.length} remaining)`
      );
    }

    return filteredDuties;
  }

  /**
   * Convert single Excel duty to FlightDuty object
   */
  private convertSingleDuty(
    excelDuty: ExcelFlightDuty,
    month: number,
    year: number,
    position?: Position
  ): FlightDuty | null {
    // Check for rest days and off days that should be filtered out
    const dutiesUpper = String(excelDuty.duties || '').toUpperCase().trim();
    const detailsUpper = String(excelDuty.details || '').toUpperCase().trim();

    // Skip rest days, off days, and other non-duty entries
    const isRestDay = dutiesUpper.includes('REST DAY') ||
                      detailsUpper.includes('REST DAY') ||
                      dutiesUpper.includes('DAY OFF') ||
                      detailsUpper.includes('DAY OFF') ||
                      dutiesUpper.includes('ADDITIONAL DAY OFF') ||
                      detailsUpper.includes('ADDITIONAL DAY OFF') ||
                      dutiesUpper === 'OFF' ||
                      dutiesUpper === '*OFF' ||
                      dutiesUpper === 'X';

    if (isRestDay) {
      return null;
    }

    // Skip other non-flight duties (OFF, SBY without times)
    if (excelDuty.dutyType === 'off' ||
        (excelDuty.dutyType === 'sby' && !excelDuty.reportTime)) {
      return null;
    }

    // Parse date
    const date = this.parseExcelDate(excelDuty.date, month, year);

    // Parse times - handle recurrent training differently
    let reportTime = createTimeValue(0, 0);
    let debriefTime = createTimeValue(0, 0);
    let actualDutyHours = 0;

    if (excelDuty.dutyType === 'recurrent') {
      // For recurrent training, parse time ranges from actualTimes column
      const actualTimesStr = excelDuty.actualTimes || '';
      console.log(`🕐 RECURRENT TRAINING TIME DEBUG: Row ${excelDuty.rowNumber}`);
      console.log(`🕐 actualTimesStr = "${actualTimesStr}"`);
      console.log(`🕐 actualTimesStr type = ${typeof actualTimesStr}`);
      console.log(`🕐 actualTimesStr length = ${actualTimesStr.length}`);

      if (actualTimesStr && actualTimesStr.trim().length > 0) {
        try {
          const trainingTime = parseTrainingTimeRange(actualTimesStr);
          console.log(`✅ Parsed training time successfully:`, trainingTime);

          // Set report time to start time and debrief time to end time
          const [startHour, startMin] = trainingTime.startTime.split(':').map(Number);
          const [endHour, endMin] = trainingTime.endTime.split(':').map(Number);

          reportTime = createTimeValue(startHour, startMin);
          debriefTime = createTimeValue(endHour, endMin);
          actualDutyHours = trainingTime.totalHours;

          console.log(`✅ Set times: report ${startHour}:${startMin}, debrief ${endHour}:${endMin}, hours ${actualDutyHours}`);
        } catch (error) {
          console.error(`❌ Failed to parse training time range for row ${excelDuty.rowNumber}:`, error);
          console.error(`❌ Raw actualTimes data: "${actualTimesStr}"`);
          // Fallback to default times
          reportTime = createTimeValue(8, 0);  // Default 08:00
          debriefTime = createTimeValue(16, 0); // Default 16:00
          actualDutyHours = 8; // Default 8 hours
          console.log(`⚠️ Using fallback times: 08:00 - 16:00, 8 hours`);
        }
      } else {
        console.warn(`⚠️ No actualTimes provided for recurrent training row ${excelDuty.rowNumber}, using defaults`);
        // Default training times if no actual times provided
        reportTime = createTimeValue(8, 0);
        debriefTime = createTimeValue(16, 0);
        actualDutyHours = 8;
        console.log(`⚠️ Using default times: 08:00 - 16:00, 8 hours`);
      }
    } else {
      // Regular flight duties - use report/debrief time columns
      reportTime = excelDuty.reportTime ?
        this.parseTimeValue(excelDuty.reportTime) : createTimeValue(0, 0);
      debriefTime = excelDuty.debriefTime ?
        this.parseTimeValue(excelDuty.debriefTime) : createTimeValue(0, 0);
    }

    // Generate unique ID
    const id = this.generateFlightId(excelDuty, date);

    // Create FlightDuty object
    const flightDuty: FlightDuty = {
      id,
      date,
      dutyType: excelDuty.dutyType,
      flightNumbers: excelDuty.flightNumbers,
      sectors: excelDuty.sectors,
      reportTime,
      debriefTime,
      dutyHours: actualDutyHours, // Use calculated hours for recurrent training
      flightPay: 0, // Will be calculated
      isCrossDay: excelDuty.isCrossDay, // Use detected cross-day value
      dataSource: 'csv' as DataSource,
      originalData: {
        rawData: excelDuty.originalData.row,
        source: 'csv',
        fileName: 'excel-upload',
        rowNumber: excelDuty.rowNumber,
        processingNotes: []
      },
      auditTrail: [{
        action: 'created',
        timestamp: new Date(),
        source: 'excel-upload',
        details: `Imported from Excel row ${excelDuty.rowNumber}`,
        userId: 'system'
      }]
    };

    // Use flight classifier to finalize duty classification and calculations
    // Pass original string values from Excel cells, not parsed arrays/objects
    const dutiesStr = excelDuty.duties || '';
    const detailsStr = excelDuty.details || '';
    const reportTimeStr = excelDuty.reportTime || '';
    const debriefTimeStr = excelDuty.debriefTime || '';

    const classificationResult = classifyFlightDuty(
      dutiesStr,
      detailsStr,
      reportTimeStr,
      debriefTimeStr,
      position,
      reportTime,
      debriefTime,
      actualDutyHours
    );

    // Update with classification results
    flightDuty.dutyType = classificationResult.dutyType;
    flightDuty.dutyHours = classificationResult.dutyHours;
    flightDuty.flightPay = classificationResult.flightPay;

    // Debug final times for recurrent training
    if (flightDuty.dutyType === 'recurrent') {
      console.log(`🕐 FINAL RECURRENT TRAINING TIMES for row ${excelDuty.rowNumber}:`);
      console.log(`  Report Time: ${flightDuty.reportTime.hours}:${flightDuty.reportTime.minutes.toString().padStart(2, '0')}`);
      console.log(`  Debrief Time: ${flightDuty.debriefTime.hours}:${flightDuty.debriefTime.minutes.toString().padStart(2, '0')}`);
      console.log(`  Duty Hours: ${flightDuty.dutyHours}`);
      console.log(`  Flight Pay: ${flightDuty.flightPay}`);
    }

    return flightDuty;
  }

  /**
   * Parse Excel date string to Date object
   * Fixed: Use UTC date creation to avoid timezone issues that cause dates to appear 1 day earlier
   */
  private parseExcelDate(dateStr: string, month: number, year: number): Date {
    // Ensure we have a string
    const safeDateStr = dateStr ? String(dateStr) : '';

    // Expected format: "01/07/2025 Tue" or just "01/07/2025"
    const dateMatch = safeDateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);

    if (dateMatch) {
      const [, day, fileMonth, fileYear] = dateMatch;
      // Create date in UTC to avoid timezone shifting issues
      // This ensures the date displays correctly regardless of user's timezone
      const utcDate = new Date(Date.UTC(parseInt(fileYear), parseInt(fileMonth) - 1, parseInt(day)));
      return utcDate;
    }

    // Fallback: try to parse as-is
    const parsed = new Date(safeDateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Last resort: use current date in UTC
    return new Date(Date.UTC(year, month - 1, 1));
  }

  /**
   * Parse time value from Excel time string
   */
  private parseTimeValue(timeStr: string) {
    try {
      // Ensure we have a string
      const safeTimeStr = timeStr ? String(timeStr) : '';

      const timeResult = parseExcelTime(safeTimeStr);
      const [hours, minutes] = timeResult.time.split(':').map(Number);
      return createTimeValue(hours, minutes);
    } catch (error) {
      // Fallback to manual parsing
      const safeTimeStr = timeStr ? String(timeStr) : '';
      const timeMatch = safeTimeStr.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const [, hours, minutes] = timeMatch;
        return createTimeValue(parseInt(hours), parseInt(minutes));
      }
      return createTimeValue(0, 0);
    }
  }

  /**
   * Generate unique flight ID
   */
  private generateFlightId(excelDuty: ExcelFlightDuty, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    const dutyIdentifier = excelDuty.flightNumbers.length > 0
      ? excelDuty.flightNumbers.join('-')
      : excelDuty.dutyType;

    return `excel-${dateStr}-${dutyIdentifier}-${excelDuty.rowNumber}`;
  }
}

/**
 * Convenience function to parse Excel file
 */
export async function parseFlydubaiExcelFile(
  file: File,
  targetMonth?: number,
  targetYear?: number,
  config?: ExcelParsingConfig
): Promise<ExcelParseResult> {
  const parser = new FlydubaiExcelParser(config);
  return parser.parseExcelFile(file, targetMonth, targetYear);
}

'use client';

/**
 * Excel Parser Test Page
 * Tests basic Excel reading functionality with real files
 * Phase 1: Foundation testing
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import {
  readExcelFile,
  getFirstWorksheet,
  getCellValue,
  validateExcelFile,
  validateExcelContent,
  parseExcelTime,
  parseExcelDateRange,
  parseEmployeeInfo,
  parseFlydubaiExcelFile,
  validateExcelFileComprehensive,
  validateExcelStructure,
  detectExcelStructureFlexible
} from '@/lib/salary-calculator';
import {
  detectFileType,
  validateFileQuick,
  parseFileContent,
  processFileUpload
} from '@/lib/salary-calculator/upload-processor';

// Define Position type locally to avoid import issues
type Position = 'CCM' | 'SCCM';

interface TestResult {
  test: string;
  success: boolean;
  result?: any;
  error?: string;
}

export default function ExcelTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTestResults([]);
    }
  };

  const runTests = async () => {
    if (!file) return;

    setLoading(true);
    const results: TestResult[] = [];

    try {
      // Test 1: File validation
      results.push({
        test: 'File Validation',
        success: true,
        result: validateExcelFile(file)
      });

      // Test 2: Read Excel file
      const workbook = await readExcelFile(file);
      results.push({
        test: 'Read Excel File',
        success: true,
        result: { sheetCount: workbook.SheetNames.length, sheets: workbook.SheetNames }
      });

      // Test 3: Get first worksheet
      const worksheet = getFirstWorksheet(workbook);
      results.push({
        test: 'Get First Worksheet',
        success: true,
        result: { hasWorksheet: !!worksheet }
      });

      // Test 4: Content validation
      const contentValidation = validateExcelContent(worksheet);
      results.push({
        test: 'Content Validation',
        success: contentValidation.valid,
        result: contentValidation
      });

      // Test 4.5: Enhanced structure validation
      const structureValidation = validateExcelStructure(worksheet);
      results.push({
        test: 'Enhanced Structure Validation',
        success: structureValidation.valid,
        result: structureValidation
      });

      // Test 4.6: Flexible structure detection
      const flexibleStructure = detectExcelStructureFlexible(worksheet);
      results.push({
        test: 'Flexible Structure Detection',
        success: !!flexibleStructure,
        result: flexibleStructure
      });

      // Test 5: Read key cells
      const a1Cell = getCellValue(worksheet, 'A1');
      const g4Cell = getCellValue(worksheet, 'G4');
      const a6Cell = getCellValue(worksheet, 'A6');
      
      results.push({
        test: 'Read Key Cells',
        success: true,
        result: {
          A1: a1Cell,
          G4: g4Cell,
          A6: a6Cell
        }
      });

      // Test 6: Parse date range (if G4 has data)
      if (g4Cell.value) {
        try {
          const dateRange = parseExcelDateRange(g4Cell.value.toString());
          results.push({
            test: 'Parse Date Range',
            success: true,
            result: dateRange
          });
        } catch (error) {
          results.push({
            test: 'Parse Date Range',
            success: false,
            error: (error as Error).message
          });
        }
      }

      // Test 7: Parse employee info (if A6 has data)
      if (a6Cell.value) {
        try {
          const employeeInfo = parseEmployeeInfo(a6Cell.value.toString());
          results.push({
            test: 'Parse Employee Info',
            success: true,
            result: employeeInfo
          });
        } catch (error) {
          results.push({
            test: 'Parse Employee Info',
            success: false,
            error: (error as Error).message
          });
        }
      }

      // Test 8: Parse sample times
      const sampleTimes = ['07:35', '19:05', '08:50⁺¹', '02:40⁺¹'];
      const timeResults = sampleTimes.map(timeStr => {
        try {
          return {
            input: timeStr,
            result: parseExcelTime(timeStr),
            success: true
          };
        } catch (error) {
          return {
            input: timeStr,
            error: (error as Error).message,
            success: false
          };
        }
      });

      results.push({
        test: 'Parse Sample Times',
        success: timeResults.every(r => r.success),
        result: timeResults
      });

      // Test 9: Read sample data rows
      const sampleRows = [10, 11, 12, 13, 14]; // Data starts at row 10
      const rowData = sampleRows.map(row => {
        return {
          row,
          date: getCellValue(worksheet, `A${row}`),
          duties: getCellValue(worksheet, `C${row}`),
          details: getCellValue(worksheet, `F${row}`),
          reportTime: getCellValue(worksheet, `L${row}`),
          debriefTime: getCellValue(worksheet, `Q${row}`)
        };
      });

      results.push({
        test: 'Read Sample Data Rows',
        success: true,
        result: rowData
      });

      // Test 10: Full Excel parsing
      try {
        const parseResult = await parseFlydubaiExcelFile(file);
        results.push({
          test: 'Full Excel Parsing',
          success: parseResult.success,
          result: {
            success: parseResult.success,
            flightDutiesCount: parseResult.data?.length || 0,
            month: parseResult.month,
            year: parseResult.year,
            employeeInfo: parseResult.employeeInfo,
            totalRows: parseResult.totalRows,
            processedRows: parseResult.processedRows,
            errors: parseResult.errors,
            warnings: parseResult.warnings,
            sampleFlightDuties: parseResult.data?.slice(0, 3) // First 3 for preview
          }
        });
      } catch (error) {
        results.push({
          test: 'Full Excel Parsing',
          success: false,
          error: (error as Error).message
        });
      }

      // Test 11: Integration Test - Upload Processor
      try {
        console.log('🧪 Testing upload processor integration...');

        // Test file type detection
        const detectedType = detectFileType(file);
        results.push({
          test: 'File Type Detection',
          success: true,
          result: { detectedType, fileName: file.name }
        });

        // Test unified file validation
        const fileValidation = validateFileQuick(file);
        results.push({
          test: 'Unified File Validation',
          success: fileValidation.valid,
          result: fileValidation
        });

        // Test unified parsing (dry run)
        const parseResult = await parseFileContent(file, 'test-user-id');
        results.push({
          test: 'Unified File Parsing',
          success: parseResult.success,
          result: {
            success: parseResult.success,
            flightDutiesCount: parseResult.data?.length || 0,
            totalRows: parseResult.totalRows,
            processedRows: parseResult.processedRows,
            month: parseResult.month,
            year: parseResult.year,
            errors: parseResult.errors,
            warnings: parseResult.warnings,
            sampleFlightDuties: parseResult.data?.slice(0, 2) // First 2 for preview
          }
        });

        // Only test full upload processor if parsing was successful
        if (parseResult.success && parseResult.data && parseResult.data.length > 0) {
          // Test full upload processor (dry run only - no database save)
          const uploadResult = await processFileUpload(
            file,
            'test-user-id',
            'CCM' as Position, // Use CCM position for testing
            (status) => console.log('Progress:', status),
            true // dry run - don't save to database
          );

          results.push({
            test: 'Upload Processor Integration (Dry Run)',
            success: uploadResult.success,
            result: {
              success: uploadResult.success,
              flightDutiesCount: uploadResult.flightDuties?.length || 0,
              layoverPeriodsCount: uploadResult.layoverRestPeriods?.length || 0,
              errors: uploadResult.errors,
              warnings: uploadResult.warnings,
              sampleCalculatedDuties: uploadResult.flightDuties?.slice(0, 2) // First 2 with calculations
            }
          });
        } else {
          results.push({
            test: 'Upload Processor Integration (Dry Run)',
            success: false,
            result: {
              skipped: true,
              reason: 'Parsing failed or no flight duties found',
              parseErrors: parseResult.errors,
              parseWarnings: parseResult.warnings
            }
          });
        }

      } catch (error) {
        results.push({
          test: 'Upload Processor Integration',
          success: false,
          error: (error as Error).message
        });
      }

    } catch (error) {
      results.push({
        test: 'Overall Test',
        success: false,
        error: (error as Error).message
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Excel Parser Test</h1>
        <p className="text-gray-600">
          Test Excel parsing utilities with real Flydubai roster files
        </p>
      </div>

      {/* File Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Upload Excel File</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".xlsx,.xlsm"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              {file && (
                <Badge variant="secondary">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                </Badge>
              )}
            </div>
            
            {file && (
              <Button 
                onClick={runTests} 
                disabled={loading}
                className="cursor-pointer hover:opacity-90"
              >
                {loading ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Run Excel Tests
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.success)}
                      <h3 className="font-semibold">{result.test}</h3>
                    </div>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "PASS" : "FAIL"}
                    </Badge>
                  </div>
                  
                  {result.error && (
                    <div className="text-red-600 text-sm mb-2">
                      Error: {result.error}
                    </div>
                  )}
                  
                  {result.result && (
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <pre className="whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Upload Validation Module
 * File validation and type detection utilities
 */

import { ValidationResult } from '@/types/salary-calculator';
import { FileType } from './types';

/**
 * Detects file type based on extension
 */
export function detectFileType(file: File): FileType {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xlsm')) {
    return 'excel';
  } else if (fileName.endsWith('.csv')) {
    return 'csv';
  } else {
    // Default to CSV for backward compatibility
    return 'csv';
  }
}

/**
 * Unified file validation for both CSV and Excel files
 */
export function validateFileQuick(file: File): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fileType = detectFileType(file);

  // Check file type
  if (fileType === 'csv') {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      errors.push('File must be a CSV file (.csv extension)');
    }
  } else if (fileType === 'excel') {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xlsm')) {
      errors.push('File must be an Excel file (.xlsx or .xlsm extension)');
    }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`);
  }

  // Check if file is empty
  if (file.size === 0) {
    errors.push('File is empty');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Reads file content as text
 */
export async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}


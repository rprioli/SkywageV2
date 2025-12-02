/**
 * Upload Processor Module
 * Re-exports from the modular upload directory structure
 * 
 * This file maintains backwards compatibility with existing imports.
 * The actual implementation is split across:
 * - upload/types.ts - Type definitions
 * - upload/validation.ts - File validation utilities
 * - upload/parsing.ts - File parsing utilities  
 * - upload/workflow.ts - Main processing workflows
 */

// Re-export everything from the upload module
export {
  // Types
  type ProcessingStatus,
  type ProcessingResult,
  type ProgressCallback,
  type FileType,
  type UnifiedParseResult,
  type ExistingDataCheck,
  type ReplacementResult,
  
  // Validation
  detectFileType,
  validateFileQuick,
  
  // Parsing
  parseFileContent,
  
  // Workflow
  checkForExistingData,
  processCSVUpload,
  processCSVUploadWithReplacement,
  processFileUpload,
  processFileUploadWithReplacement
} from './upload';

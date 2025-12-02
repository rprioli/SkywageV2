/**
 * Upload Module Index
 * Re-exports all upload processing utilities
 */

// Types
export type {
  ProcessingStatus,
  ProcessingResult,
  ProgressCallback,
  FileType,
  UnifiedParseResult,
  ExistingDataCheck,
  ReplacementResult
} from './types';

// Validation utilities
export {
  detectFileType,
  validateFileQuick,
  readFileContent
} from './validation';

// Parsing utilities
export {
  parseFileContent
} from './parsing';

// Workflow functions
export {
  checkForExistingData,
  processCSVUpload,
  processCSVUploadWithReplacement,
  processFileUpload,
  processFileUploadWithReplacement
} from './workflow';


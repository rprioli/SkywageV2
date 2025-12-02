/**
 * Manual Entry Processor Module
 * Re-exports from the modular manual-entry directory structure
 * 
 * This file maintains backwards compatibility with existing imports.
 * The actual implementation is split across:
 * - manual-entry/types.ts - Type definitions
 * - manual-entry/conversion.ts - FlightDuty conversion
 * - manual-entry/suggestions.ts - Auto-complete suggestions
 * - manual-entry/workflow.ts - Main processing workflows
 */

// Re-export everything from the manual-entry module
export {
  // Types
  type ManualEntryResult,
  type BatchManualEntryResult,
  type ManualFlightEntryData,
  type FormValidationResult,
  
  // Conversion
  convertToFlightDuty,
  
  // Suggestions
  getSuggestedFlightNumbers,
  getSuggestedSectors,
  
  // Workflow
  validateManualEntryRealTime,
  processManualEntry,
  processBatchManualEntries,
  processManualEntryBatch
} from './manual-entry';

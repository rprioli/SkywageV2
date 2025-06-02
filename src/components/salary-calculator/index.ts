/**
 * Salary Calculator Components - Phase 3 Exports
 * Complete UI components for salary calculator functionality
 * Following existing export patterns in the codebase
 */

// UI Components
export { SalaryBreakdown, SalaryBreakdownCompact } from './SalaryBreakdown';
export { FlightDutiesTable } from './FlightDutiesTable';

// Phase 3 Components
export { RosterUpload } from './RosterUpload';
export { ProcessingStatus } from './ProcessingStatus';
export { UploadResults } from './UploadResults';

// Phase 4 Components
export { ManualFlightEntry } from './ManualFlightEntry';
export { FlightEntryForm } from './FlightEntryForm';
export { FlightTypeSelector } from './FlightTypeSelector';
export { FlightNumberInput } from './FlightNumberInput';
export { SectorInput } from './SectorInput';
export { TimeInput } from './TimeInput';

// Phase 5 Components
export { EditFlightModal } from './EditFlightModal';
export { AuditTrailDisplay, AuditTrailModal } from './AuditTrailDisplay';
export { FlightDutiesManager } from './FlightDutiesManager';

// Database operations
export * from '@/lib/database/flights';
export * from '@/lib/database/calculations';
export * from '@/lib/database/audit';

// Core calculation engine (re-export from Phase 1)
export * from '@/lib/salary-calculator';

/**
 * Salary Calculator Components - Phase 2 Exports
 * Basic UI components for salary calculator functionality
 * Following existing export patterns in the codebase
 */

// UI Components
export { SalaryBreakdown, SalaryBreakdownCompact } from './SalaryBreakdown';
export { FlightDutiesTable } from './FlightDutiesTable';

// Database operations
export * from '@/lib/database/flights';
export * from '@/lib/database/calculations';
export * from '@/lib/database/audit';

// Core calculation engine (re-export from Phase 1)
export * from '@/lib/salary-calculator';

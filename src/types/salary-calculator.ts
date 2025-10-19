/**
 * Core types for Skywage Salary Calculator System
 * Following existing TypeScript patterns in the codebase
 */

// Position types matching existing profile system
export type Position = 'CCM' | 'SCCM';

// Flight duty types based on specification
export type DutyType = 'turnaround' | 'layover' | 'asby' | 'recurrent' | 'sby' | 'off' | 'business_promotion';

// Data source tracking
export type DataSource = 'csv' | 'manual' | 'edited';

// Time representation for calculations
export interface TimeValue {
  hours: number;
  minutes: number;
  totalMinutes: number;
  totalHours: number; // Decimal representation
}

// Flight duty information
export interface FlightDuty {
  id?: string;
  userId?: string;
  date: Date;
  flightNumbers: string[]; // Array for turnarounds
  sectors: string[]; // Array for multiple sectors
  dutyType: DutyType;
  reportTime: TimeValue;
  debriefTime: TimeValue;
  dutyHours: number; // Decimal hours
  flightPay: number; // AED
  isCrossDay: boolean;
  dataSource: DataSource;
  originalData?: Record<string, any>; // Store original CSV data
  lastEditedAt?: Date;
  lastEditedBy?: string;
  month: number;
  year: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Layover rest period information
export interface LayoverRestPeriod {
  id?: string;
  userId?: string;
  outboundFlightId: string;
  inboundFlightId: string;
  restStartTime: Date;
  restEndTime: Date;
  restHours: number; // Decimal hours
  perDiemPay: number; // AED
  month: number;
  year: number;
  createdAt?: Date;
}

// Monthly salary calculation breakdown
export interface MonthlyCalculation {
  id?: string;
  userId?: string;
  month: number;
  year: number;
  
  // Fixed components
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  
  // Variable components
  totalDutyHours: number;
  flightPay: number;
  totalRestHours: number;
  perDiemPay: number;
  asbyCount: number;
  asbyPay: number;
  
  // Totals
  totalFixed: number;
  totalVariable: number;
  totalSalary: number;
  
  createdAt?: Date;
  updatedAt?: Date;
}

// Salary rates configuration
export interface SalaryRates {
  position: Position;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  hourlyRate: number; // Flight pay rate
  perDiemRate: number; // Rest period rate
  asbyHours: number; // Fixed ASBY hours
}

// CSV parsing result
export interface CSVParseResult {
  success: boolean;
  data?: FlightDuty[];
  errors: string[];
  warnings: string[];
  month?: number;
  year?: number;
  totalRows: number;
  processedRows: number;
}

// Calculation result for individual flight
export interface FlightCalculationResult {
  flightDuty: FlightDuty;
  calculationDetails: {
    dutyHours: number;
    flightPay: number;
    restHours?: number;
    perDiemPay?: number;
    asbyPay?: number;
  };
  errors: string[];
  warnings: string[];
}

// Monthly calculation result
export interface MonthlyCalculationResult {
  monthlyCalculation: MonthlyCalculation;
  flightDuties: FlightDuty[];
  layoverRestPeriods: LayoverRestPeriod[];
  calculationSummary: {
    totalFlights: number;
    totalTurnarounds: number;
    totalLayovers: number;
    totalAsbyDuties: number;
    averageDutyHours: number;
    averageRestHours: number;
  };
  errors: string[];
  warnings: string[];
}

// Audit trail entry
export interface AuditTrailEntry {
  id?: string;
  flightId: string;
  userId: string;
  action: 'created' | 'deleted';
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  changeReason?: string;
  createdAt?: Date;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Time parsing result
export interface TimeParseResult {
  success: boolean;
  timeValue?: TimeValue;
  error?: string;
  isCrossDay: boolean;
}

// Flight classification result
export interface FlightClassificationResult {
  dutyType: DutyType;
  confidence: number; // 0-1 scale
  reasoning: string;
  warnings: string[];
  dutyHours?: number; // Calculated duty hours (optional)
  flightPay?: number; // Calculated flight pay (optional)
}

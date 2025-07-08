# Skywage Salary Calculator System - Technical Specification

## Document Information

- **Version**: 2.0
- **Date**: January 2025 (Updated: June 2025)
- **Project**: Skywage V2
- **Scope**: Multi-Airline Cabin Crew Salary Calculator (Starting with Flydubai)
- **Implementation Status**: Phase 8 Completed ✅ + Phase 7 UI/UX Redesign Completed ✅ + Form Layout Reorganization Completed ✅ + Recurrent Duty Type Added ✅ + Layover Duties Working ✅ + **CRITICAL POSITION BUG FIXED** ✅
- **Current Status**: All critical issues resolved, enhanced UI/UX implemented, reorganized form layout with separate date handling, Recurrent duty type fully integrated, **LAYOVER DUTY CREATION FULLY WORKING**, **USER POSITION SELECTION PROPERLY APPLIED TO CALCULATIONS**, system production-ready (January 2025)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Business Logic Specification](#2-business-logic-specification)
3. [Technical Implementation Details](#3-technical-implementation-details)
4. [Data Processing Specifications](#4-data-processing-specifications)
5. [Calculation Engine Requirements](#5-calculation-engine-requirements)
6. [User Interface Specifications](#6-user-interface-specifications)
7. [Integration Requirements](#7-integration-requirements)
8. [Testing and Validation](#8-testing-and-validation)
9. [Future Considerations](#9-future-considerations)

---

## 1. Overview

### 1.1 Purpose

This document defines the complete technical specification for implementing the Skywage Salary Calculator system. The system processes airline roster files (starting with Flydubai CSV format) to calculate monthly salaries for cabin crew members based on airline-specific compensation structures.

### 1.2 Scope

- Multi-airline salary calculation framework (starting with Flydubai)
- CSV roster file processing and validation
- Manual flight entry and editing capabilities
- Flight duty classification (turnarounds, layovers, standby)
- Real-time recalculation engine
- Integration with existing Skywage infrastructure

### 1.3 Typical Dataset Size

**Important Context**: Airline CSV roster files typically contain **13-14 flights maximum** per month. This small dataset size significantly impacts system design decisions:

- **Performance optimization**: Virtual scrolling, lazy loading, and advanced caching are unnecessary
- **UI design**: Card-based layouts can display all flights without pagination
- **User experience**: Focus on clean, intuitive interfaces rather than performance for large datasets
- **Testing scope**: Performance testing focuses on calculation accuracy rather than large dataset handling

### 1.4 Key Principles

- **Precision**: No rounding - maintain full decimal accuracy
- **Reliability**: Robust error handling and data validation
- **Consistency**: Follow established Skywage design patterns
- **Scalability**: Support for multiple airlines and future expansion
- **User Experience**: Clean, intuitive interfaces optimized for small datasets (13-14 flights)

---

## 2. Business Logic Specification

### 2.1 Flydubai Salary Components

#### 2.1.1 Fixed Monthly Components

**Cabin Crew Member (CCM):**

```
Basic Salary: 3,275 AED
Housing Allowance: 4,000 AED
Transportation Allowance: 1,000 AED
Total Fixed: 8,275 AED
```

**Senior Cabin Crew Member (SCCM):**

```
Basic Salary: 4,275 AED
Housing Allowance: 5,000 AED
Transportation Allowance: 1,000 AED
Total Fixed: 10,275 AED
```

#### 2.1.2 Variable Components

**Flight Pay:**

```
Formula: Duty Hours × Hourly Rate
CCM Rate: 50 AED/hour
SCCM Rate: 62 AED/hour
```

**Per Diem (Layover Rest):**

```
Formula: Rest Hours × Per Diem Rate
Rate (Both Positions): 8.82 AED/hour
```

**Airport Standby (ASBY):**

```
Formula: 4 hours × Position Rate
CCM: 4 × 50 = 200 AED
SCCM: 4 × 62 = 248 AED
```

#### 2.1.3 Total Salary Calculation

```
Total Monthly Salary = Fixed Components + Variable Components

Where:
Variable Components = Flight Pay + Per Diem + ASBY Pay
```

### 2.2 Flight Type Classification

#### 2.2.1 Turnaround Flights

**Characteristics:**

- Multiple flight numbers in single CSV row
- Multiple sectors in single details cell
- One reporting time and one debriefing time
- Returns to base (DXB) on final sector
- Can span multiple days but counted as single duty

**Example Pattern:**

```
Duties: "FZ549 FZ550"
Details: "DXB - CMB CMB - DXB"
Report: "9:20"
Debrief: "21:15"
```

**Calculation:**

```
Duty Hours = Debrief Time - Report Time
Flight Pay = Duty Hours × Position Rate
```

#### 2.2.2 Layover Flights

**Characteristics:**

- Single flight number per CSV row
- Single sector per details cell
- Separate reporting and debriefing times for each flight
- Rest period between consecutive flights

**Example Pattern:**

```
Row 1: FZ967, DXB - VKO, Report: 22:30, Debrief: 05:45¹
Row 2: FZ968, VKO - DXB, Report: 05:15, Debrief: 12:25
```

**Calculation:**

```
Duty Hours = Sum of individual flight duty hours
Rest Hours = Debrief Time (Flight 1) - Report Time (Flight 2)
Flight Pay = Total Duty Hours × Position Rate
Per Diem = Rest Hours × 8.82 AED/hour
```

#### 2.2.3 Airport Standby (ASBY)

**Characteristics:**

- "ASBY" in duties column
- Fixed 4-hour duration
- Paid at flight hourly rate

**Calculation:**

```
ASBY Pay = 4 hours × Position Rate
```

#### 2.2.4 Recurrent Training

**Characteristics:**

- "Recurrent" duty type for training activities (simulator training, safety training, etc.)
- Fixed 4-hour duration (regardless of actual time spent)
- Paid at flight hourly rate
- No flight numbers or sectors required
- Simplified form entry (Date, Reporting, Debriefing only)
- Displays as "Ground Duty" with BookOpen icon
- Shows "Recurrent Training" text instead of flight numbers

**Example Pattern:**

```
Manual Entry Form:
Date: 01 Jun 2025
Duty Type: Recurrent
Report Time: 08:00
Debrief Time: 16:00
```

**Calculation:**

```
Recurrent Pay = 4 hours × Position Rate
CCM: 4 × 50 = 200 AED
SCCM: 4 × 62 = 248 AED
```

#### 2.2.5 Unpaid Duties

**Home Standby (SBY):**

- No payment calculation required

**Off Days (OFF, X):**

- No payment calculation required

### 2.3 Time Calculation Rules

#### 2.3.1 Cross-Day Handling

**Special Character Indicators:**

- `¹` indicates next day
- `?¹` and similar characters must be cleaned

**Examples:**

```
Report: 23:30 (Day 1)
Debrief: 05:45¹ (Day 2)
Duration: 6 hours 15 minutes
```

#### 2.3.2 Time Format Processing

**Input Formats:**

- Standard: "09:20", "15:30"
- Next day: "05:45¹", "02:25¹"
- With artifacts: "03:45?¹"

**Processing Steps:**

1. Remove special characters (¹, ?¹, etc.)
2. Parse time in HH:MM format
3. Apply day offset for ¹ indicator
4. Calculate duration in decimal hours

#### 2.3.3 Rest Period Calculation

**Formula:**

```
Rest Period = Debrief Time (Previous Flight) - Report Time (Next Flight)
```

**Precision Requirements:**

- Calculate in HH:MM format
- Convert to decimal hours for payment calculation
- Handle multi-day rest periods accurately

**Example:**

```
Flight 1 ends: 10/05/2025 05:45
Flight 2 starts: 11/05/2025 05:15
Rest Period: 23:30 (23 hours 30 minutes)
Per Diem: 23.5 × 8.82 = 207.27 AED
```

---

## 3. Technical Implementation Details

### 3.1 Technology Stack

#### 3.1.1 Frontend

- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript
- **UI Library**: ShadCN UI components with Sonner for toast notifications
- **Styling**: Tailwind CSS with Skywage brand colors
- **State Management**: React Context API
- **File Handling**: Browser File API
- **User Feedback**: Toast notification system with comprehensive user action feedback

#### 3.1.2 Backend Integration

- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage (for CSV backups)
- **API**: Supabase REST API with TypeScript client

#### 3.1.3 Development Tools

- **Package Manager**: npm
- **Linting**: ESLint with Next.js configuration
- **Type Checking**: TypeScript strict mode
- **Build Tool**: Next.js with Turbopack

### 3.2 Database Schema Requirements

#### 3.2.1 Enhanced Tables

**flights table:**

```sql
CREATE TABLE flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  flight_numbers TEXT[] NOT NULL, -- Array for turnarounds
  sectors TEXT[] NOT NULL, -- Array for multiple sectors
  duty_type VARCHAR(20) NOT NULL, -- 'turnaround', 'layover', 'asby'
  report_time TIME NOT NULL,
  debrief_time TIME NOT NULL,
  duty_hours DECIMAL(5,2) NOT NULL,
  flight_pay DECIMAL(8,2) NOT NULL,
  is_cross_day BOOLEAN DEFAULT FALSE,
  data_source VARCHAR(20) DEFAULT 'csv', -- 'csv', 'manual', 'edited'
  original_data JSONB, -- Store original CSV data for audit
  last_edited_at TIMESTAMP,
  last_edited_by UUID REFERENCES auth.users(id),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**flight_audit_trail table:**

```sql
CREATE TABLE flight_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id UUID REFERENCES flights(id),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(20) NOT NULL, -- 'created', 'updated', 'deleted'
  old_data JSONB,
  new_data JSONB,
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**layover_rest_periods table:**

```sql
CREATE TABLE layover_rest_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  outbound_flight_id UUID REFERENCES flights(id),
  inbound_flight_id UUID REFERENCES flights(id),
  rest_start_time TIMESTAMP NOT NULL,
  rest_end_time TIMESTAMP NOT NULL,
  rest_hours DECIMAL(5,2) NOT NULL,
  per_diem_pay DECIMAL(8,2) NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**monthly_calculations table (enhanced):**

```sql
CREATE TABLE monthly_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  -- Fixed components
  basic_salary DECIMAL(8,2) NOT NULL,
  housing_allowance DECIMAL(8,2) NOT NULL,
  transport_allowance DECIMAL(8,2) NOT NULL,
  -- Variable components
  total_duty_hours DECIMAL(6,2) NOT NULL,
  flight_pay DECIMAL(8,2) NOT NULL,
  total_rest_hours DECIMAL(6,2) NOT NULL,
  per_diem_pay DECIMAL(8,2) NOT NULL,
  asby_count INTEGER NOT NULL,
  asby_pay DECIMAL(8,2) NOT NULL,
  -- Totals
  total_fixed DECIMAL(8,2) NOT NULL,
  total_variable DECIMAL(8,2) NOT NULL,
  total_salary DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);
```

#### 3.2.2 Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE layover_rest_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_calculations ENABLE ROW LEVEL SECURITY;

-- Create policies for user data isolation
CREATE POLICY "Users can only access their own data" ON flights
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own data" ON flight_audit_trail
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own data" ON layover_rest_periods
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own data" ON monthly_calculations
  FOR ALL USING (auth.uid() = user_id);
```

### 3.3 File Upload and Processing Workflow

#### 3.3.1 Upload Process

1. **File Validation**: Check file type (.csv), size limits
2. **Content Validation**: Verify A1 cell contains "flydubai"
3. **Month Extraction**: Parse month range from C2 cell
4. **Data Processing**: Parse CSV content according to specifications
5. **Calculation**: Execute salary calculation engine
6. **Storage**: Save results to database
7. **Backup**: Store original CSV in Supabase Storage

#### 3.3.2 Error Handling Strategy

- **File Level**: Invalid format, missing required cells
- **Data Level**: Malformed times, invalid flight numbers
- **Calculation Level**: Impossible time sequences, negative durations
- **Database Level**: Constraint violations, duplicate entries

---

## Implementation Status Update (January 2025)

**Phase 6 Completed**: Enhanced UI & User Experience with Toast Notifications

The Skywage Salary Calculator system has successfully completed Phase 6 implementation, which included:

- ✅ **Modern Card Design System**: Complete UI redesign with floating icons and brand colors
- ✅ **Advanced Filtering**: Filter by duty type, date range, and pay amount
- ✅ **Bulk Operations**: Select multiple flights for batch actions
- ✅ **Toast Notification System**: Comprehensive user feedback for all actions
- ✅ **Enhanced Loading States**: Progress indicators and smooth animations
- ✅ **Error Handling**: Improved error messages and confirmation dialogs

**Restructuring Completed (January 2025)**: Main Dashboard Integration

The salary calculator has been restructured to serve as the main dashboard page:

- ✅ **Main Dashboard**: Salary calculator is now the primary dashboard experience at `/dashboard`
- ✅ **Simplified Navigation**: Removed separate "Salary Calculator" menu item
- ✅ **Modal-Based Workflow**: Upload and manual entry now use clean modals instead of separate pages
- ✅ **Ultra-Streamlined Upload**: Month selection → File browser opens automatically (no intermediate steps)
- ✅ **Clean UI Design**: Minimal, consistent interface matching modern design standards
- ✅ **Preserved Functionality**: All Phase 1-6 features maintained without changes
- ✅ **Test Pages Preserved**: All test pages remain accessible for validation

**Ultra-Streamlined Upload Workflow (January 2025)**:

The upload process has been optimized for maximum efficiency:

- ✅ **2-Step Process**: Click "Upload Roster" → Select month → File browser opens automatically
- ✅ **No Intermediate Screens**: Eliminated drag-and-drop interface and settings displays
- ✅ **Automatic Processing**: File validation and processing happen seamlessly
- ✅ **Clean Progress Interface**: Minimal progress display with just title, current step, and progress bar
- ✅ **Modal-Based**: All upload functionality contained within clean modal dialogs

**Clean & Minimal UI Design (January 2025)**:

The entire interface has been redesigned for clarity and efficiency:

- ✅ **Consistent Design Language**: Upload modal and progress interface share the same clean, minimal aesthetic
- ✅ **Reduced Visual Clutter**: Removed unnecessary icons, descriptions, and redundant text
- ✅ **Compact Layouts**: Optimized spacing and sizing for better screen utilization
- ✅ **Professional Appearance**: Modern, focused design that prioritizes functionality
- ✅ **Mobile-Optimized**: Clean interfaces work seamlessly across all device sizes

**Enhanced Monthly Overview Card (January 2025)**:

- ✅ **Interactive Area Chart**: Beautiful gradient area chart with data visualization using Recharts
- ✅ **Month Selection**: Interactive month buttons (Jan-Oct) with visual feedback
- ✅ **Improved Visual Hierarchy**:
  - Center metric (Total Salary) - most prominent with larger size and enhanced styling
  - Left metric (Duty Hours) - secondary importance with proper centering
  - Right metric (Total Duties) - secondary importance with proper centering
- ✅ **Brand Color Integration**: Solid primary brand color (#4C49ED) instead of gradient
- ✅ **Real Data Integration**: Connected to actual salary calculations and flight duties
- ✅ **Responsive Design**: Maintains layout across different screen sizes

**Current Status**: Phase 6 Complete ✅ - Critical Issue Identified ⚠️

### ⚠️ Critical Issue Identified (January 2025):

**Flight Deletion Feature**: ✅ Successfully implemented and working

- Individual flight deletion with confirmation dialogs ✅
- Bulk flight deletion with batch processing ✅
- Real-time recalculation after deletion ✅
- Proper toast notifications and error handling ✅
- Dashboard overview cards update correctly after deletion ✅
- Zero-value calculations created when all flights deleted ✅
- Cross-month deletion support with proper recalculation ✅
- Database consistency maintained across all deletion scenarios ✅

**Recent Bug Fixes (June 2025)**: ✅ Critical deletion recalculation issues resolved

- **Fixed bulk deletion recalculation bug**: Dashboard overview cards now update correctly after bulk deletion
- **Fixed individual deletion recalculation bug**: Individual flight deletion now triggers proper recalculation
- **Root cause**: Incorrect property access in recalculation engine (`calculation` vs `monthlyCalculation`)
- **Impact**: Both deletion methods now maintain database consistency and real-time UI updates
- **Zero calculation handling**: Proper zero-value calculations created when all flights deleted

**Upload Display Bug**: ❌ Critical issue affecting user experience

- **Problem**: After uploading roster files, flights are not displayed in Flight Duties component
- **Root Cause**: Dashboard always refreshes current month data instead of uploaded month data
- **Impact**: Users can upload data successfully but cannot see uploaded flights on dashboard
- **Technical Details**: `refreshDashboardData()` function hardcoded to fetch current month instead of uploaded month
- **Status**: Issue identified, fix ready to implement

**Recurrent Duty Type Implementation (January 2025)**: ✅ Complete integration successful

- **New Duty Type Added**: 'recurrent' duty type for training activities (simulator, safety, etc.)
- **Database Schema Updated**: Added 'recurrent' to duty_type CHECK constraint, removed conflicting old constraint
- **Payment Structure**: Fixed 4 hours at position rate (CCM: 200 AED, SCCM: 248 AED)
- **Form Integration**: Simplified form like ASBY (Date, Reporting, Debriefing only)
- **UI Components Updated**:
  - FlightTypeSelector: Added Recurrent option with BookOpen icon
  - FlightDutyCard: Displays "Ground Duty" label with "Recurrent Training" text
  - FlightDutiesTable: Added Recurrent filter option
- **Validation Logic**: Recurrent duties don't require flight numbers or sectors
- **Calculation Engine**: Added calculateRecurrentPay() function and switch case handling
- **Manual Entry**: Full integration with existing manual entry workflow
- **Documentation**: Updated specifications and progress tracking

**Status**: Production ready with full feature parity to other duty types

## Note: Complete Specification Content

This file contains the core sections of the Skywage Salary Calculator specification. The complete specification includes additional sections covering:

- **Section 4**: Data Processing Specifications (CSV validation, manual entry validation, time parsing)
- **Section 5**: Calculation Engine Requirements (processing pipeline, real-time recalculation)
- **Section 6**: User Interface Specifications (component structure, manual entry forms, edit modals)
- **Section 7**: Integration Requirements (enhanced database operations, file storage)
- **Section 8**: Testing and Validation (unit tests, integration tests, user acceptance testing)
- **Section 9**: Future Considerations (multi-airline support, advanced analytics)

For the complete specification with all sections, please refer to the original content which has been updated with the new "SalaryCalculator" naming convention throughout.

## Key Changes from Original Naming:

### **Updated Naming Convention:**

- ✅ **System Name**: "Skywage Salary Calculator" (instead of "Flydubai Salary Calculator")
- ✅ **Scope**: Multi-airline framework starting with Flydubai
- ✅ **File Structure**: `salary-calculator/` folders (instead of `flydubai/`)
- ✅ **Component Names**: Generic with airline-specific configuration
- ✅ **Future-Proof**: Easy to add Emirates, Qatar Airways, etc.

### **Airline Configuration Pattern:**

```typescript
// Generic component with airline-specific config
<SalaryCalculator
  airline="flydubai"
  config={flydubaiConfig}
/>;

// Airline-specific configuration
const flydubaiConfig: AirlineConfig = {
  name: "Flydubai",
  csvParser: FlydubaiCSVParser,
  rates: FLYDUBAI_RATES,
  validation: FLYDUBAI_VALIDATION_RULES,
  positions: ["CCM", "SCCM"],
};
```

This approach ensures the system is scalable and properly branded as a **Skywage** feature rather than airline-specific tooling.

---

## Batch Entry Feature: Multiple Duty Processing

### Overview

**Completion Date**: February 2025
**Status**: ✅ **COMPLETED** - Batch entry functionality fully implemented
**Scope**: Enhanced manual flight entry with ability to process multiple duties in a single session

### Key Features

#### **1. Batch Management**

- **Add Another Duty Button**: Allows users to add multiple duties before saving
- **Save Batch Only Button**: Save accumulated duties without including current form
- **Batch Counter**: Visual feedback showing number of duties in batch
- **Form State Management**: Clear form after adding to batch while preserving duty type

#### **2. Enhanced User Workflow**

- **Validation Integration**: Each duty validated before adding to batch
- **Error Handling**: Clear toast notifications for validation errors
- **Loading States**: Proper loading indicators for all batch operations
- **Button Hierarchy**: Organized layout (Add Another → Save Batch Only → Save All)

#### **3. Technical Implementation**

- **TypeScript Integration**: Complete type safety for batch functionality
- **State Management**: Efficient batch collection and processing
- **Database Operations**: Optimized bulk insert operations
- **Error Recovery**: Proper error handling and rollback mechanisms

#### **4. Button Layout Structure**

```
[Add Another Duty] (outline style)
[Save Batch Only] (secondary style, when batch > 0)
[Save Flight Duty] (primary style)
```

### Benefits

- **Improved Efficiency**: Process multiple duties in single session
- **Better UX**: Reduced form submissions and page reloads
- **Data Consistency**: Atomic batch operations ensure data integrity
- **User Control**: Flexible saving options (batch only or batch + current)

---

## Phase 7 UI/UX Redesign: Manual Entry Interface Enhancement

### Overview

**Completion Date**: June 2025
**Status**: ✅ **COMPLETED** - Enhanced user experience implemented
**Scope**: Complete redesign of manual flight entry interface with grid-based layout

---

## Form Layout Reorganization: Enhanced Layover Duty Support

### Overview

**Completion Date**: December 2024
**Status**: ✅ **COMPLETED** - Reorganized form layout with separate date handling
**Scope**: Complete restructuring of manual flight entry form for improved usability and layover duty support

### Key Improvements

#### **1. Logical Form Flow**

- **Duty Type First**: Moved to top of form for immediate context
- **Date Positioning**: Positioned logically after duty type selection
- **Sector-Based Organization**: Layover duties organized by outbound/inbound sectors

#### **2. Enhanced Layover Support**

- **Separate Date Fields**: Independent date handling for outbound and inbound sectors
- **Cross-Day Detection**: Separate logic for each sector using respective dates
- **Visual Sector Separation**: Clear headers with brand colors (#4C49ED)
- **Simplified Labels**: Removed redundant "Outbound"/"Inbound" text from time fields

#### **3. Current Form Layout (Layover Duties)**

```
[Duty Type Selection: Turnaround | Layover | Airport Standby]

🛩️ OUTBOUND SECTOR (brand purple #4C49ED)
Date: [date field]
Flight Number: [single field]
Sector: [DXB] [KHI]
Reporting: [time field]
Debriefing: [time field] + cross-day indicator

🛩️ INBOUND SECTOR (brand purple #4C49ED)
Date: [date field]
Flight Number: [single field]
Sector: [KHI] [DXB]
Reporting: [time field]
Debriefing: [time field] + cross-day indicator

[Add Another Duty button]
[Save Batch Only button] (when batch has duties)
[Save Flight Duty button]
```

#### **4. Technical Implementation**

- **Data Structure**: Added `inboundDate?: string` field to `ManualFlightEntryData`
- **Validation Logic**: Enhanced validation for inbound date requirements
- **Cross-Day Logic**: Independent calculation for outbound/inbound sectors
- **UI Components**: Reorganized FlightEntryForm.tsx with sector-based layout

#### **5. User Experience Benefits**

- **Intuitive Flow**: Duty type → Date → Flight details progression
- **Clear Organization**: Sector-based grouping for layover duties
- **Visual Clarity**: Brand-colored headers and clean separation
- **Reduced Confusion**: Simplified labels and logical field placement

### Design Principles

The Phase 7 UI/UX redesign follows Skywage's core design principles:

- **Minimalistic Design**: Clean, uncluttered interfaces prioritizing functionality
- **User-Centric Input**: Simplified input formats that match user mental models
- **Progressive Disclosure**: Information and validation appear when needed
- **Consistent Branding**: Skywage colors (#4C49ED purple, #6DDC91 green, #FFFFFF white)
- **Professional Aesthetics**: Modern, focused design suitable for aviation professionals

### Grid-Based Layout Implementation

#### Flight Numbers Section

```typescript
// User Input Format: Simplified numbers only
Input: ['123', '124']
Display: 2-column grid with plane icons
Placeholder: '123', '124'
Validation: 3-4 digits only
Auto-Transform: '123' → 'FZ123' (system level)
```

#### Sectors Section

```typescript
// User Input Format: Individual airport codes
Input: ['DXB', 'KHI', 'KHI', 'DXB']
Display: 4-column grid (2x2) with map pin icons
Placeholder: 'DXB', 'KHI', 'KHI', 'DXB'
Validation: 3-letter airport codes only
Auto-Transform: ['DXB', 'KHI', 'KHI', 'DXB'] → ['DXB-KHI', 'KHI-DXB']
```

#### Times Section

```typescript
// User Input Format: Standard time format
Input: ['09:30', '17:45']
Display: 2-column grid with clock icons
Labels: 'Reporting', 'Debriefing'
Validation: 24-hour time format
```

### Input Transformation System

#### Core Transformation Functions

```typescript
// File: src/lib/salary-calculator/input-transformers.ts

transformFlightNumbers(input: string[]): string[]
// Converts ['123', '124'] → ['FZ123', 'FZ124']

transformSectors(input: string[]): string[]
// Converts ['DXB', 'KHI', 'KHI', 'DXB'] → ['DXB-KHI', 'KHI-DXB']

validateAndTransformInput(flights: string[], sectors: string[]): ValidationResult
// Validates simplified input and returns transformed data
```

#### Validation Logic Updates

```typescript
// Updated validation accepts simplified formats
validateFlightNumbers(numbers: string[], dutyType: DutyType): FieldValidationResult
// Accepts: ['123', '124'] instead of ['FZ123', 'FZ124']

validateSectors(airportCodes: string[], dutyType: DutyType): FieldValidationResult
// Accepts: ['DXB', 'KHI'] instead of ['DXB-KHI']
```

### Smart Validation System

#### Progressive Error Disclosure

- **Initial State**: Clean form with no validation warnings
- **Touch-Based Validation**: Errors appear only after user interacts with specific fields
- **Field-Specific Feedback**: Validation tied to individual input fields
- **User-Friendly Messages**: Error messages reflect simplified input format

#### Implementation

```typescript
// Touch tracking for progressive validation
const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

// Conditional error display
{
  validation.fieldErrors.flightNumbers &&
    touchedFields.has("flightNumbers") && (
      <p className="text-destructive text-sm">
        {validation.fieldErrors.flightNumbers}
      </p>
    );
}
```

### Component Architecture

#### Enhanced Components

- **FlightEntryForm.tsx**: Grid-based layout with dynamic field management
- **FlightTypeSelector.tsx**: Clean button-based selection (removed verbose descriptions)
- **FlightNumberInput.tsx**: Simplified number-only input with auto-transformation
- **SectorInput.tsx**: Individual airport code input with 3-character validation
- **ManualFlightEntry.tsx**: Streamlined container with minimal UI elements

#### New Infrastructure

- **input-transformers.ts**: Bidirectional conversion between user and system formats
- **Enhanced Validation**: Updated validation logic for simplified input formats
- **Touch-Based Validation**: Progressive error disclosure system

### User Experience Improvements

#### Before Redesign

- Complex input requirements (FZ123, DXB-CMB format)
- Cluttered interface with excessive help text and warnings
- Only 2 sector inputs for turnaround flights
- Immediate validation warnings on form load
- Verbose flight type descriptions and calculation previews

#### After Redesign

- ✅ **Simplified Input**: Numbers only (123) and airport codes (DXB, KHI)
- ✅ **Clean Interface**: Minimal, professional design matching Upload Roster modal
- ✅ **Complete Grid**: 4 sector inputs for full turnaround routes
- ✅ **Smart Validation**: Progressive error disclosure, no initial warnings
- ✅ **Streamlined Selection**: Simple button-based flight type selection
- ✅ **Professional Aesthetics**: Consistent Skywage branding and spacing

### Technical Specifications

#### File Structure

```
src/
├── components/salary-calculator/
│   ├── FlightEntryForm.tsx          # Enhanced with grid layout
│   ├── FlightTypeSelector.tsx       # Simplified button design
│   ├── FlightNumberInput.tsx        # Number-only input
│   ├── SectorInput.tsx              # Airport code input
│   └── ManualFlightEntry.tsx        # Streamlined container
├── lib/salary-calculator/
│   ├── input-transformers.ts        # NEW: Input transformation system
│   ├── manual-entry-validation.ts   # Updated for new formats
│   └── manual-entry-processor.ts    # Enhanced with transformations
```

#### Integration Points

- **Validation System**: Seamless integration with existing validation framework
- **Data Processing**: Automatic transformation maintains compatibility with existing data structures
- **UI Components**: Consistent with existing Skywage design system
- **Database Operations**: No changes required to database schema or operations

### Quality Assurance

#### Testing Coverage

- ✅ **Input Transformation**: Bidirectional conversion accuracy
- ✅ **Validation Logic**: Simplified format acceptance and error handling
- ✅ **UI Responsiveness**: Grid layout adaptation across screen sizes
- ✅ **User Interaction**: Touch-based validation and progressive disclosure
- ✅ **Data Integrity**: Compatibility with existing flight data

#### Performance Impact

- **Minimal Overhead**: Transformation functions are lightweight
- **No Database Changes**: Existing data structures maintained
- **Improved UX**: Faster user input with simplified formats
- **Clean Code**: Reduced complexity in UI components

### Repository Status

- **Git Commit**: `b07875b` - Phase 7: Complete Manual Entry UI/UX Redesign
- **Files Modified**: 35 files (enhanced/created)
- **Code Quality**: +1,535 insertions, -3,482 deletions (net optimization)
- **Documentation**: Updated implementation plans and specifications
- **Status**: Production ready with enhanced user experience + **LAYOVER DUTIES WORKING**

---

## 🚨 **Known Issues & Future Development (January 29, 2025)**

### **Minor Issues to Address:**

- [ ] **Per diem calculation** - Warning in layover rest period calculation (perDiemRate undefined)
- [ ] **Flight duty card formatting** - Fine-tuning needed for layover duty display
- [ ] **Layover rest period display** - Ensure proper formatting and calculation display

### **Recent Major Achievements:**

- ✅ **CRITICAL POSITION BUG FIXED** - User position selection now properly applied to all salary calculations
- ✅ **Automatic Recalculation System** - Position changes trigger automatic recalculation of all existing data
- ✅ **Database Profile Integration** - Dashboard now reads position from database profile (source of truth)
- ✅ **Event-Driven Updates** - Components automatically refresh when position changes
- ✅ **Layover duty creation** - Successfully creates 2 separate FlightDuty objects for layover flights
- ✅ **Database integration** - Proper saving to Supabase flights table with correct data types
- ✅ **Date handling** - Fixed Date object conversion for database compatibility
- ✅ **Function signatures** - Fixed calculateDutyHours/calculateDuration usage and imports
- ✅ **Error resolution** - Resolved all "function is not defined" errors

### **Critical Position Bug Fix (January 29, 2025):**

**Problem**: User position selection (CCM/SCCM) was not being properly applied to salary calculations. Dashboard was using stale auth metadata instead of current database profile data.

**Root Cause**:

- Dashboard read position from `user?.user_metadata?.position` (auth metadata)
- Profile updates only modified database profile table, not auth metadata
- This caused calculations to use wrong position rates even after profile changes

**Solution Implemented**:

1. **Database Profile as Source of Truth**: Modified dashboard to read position from database profile
2. **Automatic Recalculation**: Added system to recalculate all existing data when position changes
3. **Event-Driven Updates**: Added communication between profile and dashboard components
4. **Loading States**: Added proper loading states to prevent race conditions
5. **Fallback Mechanism**: Maintained auth metadata as fallback for reliability

**Technical Changes**:

- `src/app/(dashboard)/dashboard/page.tsx`: Added database profile position loading
- `src/components/profile/PositionUpdate.tsx`: Added bulk recalculation after position update
- Added event system for cross-component communication
- Created comprehensive test page for validation

**Result**:

- CCM users now get CCM rates (AED 50/hour, 3,275 basic salary)
- SCCM users now get SCCM rates (AED 62/hour, 4,275 basic salary)
- Position changes automatically recalculate ALL existing flight duties
- Dashboard immediately reflects correct calculations

### **Technical Implementation Notes:**

- Layover duties create 2 separate FlightDuty records (outbound + inbound)
- Each duty has proper date, time, and calculation handling
- Database operations work correctly with proper data type conversion
- Console shows successful creation and saving of layover duties
- Position data flows: Database Profile → Dashboard → Calculations (with auth metadata fallback)

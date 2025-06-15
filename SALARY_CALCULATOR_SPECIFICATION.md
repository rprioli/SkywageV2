# Skywage Salary Calculator System - Technical Specification

## Document Information

- **Version**: 2.0
- **Date**: January 2025 (Updated: June 2025)
- **Project**: Skywage V2
- **Scope**: Multi-Airline Cabin Crew Salary Calculator (Starting with Flydubai)
- **Implementation Status**: Phase 8 Completed ✅ - Production Ready System 🚀
- **Current Status**: All critical issues resolved, system production-ready (June 2025)

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

#### 2.2.4 Unpaid Duties

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

**Upload Display Bug**: ❌ Critical issue affecting user experience

- **Problem**: After uploading roster files, flights are not displayed in Flight Duties component
- **Root Cause**: Dashboard always refreshes current month data instead of uploaded month data
- **Impact**: Users can upload data successfully but cannot see uploaded flights on dashboard
- **Technical Details**: `refreshDashboardData()` function hardcoded to fetch current month instead of uploaded month
- **Status**: Issue identified, fix ready to implement

**Next Priority**: Fix upload display issue to restore full functionality

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

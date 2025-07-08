# Changelog

All notable changes to the Skywage V2 project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2025-01-29

### 🚨 CRITICAL BUG FIXES
- **FIXED: User position selection not applied to calculations**
  - Dashboard was using stale auth metadata instead of database profile
  - Position changes (CCM ↔ SCCM) now properly trigger recalculation
  - All existing flight duties automatically recalculated with new rates
  - CCM users now get correct rates: AED 50/hour, 3,275 basic salary
  - SCCM users now get correct rates: AED 62/hour, 4,275 basic salary

### ✨ NEW FEATURES
- **Automatic Recalculation System**: Position changes trigger bulk recalculation of all existing data
- **Event-Driven Updates**: Components automatically refresh when position changes
- **Database Profile Integration**: Dashboard now reads position from database profile (source of truth)
- **Position Test Page**: Added comprehensive test page for validation (`/position-test`)

### 🔧 TECHNICAL IMPROVEMENTS
- Added loading states to prevent operations during position loading
- Enhanced error handling and user feedback in position updates
- Implemented event system for cross-component communication
- Added fallback mechanism to auth metadata for reliability
- Comprehensive logging for debugging and validation

### 📝 FILES MODIFIED
- `src/app/(dashboard)/dashboard/page.tsx`: Added database profile position loading
- `src/components/profile/PositionUpdate.tsx`: Added bulk recalculation after position update
- `src/app/position-test/page.tsx`: Created comprehensive test page (NEW)
- `SALARY_CALCULATOR_SPECIFICATION.md`: Updated with position bug fix documentation

### 🧪 TESTING
- Created step-by-step testing instructions
- Added debug logging for validation (removable after testing)
- Comprehensive test coverage for position changes and recalculation

## [2.0.0] - 2025-01-28

### ✨ MAJOR FEATURES
- **Layover Duty Creation**: Successfully creates 2 separate FlightDuty objects for layover flights
- **Database Integration**: Proper saving to Supabase flights table with correct data types
- **Date Handling**: Fixed Date object conversion for database compatibility
- **Function Signatures**: Fixed calculateDutyHours/calculateDuration usage and imports
- **Error Resolution**: Resolved all "function is not defined" errors

### 🎨 UI/UX IMPROVEMENTS
- Enhanced UI/UX implemented
- Reorganized form layout with separate date handling
- Recurrent duty type fully integrated
- Card-based layouts for flight duties

### 🔧 TECHNICAL IMPROVEMENTS
- Multi-airline salary calculation framework (starting with Flydubai)
- CSV roster file processing and validation
- Manual flight entry and editing capabilities
- Flight duty classification (turnarounds, layovers, standby)
- Real-time recalculation engine

## [1.0.0] - 2024-12-01

### ✨ INITIAL RELEASE
- Basic salary calculator functionality
- User authentication and profiles
- Dashboard with monthly overview
- Flight duties management
- CSV roster upload capability

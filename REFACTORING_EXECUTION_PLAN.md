# Skywage V2 Refactoring Execution Plan

## 📋 Overview

This document outlines a phased approach to refactor the Skywage V2 codebase following the comprehensive lint cleanup. The refactoring focuses on improving maintainability, testability, and performance while maintaining existing functionality.

**Total Phases**: 6 (3 High Priority, 2 Medium Priority, 1 Low Priority)

**Approach**: Incremental refactoring with separate branches, testing, and PRs for each phase.

---

## 🎯 Refactoring Goals

1. Break down large components (dashboard page: 1380 lines → ~300 lines)
2. Eliminate code duplication (4 refresh functions → 1 reusable hook)
3. Improve build configuration (remove error bypasses)
4. Add component and hook tests
5. Consolidate duplicated validation logic
6. Optimize database query patterns

---

## 📊 Phase Summary

| Phase | Priority    | Description                               | Risk Level  | Files Modified | Status      |
| ----- | ----------- | ----------------------------------------- | ----------- | -------------- | ----------- |
| 0     | 🔴 CRITICAL | Pre-Refactoring Verification              | 🟢 VERY LOW | 0 files        | ✅ COMPLETE |
| 1     | 🔴 HIGH     | Fix Build Configuration                   | 🟢 VERY LOW | 34 files       | ✅ COMPLETE |
| 2     | 🔴 HIGH     | Consolidate Refresh Logic                 | � MEDIUM    | 2 files        | ✅ COMPLETE |
| 3     | 🔴 HIGH     | Break Down Dashboard Page                 | 🔴 HIGH     | 3-5 files      | ⏳ PENDING  |
| 3.5   | 🔴 HIGH     | Verify Complex Business Logic             | 🟠 MEDIUM   | 0 files        | ⏳ PENDING  |
| 4     | 🟡 MEDIUM   | Add Component Tests                       | 🟢 LOW      | 4-6 files      | ⏳ PENDING  |
| 5     | 🟡 MEDIUM   | Consolidate Validation & Optimize Queries | � MEDIUM    | 3-4 files      | ⏳ PENDING  |
| 6     | 🟢 LOW      | Code Organization Improvements (OPTIONAL) | 🟢 VERY LOW | 2-3 files      | ⏳ PENDING  |

**Total Estimated Time**: 23-33 hours (excluding optional Phase 6)

**Critical Path**: Phases 0 → 1 → 2 → 3 → 3.5 must be completed in order and tested at each step.

---

## Execution Strategy 🎯

### Recommended Approach:

1. **Start with Phase 0**: Document baseline, create backup
2. **Complete Phases 1-3.5 in order**: These are the critical refactoring phases
3. **Test thoroughly after each phase**: Wait for user confirmation before proceeding
4. **Phases 4-5 can be done together**: Testing and optimization work well together
5. **Phase 6 is optional**: Evaluate necessity after Phase 5

### Key Principles:

- ✅ **One phase at a time**: Complete and test each phase before moving to the next
- ✅ **User testing required**: Wait for user confirmation after Phases 1, 2, 3, and 3.5
- ✅ **Server restart after changes**: Always kill old servers and start fresh
- ✅ **Measure performance**: Document baseline and improvements
- ✅ **No dead code**: Always remove old implementations completely
- ✅ **Rollback ready**: Know how to revert if something goes wrong

### Phase Dependencies:

```
Phase 0 (Verification)
  ↓
Phase 1 (Build Config) ← Must complete Phase 0 first
  ↓
Phase 2 (Refresh Logic) ← Must complete Phase 1 first
  ↓
Phase 3 (Dashboard Breakdown) ← Must complete Phase 2 first
  ↓
Phase 3.5 (Business Logic Verification) ← Must complete Phase 3 first
  ↓
Phase 4 (Component Tests) ← Must complete Phase 3.5 first
  ↓
Phase 5 (Query Optimization) ← Must complete Phase 4 first
  ↓
Phase 6 (Code Organization) ← OPTIONAL, evaluate after Phase 5
```

---

## PHASE 0: Pre-Refactoring Verification ✅ COMPLETE

**Priority**: 🔴 CRITICAL
**Branch**: N/A (work on main branch)
**Risk Level**: 🟢 VERY LOW
**Status**: ✅ **COMPLETED** - 2025-01-04
**Must Complete Before Phase 1**

### Purpose:

Verify that the codebase is in a clean, stable state before beginning any refactoring work. This phase ensures that all subsequent phases start from a known-good baseline.

### Verification Steps:

#### 1. **Verify Build is Clean**

```bash
# Run lint check
npm run lint
# Expected: 0 errors, 0 warnings

# Run TypeScript build
npm run build
# Expected: Build completes successfully with no errors

# Run existing tests (if any)
npm run test
# Expected: All tests pass
```

#### 2. **Document Current State**

Create a baseline metrics file:

```bash
# Count lines in dashboard page
wc -l src/app/(dashboard)/dashboard/page.tsx
# Expected: ~1380 lines

# Count total files
find src -name "*.tsx" -o -name "*.ts" | wc -l

# List all hooks
ls -la src/hooks/
```

#### 3. **Create Backup Branch**

```bash
git checkout main
git pull origin main
git checkout -b backup/pre-refactoring
git push -u origin backup/pre-refactoring
git checkout main
```

#### 4. **Manual Testing - Critical User Flows**

Test all critical functionality to establish baseline:

- [ ] User can log in successfully
- [ ] Dashboard loads without errors
- [ ] Monthly calculations display correctly
- [ ] Flight duties display correctly
- [ ] Can upload CSV roster file
- [ ] Can upload Excel roster file
- [ ] Can add manual flight entry
- [ ] Can delete single flight
- [ ] Can delete all flights
- [ ] Month selection works
- [ ] Layover pairs display correctly
- [ ] Turnaround flights display correctly
- [ ] All duty types render correctly (ASBY, Recurrent, etc.)
- [ ] Salary calculations are accurate
- [ ] No console errors in browser

#### 5. **Verify Lint Cleanup Completion**

Confirm that the "comprehensive lint cleanup" mentioned in the plan was actually completed:

```bash
# Check for any remaining lint issues
npm run lint -- --max-warnings 0

# Check for any TypeScript errors
npx tsc --noEmit
```

#### 6. **Document Environment**

Record current environment for reference:

```bash
node --version
npm --version
cat package.json | grep "next\|react\|typescript"
```

### Verification Checklist:

- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run build` completes successfully
- [ ] `npm run test` passes (if tests exist)
- [ ] Backup branch created and pushed
- [ ] All critical user flows tested and working
- [ ] Current state documented (line counts, file counts)
- [ ] No console errors in browser
- [ ] Environment versions documented
- [ ] Ready to proceed to Phase 1

### If Verification Fails:

**DO NOT PROCEED** with refactoring until issues are resolved:

1. Document all failures
2. Fix issues on main branch
3. Re-run verification
4. Only proceed when all checks pass

---

## PHASE 1: Fix Build Configuration ✅ COMPLETE

**Priority**: 🔴 HIGH
**Branch**: `refactor/fix-build-config`
**Risk Level**: 🟢 VERY LOW
**Status**: ✅ **COMPLETED** - 2025-01-04
**Dependencies**: Must complete Phase 0 first
**Issues Fixed**: Build allows errors to pass through

### Completion Summary:

**What Was Accomplished:**

1. ✅ **Removed build bypasses** from `next.config.ts`

   - Removed `ignoreDuringBuilds: true` for ESLint
   - Removed `ignoreBuildErrors: true` for TypeScript

2. ✅ **Fixed 40+ TypeScript errors** across 34 files

   - Type assertions, null checks, ref callbacks
   - Fixed array spreading, property access
   - Fixed type definitions and interfaces
   - Fixed database schema compatibility

3. ✅ **Fixed database schema issues**

   - Made new schema columns optional for backward compatibility
   - Added fallback values for missing/invalid data
   - Made `rowToFlightDuty` robust to handle corrupted data
   - Fixed time format parsing (HH:MM and HH:MM:SS support)

4. ✅ **Build passing cleanly**
   - Only 2 non-blocking ESLint warnings (img tags)
   - All TypeScript errors resolved
   - All features working correctly

**Files Modified:** 34 files total

- `next.config.ts`
- `middleware.ts`
- `src/lib/supabase.ts`
- `src/lib/database/flights.ts`
- `src/lib/salary-calculator/time-calculator.ts`
- `src/lib/salary-calculator/*` (multiple files)
- `src/components/*` (multiple files)
- `src/types/*` (multiple files)

**Testing Results:**

- ✅ Login/authentication works
- ✅ Dashboard loads correctly
- ✅ Flight duties display with correct timings
- ✅ Upload roster works (CSV and Excel)
- ✅ Manual flight entry works
- ✅ Delete operations work (single, bulk, all)
- ✅ Layover rest periods calculated correctly
- ✅ Per diem pay calculated correctly

**Next Steps:** Ready to commit and create PR for Phase 1

### Problem:

Build configuration currently allows ESLint and TypeScript errors to pass through to production, which defeats the purpose of type safety and linting.

### Pre-Phase Verification:

**CRITICAL**: Before making any changes, verify Phase 0 was completed successfully:

- [ ] Phase 0 verification checklist is complete
- [ ] `npm run lint` currently passes with 0 errors
- [ ] `npm run build` currently succeeds

**If Phase 0 verification failed**: DO NOT proceed with this phase. Fix issues first.

### Files to Modify:

#### 1. **next.config.ts**

**Current State (Lines 6-17):**

```typescript
eslint: {
  // Warning: This allows production builds to successfully complete even if
  // your project has ESLint errors.
  ignoreDuringBuilds: true,
},
typescript: {
  // !! WARN !!
  // Dangerously allow production builds to successfully complete even if
  // your project has type errors.
  // !! WARN !!
  ignoreBuildErrors: true,
},
```

**Changes:**

- Remove `ignoreDuringBuilds: true` from eslint config
- Remove `ignoreBuildErrors: true` from typescript config
- Keep image optimization settings (required for static export)

**Expected Result:**

```typescript
eslint: {
  // ESLint errors will now fail the build
},
typescript: {
  // TypeScript errors will now fail the build
},
```

### Testing Checklist:

- [ ] Kill all existing dev servers
- [ ] Clear Next.js cache: `rm -rf .next`
- [ ] `npm run build` completes successfully
- [ ] No ESLint errors in build output
- [ ] No TypeScript errors in build output
- [ ] Start fresh server: `npm run dev`
- [ ] Application runs correctly in development mode
- [ ] Test in browser with hard refresh (Ctrl+Shift+R)
- [ ] All existing functionality works
- [ ] No console errors in browser
- [ ] No terminal warnings

### Git Commands:

```bash
git checkout main
git pull origin main
git checkout -b refactor/fix-build-config

# Make changes to next.config.ts

npm run build
npm run dev
# Test application

git add next.config.ts
git commit -m "refactor: remove build error bypasses from Next.js config

- Remove ignoreDuringBuilds from ESLint config
- Remove ignoreBuildErrors from TypeScript config
- Ensures build fails on errors, preventing broken code deployment
- Safe to remove after comprehensive lint cleanup completion"

git push -u origin refactor/fix-build-config

# Create PR, wait for approval, merge, delete branch
```

---

## PHASE 2: Consolidate Refresh Logic 🔄 ✅ COMPLETE

**Priority**: 🔴 HIGH
**Branch**: `refactor/consolidate-refresh-logic`
**Risk Level**: � MEDIUM
**Dependencies**: Must complete Phase 1 first
**Issues Fixed**: 4 duplicated refresh functions
**Status**: ✅ COMPLETE - Committed e625e31, pushed to origin
**Actual Results**: Dashboard reduced by 216 lines (1380 → 1164), all tests passing

### Problem:

Dashboard page has 4 different functions doing essentially the same thing:

1. `refreshDataAfterDelete()` (68 lines)
2. `refreshDataAfterBulkDelete()` (65 lines)
3. `refreshDashboardData()` (36 lines)
4. `handleManualEntrySuccess()` (61 lines)

All fetch monthly calculations and flight duties with slight variations.

### Risk Assessment:

**Why MEDIUM risk**:

- Consolidating 4 functions with subtle differences
- Risk of losing important edge case handling
- State management complexity with callbacks
- Potential for breaking refresh functionality

### Pre-Phase Analysis:

**REQUIRED**: Before creating the hook, analyze all 4 functions:

1. Create comparison table of differences:

   - What parameters does each take?
   - What state does each update?
   - Are there any unique behaviors?
   - What error handling does each have?

2. Identify commonalities:

   - All call `recalculateMonthlyTotals`
   - All fetch monthly calculations
   - All fetch flight duties
   - All update state via callbacks

3. Identify differences to preserve:
   - Different month/year handling
   - Different error messages
   - Different loading state management

### Solution:

Create a single reusable `useDataRefresh` custom hook that handles all refresh scenarios while preserving all unique behaviors.

### Files to Create:

#### 1. **src/hooks/useDataRefresh.ts** (NEW FILE)

**Purpose**: Centralized data refresh logic for dashboard

**TypeScript Interface**:

```typescript
import {
  FlightDuty,
  MonthlyCalculation,
  Position,
} from "@/types/salary-calculator";

interface UseDataRefreshOptions {
  userId: string;
  position: Position;
  selectedMonth: number;
  selectedYear: number;
  onCalculationsUpdate: (
    current: MonthlyCalculation | null,
    all: MonthlyCalculation[]
  ) => void;
  onFlightDutiesUpdate: (duties: FlightDuty[]) => void;
  onError: (error: string) => void;
}

interface UseDataRefreshReturn {
  // Refresh after deleting a single flight
  refreshAfterDelete: (month?: number, year?: number) => Promise<void>;

  // Refresh after bulk delete (determines month from deleted flights)
  refreshAfterBulkDelete: (deletedFlights: FlightDuty[]) => Promise<void>;

  // General dashboard refresh (uses selected month/year)
  refreshDashboard: () => Promise<void>;

  // Refresh after manual entry (uses provided month/year)
  refreshAfterManualEntry: (month: number, year: number) => Promise<void>;

  // Loading state
  isRefreshing: boolean;
}

export function useDataRefresh(
  options: UseDataRefreshOptions
): UseDataRefreshReturn;
```

**Implementation Requirements**:

- Handles recalculation via `recalculateMonthlyTotals`
- Fetches monthly calculations via `getMonthlyCalculation` and `getAllMonthlyCalculations`
- Fetches flight duties via `getFlightDutiesByMonth`
- Updates state via provided callbacks
- Proper error handling with descriptive messages
- Loading state management
- Preserves all unique behaviors from original 4 functions

### Files to Modify:

#### 2. **src/app/(dashboard)/dashboard/page.tsx**

**Changes**:

- Import `useDataRefresh` hook
- Remove `refreshDataAfterDelete()` function (lines ~328-396)
- Remove `refreshDataAfterBulkDelete()` function (lines ~902-967)
- Remove `refreshDashboardData()` function (lines ~554-590)
- Remove refresh logic from `handleManualEntrySuccess()` (lines ~732-793)
- Replace all 4 functions with calls to `useDataRefresh` methods

**Expected Line Reduction**: ~230 lines removed from dashboard page

### Verification Before Commit:

**CRITICAL**: Verify old code is completely removed:

- [ ] `refreshDataAfterDelete()` function completely removed (no dead code)
- [ ] `refreshDataAfterBulkDelete()` function completely removed
- [ ] `refreshDashboardData()` function completely removed
- [ ] Refresh logic in `handleManualEntrySuccess()` completely removed
- [ ] No commented-out old code remaining
- [ ] All imports updated correctly
- [ ] No unused variables or functions

### Testing Checklist:

- [ ] Kill all existing dev servers
- [ ] Clear Next.js cache: `rm -rf .next`
- [ ] Start fresh server: `npm run dev`
- [ ] Delete single flight works correctly
- [ ] Delete all flights works correctly
- [ ] Bulk delete works correctly
- [ ] Manual entry success refreshes data
- [ ] Dashboard data refreshes on mount
- [ ] Monthly calculations update correctly
- [ ] Flight duties update correctly
- [ ] Error handling works (test with network offline)
- [ ] Loading states display correctly
- [ ] No console errors in browser
- [ ] No terminal warnings
- [ ] Test with hard refresh (Ctrl+Shift+R)

### Git Commands:

```bash
git checkout main
git pull origin main
git checkout -b refactor/consolidate-refresh-logic

# Create src/hooks/useDataRefresh.ts
# Modify src/app/(dashboard)/dashboard/page.tsx

npm run lint
npm run dev
# Test all refresh scenarios

git add src/hooks/useDataRefresh.ts src/app/(dashboard)/dashboard/page.tsx
git commit -m "refactor: consolidate duplicated refresh logic into useDataRefresh hook

- Create useDataRefresh custom hook for centralized refresh logic
- Remove 4 duplicated refresh functions from dashboard page
- Reduce dashboard page by ~230 lines
- Improve maintainability and consistency
- Single source of truth for data refresh operations"

git push -u origin refactor/consolidate-refresh-logic

# Create PR, wait for approval, merge, delete branch
```

---

## PHASE 3: Break Down Dashboard Page 📦

**Priority**: 🔴 HIGH
**Branch**: `refactor/break-down-dashboard`
**Risk Level**: � HIGH
**Dependencies**: Must complete Phase 2 first
**Issues Fixed**: Dashboard page complexity (1380 lines)

### Problem:

Dashboard page is 1380 lines with multiple responsibilities:

- State management (10+ useState hooks)
- Data fetching (4+ useEffect hooks)
- File upload handling
- Manual entry handling
- Delete operations
- UI rendering
- Month selection

### Risk Assessment:

**Why HIGH risk**:

- Extracting 1000+ lines of complex code
- Complex state management across multiple components
- Previous issues with incomplete component extraction (from memories)
- Layover pair logic is complex and easy to break
- Month selection state shared across components
- Risk of introducing re-rendering issues

### Pre-Phase Planning:

**REQUIRED**: Before creating components, plan state management:

1. **Identify State Categories**:

   - Global state (user, position) → Keep in dashboard or use context
   - Shared state (month, year) → Lift to dashboard, pass as props
   - Local state (loading, errors) → Move to individual components
   - Derived state (calculations, duties) → Move to custom hooks

2. **Plan Component Hierarchy**:

   ```
   Dashboard (main page)
   ├── useFlightDuties hook (data fetching)
   ├── useMonthlyCalculations hook (data fetching)
   ├── useDataRefresh hook (from Phase 2)
   ├── MonthSelector component (UI)
   ├── RosterUploadSection component (UI + logic)
   ├── ManualEntrySection component (UI + logic)
   └── FlightDutiesManager component (existing, already extracted)
   ```

3. **Plan Props Flow**:
   - Dashboard → MonthSelector: selectedMonth, onMonthChange, calculations
   - Dashboard → RosterUploadSection: userId, position, onSuccess
   - Dashboard → ManualEntrySection: position, onSuccess
   - Dashboard → FlightDutiesManager: duties, onDelete, onBulkDelete

### Solution:

Extract logic into custom hooks and sub-components with careful state management and memoization.

### Files to Create:

#### 1. **src/hooks/useFlightDuties.ts** (NEW FILE)

**Purpose**: Manage flight duties data fetching and state

**TypeScript Interface**:

```typescript
interface UseFlightDutiesReturn {
  flightDuties: FlightDuty[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFlightDuties(
  userId: string,
  month: number,
  year: number
): UseFlightDutiesReturn;
```

**Implementation Requirements**:

- Fetches flight duties on mount and when month/year changes
- Handles loading and error states
- Provides refetch function for manual refresh
- Uses `getFlightDutiesByMonth` from database layer

#### 2. **src/hooks/useMonthlyCalculations.ts** (NEW FILE)

**Purpose**: Manage monthly calculations data fetching and state

**TypeScript Interface**:

```typescript
interface UseMonthlyCalculationsReturn {
  currentCalculation: MonthlyCalculation | null;
  allCalculations: MonthlyCalculation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMonthlyCalculations(
  userId: string,
  month: number,
  year: number
): UseMonthlyCalculationsReturn;
```

**Implementation Requirements**:

- Fetches both current and all calculations
- Handles loading and error states
- Provides refetch function
- Uses `getMonthlyCalculation` and `getAllMonthlyCalculations`

#### 3. **src/components/dashboard/RosterUploadSection.tsx** (NEW FILE)

**Purpose**: Handle roster upload UI and logic

**TypeScript Interface**:

```typescript
interface RosterUploadSectionProps {
  userId: string;
  position: Position;
  selectedMonth: number;
  selectedYear: number;
  onUploadSuccess: () => void;
}

export const RosterUploadSection = React.memo<RosterUploadSectionProps>(
  ({ userId, position, selectedMonth, selectedYear, onUploadSuccess }) => {
    // Component implementation
  }
);
```

**Features**:

- Upload dialog with file input
- File validation (CSV and Excel)
- Processing status display
- Success/error handling with toast notifications
- Replacement confirmation dialog
- Wrapped in React.memo for performance

#### 4. **src/components/dashboard/ManualEntrySection.tsx** (NEW FILE)

**Purpose**: Handle manual entry UI and logic

**TypeScript Interface**:

```typescript
interface ManualEntrySectionProps {
  position: Position;
  onEntrySuccess: (month: number, year: number) => void;
}

export const ManualEntrySection = React.memo<ManualEntrySectionProps>(
  ({ position, onEntrySuccess }) => {
    // Component implementation
  }
);
```

**Features**:

- Manual entry dialog
- Form handling with validation
- Batch entry support
- Success/error handling
- Wrapped in React.memo for performance

#### 5. **src/components/dashboard/MonthSelector.tsx** (NEW FILE)

**Purpose**: Month selection UI component

**TypeScript Interface**:

```typescript
interface MonthSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  monthlyCalculations: MonthlyCalculation[];
}

export const MonthSelector = React.memo<MonthSelectorProps>(
  ({ selectedMonth, selectedYear, onMonthChange, monthlyCalculations }) => {
    // Component implementation
  }
);
```

**Features**:

- Month buttons with calculations display
- Highlight current month
- Show salary totals for each month
- Memoized to prevent unnecessary re-renders
- Uses useMemo for filtered/sorted month data

### Files to Modify:

#### 6. **src/app/(dashboard)/dashboard/page.tsx**

**Changes**:

- Import new hooks: `useFlightDuties`, `useMonthlyCalculations`, `useDataRefresh`
- Import new components: `RosterUploadSection`, `ManualEntrySection`, `MonthSelector`
- Remove data fetching logic (move to hooks)
- Remove upload handling logic (move to RosterUploadSection)
- Remove manual entry logic (move to ManualEntrySection)
- Remove month selection UI (move to MonthSelector)
- Simplify to ~300 lines focused on layout and composition
- **CRITICAL**: Use useCallback for all callback props to prevent re-renders

**Memoization Strategy**:

```typescript
// Memoize all callbacks passed to child components
const handleMonthChange = useCallback((month: number) => {
  setSelectedMonth(month);
}, []);

const handleUploadSuccess = useCallback(() => {
  refreshDashboard();
}, [refreshDashboard]);

const handleEntrySuccess = useCallback(
  (month: number, year: number) => {
    refreshAfterManualEntry(month, year);
  },
  [refreshAfterManualEntry]
);

const handleDelete = useCallback(
  (flight: FlightDuty) => {
    // Delete logic
  },
  [
    /* dependencies */
  ]
);
```

**Expected Result**: Dashboard page reduced from 1380 lines to ~300 lines

### Verification Before Commit:

**CRITICAL**: Ensure complete extraction and no dead code:

- [ ] All data fetching logic moved to hooks
- [ ] All upload logic moved to RosterUploadSection
- [ ] All manual entry logic moved to ManualEntrySection
- [ ] All month selection UI moved to MonthSelector
- [ ] No commented-out old code remaining
- [ ] All callbacks wrapped in useCallback
- [ ] All components wrapped in React.memo
- [ ] No unnecessary re-renders (verify with React DevTools Profiler)
- [ ] Old component definitions completely removed

### Testing Checklist:

- [ ] Kill all existing dev servers
- [ ] Clear Next.js cache: `rm -rf .next`
- [ ] Start fresh server: `npm run dev`
- [ ] Dashboard loads correctly
- [ ] Monthly calculations display correctly
- [ ] Flight duties display correctly
- [ ] Month selection works
- [ ] Roster upload works (CSV and Excel)
- [ ] Manual entry works (single and batch)
- [ ] Delete operations work (single, bulk, all)
- [ ] All refresh scenarios work
- [ ] Loading states display correctly
- [ ] Error handling works
- [ ] No console errors in browser
- [ ] No terminal warnings
- [ ] No performance regressions (check with DevTools)
- [ ] Test with hard refresh (Ctrl+Shift+R)
- [ ] **CRITICAL BUSINESS LOGIC TESTS** (see Phase 3.5)

### Git Commands:

```bash
git checkout main
git pull origin main
git checkout -b refactor/break-down-dashboard

# Create new hooks and components
# Modify dashboard page

npm run lint
npm run dev
# Test all dashboard functionality thoroughly

git add src/hooks/useFlightDuties.ts src/hooks/useMonthlyCalculations.ts
git add src/components/dashboard/RosterUploadSection.tsx
git add src/components/dashboard/ManualEntrySection.tsx
git add src/components/dashboard/MonthSelector.tsx
git add src/app/(dashboard)/dashboard/page.tsx
git commit -m "refactor: break down dashboard page into hooks and components

- Extract data fetching into useFlightDuties and useMonthlyCalculations hooks
- Extract upload logic into RosterUploadSection component
- Extract manual entry logic into ManualEntrySection component
- Extract month selection into MonthSelector component
- Reduce dashboard page from 1380 lines to ~300 lines
- Add React.memo and useCallback for performance
- Improve maintainability, testability, and performance
- Follow Single Responsibility Principle"

git push -u origin refactor/break-down-dashboard

# Create PR, wait for approval, merge, delete branch
# ⚠️ WAIT FOR USER TESTING CONFIRMATION before proceeding to Phase 3.5
```

---

## PHASE 3.5: Verify Complex Business Logic 🔍

**Priority**: 🔴 HIGH
**Branch**: N/A (testing on refactor/break-down-dashboard branch)
**Risk Level**: 🟠 MEDIUM
**Dependencies**: Must complete Phase 3 first
**Purpose**: Verify all complex business logic still works after dashboard extraction

### Problem:

Phase 3 extracted 1000+ lines of code. Complex business logic could have been broken during extraction, especially:

- Layover pair identification and navigation
- Cross-day flight calculations
- Date-aware rate selection
- Special duty type handling

### Critical Business Logic Tests:

#### **Layover Functionality**:

- [ ] Layover pairs are correctly identified
- [ ] Layover navigation arrows work (left/right between outbound/inbound)
- [ ] Layover rest period displays on outbound segment only
- [ ] Layover rest hours calculated correctly
- [ ] Layover per diem pay calculated correctly (8.82 AED/hour)
- [ ] Layover pair deletion works (deletes both flights)

#### **Flight Calculations**:

- [ ] Cross-day turnaround flights calculate correctly
- [ ] Cross-day layover flights calculate correctly
- [ ] Duty hours calculated correctly for all duty types
- [ ] Flight pay calculated correctly for all duty types

#### **Date-Aware Rates**:

- [ ] Legacy rates (pre-2025) applied correctly
- [ ] New rates (2025+) applied correctly
- [ ] Calculations for historical months use correct rates
- [ ] Calculations for current/future months use correct rates

#### **Special Duty Types**:

- [ ] ASBY (Airport Standby) shows 4 hours at flight rate
- [ ] Regular recurrent training shows 4-hour pay
- [ ] ELD recurrent training shows 0 AED
- [ ] Home Standby shows 0 AED (no pay badge)
- [ ] Business Promotion calculates correctly
- [ ] Ground duties display correctly
- [ ] Rest days are filtered out (not displayed)

#### **Position-Based Calculations**:

- [ ] CCM position calculations correct
- [ ] SCCM position calculations correct
- [ ] Position change updates all calculations

#### **Batch Operations**:

- [ ] Manual entry batch mode works
- [ ] Can add multiple flights to batch
- [ ] Can save batch with incomplete new form
- [ ] Batch validation works correctly

#### **Delete Operations**:

- [ ] Single flight delete works
- [ ] Layover pair delete works (both flights)
- [ ] Bulk delete works
- [ ] Delete all flights works
- [ ] Delete updates calculations correctly

#### **Month Selection**:

- [ ] Month selection state persists
- [ ] Changing month updates all data
- [ ] Month with no data displays correctly
- [ ] Current month highlighted correctly

#### **Roster Upload**:

- [ ] CSV upload works
- [ ] Excel upload works
- [ ] Roster replacement confirmation works
- [ ] Month selection preserved during upload
- [ ] Upload processes all duty types correctly

### Edge Case Testing Matrix:

| Scenario                     | Expected Behavior                  | Status |
| ---------------------------- | ---------------------------------- | ------ |
| Layover with missing inbound | Shows single card, no navigation   | [ ]    |
| Cross-day turnaround         | Correct duty hours calculation     | [ ]    |
| ELD recurrent training       | 0 AED payment                      | [ ]    |
| Regular recurrent training   | 4-hour flight pay                  | [ ]    |
| Batch entry with errors      | Shows validation, allows save      | [ ]    |
| Delete all flights           | Clears table, updates calculations | [ ]    |
| Month with no data           | Shows empty state                  | [ ]    |
| Legacy rate period           | Uses old rates                     | [ ]    |
| New rate period              | Uses new rates                     | [ ]    |
| CCM calculations             | Correct CCM rates                  | [ ]    |
| SCCM calculations            | Correct SCCM rates                 | [ ]    |

### If Any Test Fails:

**DO NOT PROCEED** to Phase 4 until fixed:

1. Document the failure in detail
2. Identify which component/hook caused the issue
3. Fix the issue
4. Re-run all tests
5. Only proceed when ALL tests pass

### Success Criteria:

- [ ] All layover functionality tests pass
- [ ] All flight calculation tests pass
- [ ] All date-aware rate tests pass
- [ ] All special duty type tests pass
- [ ] All position-based calculation tests pass
- [ ] All batch operation tests pass
- [ ] All delete operation tests pass
- [ ] All month selection tests pass
- [ ] All roster upload tests pass
- [ ] All edge cases pass
- [ ] User confirms all functionality works correctly

**⚠️ WAIT FOR USER TESTING CONFIRMATION before proceeding to Phase 4**

---

## PHASE 4: Add Component Tests 🧪

**Priority**: 🟡 MEDIUM
**Branch**: `refactor/add-component-tests`
**Risk Level**: 🟢 LOW
**Dependencies**: Must complete Phase 3.5 first
**Issues Fixed**: Limited test coverage

### Problem:

Current test coverage is limited to core calculation utilities. No tests exist for:

- React components
- Custom hooks
- Database operations
- Upload/manual entry processors

### Solution:

Add tests for critical components and hooks to ensure refactoring doesn't introduce regressions.

### Setup Required:

**Install Testing Dependencies** (if not already installed):

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event @testing-library/react-hooks vitest @vitejs/plugin-react jsdom
```

**Create Vitest Config** (if not exists):

Create `vitest.config.ts` with React testing setup:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Create Test Setup File**:

Create `src/__tests__/setup.ts`:

```typescript
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
    },
  },
}));

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
}));

// Mock toast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));
```

### Mocking Strategy:

**For Database Operations**:

```typescript
import { vi } from "vitest";
import * as flightsDb from "@/lib/database/flights";

// Mock specific database functions
vi.spyOn(flightsDb, "getFlightDutiesByMonth").mockResolvedValue({
  data: mockFlightDuties,
  error: null,
});
```

**For Authentication**:

```typescript
import { useAuth } from "@/hooks/useAuth";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
    loading: false,
  }),
}));
```

**For File Upload**:

```typescript
// Mock File API
const mockFile = new File(["roster data"], "roster.csv", { type: "text/csv" });
```

### Files to Create:

#### 1. **src/hooks/**tests**/useDataRefresh.test.ts** (NEW FILE)

**Purpose**: Test the consolidated refresh logic hook

**Test Cases**:

- ✅ Refreshes data after single delete
- ✅ Refreshes data after bulk delete
- ✅ Refreshes dashboard data
- ✅ Refreshes after manual entry
- ✅ Handles errors correctly
- ✅ Updates loading states

#### 2. **src/hooks/**tests**/useFlightDuties.test.ts** (NEW FILE)

**Purpose**: Test flight duties data fetching hook

**Test Cases**:

- ✅ Fetches flight duties on mount
- ✅ Refetches when month/year changes
- ✅ Handles loading states
- ✅ Handles errors
- ✅ Refetch function works

#### 3. **src/hooks/**tests**/useMonthlyCalculations.test.ts** (NEW FILE)

**Purpose**: Test monthly calculations data fetching hook

**Test Cases**:

- ✅ Fetches calculations on mount
- ✅ Refetches when month/year changes
- ✅ Handles loading states
- ✅ Handles errors
- ✅ Returns current and all calculations

#### 4. **src/hooks/**tests**/useStatisticsData.test.ts** (NEW FILE)

**Purpose**: Test statistics data hook

**Test Cases**:

- ✅ Fetches statistics data
- ✅ Calculates monthly trends
- ✅ Handles loading states
- ✅ Handles errors

#### 5. **src/components/salary-calculator/**tests**/FlightDutiesManager.test.tsx** (NEW FILE)

**Purpose**: Test FlightDutiesManager component

**Test Cases**:

- ✅ Renders flight duties table
- ✅ Opens delete dialog on delete click
- ✅ Deletes single flight
- ✅ Deletes layover pair
- ✅ Deletes all flights
- ✅ Shows success/error toasts
- ✅ Calls callbacks correctly

#### 6. **src/components/salary-calculator/**tests**/ManualFlightEntry.test.tsx** (NEW FILE)

**Purpose**: Test ManualFlightEntry component

**Test Cases**:

- ✅ Renders form
- ✅ Submits single entry
- ✅ Adds to batch
- ✅ Saves batch
- ✅ Shows success/error states
- ✅ Calls callbacks correctly

### Testing Checklist:

- [ ] All new tests pass
- [ ] Test coverage increases
- [ ] No existing tests broken
- [ ] `npm run test` completes successfully
- [ ] Tests are meaningful and catch regressions

### Git Commands:

```bash
git checkout main
git pull origin main
git checkout -b refactor/add-component-tests

# Install testing dependencies (if needed)
# Create vitest.config.ts (if needed)
# Create test files

npm run test
npm run lint

git add src/hooks/__tests__/ src/components/salary-calculator/__tests__/
git add vitest.config.ts  # if created
git add package.json package-lock.json  # if dependencies added
git commit -m "refactor: add component and hook tests

- Add tests for useDataRefresh hook
- Add tests for useFlightDuties hook
- Add tests for useMonthlyCalculations hook
- Add tests for useStatisticsData hook
- Add tests for FlightDutiesManager component
- Add tests for ManualFlightEntry component
- Improve test coverage for critical functionality
- Ensure refactoring doesn't introduce regressions"

git push -u origin refactor/add-component-tests

# Create PR, wait for approval, merge, delete branch
```

---

## PHASE 5: Consolidate Validation & Optimize Queries ⚡

**Priority**: 🟡 MEDIUM
**Branch**: `refactor/validation-and-optimization`
**Risk Level**: � MEDIUM
**Dependencies**: Must complete Phase 4 first
**Issues Fixed**: Duplicated validation, sequential database calls

### Problem 1: Duplicated File Validation

Two identical validation functions exist:

- `validateCSVFile()` in `src/lib/salary-calculator/csv-validator.ts`
- `validateCSVFileQuick()` in `src/lib/salary-calculator/upload-processor.ts`

### Problem 2: Sequential Database Calls

Refresh functions make sequential database calls that could be parallelized:

```typescript
const recalcResult = await recalculateMonthlyTotals(...);
const calculationResult = await getMonthlyCalculation(...);
const allCalculationsResult = await getAllMonthlyCalculations(...);
const flightDutiesResult = await getFlightDutiesByMonth(...);
```

### Risk Assessment:

**Why MEDIUM risk**:

- Query parallelization can introduce race conditions
- Some queries have dependencies (recalculation must complete first)
- Incorrect parallelization could lead to stale data
- Performance changes need measurement to verify improvements

### Pre-Phase Analysis:

**REQUIRED**: Analyze query dependencies before parallelizing:

#### **Query Dependency Analysis**:

**MUST be sequential** (dependent):

```typescript
// Recalculation MUST complete before fetching new data
const recalcResult = await recalculateMonthlyTotals(
  userId,
  month,
  year,
  position
);

// Then fetch updated data (can be parallel)
const [calculation, allCalculations, flightDuties] = await Promise.all([
  getMonthlyCalculation(userId, month, year),
  getAllMonthlyCalculations(userId),
  getFlightDutiesByMonth(userId, month, year),
]);
```

**CAN be parallel** (independent):

```typescript
// These don't depend on each other
const [calculation, allCalculations, flightDuties] = await Promise.all([
  getMonthlyCalculation(userId, month, year),
  getAllMonthlyCalculations(userId),
  getFlightDutiesByMonth(userId, month, year),
]);
```

**CANNOT be parallel** (would cause issues):

```typescript
// ❌ WRONG - recalculation must complete first
const [recalcResult, calculation] = await Promise.all([
  recalculateMonthlyTotals(userId, month, year, position),
  getMonthlyCalculation(userId, month, year), // Would get stale data!
]);
```

### Solution:

1. Remove duplicate validation function
2. Optimize database queries with `Promise.all()` (only where safe)
3. Add memoization for expensive calculations
4. Measure performance improvements

### Files to Modify:

#### 1. **src/lib/salary-calculator/upload-processor.ts**

**Changes**:

- Remove `validateCSVFileQuick()` function (lines 430-455)
- Import `validateCSVFile` from `csv-validator.ts`
- Update all references to use imported function

#### 2. **src/hooks/useDataRefresh.ts**

**Changes**:

- Optimize database queries using `Promise.all()` where safe
- **CRITICAL**: Maintain dependency order (recalculation → fetch)
- Example:

```typescript
// Before (all sequential)
const recalcResult = await recalculateMonthlyTotals(
  userId,
  month,
  year,
  position
);
const calculationResult = await getMonthlyCalculation(userId, month, year);
const allCalculationsResult = await getAllMonthlyCalculations(userId);
const flightDutiesResult = await getFlightDutiesByMonth(userId, month, year);

// After (optimized with correct dependencies)
// Step 1: Recalculation MUST complete first
const recalcResult = await recalculateMonthlyTotals(
  userId,
  month,
  year,
  position
);

// Step 2: Fetch operations can be parallel (they don't depend on each other)
const [calculationResult, allCalculationsResult, flightDutiesResult] =
  await Promise.all([
    getMonthlyCalculation(userId, month, year),
    getAllMonthlyCalculations(userId),
    getFlightDutiesByMonth(userId, month, year),
  ]);
```

**Performance Measurement**:

Add timing to measure improvements:

```typescript
const startTime = performance.now();
// ... optimized code ...
const endTime = performance.now();
console.log(`Refresh completed in ${endTime - startTime}ms`);
```

#### 3. **src/hooks/useStatisticsData.ts**

**Changes**:

- Add `useMemo` for expensive calculations
- Memoize monthly trends calculation
- Memoize chart data preparation
- Example:

```typescript
// Memoize expensive calculations
const monthlyTrends = useMemo(() => {
  return calculateMonthlyTrends(monthlyCalculations);
}, [monthlyCalculations]);

const chartData = useMemo(() => {
  return prepareChartData(statisticsData);
}, [statisticsData]);
```

#### 4. **src/components/dashboard/MonthSelector.tsx** (if created in Phase 3)

**Changes**:

- Add `useMemo` for filtered/sorted month data
- Prevent unnecessary re-renders
- Example:

```typescript
const sortedMonths = useMemo(() => {
  return monthlyCalculations
    .filter((calc) => calc.totalSalary > 0)
    .sort((a, b) => a.month - b.month);
}, [monthlyCalculations]);
```

### Performance Targets:

**Measure before and after**:

- [ ] Data refresh time: Target 30% reduction
- [ ] Statistics page load: Target 20% reduction
- [ ] Component re-renders: Target 50% reduction

**How to measure**:

- Use `console.time()` / `console.timeEnd()` for timing
- Use React DevTools Profiler for re-renders
- Document baseline and improved times

### Testing Checklist:

- [ ] Kill all existing dev servers
- [ ] Clear Next.js cache: `rm -rf .next`
- [ ] Start fresh server: `npm run dev`
- [ ] CSV upload works correctly
- [ ] Excel upload works correctly
- [ ] Validation errors display correctly
- [ ] **Measure**: Data refresh time (before/after)
- [ ] **Measure**: Statistics page load time (before/after)
- [ ] **Measure**: Component re-renders (before/after)
- [ ] Data refresh is faster (verify with measurements)
- [ ] Statistics page loads faster (verify with measurements)
- [ ] No console errors in browser
- [ ] No terminal warnings
- [ ] No regressions in functionality
- [ ] `npm run lint` passes
- [ ] Test with hard refresh (Ctrl+Shift+R)

### Git Commands:

```bash
git checkout main
git pull origin main
git checkout -b refactor/validation-and-optimization

# Modify files

npm run lint
npm run dev
# Test upload, refresh, and statistics functionality

git add src/lib/salary-calculator/upload-processor.ts
git add src/hooks/useDataRefresh.ts
git add src/hooks/useStatisticsData.ts
git add src/components/dashboard/MonthSelector.tsx  # if applicable
git commit -m "refactor: consolidate validation and optimize database queries

- Remove duplicate validateCSVFileQuick function
- Use validateCSVFile from csv-validator consistently
- Optimize database queries with Promise.all() for parallel execution
- Add useMemo for expensive calculations in statistics
- Improve performance of data refresh operations
- Reduce code duplication"

git push -u origin refactor/validation-and-optimization

# Create PR, wait for approval, merge, delete branch
```

---

## PHASE 6: Code Organization Improvements 📁

**Priority**: 🟢 LOW (OPTIONAL)
**Branch**: `refactor/code-organization`
**Risk Level**: 🟢 VERY LOW
**Dependencies**: Must complete Phase 5 first
**Issues Fixed**: File organization, generic patterns

### ⚠️ IMPORTANT: Evaluate Necessity

**Before starting this phase**:

- Review if organization issues still exist after Phases 1-5
- Consider if current organization is "good enough"
- Only proceed if there are clear, specific organization problems
- **DO NOT** drastically change working patterns without strong justification
- Remember: "If it ain't broke, don't fix it"

### Problem:

Minor organizational improvements that would benefit long-term maintainability:

1. Database operation patterns could be abstracted
2. Processor files could be better organized

**Note**: These are nice-to-have improvements, not critical issues.

### Solution:

Create generic utilities and improve file organization.

### Files to Create:

#### 1. **src/lib/database/withDatabaseOperation.ts** (NEW FILE)

**Purpose**: Generic wrapper for database operations

**Features**:

- Handles try-catch pattern
- Handles `{ data, error }` return pattern
- Consistent error logging
- Type-safe

**Example Usage**:

```typescript
// Before
export async function createFlightDuty(duty: FlightDuty, userId: string) {
  try {
    const { data, error } = await supabase.from("flight_duties").insert(duty);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error creating flight duty:", error);
    return { data: null, error };
  }
}

// After
export const createFlightDuty = withDatabaseOperation(
  async (duty: FlightDuty, userId: string) => {
    return supabase.from("flight_duties").insert(duty);
  },
  "createFlightDuty"
);
```

#### 2. **src/lib/salary-calculator/processors/index.ts** (NEW FILE)

**Purpose**: Barrel export for all processors

**Exports**:

- `upload-processor`
- `manual-entry-processor`
- `recalculation-engine`

### Files to Modify (Optional):

#### 3. **src/lib/database/flights.ts**

**Changes** (Optional):

- Refactor to use `withDatabaseOperation` wrapper
- Reduce boilerplate code

#### 4. **src/lib/database/calculations.ts**

**Changes** (Optional):

- Refactor to use `withDatabaseOperation` wrapper
- Reduce boilerplate code

### Testing Checklist:

- [ ] All database operations work correctly
- [ ] Error handling works
- [ ] Imports work correctly
- [ ] No regressions
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds

### Git Commands:

```bash
git checkout main
git pull origin main
git checkout -b refactor/code-organization

# Create new files
# Modify existing files (optional)

npm run lint
npm run build
npm run dev
# Test database operations

git add src/lib/database/withDatabaseOperation.ts
git add src/lib/salary-calculator/processors/index.ts
git add src/lib/database/flights.ts  # if modified
git add src/lib/database/calculations.ts  # if modified
git commit -m "refactor: improve code organization and add generic utilities

- Create withDatabaseOperation wrapper for consistent error handling
- Add barrel export for processor files
- Reduce boilerplate in database operations (optional)
- Improve code organization and maintainability"

git push -u origin refactor/code-organization

# Create PR, wait for approval, merge, delete branch
```

---

## 🎯 Execution Strategy

### Recommended Order:

1. **Phase 1** (Fix Build Config) - Quick win, prevents future issues
2. **Phase 2** (Consolidate Refresh Logic) - Reduces duplication, prepares for Phase 3
3. **Phase 3** (Break Down Dashboard) - Biggest impact, requires Phases 1-2 complete
4. **Phase 4** (Add Tests) - Ensures quality, can be done anytime after Phase 3
5. **Phase 5** (Validation & Optimization) - Performance improvements
6. **Phase 6** (Code Organization) - Optional, nice-to-have improvements

### Workflow for Each Phase:

1. ✅ **Review phase plan** - Understand what needs to be done
2. ✅ **Create branch** - Use specified branch name
3. ✅ **Make changes** - Follow the plan
4. ✅ **Test thoroughly** - Use testing checklist
5. ✅ **Lint and build** - Ensure no errors
6. ✅ **User tests** - You test the functionality
7. ✅ **Commit and push** - Use specified commit message
8. ✅ **Create PR** - Wait for your approval
9. ✅ **Merge and delete branch** - You merge when ready
10. ✅ **Move to next phase** - Repeat

### Important Notes:

- ⚠️ **Each phase is independent** - Can be done separately
- ⚠️ **Test thoroughly** - Especially Phase 3 (dashboard breakdown)
- ⚠️ **You control the pace** - Test and approve each phase
- ⚠️ **Phases can be skipped** - If you decide a phase isn't needed
- ⚠️ **Phases can be reordered** - Except Phase 3 should come after Phase 2

---

## 📈 Expected Outcomes

### After All Phases Complete:

**Code Quality:**

- ✅ Dashboard page: 1380 lines → ~300 lines
- ✅ Zero code duplication in refresh logic
- ✅ Build fails on errors (prevents broken deployments)
- ✅ Better test coverage

**Maintainability:**

- ✅ Easier to understand and modify
- ✅ Single Responsibility Principle followed
- ✅ Cleaner separation of concerns

**Performance:**

- ✅ Faster data refresh (parallel queries)
- ✅ Optimized re-renders (memoization)
- ✅ Better user experience

**Developer Experience:**

- ✅ Faster feature development
- ✅ Easier debugging
- ✅ Better IDE support
- ✅ More confidence in changes

---

## 🚀 Ready to Start?

When you're ready to begin, let me know which phase you'd like to start with!

**Recommended**: Start with **Phase 0** (Pre-Refactoring Verification), then proceed with **Phase 1** (Fix Build Config) - it's quick, low-risk, and prevents future issues.

---

## Rollback Procedures 🔄

### If a Phase Fails:

**Immediate Actions**:

1. Document the failure in detail (what broke, error messages, steps to reproduce)
2. Do NOT proceed to next phase
3. Revert the branch: `git reset --hard origin/main`
4. Analyze root cause
5. Update this plan with lessons learned
6. Fix the issue
7. Re-test the phase completely
8. Only proceed when ALL tests pass

### Git Rollback Commands:

```bash
# If you haven't pushed yet
git reset --hard HEAD~1

# If you've pushed but not merged PR
git reset --hard origin/main
git push --force origin <branch-name>

# If PR is merged but issues found
git revert <commit-hash>
git push origin main
```

### Emergency Rollback (Production):

If issues are discovered after merge:

1. Create hotfix branch immediately
2. Revert the problematic commit
3. Create emergency PR
4. Get immediate review and merge
5. Post-mortem: analyze what went wrong

---

## PR Review Criteria ✅

### Before Creating PR:

- [ ] All phase testing checklist items completed
- [ ] No console errors or warnings
- [ ] `npm run lint` passes with no errors
- [ ] All business logic tests pass (Phase 3.5)
- [ ] Performance measurements documented (Phase 5)
- [ ] Old code completely removed (no dead code)
- [ ] TypeScript types are correct
- [ ] Code follows project guidelines
- [ ] Commit message is descriptive

### PR Description Should Include:

1. **What changed**: List of files and changes
2. **Why**: Reason for the refactoring
3. **Testing**: What was tested and results
4. **Performance**: Any performance improvements (with measurements)
5. **Breaking changes**: None expected, but document if any
6. **Screenshots**: If UI changes (not expected in this refactoring)

### Reviewer Should Verify:

- [ ] Code quality and readability
- [ ] No unnecessary changes
- [ ] TypeScript types are correct
- [ ] No performance regressions
- [ ] Tests are comprehensive
- [ ] Documentation is updated (if needed)

---

## Success Metrics 📊

### Overall Goals:

- [ ] Dashboard page reduced from 1380 lines to ~300 lines
- [ ] All lint errors fixed (0 errors)
- [ ] Build config cleaned up (no bypasses)
- [ ] Code duplication eliminated
- [ ] Test coverage added for critical paths
- [ ] Performance improved (measured)
- [ ] No functionality regressions
- [ ] Codebase is cleaner and more maintainable

### Phase-Specific Metrics:

**Phase 0**: Baseline documented, backup created
**Phase 1**: 0 lint errors, 0 build bypasses
**Phase 2**: 4 refresh functions → 1 hook
**Phase 3**: 1380 lines → ~300 lines
**Phase 3.5**: All business logic tests pass
**Phase 4**: Test coverage added (hooks 80%, components 70%)
**Phase 5**: 30% faster refresh, 20% faster statistics load
**Phase 6**: (Optional) Better file organization

---

**Document Version**: 2.0
**Last Updated**: 2025-10-29 (Enhanced with comprehensive improvements)
**Total Phases**: 8 (including Phase 0 and Phase 3.5)
**Status**: Ready for execution

---

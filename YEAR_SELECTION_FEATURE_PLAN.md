# Year Selection Feature - Implementation Plan

## Overview

This document outlines the implementation plan for adding multi-year selection functionality to the Skywage salary calculator dashboard. Currently, the dashboard only supports viewing and managing flight duties within the current year (2025). This feature will enable users to select and manage data for different years (near-term: current year ± 2 years).

---

## Implementation Summary

| Aspect                 | Details                                                 |
| ---------------------- | ------------------------------------------------------- |
| **Complexity**         | Medium                                                  |
| **Total Phases**       | 3 phases (completed) + 1 optional enhancement (planned) |
| **Actual Time**        | ~6 hours                                                |
| **Files Modified**     | 8 files                                                 |
| **Breaking Changes**   | None                                                    |
| **Database Migration** | None (schema already supports multi-year)               |
| **Status**             | ✅ Phase 1-3 Complete, 📋 Phase 4 Planned (optional)    |

---

## Design Decisions

### UI/UX Specifications

1. **Year Selector**: Dropdown above the chart (e.g., "2025 ▼")
2. **Year Range**: Near-term only (current year ± 2 years)
3. **Default Year**: Always current year on page load
4. **Year Persistence**: Session-only (not saved to localStorage)
5. **Upload Flow**: Combined month & year selection (single step)
6. **Date Restrictions**: Manual entry dates must match selected year
7. **Empty Year**: Show empty state with "Upload Roster" and "Add Flight" buttons

### Technical Specifications

- Year state managed at dashboard level
- Year passed as prop to all child components
- Database queries already support year parameter (no changes needed)
- Calculation engine already handles multi-year rates (no changes needed)
- Query keys in data hooks (useFlightDuties, useMonthlyCalculations) must include year to avoid stale data when switching years
- Dashboard page.tsx must be a Client Component (add 'use client' if needed) since it uses useState/useCallback

---

## Phase 1: Core Year Selection (Dashboard & Month Selector)

### Branch: `feature/year-selection-phase-1`

### Goals

- Add year selection state to dashboard
- Create year dropdown UI in MonthSelector
- Update data fetching to use selected year
- Test year switching functionality

### Files to Modify

#### 1. `src/app/(dashboard)/dashboard/page.tsx`

**Changes**:

- Add `selectedYear` state variable
- Replace hardcoded `currentYear` constant with state
- Add year change handler
- Pass `selectedYear` to all child components and hooks

**Code Changes**:

```typescript
// BEFORE (Line 47)
const currentYear = new Date().getFullYear();

// AFTER
const [selectedYear, setSelectedYear] = useState<number>(
  new Date().getFullYear()
);

// Add year change handler
const handleYearChange = useCallback((year: number) => {
  setSelectedYear(year);
  // Reset to current month when year changes (if data exists)
  // Otherwise, select first available month in new year
}, []);
```

**Update hook calls**:

```typescript
// BEFORE (Lines 93-98)
const {
  flightDuties,
  loading: flightDutiesLoading,
  refetch: refetchFlightDuties,
} = useFlightDuties({
  userId: user?.id || "",
  month: selectedOverviewMonth,
  year: currentYear, // ← Hardcoded
  enabled: !!user?.id,
});

// AFTER
const {
  flightDuties,
  loading: flightDutiesLoading,
  refetch: refetchFlightDuties,
} = useFlightDuties({
  userId: user?.id || "",
  month: selectedOverviewMonth,
  year: selectedYear, // ← Dynamic state
  enabled: !!user?.id,
});
```

**Update MonthlyCalculations hook** (Lines 107-112):

```typescript
// BEFORE
const {
  currentCalculation,
  allCalculations,
  loading: calculationsLoading,
  refetchCurrent: refetchCurrentCalculation,
  refetchAll: refetchAllCalculations,
} = useMonthlyCalculations({
  userId: user?.id || "",
  month: selectedOverviewMonth,
  year: currentYear, // ← Hardcoded
  enabled: !!user?.id,
});

// AFTER
const {
  currentCalculation,
  allCalculations,
  loading: calculationsLoading,
  refetchCurrent: refetchCurrentCalculation,
  refetchAll: refetchAllCalculations,
} = useMonthlyCalculations({
  userId: user?.id || "",
  month: selectedOverviewMonth,
  year: selectedYear, // ← Dynamic state
  enabled: !!user?.id,
});
```

**Update useDataRefresh hook** (Lines 137-147):

```typescript
// BEFORE
const {
  refreshAfterDelete,
  refreshAfterBulkDelete,
  refreshAfterUpload,
  refreshAfterManualEntry,
} = useDataRefresh({
  userId: user?.id || "",
  position: userPosition,
  selectedMonth: selectedOverviewMonth,
  selectedYear: currentYear, // ← Hardcoded
  userPositionLoading,
  onCalculationsUpdate: async () => {
    // ...
  },
});

// AFTER
const {
  refreshAfterDelete,
  refreshAfterBulkDelete,
  refreshAfterUpload,
  refreshAfterManualEntry,
} = useDataRefresh({
  userId: user?.id || "",
  position: userPosition,
  selectedMonth: selectedOverviewMonth,
  selectedYear: selectedYear, // ← Dynamic state
  userPositionLoading,
  onCalculationsUpdate: async () => {
    // ...
  },
});
```

**Update initialization effect** (Lines 114-134):

```typescript
// BEFORE (Line 120)
const currentMonthData = allCalculations.find(calc =>
  calc.month === currentMonthIndex + 1 && calc.year === currentYear
);

// AFTER
const currentMonthData = allCalculations.find(calc =>
  calc.month === currentMonthIndex + 1 && calc.year === selectedYear
);

// Update dependency array (Line 134)
// BEFORE
}, [calculationsLoading, allCalculations, hasUserSelectedMonth, currentYear]);

// AFTER
}, [calculationsLoading, allCalculations, hasUserSelectedMonth, selectedYear]);
```

**Pass year to MonthSelector component** (around line 350):

```typescript
// BEFORE
<MonthSelector
  selectedMonth={selectedOverviewMonth}
  onMonthChange={handleMonthChange}
  allMonthlyCalculations={allCalculations}
  loading={calculationsLoading}
/>

// AFTER
<MonthSelector
  selectedMonth={selectedOverviewMonth}
  selectedYear={selectedYear}  // ← Add year prop
  onMonthChange={handleMonthChange}
  onYearChange={handleYearChange}  // ← Add year change handler
  allMonthlyCalculations={allCalculations}
  loading={calculationsLoading}
/>
```

**Estimated Lines Changed**: ~20-25 lines

Note: If dashboard/page.tsx is not already a Client Component, add the 'use client' directive at the very top, since these changes rely on useState/useCallback.

---

#### 2. `src/components/dashboard/MonthSelector.tsx`

**Changes**:

- Add `selectedYear` and `onYearChange` props
- Add year dropdown UI above the chart
- Update chart data filtering to use `selectedYear`
- Calculate year range (current year ± 2)

**Code Changes**:

**Update component props**:

```typescript
// BEFORE
interface MonthSelectorProps {
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  allMonthlyCalculations: MonthlyCalculation[];
  loading: boolean;
}

// AFTER
interface MonthSelectorProps {
  selectedMonth: number;
  selectedYear: number; // ← Add year prop
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void; // ← Add year change handler
  allMonthlyCalculations: MonthlyCalculation[];
  loading: boolean;
}
```

**Update component signature**:

```typescript
// BEFORE
export function MonthSelector({
  selectedMonth,
  onMonthChange,
  allMonthlyCalculations,
  loading
}: MonthSelectorProps) {

// AFTER
export function MonthSelector({
  selectedMonth,
  selectedYear,  // ← Add year
  onMonthChange,
  onYearChange,  // ← Add year change handler
  allMonthlyCalculations,
  loading
}: MonthSelectorProps) {
```

**Remove hardcoded year** (Line 42):

```typescript
// BEFORE
const currentYear = currentDate.getFullYear();

// AFTER
// Remove this line - use selectedYear prop instead
```

**Add year range calculation**:

```typescript
// Add after imports
const getYearRange = (): number[] => {
  const currentYear = new Date().getFullYear();
  return [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
  ];
};
```

**Add year dropdown UI** (before the chart):

```typescript
// Add this section before the chart rendering
<div className="mb-4 flex items-center gap-2">
  <label
    htmlFor="year-selector"
    className="text-sm font-medium text-gray-700"
  >
    Year:
  </label>
  <Select
    value={selectedYear.toString()}
    onValueChange={(value) => onYearChange(parseInt(value, 10))}
  >
    <SelectTrigger
      id="year-selector"
      className="w-[120px]"
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {getYearRange().map((year) => (
        <SelectItem
          key={year}
          value={year.toString()}
        >
          {year}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Update chart data filtering** (Lines 64-66):

```typescript
// BEFORE
const monthCalc = allMonthlyCalculations.find(
  (calc) => calc.month === i + 1 && calc.year === currentYear
);

// AFTER
const monthCalc = allMonthlyCalculations.find(
  (calc) => calc.month === i + 1 && calc.year === selectedYear
);
```

**Add imports** (if not already present):

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```

**Estimated Lines Changed**: ~35-40 lines

---

### Testing Checklist for Phase 1

- [ ] Year dropdown appears above the chart
- [ ] Year dropdown shows current year ± 2 years (5 years total)
- [ ] Selecting a different year updates the chart
- [ ] Selecting a different year updates the flight duties table
- [ ] Selecting a different year updates the salary breakdown card
- [ ] Month selection persists when changing years (if data exists)
- [ ] Empty state shows when selecting a year with no data
- [ ] Page loads with current year selected by default
- [ ] Year selection resets to current year on page refresh

### GitHub Workflow - Phase 1

```bash
# 1. Create feature branch
git checkout -b feature/year-selection-phase-1

# 2. Make changes to files listed above

# 3. Test locally
npm run dev
# Test all items in checklist above

# 4. Stage and commit changes
git add src/app/(dashboard)/dashboard/page.tsx
git add src/components/dashboard/MonthSelector.tsx
git commit -m "feat: add year selection to dashboard and month selector

- Add selectedYear state to dashboard page
- Add year dropdown UI to MonthSelector component
- Update data fetching hooks to use selected year
- Support year range: current year ± 2 years
- Default to current year on page load

Phase 1 of 3 for multi-year selection feature"

# 5. Push branch
git push origin feature/year-selection-phase-1

# 6. Wait for user testing confirmation
# User will test and confirm "it's ok"

# 7. Create Pull Request (after user confirmation)
# Title: "feat: Add year selection to dashboard (Phase 1/3)"
# Description: See commit message above + link to YEAR_SELECTION_FEATURE_PLAN.md

# 8. User will merge and delete branch
```

---

## Phase 2: Roster Upload Year Selection

### Branch: `feature/year-selection-phase-2`

### Goals

- Add year selection to roster upload flow
- Update month selector to show selected year
- Pass selected year to upload processor
- Update existing data check to use selected year

### Files to Modify

#### 1. `src/components/dashboard/RosterUploadSection.tsx`

**Changes**:

- Accept `selectedYear` prop from dashboard
- Update month selector display to show selected year
- Pass selected year to upload processor
- Update existing data check to use selected year
- Ensure `processFileUploadWithReplacement` and `checkForExistingData` use the provided `selectedYear` end-to-end (no fallback to `currentYear`)

**Code Changes**:

**Update component props**:

```typescript
// BEFORE
interface RosterUploadSectionProps {
  position: Position;
  userPositionLoading: boolean;
  onUploadSuccess: () => Promise<void>;
}

// AFTER
interface RosterUploadSectionProps {
  position: Position;
  userPositionLoading: boolean;
  selectedYear: number; // ← Add year prop
  onUploadSuccess: () => Promise<void>;
}
```

**Update component signature**:

```typescript
// BEFORE
export const RosterUploadSection = memo<RosterUploadSectionProps>(({
  position,
  userPositionLoading,
  onUploadSuccess,
}) => {

// AFTER
export const RosterUploadSection = memo<RosterUploadSectionProps>(({
  position,
  userPositionLoading,
  selectedYear,  // ← Add year
  onUploadSuccess,
}) => {
```

**Remove hardcoded year** (Lines 108, 176):

```typescript
// BEFORE (Line 108)
const currentYear = new Date().getFullYear();

// AFTER
// Remove this line - use selectedYear prop instead

// BEFORE (Line 176)
const currentYear = new Date().getFullYear();

// AFTER
// Remove this line - use selectedYear prop instead
```

**Update processFileUploadWithReplacement call** (Line 110-120):

```typescript
// BEFORE
const result = await processFileUploadWithReplacement(
  file,
  userId,
  position,
  selectedUploadMonth,
  currentYear, // ← Hardcoded
  (status) => {
    setProcessingStatus(status);
  },
  performReplacement
);

// AFTER
const result = await processFileUploadWithReplacement(
  file,
  userId,
  position,
  selectedUploadMonth,
  selectedYear, // ← Use prop
  (status) => {
    setProcessingStatus(status);
  },
  performReplacement
);
```

**Update checkForExistingData call** (Line 180):

```typescript
// BEFORE
const existingCheck = await checkForExistingData(
  userId,
  selectedUploadMonth,
  currentYear
);

// AFTER
const existingCheck = await checkForExistingData(
  userId,
  selectedUploadMonth,
  selectedYear
);
```

**Update month selector display** (Line 270):

```typescript
// BEFORE
{
  getMonthName(month);
}
{
  new Date().getFullYear();
}

// AFTER
{
  getMonthName(month);
}
{
  selectedYear;
}
```

**Estimated Lines Changed**: ~10-15 lines

---

#### 2. `src/app/(dashboard)/dashboard/page.tsx`

**Changes**:

- Pass `selectedYear` prop to RosterUploadSection

**Code Changes**:

```typescript
// BEFORE (around line 400)
<RosterUploadSection
  position={userPosition}
  userPositionLoading={userPositionLoading}
  onUploadSuccess={refreshAfterUpload}
/>

// AFTER
<RosterUploadSection
  position={userPosition}
  userPositionLoading={userPositionLoading}
  selectedYear={selectedYear}  // ← Add year prop
  onUploadSuccess={refreshAfterUpload}
/>
```

**Estimated Lines Changed**: ~1 line

---

### Testing Checklist for Phase 2

- [ ] Month selector in upload dialog shows selected year (e.g., "January 2026")
- [ ] Uploading roster for current year works correctly
- [ ] Uploading roster for different year (e.g., 2026) works correctly
- [ ] Existing data check uses selected year (not hardcoded current year)
- [ ] Replacement dialog shows correct month/year
- [ ] After upload, dashboard updates to show new data for selected year
- [ ] Upload for year with no existing data creates new records
- [ ] Upload for year with existing data shows replacement dialog

### GitHub Workflow - Phase 2

```bash
# 1. Ensure Phase 1 is merged to main
git checkout main
git pull origin main

# 2. Create feature branch from main
git checkout -b feature/year-selection-phase-2

# 3. Make changes to files listed above

# 4. Test locally
npm run dev
# Test all items in checklist above

# 5. Stage and commit changes
git add src/components/dashboard/RosterUploadSection.tsx
git add src/app/(dashboard)/dashboard/page.tsx
git commit -m "feat: add year selection to roster upload

- Accept selectedYear prop in RosterUploadSection
- Update month selector to display selected year
- Pass selected year to upload processor
- Update existing data check to use selected year
- Remove hardcoded currentYear references

Phase 2 of 3 for multi-year selection feature"

# 6. Push branch
git push origin feature/year-selection-phase-2

# 7. Wait for user testing confirmation

# 8. Create Pull Request (after user confirmation)
# Title: "feat: Add year selection to roster upload (Phase 2/3)"

# 9. User will merge and delete branch
```

---

## Phase 3: Manual Entry Year Validation

### Branch: `feature/year-selection-phase-3`

### Status: ✅ **COMPLETED**

### Goals

- ✅ Restrict manual entry dates to match selected year
- ✅ Update date validation logic to support cross-year layovers
- ✅ Remove current year restrictions
- ✅ Test manual entry for different years
- ✅ Support layovers with rest periods up to 96 hours

### Files to Modify

#### 1. `src/components/salary-calculator/FlightEntryForm.tsx`

**Changes**:

- Accept `selectedYear` prop
- Update date input min/max to match selected year
- Update validation to ensure date matches selected year
- Update helper functions to use selected year

**Code Changes**:

**Update component props**:

```typescript
// BEFORE
interface FlightEntryFormProps {
  onSubmit: (data: ManualFlightEntryData) => Promise<void>;
  onAddToBatch?: (data: ManualFlightEntryData) => void;
  onSaveBatchOnly?: () => Promise<void>;
  position: Position;
  disabled?: boolean;
  loading?: boolean;
  batchCount?: number;
  initialData?: Partial<ManualFlightEntryData>;
}

// AFTER
interface FlightEntryFormProps {
  onSubmit: (data: ManualFlightEntryData) => Promise<void>;
  onAddToBatch?: (data: ManualFlightEntryData) => void;
  onSaveBatchOnly?: () => Promise<void>;
  position: Position;
  selectedYear: number; // ← Add year prop
  disabled?: boolean;
  loading?: boolean;
  batchCount?: number;
  initialData?: Partial<ManualFlightEntryData>;
}
```

**Update component signature**:

```typescript
// BEFORE
export function FlightEntryForm({
  onSubmit,
  onAddToBatch,
  onSaveBatchOnly,
  position,
  disabled = false,
  loading = false,
  batchCount = 0,
  initialData
}: FlightEntryFormProps) {

// AFTER
export function FlightEntryForm({
  onSubmit,
  onAddToBatch,
  onSaveBatchOnly,
  position,
  selectedYear,  // ← Add year
  disabled = false,
  loading = false,
  batchCount = 0,
  initialData
}: FlightEntryFormProps) {
```

**Update date helper functions** (Lines 275-286):

```typescript
// BEFORE
const getStartOfCurrentYear = () => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  return startOfYear.toISOString().split("T")[0];
};

const getEndOfCurrentYear = () => {
  const today = new Date();
  const endOfYear = new Date(today.getFullYear(), 11, 31);
  return endOfYear.toISOString().split("T")[0];
};

// AFTER
const getStartOfSelectedYear = () => {
  return `${selectedYear}-01-01`; // local-date safe
};

const getEndOfSelectedYear = () => {
  return `${selectedYear}-12-31`; // local-date safe
};
```

**Update date input constraints** (Lines 362-363, 485-486):

```typescript
// Outbound date input (must be within selected year)
min={getStartOfSelectedYear()}
max={getEndOfSelectedYear()}

// Inbound date input (allow cross‑year next‑day for Dec 31 → Jan 1)
min={formData.outboundDate || getStartOfSelectedYear()}
max={getInboundMaxDate(formData.outboundDate)}
```

**Add date validation helper**:

```typescript
// Add these helpers after the date helper functions

// Outbound must be in selectedYear
const isOutboundInSelectedYear = (dateString: string): boolean => {
  if (!dateString) return false;
  const d = new Date(dateString);
  return d.getFullYear() === selectedYear;
};

// Inbound is allowed if it is the same day or next day relative to outbound,
// which can roll over to selectedYear + 1 at the year boundary.
const isInboundDateAllowed = (outbound?: string, inbound?: string): boolean => {
  if (!outbound || !inbound) return false;
  const o = new Date(outbound);
  const i = new Date(inbound);
  if (i < o) return false;
  const nextDay = new Date(o.getFullYear(), o.getMonth(), o.getDate() + 1);
  // Allowed if inbound is same day or next day
  return (
    (i.getFullYear() === o.getFullYear() &&
      i.getMonth() === o.getMonth() &&
      i.getDate() === o.getDate()) ||
    (i.getFullYear() === nextDay.getFullYear() &&
      i.getMonth() === nextDay.getMonth() &&
      i.getDate() === nextDay.getDate())
  );
};

// Helper to compute inbound max date string (same day or next day)
const getInboundMaxDate = (outboundDate?: string): string => {
  if (!outboundDate) return getEndOfSelectedYear();
  const d = new Date(outboundDate);
  const nextDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  const yyyy = nextDay.getFullYear();
  const mm = String(nextDay.getMonth() + 1).padStart(2, "0");
  const dd = String(nextDay.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
```

**Add validation messages**:

```typescript
// Outbound warning
{
  formData.outboundDate && !isOutboundInSelectedYear(formData.outboundDate) && (
    <p className="text-orange-500 text-sm">
      Outbound date must be in {selectedYear}
    </p>
  );
}

// Inbound warning
{
  formData.inboundDate &&
    !isInboundDateAllowed(formData.outboundDate, formData.inboundDate) && (
      <p className="text-orange-500 text-sm">
        Inbound date must be same day or next day relative to outbound
      </p>
    );
}
```

**Estimated Lines Changed**: ~15-20 lines

---

#### 2. `src/components/salary-calculator/ManualFlightEntry.tsx`

**Changes**:

- Accept `selectedYear` prop
- Pass `selectedYear` to FlightEntryForm

**Code Changes**:

**Update component props**:

```typescript
// BEFORE
interface ManualFlightEntryProps {
  position: Position;
  onBack?: () => void;
  onSuccess?: () => void;
  className?: string;
}

// AFTER
interface ManualFlightEntryProps {
  position: Position;
  selectedYear: number; // ← Add year prop
  onBack?: () => void;
  onSuccess?: () => void;
  className?: string;
}
```

**Update component signature**:

```typescript
// BEFORE
export function ManualFlightEntry({
  position,
  onBack,
  onSuccess,
  className
}: ManualFlightEntryProps) {

// AFTER
export function ManualFlightEntry({
  position,
  selectedYear,  // ← Add year
  onBack,
  onSuccess,
  className
}: ManualFlightEntryProps) {
```

**Pass year to FlightEntryForm** (around line 200):

```typescript
// BEFORE
<FlightEntryForm
  onSubmit={handleFormSubmit}
  onAddToBatch={handleAddToBatch}
  onSaveBatchOnly={handleSaveBatchOnly}
  position={position}
  loading={loading}
  batchCount={batchDuties.length}
/>

// AFTER
<FlightEntryForm
  onSubmit={handleFormSubmit}
  onAddToBatch={handleAddToBatch}
  onSaveBatchOnly={handleSaveBatchOnly}
  position={position}
  selectedYear={selectedYear}  // ← Add year prop
  loading={loading}
  batchCount={batchDuties.length}
/>
```

**Estimated Lines Changed**: ~5 lines

---

#### 3. `src/components/dashboard/ManualEntrySection.tsx`

**Changes**:

- Accept `selectedYear` prop
- Pass `selectedYear` to ManualFlightEntry

**Code Changes**:

**Update component props**:

```typescript
// BEFORE
interface ManualEntrySectionProps {
  position: Position;
  userPositionLoading: boolean;
  onEntrySuccess: () => Promise<void>;
}

// AFTER
interface ManualEntrySectionProps {
  position: Position;
  userPositionLoading: boolean;
  selectedYear: number; // ← Add year prop
  onEntrySuccess: () => Promise<void>;
}
```

**Update component signature**:

```typescript
// BEFORE
export const ManualEntrySection = memo<ManualEntrySectionProps>(({
  position,
  userPositionLoading,
  onEntrySuccess,
}) => {

// AFTER
export const ManualEntrySection = memo<ManualEntrySectionProps>(({
  position,
  userPositionLoading,
  selectedYear,  // ← Add year
  onEntrySuccess,
}) => {
```

**Pass year to ManualFlightEntry** (around line 78):

```typescript
// BEFORE
<ManualFlightEntry
  position={position}
  onBack={() => setManualEntryModalOpen(false)}
  onSuccess={handleManualEntrySuccess}
/>

// AFTER
<ManualFlightEntry
  position={position}
  selectedYear={selectedYear}  // ← Add year prop
  onBack={() => setManualEntryModalOpen(false)}
  onSuccess={handleManualEntrySuccess}
/>
```

**Estimated Lines Changed**: ~3 lines

---

#### 4. `src/app/(dashboard)/dashboard/page.tsx`

**Changes**:

- Pass `selectedYear` prop to ManualEntrySection

**Code Changes**:

```typescript
// BEFORE (around line 450)
<ManualEntrySection
  position={userPosition}
  userPositionLoading={userPositionLoading}
  onEntrySuccess={refreshAfterManualEntry}
/>

// AFTER
<ManualEntrySection
  position={userPosition}
  userPositionLoading={userPositionLoading}
  selectedYear={selectedYear}  // ← Add year prop
  onEntrySuccess={refreshAfterManualEntry}
/>
```

**Estimated Lines Changed**: ~1 line

---

### Testing Checklist for Phase 3

- [x] Manual entry modal opens correctly
- [x] Outbound date input shows min/max for selected year only
- [x] Outbound date cannot be outside selected year
- [x] Inbound date can roll over to next year for cross-year layovers (Dec 31 → Jan 1)
- [x] Inbound date cannot be before outbound date
- [x] Inbound date supports long rest periods (up to 96 hours / 4 days)
- [x] Manual entry saves with correct year (year of outbound date)
- [x] After saving, flight appears in correct year's data
- [x] Validation shows clear errors for invalid outbound/inbound combinations

### Known Issue Identified

**Cross-Year Layover Display**: When viewing year 2025, cross-year layovers (e.g., Dec 31, 2025 → Jan 1, 2026) show "Layover (No pair found)" because the dashboard only fetches flights for the selected year. The inbound flight (Jan 1, 2026) is not in the dataset when viewing 2025.

**Solution**: This will be addressed in Phase 4 (see below).

### GitHub Workflow - Phase 3

```bash
# 1. Ensure Phase 2 is merged to main
git checkout main
git pull origin main

# 2. Create feature branch from main
git checkout -b feature/year-selection-phase-3

# 3. Make changes to files listed above

# 4. Test locally
npm run dev
# Test all items in checklist above

# 5. Stage and commit changes
git add src/components/salary-calculator/FlightEntryForm.tsx
git add src/components/salary-calculator/ManualFlightEntry.tsx
git add src/components/dashboard/ManualEntrySection.tsx
git add src/app/(dashboard)/dashboard/page.tsx
git add src/lib/salary-calculator/manual-entry-validation.ts
git add src/lib/salary-calculator/manual-entry-processor.ts
git commit -m "feat: add year validation to manual flight entry

- Accept selectedYear prop in manual entry components
- Update validateDate() to accept selectedYear and isInbound parameters
- Support cross-year layovers (inbound can be in selected year or next year)
- Remove restrictive inbound date validation (support up to 96-hour rest periods)
- Update all validation functions to use selectedYear
- Remove hardcoded current year restrictions

Phase 3 of 3 for multi-year selection feature"

# 6. Push branch
git push origin feature/year-selection-phase-3

# 7. Wait for user testing confirmation

# 8. Create Pull Request (after user confirmation)
# Title: "feat: Add year validation to manual entry (Phase 3/3)"

# 9. User will merge and delete branch
```

### Actual Implementation Notes

**Files Modified** (6 files):

1. `src/lib/salary-calculator/manual-entry-validation.ts` - Updated `validateDate()` and `validateManualEntry()` to accept `selectedYear` parameter
2. `src/lib/salary-calculator/manual-entry-processor.ts` - Updated `validateManualEntryRealTime()`, `processManualEntry()`, and batch processing functions
3. `src/components/salary-calculator/FlightEntryForm.tsx` - Updated to pass `selectedYear` to validation, removed restrictive inbound date logic
4. `src/components/salary-calculator/ManualFlightEntry.tsx` - Added `selectedYear` prop and passed to FlightEntryForm
5. `src/components/dashboard/ManualEntrySection.tsx` - Added `selectedYear` prop and passed to ManualFlightEntry
6. `src/app/(dashboard)/dashboard/page.tsx` - Passed `selectedYear` to ManualEntrySection

**Key Changes**:

- `validateDate()` now accepts `selectedYear` and `isInbound` parameters
- Outbound dates must be within selected year
- Inbound dates can be in selected year OR next year (for cross-year layovers)
- Removed 1-day restriction on inbound dates (now supports up to 96-hour rest periods)
- All validation functions extract year from data.date when needed

---

## Phase 4: Cross-Year Layover Display (Optional Enhancement)

### Branch: `feature/year-selection-phase-4`

### Status: 📋 **PLANNED**

### Problem Statement

When viewing year 2025, cross-year layovers (e.g., Dec 31, 2025 → Jan 1, 2026) display as "Layover (No pair found)" because:

- The dashboard fetches only flights for the selected year (2025)
- The outbound flight (Dec 31, 2025) is in the 2025 dataset ✅
- The inbound flight (Jan 1, 2026) is in the 2026 dataset ❌ (not loaded)
- The layover pairing logic can't find the matching inbound flight

### Goals

- Modify data fetching to include cross-year layover pairs
- Update `useFlightDuties` hook to fetch adjacent year layovers
- Ensure layover pairing works across year boundaries
- Maintain performance (don't fetch all data from adjacent years)

### Proposed Solution

**Option 1: Fetch Adjacent Year Layovers (Recommended)**

- When fetching flights for year Y, also fetch layover flights from year Y+1 that could pair with year Y outbound flights
- Filter: Only fetch layovers from January of year Y+1 that have matching destinations
- Minimal performance impact (only a few extra flights)

**Option 2: Smart Pairing Query**

- Create a database query that specifically fetches layover pairs across year boundaries
- More complex but more efficient

**Option 3: Client-Side Fallback**

- When a layover has no pair, check if it's near year boundary
- Make a targeted fetch for the potential pair
- More network requests but simpler implementation

### Files to Modify

1. `src/hooks/useFlightDuties.ts` - Update to fetch cross-year layover pairs
2. `src/lib/database/flights.ts` - Add query for cross-year layover pairs
3. `src/lib/salary-calculator/card-data-mapper.ts` - Update pairing logic if needed

### Implementation Details

**To be determined based on chosen solution approach**

### Testing Checklist

- [ ] Cross-year layovers display correctly when viewing earlier year
- [ ] Cross-year layovers display correctly when viewing later year
- [ ] Layover rest period calculated correctly across year boundary
- [ ] Per diem payment displayed correctly
- [ ] Performance remains acceptable
- [ ] No duplicate flights displayed
- [ ] Edit/delete operations work correctly for cross-year layovers

### Priority

**Low-Medium** - This is a display issue that doesn't affect data integrity or calculations. Users can still:

- Save cross-year layovers ✅
- View them by switching years ✅
- See correct calculations ✅

The only limitation is the visual pairing in the UI when viewing a single year.

---

## Post-Implementation Verification

### Complete Feature Testing

After all 3 phases are merged, perform end-to-end testing:

#### Year Selection

- [ ] Year dropdown shows current year ± 2 years
- [ ] Default year is current year on page load
- [ ] Year selection persists during session
- [ ] Year resets to current year on browser refresh
- [ ] Changing year updates all dashboard components

#### Data Display

- [ ] Chart shows correct data for selected year
- [ ] Flight duties table shows correct data for selected year
- [ ] Salary breakdown shows correct calculations for selected year
- [ ] Empty state shows when no data exists for selected year

#### Roster Upload

- [ ] Month selector shows selected year
- [ ] Upload saves data to correct year
- [ ] Existing data check uses correct year
- [ ] Replacement dialog shows correct month/year

#### Manual Entry

- [ ] Outbound date restricted to selected year
- [ ] Inbound date allowed to roll to next year for next-day layovers
- [ ] Manual entries save to year of outbound date
- [ ] Cross-day detection works correctly

#### Calculations

- [ ] Salary rates are correct for each year (pre/post July 2025)
- [ ] Layover pay calculated correctly across years
- [ ] Monthly calculations stored with correct year

#### Edge Cases

- [ ] Switching from year with data to year without data
- [ ] Switching from year without data to year with data
- [ ] Uploading roster for future year (e.g., 2026 in 2025)
- [ ] Manual entry at year boundaries (Dec 31 / Jan 1)
- [ ] Multiple users with data in different years

---

## Database Verification

### Confirm Multi-Year Support

Run these queries to verify data integrity:

```sql
-- Check year distribution
SELECT year, COUNT(*) as flight_count
FROM flights
GROUP BY year
ORDER BY year;

-- Check monthly calculations by year
SELECT year, month, COUNT(*) as calc_count
FROM monthly_calculations
GROUP BY year, month
ORDER BY year, month;

-- Verify year constraints
SELECT
  table_name,
  column_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%year%';
```

---

## Rollback Plan

If issues are discovered after deployment:

### Phase 3 Rollback

```bash
git revert <phase-3-commit-hash>
git push origin main
```

**Impact**: Manual entry will revert to current year only

### Phase 2 Rollback

```bash
git revert <phase-2-commit-hash>
git push origin main
```

**Impact**: Roster upload will revert to current year only

### Phase 1 Rollback

```bash
git revert <phase-1-commit-hash>
git push origin main
```

**Impact**: Complete feature rollback, dashboard shows current year only

### Full Rollback

```bash
git revert <phase-3-commit-hash> <phase-2-commit-hash> <phase-1-commit-hash>
git push origin main
```

---

## Future Enhancements

### Optional Phase 4: UX Improvements

These enhancements can be added later if needed:

1. **Year Persistence to localStorage**

   - Remember last selected year across sessions
   - Add user preference setting

2. **Smart Year Detection**

   - Auto-select year with most recent data
   - Show indicator for years with data

3. **Year Range Expansion**

   - Allow admin to configure year range
   - Dynamic range based on user's data

4. **Multi-Year Statistics**

   - Year-over-year comparison charts
   - Annual summary reports
   - Career statistics across all years

5. **Year Navigation Shortcuts**

   - Keyboard shortcuts (Ctrl+Left/Right for year navigation)
   - Quick jump to specific year
   - "Go to current year" button

6. **Data Migration Tools**
   - Bulk copy data from one year to another
   - Template creation from previous year
   - Data export/import by year

---

## Known Limitations

1. **Year Range**: Limited to current year ± 2 years (can be expanded if needed)
2. **Year Persistence**: Session-only (resets on page refresh)
3. **Statistics Page**: Not included in this implementation (future enhancement)
4. **Cross-Year Duties**: Duties spanning year boundaries (Dec 31 → Jan 1) are assigned to the year of the outbound date; inbound date selection across the boundary is allowed when it is the next day.

---

## Success Criteria

This feature is considered successfully implemented when:

- ✅ Users can select any year within the supported range
- ✅ All dashboard components update when year changes
- ✅ Roster uploads save to the selected year
- ✅ Manual entries are restricted to the selected year
- ✅ Calculations use correct salary rates for each year
- ✅ No breaking changes to existing functionality
- ✅ All tests pass
- ✅ User acceptance testing completed

---

## Support & Maintenance

### Documentation Updates Needed

After implementation, update:

- User guide with year selection instructions
- FAQ with year-related questions
- Admin documentation for year range configuration

### Monitoring

Monitor for:

- Users uploading data to wrong year
- Calculation errors across year boundaries
- Performance issues with multi-year data

### Common Issues & Solutions

**Issue**: User can't find their data

- **Solution**: Check if correct year is selected

**Issue**: Upload fails for future year

- **Solution**: Verify year is within supported range

**Issue**: Calculations seem wrong

- **Solution**: Verify correct salary rates are applied for the year

---

## Appendix: File Change Summary

| File                                                     | Phase   | Lines Changed | Type             |
| -------------------------------------------------------- | ------- | ------------- | ---------------- |
| `src/app/(dashboard)/dashboard/page.tsx`                 | 1, 2, 3 | ~25           | State Management |
| `src/components/dashboard/MonthSelector.tsx`             | 1       | ~40           | UI Component     |
| `src/components/dashboard/RosterUploadSection.tsx`       | 2       | ~15           | UI Component     |
| `src/components/salary-calculator/FlightEntryForm.tsx`   | 3       | ~20           | UI Component     |
| `src/components/salary-calculator/ManualFlightEntry.tsx` | 3       | ~5            | Prop Passing     |
| `src/components/dashboard/ManualEntrySection.tsx`        | 3       | ~3            | Prop Passing     |
| `src/hooks/useFlightDuties.ts`                           | -       | 0             | No Changes       |
| `src/hooks/useMonthlyCalculations.ts`                    | -       | 0             | No Changes       |
| `src/lib/database/flights.ts`                            | -       | 0             | No Changes       |
| `src/lib/database/calculations.ts`                       | -       | 0             | No Changes       |

**Total Estimated Changes**: ~110-120 lines across 6 files

---

## Questions or Issues?

If you encounter any issues during implementation:

1. Check the testing checklist for the current phase
2. Verify all prop passing is correct
3. Check browser console for errors
4. Verify database queries are using correct year parameter
5. Test with different year selections
6. Refer to this document for expected behavior

---

**Document Version**: 1.0
**Created**: 2025-11-09
**Last Updated**: 2025-11-09
**Status**: Ready for Implementation

---

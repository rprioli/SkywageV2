# Flight Duty Edit Functionality - Implementation Plan

## Overview

This document outlines the phased implementation plan for adding edit functionality to flight duties, allowing users to modify reporting and debriefing times with automatic recalculation of all dependent values.

**Complexity:** Moderate  
**Estimated Timeline:** 2-3 days development + 1 day testing  
**Total Effort:** 15-22 hours

---

## Key Design Decisions

### UI/UX Approach

- ✅ **Modal/Dialog interface** for all screen sizes
- ✅ **Edit option in dropdown menu** (next to Delete)
- ✅ **Not available in bulk selection mode** (individual edits only)
- ✅ **Confirmation dialog** before saving changes

### Validation & User Experience

- ✅ **Auto-detect cross-day** if debrief time < report time
- ✅ **Inline error messages** below input fields
- ✅ **Prevent negative duty hours** with validation

### Scope

**Editable Duty Types:**

- Turnarounds ✅
- Layovers ✅
- Airport Standby (ASBY) ✅
- Home Standby (SBY) ✅

**Not Editable:**

- Recurrent Training (no times displayed)
- Business Promotion (no times displayed)
- Off Days / Rest Days

### Data & Audit Trail

- ✅ **Store original times** before first edit (preserve roster data)
- ✅ **Track last edit** timestamp and user
- ✅ **Revert functionality** to restore original values
- ✅ **No visual distinction** for edited flights on cards
- ✅ **Edit any data source** (CSV, manual, already edited)
- ✅ **No edit limit** (unlimited edits allowed)

### Recalculation Behavior

- ✅ **Background recalculation** with loading state
- ✅ **Real-time card updates** after recalculation
- ✅ **Real-time rest period preview** in edit dialog for layovers
- ✅ **Automatic paired flight updates** for layovers

---

## Git/GitHub Workflow

### Branch Strategy

**Main Branch Protection:**

- `main` branch is protected and represents production-ready code
- All changes must go through Pull Requests
- No direct commits to `main`

**Branch Naming Convention:**

```
feature/flight-edit-phase-1-database
feature/flight-edit-phase-2-dialog
feature/flight-edit-phase-3-turnaround
feature/flight-edit-phase-4-layover
feature/flight-edit-phase-5-standard
feature/flight-edit-phase-6-revert
feature/flight-edit-phase-7-testing
```

### Workflow for Each Phase

#### 1. Start Phase

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create new branch for the phase
git checkout -b feature/flight-edit-phase-X-name
```

#### 2. Development

```bash
# Make changes and commit regularly
git add .
git commit -m "Phase X: Descriptive commit message"

# Push to remote regularly
git push origin feature/flight-edit-phase-X-name
```

#### 3. Testing

- Complete all tasks in the phase checklist
- Run all tests in the testing checklist
- Test manually in the browser
- Verify no regressions in existing functionality

#### 4. Create Pull Request

```bash
# Push final changes
git push origin feature/flight-edit-phase-X-name

# Create PR on GitHub with:
# - Title: "Phase X: [Phase Name]"
# - Description: Link to this plan, list completed tasks
# - Checklist: All items from phase testing checklist
```

#### 5. Create Pull Request & Wait for Review

- AI creates PR on GitHub with detailed description
- AI adds all completed tasks and testing checklist
- **User reviews the PR**
- **User tests the changes**
- **User merges to `main` using Squash and Merge**
- **User deletes the feature branch after merge**

#### 6. Prepare for Next Phase (After User Merges)

```bash
# Switch back to main
git checkout main

# Pull the merged changes (after user has merged)
git pull origin main

# Create branch for next phase
git checkout -b feature/flight-edit-phase-X+1-name
```

### Pull Request Template

Each PR should include:

```markdown
## Phase X: [Phase Name]

### Completed Tasks

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

### Testing Checklist

- [ ] Test scenario 1
- [ ] Test scenario 2
- [ ] Test scenario 3

### Changes Made

- Brief description of changes
- New files created
- Modified files

### Testing Notes

- How to test the changes
- Any specific scenarios to verify

### Screenshots/Videos (if applicable)

- Before/after comparisons
- New UI elements

### Related

- Closes #[issue-number] (if applicable)
- Part of Flight Edit Implementation Plan
```

### Hotfix Strategy

If a bug is found in a previous phase after moving forward:

**Option 1: Fix in Current Phase Branch**

```bash
# If the bug is minor and doesn't affect current work
# Fix it in the current phase branch
git add .
git commit -m "Fix: [bug description] from Phase X"
```

**Option 2: Create Hotfix Branch**

```bash
# If the bug is critical and needs immediate fix
git checkout main
git checkout -b hotfix/flight-edit-[bug-description]
# Fix the bug
git commit -m "Hotfix: [bug description]"
# Create PR and merge immediately
```

### Merge Strategy

**Squash and Merge:**

- Keeps main branch history clean
- Each phase becomes a single commit
- Easier to revert if needed
- Commit message format: `Phase X: [Phase Name] (#PR-number)`

### Branch Cleanup

After each successful merge (handled by user):

```bash
# User deletes local branch
git branch -d feature/flight-edit-phase-X-name

# User deletes remote branch on GitHub after merge
```

### Rollback Strategy

If a phase needs to be rolled back:

```bash
# Revert the merge commit
git checkout main
git revert -m 1 [merge-commit-hash]
git push origin main
```

### Progress Tracking

**Updated Strategy:** Combining Phases 1-3 into single PR for better testability.

- [x] **Phase 1-3 Combined:** TurnaroundCard Edit (Proof of Concept) - `feature/flight-edit-phase-1-3-turnaround-poc`
  - Includes: Database functions + Edit dialog + TurnaroundCard integration
  - Fully testable before merge
  - **Status:** ✅ Merged in PR #18
- [x] Phase 4: LayoverConnectedCard Integration - `feature/flight-edit-phase-4-layover`
  - **Status:** ✅ Merged in PR #19
- [x] Phase 5: StandardDutyCard Integration (ASBY & SBY) - `feature/flight-edit-phase-5-standard`
  - **Status:** ✅ Merged in PR #20
  - **Note:** Recurrent training excluded from edit functionality per user request
- [ ] Phase 6: Revert Functionality - `feature/flight-edit-phase-6-revert` **(OPTIONAL - Future Enhancement)**
- [x] Phase 7: Testing & Edge Cases
  - **Status:** ✅ Completed through user testing in Phases 1-5

---

## ✅ FEATURE COMPLETE (Phases 1-5)

**Date Completed:** November 8, 2025

**Summary:**

- All editable duty types (Turnaround, Layover, ASBY, SBY) now have full edit functionality
- Payment logic correctly handles SBY (0 AED) and ASBY (fixed 4-hour rate)
- Flight Hours calculation correctly excludes SBY duties
- Real-time recalculation of monthly totals working correctly
- Layover rest periods update automatically when editing paired flights
- All issues identified during testing have been resolved

**Future Enhancement:**

- Phase 6 (Revert Functionality) can be implemented if users request the ability to restore original roster values

---

## Technical Architecture

### Data Flow

```
User clicks "Edit Times"
  → EditTimesDialog opens with current times
  → User modifies times
  → Real-time validation + cross-day detection
  → (For layovers) Real-time rest period calculation preview
  → User clicks Save
  → Confirmation dialog appears
  → User confirms
  → updateFlightDuty() called
  → Recalculation engine runs in background
  → UI shows loading state
  → Cards update with new values
  → (For layovers) Paired flight card updates automatically
  → Success notification
```

### Database Operations

**New Function:** `updateFlightDuty(flightId, updates, userId)`

- Updates `report_time`, `debrief_time`, `duty_hours`, `flight_pay`
- Updates `is_cross_day` flag
- Sets `data_source` to `'edited'`
- Updates `last_edited_at` and `last_edited_by`
- Preserves `original_data` on first edit
- Creates audit trail entry

### Calculation Dependencies

When times are edited, the following must be recalculated:

1. **Duty Hours** - `calculateDuration(reportTime, debriefTime, isCrossDay)`
2. **Flight Pay** - `dutyHours × hourlyRate` (for turnarounds/layovers)
3. **Layover Rest Period** - `calculateRestPeriod()` (if part of layover pair)
4. **Per Diem Pay** - `restHours × 8.82 AED/hr` (for layovers)
5. **Monthly Totals** - Sum of all flight pay and per diem pay

**Existing Infrastructure:**

- ✅ `recalculateMonthlyTotals()` already exists in `recalculation-engine.ts`
- ✅ Time calculation utilities exist in `time-calculator.ts`
- ✅ `TimeInput` component exists for validation

---

## Component Structure

### New Components

```
src/components/salary-calculator/
  ├── EditTimesDialog.tsx          (NEW - Shared edit dialog)
  └── RevertTimesDialog.tsx        (NEW - Revert confirmation)
```

### Modified Components

```
src/components/salary-calculator/
  ├── TurnaroundCard.tsx           (Add edit menu item)
  ├── LayoverConnectedCard.tsx     (Add edit menu item)
  └── StandardDutyCard.tsx         (Add edit menu item for ASBY/SBY)
```

### New Database Functions

```
src/lib/database/
  └── flights.ts
      ├── updateFlightDuty()       (NEW - Update flight times)
      └── revertFlightDuty()       (NEW - Revert to original)
```

---

## Phase 1: Database & Core Infrastructure

**Goal:** Create database update operations with audit trail support

### Tasks

- [ ] 1.1 Create `updateFlightDuty()` function in `src/lib/database/flights.ts`
  - Accept `flightId`, `updates`, `userId` parameters
  - Update both old schema (`reporting_time`, `debriefing_time`) and new schema (`report_time`, `debrief_time`)
  - Update `duty_hours`, `flight_pay`, `is_cross_day`
  - Set `data_source` to `'edited'`
  - Update `last_edited_at` and `last_edited_by`
  - Preserve `original_data` on first edit (if not already edited)
- [ ] 1.2 Add audit trail support
  - Create audit entry with old and new values
  - Follow existing pattern from `deleteFlightDuty()`
- [ ] 1.3 Create `revertFlightDuty()` function

  - Restore times from `original_data`
  - Reset `data_source` to original value
  - Clear `last_edited_at` and `last_edited_by`
  - Create audit entry for revert action

- [ ] 1.4 Add TypeScript types
  - `FlightTimeUpdate` interface for update payload
  - Update return types

### Testing Checklist

- [ ] Update function successfully modifies database
- [ ] Original data is preserved on first edit
- [ ] Subsequent edits don't overwrite original data
- [ ] Audit trail entries are created
- [ ] Revert function restores original values

### Success Criteria

- Database operations work correctly
- Audit trail is maintained
- Original data is preserved

**Estimated Time:** 2-3 hours

---

## Phase 2: Shared Edit Dialog Component

**Goal:** Create reusable EditTimesDialog component with validation

### Tasks

- [ ] 2.1 Create `EditTimesDialog.tsx` component
  - Accept `flightDuty`, `allFlightDuties`, `onSave`, `onCancel` props
  - Use ShadCN Dialog component
  - Display flight number and duty type in header
- [ ] 2.2 Add time input fields
  - Reuse existing `TimeInput` component
  - Reporting time field
  - Debriefing time field
  - Initialize with current values
- [ ] 2.3 Implement validation
  - HH:MM format validation (handled by TimeInput)
  - Report time before debrief time (same day)
  - Prevent negative duty hours
  - Show inline error messages below fields
- [ ] 2.4 Add cross-day auto-detection
  - Detect if debrief < report
  - Show cross-day indicator badge
  - Update `isCrossDay` flag automatically
- [ ] 2.5 Add real-time duty hours preview
  - Calculate and display duty hours as user types
  - Show updated flight pay estimate
- [ ] 2.6 Add layover rest period preview (for layovers only)
  - Detect if flight is part of layover pair
  - Calculate rest period in real-time
  - Display updated per diem estimate
  - Show which paired flight will be affected
- [ ] 2.7 Add confirmation dialog

  - Show summary of changes before saving
  - Display old vs new times
  - Show impact on calculations
  - Confirm/Cancel buttons

- [ ] 2.8 Add loading state
  - Disable inputs during save
  - Show spinner on save button
  - Prevent dialog close during save

### Component Props Interface

```typescript
interface EditTimesDialogProps {
  flightDuty: FlightDuty;
  allFlightDuties: FlightDuty[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    flightId: string,
    newReportTime: TimeValue,
    newDebriefTime: TimeValue,
    isCrossDay: boolean
  ) => Promise<void>;
}
```

### Testing Checklist

- [ ] Dialog opens and closes correctly
- [ ] Time inputs are pre-filled with current values
- [ ] Validation errors appear inline
- [ ] Cross-day is auto-detected
- [ ] Duty hours preview updates in real-time
- [ ] Layover rest period preview works (for layovers)
- [ ] Confirmation dialog shows correct summary
- [ ] Loading state prevents multiple saves

### Success Criteria

- Dialog is fully functional and reusable
- All validation works correctly
- Real-time previews are accurate
- User experience is smooth

**Estimated Time:** 4-6 hours

---

## Phase 3: TurnaroundCard Integration (Proof of Concept)

**Goal:** Implement edit functionality in TurnaroundCard as proof of concept

### Tasks

- [ ] 3.1 Add "Edit Times" to dropdown menu
  - Add menu item after Delete option
  - Use Pencil icon from lucide-react
  - Only show when `showActions={true}` and not in bulk mode
- [ ] 3.2 Add dialog state management
  - `isEditDialogOpen` state
  - Open dialog on menu item click
- [ ] 3.3 Wire up EditTimesDialog
  - Pass current flight duty
  - Pass all flight duties for context
  - Implement onSave handler
- [ ] 3.4 Implement save handler
  - Call `updateFlightDuty()` with new times
  - Recalculate duty hours and flight pay
  - Call `recalculateMonthlyTotals()`
  - Refresh flight duties data
  - Show success notification
- [ ] 3.5 Add error handling
  - Catch database errors
  - Show error notification
  - Keep dialog open on error

### Testing Checklist

- [ ] Edit menu item appears in dropdown
- [ ] Dialog opens with correct data
- [ ] Saving updates the database
- [ ] Card updates with new times
- [ ] Duty hours recalculate correctly
- [ ] Flight pay recalculates correctly
- [ ] Monthly totals update
- [ ] Dashboard summary cards update
- [ ] Error handling works

### Success Criteria

- Edit functionality works end-to-end for turnarounds
- All calculations update correctly
- UI updates reflect changes immediately

**Estimated Time:** 3-4 hours

---

## Phase 4: LayoverConnectedCard Integration

**Goal:** Implement edit functionality for layovers with rest period recalculation

### Tasks

- [ ] 4.1 Add "Edit Times" to dropdown menu
  - Same pattern as TurnaroundCard
- [ ] 4.2 Wire up EditTimesDialog
  - Pass layover pair information
  - Enable rest period preview
- [ ] 4.3 Implement save handler with layover logic
  - Update flight times
  - Recalculate rest period for layover pair
  - Update `layover_rest_periods` table
  - Recalculate per diem pay
  - Update both outbound and inbound cards
- [ ] 4.4 Test paired flight updates
  - Edit outbound debrief time → rest period changes
  - Edit inbound report time → rest period changes
  - Verify paired flight card updates automatically
- [ ] 4.5 Add real-time preview in dialog
  - Show current rest period
  - Show new rest period as user types
  - Show impact on per diem pay
  - Highlight which paired flight is affected

### Testing Checklist

- [ ] Edit works for outbound layover flights
- [ ] Edit works for inbound layover flights
- [ ] Rest period recalculates correctly
- [ ] Per diem pay updates correctly
- [ ] Paired flight card updates in real-time
- [ ] Layover details section updates
- [ ] Monthly totals include updated per diem

### Success Criteria

- Layover edit functionality works end-to-end
- Rest period calculations are accurate
- Both paired flights update correctly
- Real-time preview is accurate

**Estimated Time:** 4-5 hours

---

## Phase 5: StandardDutyCard Integration (ASBY, SBY)

**Goal:** Add edit functionality for ASBY and SBY duties

### Tasks

- [ ] 5.1 Add "Edit Times" to dropdown menu
  - Only show for ASBY and SBY duty types
  - Hide for recurrent, business_promotion, off
- [ ] 5.2 Wire up EditTimesDialog
  - Same pattern as other cards
- [ ] 5.3 Implement save handler
  - ASBY: Update times but pay remains fixed at 4 hours
  - SBY: Update times (currently 0 pay)
- [ ] 5.4 Add note in dialog for ASBY
  - Inform user that ASBY pay is fixed at 4 hours
  - Editing times won't change payment

### Testing Checklist

- [ ] Edit works for ASBY duties
- [ ] Edit works for SBY duties
- [ ] ASBY pay remains at 4 hours regardless of time changes
- [ ] Edit option doesn't appear for recurrent/business_promotion/off

### Success Criteria

- Edit functionality works for ASBY and SBY
- Fixed pay logic is maintained for ASBY
- User is informed about ASBY payment rules

**Estimated Time:** 2-3 hours

---

## Phase 6: Revert Functionality

**Goal:** Allow users to revert edited flights back to original values

### Tasks

- [ ] 6.1 Create `RevertTimesDialog.tsx` component
  - Confirmation dialog
  - Show original vs current times
  - Warn about recalculation impact
- [ ] 6.2 Add "Revert to Original" menu item
  - Only show if flight has been edited (`dataSource === 'edited'`)
  - Only show if `original_data` exists
  - Add to dropdown menu in all card types
- [ ] 6.3 Implement revert handler
  - Call `revertFlightDuty()`
  - Recalculate monthly totals
  - Refresh UI
  - Show success notification
- [ ] 6.4 Handle layover reverts
  - If reverting a layover flight, recalculate rest period
  - Update paired flight

### Testing Checklist

- [ ] Revert option only appears for edited flights
- [ ] Revert dialog shows correct original values
- [ ] Reverting restores original times
- [ ] Calculations update after revert
- [ ] Layover rest periods update after revert
- [ ] Audit trail records revert action

### Success Criteria

- Users can successfully revert edited flights
- Original data is restored accurately
- All calculations update correctly

**Estimated Time:** 2-3 hours

---

## Phase 7: Testing & Edge Cases

**Goal:** Comprehensive testing of all scenarios and edge cases

### Test Scenarios

#### Cross-Day Detection

- [ ] Edit turnaround: report 23:00, debrief 02:00 → auto-detect cross-day
- [ ] Edit layover: report 22:00, debrief 01:00 → auto-detect cross-day
- [ ] Verify duty hours calculation with cross-day flag

#### Layover Rest Period Calculations

- [ ] Edit outbound debrief time → verify rest period updates
- [ ] Edit inbound report time → verify rest period updates
- [ ] Edit both outbound and inbound → verify cumulative effect
- [ ] Verify per diem pay updates correctly

#### Validation

- [ ] Invalid time format → show error
- [ ] Report time after debrief time (same day) → show error
- [ ] Times resulting in negative duty hours → prevent save
- [ ] Empty time fields → show error

#### Data Integrity

- [ ] First edit preserves original data
- [ ] Second edit doesn't overwrite original data
- [ ] Revert restores exact original values
- [ ] Audit trail records all changes

#### UI/UX

- [ ] Dialog works on mobile screens
- [ ] Loading states prevent duplicate saves
- [ ] Error messages are clear and helpful
- [ ] Success notifications appear
- [ ] Cards update without page refresh

#### Performance

- [ ] Recalculation completes within 2 seconds
- [ ] Multiple rapid edits don't cause race conditions
- [ ] Large datasets (30+ flights) handle well

### Success Criteria

- All test scenarios pass
- No regressions in existing functionality
- Performance is acceptable
- User experience is smooth

**Estimated Time:** 3-4 hours

---

## Implementation Checklist

### Phase 1: Database & Core Infrastructure ⏱️ 2-3 hours

- [ ] Create `updateFlightDuty()` function
- [ ] Add audit trail support
- [ ] Create `revertFlightDuty()` function
- [ ] Test database operations

### Phase 2: Shared Edit Dialog Component ⏱️ 4-6 hours

- [ ] Create `EditTimesDialog.tsx`
- [ ] Add time input fields with validation
- [ ] Implement cross-day auto-detection
- [ ] Add real-time previews
- [ ] Add confirmation dialog

### Phase 3: TurnaroundCard Integration ⏱️ 3-4 hours

- [ ] Add edit menu item
- [ ] Wire up dialog
- [ ] Implement save handler
- [ ] Test recalculation flow

### Phase 4: LayoverConnectedCard Integration ⏱️ 4-5 hours

- [ ] Add edit menu item
- [ ] Implement layover-specific logic
- [ ] Test rest period recalculation
- [ ] Test paired flight updates

### Phase 5: StandardDutyCard Integration ⏱️ 2-3 hours

- [ ] Add edit for ASBY and SBY
- [ ] Handle fixed pay for ASBY
- [ ] Test both duty types

### Phase 6: Revert Functionality ⏱️ 2-3 hours

- [ ] Create revert dialog
- [ ] Add revert menu item
- [ ] Implement revert handler
- [ ] Test revert flow

### Phase 7: Testing & Edge Cases ⏱️ 3-4 hours

- [ ] Test all scenarios
- [ ] Fix any bugs found
- [ ] Performance testing
- [ ] User acceptance testing

---

## Total Estimated Timeline

| Phase   | Estimated Time | Cumulative  |
| ------- | -------------- | ----------- |
| Phase 1 | 2-3 hours      | 2-3 hours   |
| Phase 2 | 4-6 hours      | 6-9 hours   |
| Phase 3 | 3-4 hours      | 9-13 hours  |
| Phase 4 | 4-5 hours      | 13-18 hours |
| Phase 5 | 2-3 hours      | 15-21 hours |
| Phase 6 | 2-3 hours      | 17-24 hours |
| Phase 7 | 3-4 hours      | 20-28 hours |

**Total: 20-28 hours (2.5-3.5 days)**

---

## Success Metrics

- ✅ Users can edit reporting/debriefing times for turnarounds, layovers, ASBY, and SBY
- ✅ All calculations update automatically and accurately
- ✅ Layover rest periods recalculate when paired flights are edited
- ✅ Original data is preserved and can be reverted
- ✅ Validation prevents invalid time entries
- ✅ Cross-day detection works automatically
- ✅ UI updates in real-time without page refresh
- ✅ No regressions in existing functionality
- ✅ Performance is acceptable (< 2 seconds for recalculation)

---

## Notes

- Test each phase thoroughly before moving to the next
- User will perform system testing (no fake test data needed)
- Focus on clean, maintainable code following existing patterns
- Reuse existing components and utilities wherever possible
- Document any deviations from the plan

---

**Document Version:** 1.0  
**Created:** 2025-11-07  
**Status:** Ready for Implementation

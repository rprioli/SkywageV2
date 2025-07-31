# Layover Rest Period & Salary Calculation Fix Action Plan

## Executive Summary

Critical issues identified in the layover pairing logic and salary calculations that result in:

- **Incorrect rest period calculations**
- **Inflated per diem payments** due to wrong rest periods
- **Total salary discrepancy**
- **Inconsistent duty hour reporting** between dashboard and cards

## Issues Identified

### Primary Issues

1. **Layover Pairing Logic Failure**: System pairs layover duties with wrong reference flights
2. **Rest Period Calculation Errors**: Using incorrect start/end times for rest calculations
3. **Per Diem Inflation**: Excessive per diem due to inflated rest periods

### Secondary Issues

4. **Critical Duty Hour Inconsistency**: Dashboard shows 120h, cards show 97h, Excel shows 119h
5. **Flight Count Mismatch**: System shows 16 flights vs expected 15 + 1 standby
6. **Salary Calculation Errors**: Total salary inflated by incorrect per diem + wrong duty hours

## Root Cause Analysis

### Layover Pairing Algorithm Issues

- **Aug 5 FZ1794**: Calculating rest from Aug 3 instead of Aug 4 FZ1793
- **Aug 9 FZ1794**: Calculating rest from Aug 7 (day off) instead of Aug 8 FZ1793
- **Aug 13 FZ1682**: Calculating rest from Aug 9 FZ1794 instead of Aug 12 FZ1681

### Duty Hour Calculation Issues

- **Excel Source**: 119:00 hours (authoritative source)
- **Dashboard Display**: 120h (1 hour over - likely rounding or calculation error)
- **Flight Time Card**: 97h (22 hours under - missing duties or wrong calculation)
- **Root Cause**: Inconsistent duty hour calculation logic across components

### Expected vs Actual Rest Periods

| Flight        | Expected Rest   | Actual Rest | Status     |
| ------------- | --------------- | ----------- | ---------- |
| Aug 4 FZ1793  | 23h 30m         | 23h 30m     | ✅ Correct |
| Aug 5 FZ1794  | 0h (return leg) | 57h 35m     | ❌ Wrong   |
| Aug 8 FZ1793  | 23h 30m         | 23h 30m     | ✅ Correct |
| Aug 9 FZ1794  | 0h (return leg) | 55h 55m     | ❌ Wrong   |
| Aug 12 FZ1681 | 23h 30m         | 23h 30m     | ✅ Correct |
| Aug 13 FZ1682 | 0h (return leg) | 94h 05m     | ❌ Wrong   |

---

## PHASE 1: Investigation & Code Analysis

### Step 1.1: Locate Layover Pairing Logic

- [ ] Review `calculateLayoverRestPeriods()` function in `calculation-engine.ts`
- [ ] Examine layover identification algorithm in flight classifier
- [ ] Check rest period calculation logic in time calculator
- [ ] Identify where incorrect pairing occurs

### Step 1.2: Analyze Current Implementation

- [ ] Document current layover pairing algorithm
- [ ] Identify why return legs are getting rest periods
- [ ] Trace rest period calculation flow
- [ ] Map data flow from roster to final calculations
- [ ] **Analyze duty hour calculation discrepancies**
- [ ] **Identify where 120h vs 119h vs 97h calculations occur**
- [ ] **Trace duty hour calculation across all components**

### Step 1.3: Create Test Cases

- [ ] Analyze real data for August 2025 roster
- [ ] Define expected vs actual results for each layover pair
- [ ] Set up unit tests for layover pairing logic
- [ ] Prepare validation data for salary calculations
- [ ] **Create duty hour validation test cases (119h expected)**
- [ ] **Set up cross-component duty hour consistency tests**

---

## PHASE 2: Fix Layover Pairing Logic

### Step 2.1: Correct Layover Identification ✅ COMPLETED

**Target Files:**

- `src/lib/salary-calculator/calculation-engine.ts`
- `src/components/salary-calculator/FlightDutyCard.tsx`

**Changes Required:**

- [x] Fix `calculateLayoverRestPeriods()` to properly identify layover pairs
- [x] Ensure only outbound flights get rest periods, not return flights
- [x] Implement proper consecutive flight pairing logic
- [x] Add validation for layover pair matching

**✅ COMPLETED CHANGES:**

- Replaced sequential pairing logic with route-based pairing
- Added helper functions to identify outbound/inbound flights
- Implemented destination matching for proper layover pairs
- Updated FlightDutyCard to use same logic as calculation engine
- Added comprehensive logging for debugging

### Step 2.2: Fix Rest Period Calculation

**Target Files:**

- `src/lib/salary-calculator/time-calculator.ts`
- `src/lib/salary-calculator/calculation-engine.ts`

**Changes Required:**

- [ ] Ensure rest calculation uses correct debrief → report time sequence
- [ ] Fix cross-day calculation for layover rest periods
- [ ] Validate rest period calculations against expected 23h 30m standard
- [ ] Add error handling for invalid rest period calculations

### Step 2.3: Update Layover Display Logic

**Target Files:**

- `src/components/salary-calculator/FlightDutyCard.tsx`

**Changes Required:**

- [ ] Show rest periods only on outbound layover flights
- [ ] Remove rest period display from return flights
- [ ] Update per diem calculation display
- [ ] Fix layover pair matching in UI components

---

## PHASE 3: Fix Salary Calculations

### Step 3.1: Recalculate Per Diem Payments

**Target Files:**

- `src/lib/salary-calculator/calculation-engine.ts`

**Changes Required:**

- [ ] Recalculate per diem using corrected rest periods
- [ ] Ensure per diem rate of 8.82 AED/hour is applied correctly
- [ ] Update total per diem calculation (should be ~1,036.35 AED)
- [ ] Remove per diem from return flights

### Step 3.2: Fix Monthly Salary Totals

**Target Files:**

- `src/lib/salary-calculator/calculation-engine.ts`

**Changes Required:**

- [ ] Recalculate total variable pay with corrected per diem
- [ ] Update total salary calculation (should be ~15,261.35 AED)
- [ ] Ensure consistent salary reporting across all components
- [ ] Validate against expected CCM rates

### Step 3.3: **CRITICAL: Fix Duty Hour Calculation Precision**

**Target Files:**

- `src/components/dashboard/` (Dashboard duty hour display)
- `src/components/salary-calculator/FlightDutyCard.tsx`
- `src/lib/salary-calculator/calculation-engine.ts`
- All components displaying duty hours

**Changes Required:**

- [ ] **Identify source of 120h calculation error (1h over Excel)**
- [ ] **Fix 97h calculation error (22h under Excel)**
- [ ] **Ensure all components use same duty hour calculation logic**
- [ ] **Validate against Excel source: exactly 119:00 hours**
- [ ] **Update flight pay calculation to use precise 119h**
- [ ] **Synchronize duty hour display across all UI components**
- [ ] **Add validation to prevent duty hour calculation drift**

---

## PHASE 4: Testing & Validation

### Step 4.1: Unit Testing

- [ ] Test layover pairing algorithm with August 2025 data
- [ ] Validate rest period calculations for all layover pairs
- [ ] Test per diem calculations with corrected rest periods
- [ ] Verify salary calculation accuracy
- [ ] **Test duty hour calculation precision (must equal 119h)**
- [ ] **Validate duty hour consistency across all components**

### Step 4.2: Integration Testing

- [ ] Test complete roster upload and processing
- [ ] Validate end-to-end salary calculation flow
- [ ] Test UI display consistency
- [ ] Verify database updates are correct

### Step 4.3: Regression Testing

- [ ] Test with other monthly rosters
- [ ] Ensure existing functionality remains intact
- [ ] Validate different layover scenarios
- [ ] Test edge cases and error handling

---

## PHASE 5: Deployment & Monitoring

### Step 5.1: Pre-Deployment Validation

- [ ] Final validation with August 2025 roster
- [ ] Confirm expected results match actual results
- [ ] Review all code changes for quality
- [ ] Update documentation and comments

### Step 5.2: Deployment

- [ ] Deploy fixes to development environment
- [ ] Perform smoke testing
- [ ] Deploy to production
- [ ] Monitor for any issues

### Step 5.3: Post-Deployment Verification

- [ ] Verify August 2025 calculations are correct
- [ ] Check total salary shows 15,261.35 AED
- [ ] Confirm layover rest periods show 23h 30m
- [ ] Validate per diem totals are accurate
- [ ] **Verify duty hours show exactly 119h across all displays**
- [ ] **Confirm flight pay calculation uses precise 119h**

---

## Expected Results After Fix

### Corrected Layover Rest Periods

- **Zagreb Layover 1 (Aug 4-5)**: 23h 30m on Aug 4 only
- **Zagreb Layover 2 (Aug 8-9)**: 23h 30m on Aug 8 only
- **Naples Layover (Aug 12-13)**: 23h 30m on Aug 12 only
- **Moscow Layover (Aug 16-18)**: 23h 30m on Aug 16 only
- **Ljubljana Layover (Aug 23-24)**: 23h 30m on Aug 23 only

### Corrected Financial Calculations

- **Total Per Diem**: 1,036.35 AED (117.5 hours × 8.82 AED/hour)
- **Total Flight Pay**: 5,950.00 AED (119 hours × 50 AED/hour)
- **Total Variable Pay**: 6,986.35 AED
- **Total Monthly Salary**: 15,261.35 AED

### Corrected Display Metrics

- **Precise Duty Hours**: Exactly 119 hours across ALL displays (dashboard, cards, calculations)
- **Correct Flight Count**: 15 flights + 1 standby
- **Accurate Rest Periods**: Only on outbound layover flights
- **Consistent Flight Pay**: 5,950.00 AED (119h × 50 AED/hour) everywhere

---

## Success Criteria

✅ **Layover Pairing**: Only outbound flights show rest periods
✅ **Rest Periods**: All layovers show exactly 23h 30m
✅ **Per Diem**: Total of 1,036.35 AED
✅ **Total Salary**: 15,261.35 AED
✅ **Duty Hours**: Precisely 119 hours across ALL displays (no 120h or 97h errors)
✅ **Flight Pay**: Exactly 5,950.00 AED (119h × 50 AED/hour)
✅ **Flight Count**: Accurate count of 15 flights + 1 standby

## Risk Mitigation

- **Backup current calculations** before making changes
- **Test thoroughly** with multiple roster scenarios
- **Implement gradual rollout** to minimize impact
- **Monitor closely** after deployment for any issues
- **Have rollback plan** ready if critical issues arise

---

_This action plan addresses the critical layover calculation issues identified in the August 2025 roster analysis and provides a systematic approach to fix all related problems._

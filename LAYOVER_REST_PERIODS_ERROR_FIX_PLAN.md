# Layover Rest Periods Database Error Fix Plan

## Issue Summary

**Problem**: Two console errors occurring during Excel/CSV roster file uploads:

1. `Error creating layover rest periods: {}`
2. `Insert data that failed: [...]`

**Root Cause**: Foreign key constraint violations when inserting layover rest periods into the database. The `layover_rest_periods` table has foreign key constraints on `outbound_flight_id` and `inbound_flight_id` that reference the `flights` table, but the code was attempting to insert records with invalid/empty flight IDs.

**Impact**:

- Layover rest periods are not being saved to the database
- Console errors appear during file uploads
- Salary calculations may be incomplete for layover pay

## Database Schema Analysis

### `layover_rest_periods` Table Structure:

- `outbound_flight_id` (uuid) → FK to `flights.id`
- `inbound_flight_id` (uuid) → FK to `flights.id`
- Both fields are nullable but have foreign key constraints

### Foreign Key Constraints:

- `layover_rest_periods_outbound_flight_id_fkey` → `flights.id`
- `layover_rest_periods_inbound_flight_id_fkey` → `flights.id`

## What Has Been Attempted (Current Session)

### Phase 1: Enhanced Error Handling ✅ COMPLETED

**File**: `src/lib/database/calculations.ts`

- Added validation to check for missing flight IDs before database insertion
- Added specific error message for foreign key constraint violations (error code 23503)
- Enhanced logging to identify problematic data

### Phase 2: Fixed Flight ID Logic ✅ COMPLETED

**File**: `src/lib/salary-calculator/calculation-engine.ts`

- Changed from `outboundFlight.id || ''` to only create rest periods when both flights have valid IDs
- Added warning logs when skipping rest period creation due to missing flight IDs

### Phase 3: Added Safety Checks ✅ COMPLETED

**File**: `src/lib/salary-calculator/upload-processor.ts`

- Filter out invalid rest periods before attempting to save them
- Added detailed logging for valid vs invalid rest periods
- Applied fixes to both CSV and Excel processing paths

### Result: **FIXES DID NOT RESOLVE THE ISSUE**

- User reported the same errors persist after uploading Excel file
- Need deeper investigation into the data flow and timing issues

## Detailed Investigation Plan (Next Steps)

### Phase 4: Deep Debugging and Data Flow Analysis ✅ IN PROGRESS

**Priority**: HIGH
**Estimated Time**: 1-2 hours

#### Step 4.1: Add Comprehensive Logging ✅ COMPLETED

- ✅ Added detailed logging throughout the entire upload process
- ✅ Log flight duty data before and after database save
- ✅ Log layover rest period data at each transformation step
- ✅ Track flight ID assignment and validation

**Files Modified:**

- `src/lib/salary-calculator/upload-processor.ts` - Added comprehensive logging for both CSV and file upload paths
- `src/lib/salary-calculator/calculation-engine.ts` - Added detailed logging for layover calculation process
- `src/lib/database/calculations.ts` - Enhanced database insertion logging

**Logging Added:**

- Flight duties after database save with ID verification
- Layover rest periods before and after calculation
- Valid vs invalid rest periods filtering
- Flight ID existence verification against saved flights
- Database insertion record details
- Comprehensive error tracking throughout the data flow

#### Step 4.2: Investigate Data Flow Timing ✅ IN PROGRESS

- ✅ Verify that flights are being saved to database successfully
- ✅ Check if flight IDs are properly assigned after database save
- 🔄 Investigate if there's a race condition between flight save and layover calculation

**Key Findings from Console Logs:**

- ✅ Flights are being saved successfully (5 duties saved)
- ✅ Layover flights are being identified (2 layover flights found)
- ✅ Rest periods are being calculated (1 rest period created)
- ❌ Database save fails with foreign key constraint violation
- 🔍 **Root Cause Identified**: Flight IDs in rest periods don't match actual database flight IDs

**Enhanced Debugging Added:**

- Added database-level flight ID existence verification
- Added enhanced flight ID mismatch detection with error alerts
- Added detailed flight ID comparison logging

**🚀 SOLUTION IMPLEMENTED:**

- **Root Cause**: Layover rest periods were calculated with original flight IDs (before database save), but database save assigns new auto-generated IDs
- **Fix Applied**: Changed Excel upload path to recalculate layover rest periods using saved flight duties (with correct database IDs), matching the CSV approach
- **Code Changes**:
  - Excel path now calls `calculateLayoverRestPeriods(savedFlightDuties, userId, position)` after flights are saved
  - Removed flawed ID mapping logic that only updated `flightDutyId` but not `outboundFlightId`/`inboundFlightId`

**Action Required:** Test Excel file upload again to verify the foreign key constraint violation is resolved.

#### Step 4.3: Database State Verification 🔄 PENDING

- Add queries to verify flights exist in database before creating rest periods
- Check for any data corruption or inconsistent states
- Validate that saved flight duties have proper IDs

### Phase 5: Excel-Specific Investigation 🔄 PENDING

**Priority**: HIGH
**Estimated Time**: 1 hour

#### Step 5.1: Excel Parser Data Validation

- Verify Excel parser is correctly extracting layover flight data
- Check if Excel parsing creates different data structure than CSV
- Validate that Excel-parsed flights have proper duty types and relationships

#### Step 5.2: Cross-Day Detection Issues

- Investigate if cross-day detection in Excel parsing affects flight ID assignment
- Check if layover pair detection works correctly with Excel data

### Phase 6: Database Transaction Analysis 🔄 PENDING

**Priority**: MEDIUM
**Estimated Time**: 1 hour

#### Step 6.1: Transaction Isolation

- Investigate if database transactions are properly isolated
- Check if layover rest periods are being created before flights are committed
- Consider implementing proper transaction boundaries

#### Step 6.2: Batch Insert Optimization

- Review if batch inserts are causing timing issues
- Consider implementing sequential saves with proper error handling

### Phase 7: Alternative Architecture Solutions 🔄 PENDING

**Priority**: LOW
**Estimated Time**: 2-3 hours

#### Step 7.1: Deferred Layover Creation

- Implement a two-phase approach: save flights first, then calculate layovers
- Add a background job or delayed processing for layover rest periods

#### Step 7.2: Database Schema Review

- Consider making foreign key constraints deferrable
- Evaluate if layover rest periods should be created differently

## Testing Strategy

### Test Cases to Implement:

1. **Excel Upload with Layovers**: Upload Excel file with known layover flights
2. **CSV Upload with Layovers**: Compare behavior with CSV uploads
3. **Database State Verification**: Query database after upload to verify data integrity
4. **Error Reproduction**: Create minimal test case that reproduces the error

### Test Data Requirements:

- Excel file with clear layover flight pairs
- Known good data that should create valid layover rest periods
- Edge cases: single layovers, multiple consecutive layovers

## Success Criteria

### Phase 4 Success:

- [ ] Clear understanding of where in the data flow the error occurs
- [ ] Detailed logs showing exact point of failure
- [ ] Identification of root cause (timing, data structure, or logic issue)

### Overall Success:

- [ ] No console errors during Excel/CSV uploads
- [ ] Layover rest periods successfully saved to database
- [ ] Proper foreign key relationships maintained
- [ ] Salary calculations include correct layover pay

## Development Guidelines Compliance

- ✅ **Phased Approach**: Breaking down into manageable phases
- ✅ **Existing Code Iteration**: Building on existing patterns
- ✅ **Simple Solutions**: Avoiding over-engineering
- ✅ **Clean Code**: Maintaining organized structure
- 🔄 **Testing**: Will implement proper testing after fixes
- 🔄 **Server Restart**: Will restart server for testing after each phase

## Next Session Action Items

1. **Start with Phase 4.1**: Add comprehensive logging
2. **Kill existing servers** before starting development
3. **Test each fix incrementally** with actual Excel file uploads
4. **Update this document** with findings and progress
5. **Start new server** after each change for testing

## Notes for Future Development

- This issue may be related to the Excel parsing improvements documented in `EXCEL_SUPPORT_IMPLEMENTATION_PLAN.md`
- Consider the relationship between cross-day detection fixes and layover rest period creation
- May need to coordinate with existing Excel parsing work to ensure compatibility

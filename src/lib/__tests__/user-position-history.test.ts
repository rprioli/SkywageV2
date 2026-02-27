/**
 * Unit tests for User Position History module
 *
 * Tests pure helper functions that require no Supabase access.
 * Database-dependent functions (getUserPositionForMonth, getAffectedMonthsFrom,
 * CRUD operations) are covered by the manual verification checklist below and
 * would require a test runner with Supabase mocking (e.g. jest + @types/jest).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MANUAL VERIFICATION CHECKLIST
 * Run these after applying the SQL migrations and deploying the feature.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. BASELINE BACKFILL
 *    [ ] Open Profile → Role History for an existing user.
 *        One baseline entry should exist, matching the position in profiles.
 *    [ ] Sign up as a new user. A baseline entry is auto-created.
 *
 * 2. ADD POSITION CHANGE (e.g. CCM → SCCM effective June 2025)
 *    [ ] Click "Add Position Change", select SCCM and June 2025, save.
 *    [ ] Salary Breakdown for July 2025 flights shows "SCCM" in the role badge.
 *    [ ] Salary Breakdown for May 2025 flights still shows "CCM".
 *    [ ] profiles.position in the database reflects the current effective role.
 *
 * 3. RE-UPLOAD HISTORICAL ROSTER (May 2025)
 *    [ ] Re-upload May 2025 roster after the SCCM change is saved.
 *    [ ] May 2025 flights are still calculated with CCM rates (no retroactive change).
 *    [ ] June 2025+ flights are calculated with SCCM rates.
 *
 * 4. MANUAL FLIGHT ENTRY
 *    [ ] Add a manual flight for April 2025 → uses CCM rates.
 *    [ ] Add a manual flight for June 2025 → uses SCCM rates.
 *    [ ] Real-time pay preview in the form matches the correct rates per date.
 *
 * 5. CROSS-MONTH LAYOVER (PROMOTION BOUNDARY)
 *    [ ] A layover starting in May 2025 with rest period ending in June 2025
 *        (or vice-versa) should recalculate correctly.
 *    [ ] After adding the SCCM change, verify the previous month (May) is also
 *        recalculated (PositionUpdate triggers recalc for month - 1).
 *    [ ] Per diem for May rest period uses CCM rate; June rest uses SCCM rate.
 *
 * 6. SNAPSHOT COLUMNS
 *    [ ] In the database, flights.position_used reflects the role used at time
 *        of calculation (not the current profiles.position).
 *    [ ] monthly_calculations.position_used reflects the correct historical role.
 *    [ ] SalaryBreakdown UI shows the snapshot role, not the current role.
 *
 * 7. DELETE POSITION CHANGE
 *    [ ] Delete a non-baseline entry → succeeds, timeline shrinks.
 *    [ ] Attempt to delete the last remaining entry → shows error:
 *        "Cannot delete the baseline position entry."
 *    [ ] After deletion, profiles.position syncs to the new latest effective role.
 *
 * 8. EDIT POSITION CHANGE
 *    [ ] Edit an existing entry (change month or role) → timeline updates.
 *    [ ] Affected months are recalculated after the edit is saved.
 *    [ ] Toast notifications show progress ("Recalculating X months...") and
 *        completion ("Role history updated. X months recalculated.").
 *
 * 9. RESOLVER EDGE CASES (verify via database queries or integration tests)
 *    [ ] User has no history row and no profile → resolver throws an error.
 *    [ ] User has only a future history entry → resolver falls back to profile.
 *    [ ] Multiple history entries → resolver picks the latest effective for date.
 *    [ ] Position change effective January → previous month is December of prior year.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getPreviousMonth } from '../user-position-history';

// ─────────────────────────────────────────────────────────────────────────────
// getPreviousMonth — pure function, no dependencies
// ─────────────────────────────────────────────────────────────────────────────

describe('getPreviousMonth', () => {
  describe('year boundary', () => {
    test('January 2026 → December 2025', () => {
      expect(getPreviousMonth(2026, 1)).toEqual({ month: 12, year: 2025 });
    });

    test('January 2025 → December 2024', () => {
      expect(getPreviousMonth(2025, 1)).toEqual({ month: 12, year: 2024 });
    });
  });

  describe('within same year', () => {
    test('June 2025 → May 2025', () => {
      expect(getPreviousMonth(2025, 6)).toEqual({ month: 5, year: 2025 });
    });

    test('December 2025 → November 2025', () => {
      expect(getPreviousMonth(2025, 12)).toEqual({ month: 11, year: 2025 });
    });

    test('February 2025 → January 2025', () => {
      expect(getPreviousMonth(2025, 2)).toEqual({ month: 1, year: 2025 });
    });

    test('March 2026 → February 2026', () => {
      expect(getPreviousMonth(2026, 3)).toEqual({ month: 2, year: 2026 });
    });
  });

  describe('cross-month layover pairing (promotion boundary)', () => {
    /**
     * When a promotion is effective January, any layover that started in December
     * of the prior year and rested in January must be re-evaluated. PositionUpdate
     * recalculates getPreviousMonth(effectiveYear, effectiveMonth) to cover this.
     */
    test('promotion in Jan 2026 triggers December 2025 recalculation', () => {
      const effective = { year: 2026, month: 1 };
      const previous = getPreviousMonth(effective.year, effective.month);
      expect(previous).toEqual({ month: 12, year: 2025 });
    });

    test('promotion in March 2025 triggers February 2025 recalculation', () => {
      const effective = { year: 2025, month: 3 };
      const previous = getPreviousMonth(effective.year, effective.month);
      expect(previous).toEqual({ month: 2, year: 2025 });
    });

    test('promotion in June 2025 triggers May 2025 recalculation', () => {
      const effective = { year: 2025, month: 6 };
      const previous = getPreviousMonth(effective.year, effective.month);
      expect(previous).toEqual({ month: 5, year: 2025 });
    });
  });
});

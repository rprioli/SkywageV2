# Spec for UTC Payment Month Assignment & Business Promotion Fix

branch: claude/feature/utc-payment-month-assignment

## Summary

- **UTC-based payment month**: Roster files use Dubai local time (UTC+4), but Flydubai calculates payment based on UTC. A duty showing May 1 at 01:30 local is actually April 30 at 21:30 UTC — and should be paid in April. The system must use the UTC date of the report time to determine which month a duty's payment belongs to.
- **Display stays local**: All dates and times displayed to the user remain in Dubai local time. Only the payment/calculation logic changes.
- **Business promotion fixed pay**: Business promotion duties must be calculated at a fixed 5 flight hours regardless of actual duty duration, using the crew member's position rate (CCM 50 AED/hr or SCCM 62 AED/hr).

## Functional Requirements

### 1. UTC-Based Payment Month Assignment

- When parsing a roster file (CSV or Excel), each duty's **payment month** is determined by converting its report time from Dubai local (UTC+4) to UTC and using the resulting date's month.
- The duty's **display date** remains the local date from the roster (no change).
- Duties whose UTC report time falls in the target upload month are included in that month's payment calculation, even if their local date is in the following month.
- Duties whose UTC report time falls outside the target upload month are excluded from that month's payment calculation, even if their local date matches the target month.

### 2. Cross-Month Duty Handling — Two Scenarios

**Scenario A — Uploading April, last duty is May 1 (local)**
- UTC check: May 1 01:30 local → April 30 21:30 UTC → payment month = April.
- The duty is **not displayed** in April's roster view (local date is May, not April).
- The duty **is counted** in April's payment calculation at upload time.
- The duty is **not saved** to the database as an individual flight record — it will be persisted when May's roster is uploaded.

**Scenario B — Uploading May, first duty is May 1 (local) — same duty**
- UTC check: same duty → UTC date = April 30 → payment month = April.
- The duty **is displayed** in May's roster view (local date = May 1, matches May).
- The duty **is skipped** from May's payment calculation (already paid in April).
- The duty **is saved** to the database under May (month = 5).
- April gets recalculated (existing mechanism for cross-month layover pairing) and picks up the boundary duty via lookahead, ensuring April's totals remain correct.

### 3. Layover Inbound at Month Boundary

- Same rules apply: a layover inbound flight at the month boundary follows the UTC payment logic.
- Layover rest period pairing continues to work via the existing lookahead mechanism (fetches flights from the first 3 days of the next month).
- Rest periods are attributed to the outbound month, using the outbound month's position rates (no change from current behavior).

### 4. Business Promotion Fixed Pay

- Business promotion duties (`duty_type = 'business_promotion'`) must be calculated at exactly **5 flight hours**, regardless of the actual rostered duty duration.
- The hourly rate is determined by the crew member's position for the duty's month: CCM = 50 AED/hr, SCCM = 62 AED/hr (legacy rates), or the corresponding new-era rates for July 2025+.
- Example: A CCM business promotion = 5 x 50 = 250 AED (legacy) or 5 x new CCM rate (new era).

## Possible Edge Cases

- **Duty at exactly 04:00 local (00:00 UTC)**: A duty with report time at exactly 04:00 local on May 1 converts to 00:00 UTC May 1 — this belongs to May, not April. The boundary is exclusive: only report times before 04:00 local on the 1st of the next month shift back to the previous UTC month.
- **Layover outbound at month boundary**: An outbound flight on May 1 (local) with UTC date in April — same UTC logic applies. The rest period would be attributed to April (outbound month).
- **Multiple boundary duties**: A roster could have more than one duty in the UTC boundary window (00:00–03:59 local on the 1st). All should be handled consistently.
- **Business promotion spanning rate eras**: A business promotion in July 2025 should use new-era rates (5 hours x new rate).

## Acceptance Criteria

- Uploading an April roster with a May 1 (local) duty whose UTC report time is in April: the duty's pay is reflected in April's monthly calculation totals.
- Uploading a May roster with a May 1 (local) duty whose UTC report time is in April: the duty is displayed in May but not counted in May's payment. April is recalculated to include it.
- A duty with report time at 04:00 local on May 1 (= 00:00 UTC May 1) is treated as a May duty, not April.
- Business promotion duties always calculate at 5 flight hours x position hourly rate, regardless of rostered duty duration.
- All existing non-boundary duties continue to work exactly as before.
- Display dates/times remain in Dubai local time throughout the UI.
- Monthly salary totals are correct when both months' rosters have been uploaded.

## Open Questions

- None at this time.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- UTC conversion of report times near the month boundary (03:59 local → previous month UTC, 04:00 local → current month UTC).
- Payment month assignment for a boundary duty during upload of the current month (Scenario A).
- Payment month exclusion for a boundary duty during upload of the following month (Scenario B).
- Business promotion duty calculates at exactly 5 hours x CCM rate (legacy and new era).
- Business promotion duty calculates at exactly 5 hours x SCCM rate (legacy and new era).
- Non-boundary duties are unaffected by the UTC logic.

# Code Quality Reviewer — Persistent Memory

## Confirmed Project Patterns

- Database mutations always use `withDatabaseOperation` / `withDatabaseArrayOperation` / `withDatabaseVoidOperation` wrappers.
- Position resolution for calculations: always `getUserPositionForMonth(userId, year, month)` — never `profiles.position` directly.
- Month indexing: 0-based in UI/hooks, 1-based in database and salary-calculator internals.
- Business rules constants live in `src/lib/salary-calculator/airlines/flydubai-config.ts` (FLYDUBAI_BUSINESS_RULES).
- Internal engine constants that mirror config values are acceptable (e.g., `BP_FIXED_HOURS` in calculation-engine.ts mirrors `bpFixedHours` from config) — flag only if they can diverge silently.

## Recurring Issues to Watch

- `ExcelParseResult.boundaryDuties` is typed as `unknown[]` (in `src/types/excel-config.ts`) while downstream callers cast it to `FlightDuty[]`. This is a type-safety hole that keeps showing up at parser boundaries.
- `calculateFlightDuty` called in `workflow.ts` without `year`/`month` parameters — it silently falls back to `duty.year`/`duty.month`, which may misapply era rates. Watch for this at boundary-duty recalculation sites.
- The `tests/` directory is empty; spec files call for tests there but no test files were added in the UTC payment month feature. If the spec mandates tests in `./tests/`, they are missing.
- Boundary-duty augmentation in `workflow.ts` mutates the `monthlyCalculation` object in-place before persisting — fragile pattern if `recalcResult.updatedCalculation` ever contains shared references.

## Key File Sizes (watch for growth)
- `src/app/(dashboard)/dashboard/page.tsx` — ~563 lines (already over the 300-line guideline)
- `src/lib/salary-calculator/recalculation-engine.ts` — growing with UTC logic; monitor
- `src/lib/salary-calculator/upload/workflow.ts` — growing; monitor

## Architecture Notes
- `boundaryDuties` are NOT saved to the database as current-month records; they are only used to augment the monthly monetary totals. This is intentional (spec Scenario A).
- The augmentation is explicitly temporary — corrected when the adjacent month is uploaded.
- `getPaymentMonth()` in `time-calculator.ts` is the single source of truth for UTC conversion; exported via `index.ts` as `GST_OFFSET_HOURS` too.

## Testing
- No test runner configured; test files in `src/lib/salary-calculator/__tests__/` are reference-only.
- Spec `_specs/utc-payment-month-assignment.md` calls for tests in `./tests/` — that dir is empty.

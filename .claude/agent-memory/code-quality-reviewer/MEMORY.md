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
- No test runner configured; test files in `src/lib/salary-calculator/__tests__/` and `tests/` are reference-only.
- `tests/` now has: `dhd-deadhead-pay.test.ts`, `dhd-manual-entry-block-times.test.ts`, `dhd-sector-asterisk.test.ts`
- v2-card-adapter test file exists at `src/lib/__tests__/v2-card-adapter.test.ts` — reference only.

## DHD (Deadhead) Feature Patterns
- `buildDeadheadSector(fn, origin, dest, depTime?, arrTime?)` in `conversion.ts` is the factory for DHD `Sector` objects; exported from `manual-entry/index.ts`.
- DHD pay deduction formula `Math.max(0, dutyHours - (dhdBlockMinutes / 2 / 60))` appears in calculation-engine.ts (canonical) AND in conversion.ts (both layover and turnaround paths). The conversion.ts duplication is intentional — manual entries pre-compute `flightPay` before the calculation engine sees them.
- `ManualFlightEntryData` has three parallel arrays: `deadheadSectors`, `deadheadDepartureTimes`, `deadheadArrivalTimes` — all indexed to `flightNumbers` (not just DHD sectors; all sectors populated when any DHD toggled).
- `totalBlockMinutes()` in `v2-card-adapter.ts` now halves DHD sectors inline — it is no longer a pure sum. Watch for callers expecting raw totals.
- `dhdBlockTime` prop was removed — block time is shown per-sector via `FlightRow.isDeadhead` red styling, not as a card-level label.
- `handleDhdToggle` in FlightEntryForm.tsx must clear times per-sector when toggled off. The current implementation only clears when ALL sectors are un-toggled — stale data bug for partial-DHD duties. (Flagged in review 2026-03-16.)

## Component Patterns (v2 Cards)
- Wrapper components (TurnaroundCardV2Wrapper, LayoverCardV2Wrapper, SimpleDutyCardV2Wrapper) follow a consistent bridge pattern: data mapping via useMemo, edit dialog via useState, actions via CardActions.
- `useCardEditHandler` is the shared hook for edit-save logic across all wrapper components — calls `recalculateMonthlyTotals` after update.
- `createSaveHandler(flightDuty)` in `useCardEditHandler` creates a new async function on every render (not memoized) — this is acceptable because `EditTimesDialog.onSave` is only called on user action, not on render.
- Off-day type set is defined in two places: `OFF_DAY_TYPES` in `SimpleDutyCardV2Wrapper.tsx` and inline `isOffDayType` function in `FlightDutiesTable.tsx`. The authoritative set is `NON_PAYABLE_DUTY_TYPES` in `calculation-engine.ts` (includes `sby` too — different semantic from "off days").
- `FlightDutiesTable.tsx` calls `identifyLayoverPairs` inside a useMemo for filtering. `NewFlightDutyCard.tsx` then calls `findLayoverPair` (which calls `identifyLayoverPairs` internally) again per card for routing — O(n) work repeated O(n) times for layover duties.
- `selectAllVisible` in `FlightDutiesTable.tsx` selects from `flightDuties` (all duties, unfiltered) rather than `filteredFlightDuties` — bug: off-day IDs get selected even when filtered out.
- `CardShell.tsx` uses `React.ReactNode` in its interface without importing React — works because `react-jsx` transform, but is an implicit namespace reference. Consistent pattern across the v2-cards directory.

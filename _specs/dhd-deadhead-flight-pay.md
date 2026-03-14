# Spec for DHD Deadhead Flight Pay

branch: claude/feature/sector-block-times-display

## Summary

- Implement correct pay calculation for deadhead (DHD) flights: deduct 50% of DHD block time from total duty hours
- Enhance DHD detection to require both `*` sector prefix AND `D` indicator confirmation
- Add per-sector DHD toggle for manual flight entries
- Display DHD status and corrected block time in red on duty cards

## Functional Requirements

### 1. DHD Detection Enhancement (Roster Upload)

- Currently `hasFlaggedSectors` is set solely from `*` prefix on sectors in `extractSectorsWithFlags()` and in `flydubai-excel-parser.ts` line 662
- The `indicators` column is already parsed and available on each `excelDuty` (line 339: `indicators: indicatorsCell.value?.toString()`)
- Confirm DHD only when BOTH conditions are met:
  - At least one sector has `*` prefix (existing `hasFlaggedSectors` logic)
  - The `indicators` string contains `D` (parsed from comma-separated values like `"D,R,M"`)
- Add a new boolean field `hasDeadheadSectors` on `FlightDuty` (distinct from existing `hasFlaggedSectors`)
- When confirmed, mark the specific `*`-prefixed sectors with a new `isDeadhead: boolean` on the `Sector` type (alongside existing `isFlaggedSector`)
- Pass the `indicators` string from the parsed row into the `convertToFlightDuty` method so it can perform the dual check

### 2. Type Changes

- `Sector` interface: add `isDeadhead?: boolean`
- `FlightDuty` interface: add `hasDeadheadSectors?: boolean`
- These are optional fields to maintain backward compatibility with existing stored data

### 3. Pay Calculation

- In `calculateFlightDuty()` in `calculation-engine.ts`:
  - After computing `dutyHours`, check if `flightDuty.hasDeadheadSectors === true`
  - Sum `blockMinutes` from all sectors where `isDeadhead === true`
  - Compute deduction: `dhdBlockMinutes / 2` (half the DHD block time)
  - Payable hours: `dutyHours - (deduction / 60)`
  - Use payable hours (not raw duty hours) for flight pay calculation
- Formula verified against actual Flydubai payslip (Jan 2026):
  - Total duty hours: 100h 14m
  - DHD block time: 6h 04m, deduction: 3h 02m
  - Flying hours: 97h 12m
  - Flight pay: 97.2 x 50 = 4,860.00 AED

### 4. Manual Entry DHD Toggle

- In the sector input area of `FlightEntryForm.tsx` / `SectorInput.tsx`, add a per-sector toggle to flag individual sectors as DHD
- The toggle should set `isDeadhead: true` on the corresponding `Sector` object
- When any sector is toggled as DHD, set `hasDeadheadSectors: true` on the `FlightDuty`
- This allows users to mark DHD sectors for manual entries where roster markers are absent

### 5. Database Persistence

- `isDeadhead` is stored within the existing `sector_details` JSONB column on the `flights` table (no schema migration needed)
- `hasDeadheadSectors` should be derivable from `sector_details` on read, but can also be stored as a top-level field for query convenience

### 6. UI Display on Duty Cards

- In the second panel of duty cards (where block time is shown), when a duty has DHD sectors:
  - Show a small red "DHD" label immediately before the total block time
  - Show the corrected (halved) block time in red instead of the normal block time
- Affected components:
  - `SectorBlockDetails.tsx` — the block total line at the bottom
  - `v2-card-adapter.ts` — the `blockTime` string passed to card props
- Only render the DHD display when `hasDeadheadSectors === true` and DHD block minutes are available

## Possible Edge Cases

- Flight has `*` prefix but no `D` indicator (or vice versa): do NOT mark as DHD — require both signals
- Multiple sectors on a single duty where only some are DHD: sum only the `isDeadhead` sectors' block minutes for the deduction
- Missing `sectorDetails` or `blockMinutes` on a DHD-flagged duty: skip the deduction, calculate as regular duty (log a warning)
- Manual entry with DHD toggle but no block minutes entered: prompt user to provide departure/arrival times so block can be computed
- Existing stored flights that were uploaded before this feature: `hasDeadheadSectors` will be undefined, treated as non-DHD (no retroactive recalculation needed)

## Acceptance Criteria

- Uploading a roster with a DHD flight (e.g., `*DXB-BEG` with `D` indicator) correctly sets `isDeadhead` on the sector and `hasDeadheadSectors` on the duty
- Flight pay for DHD duties uses the reduced hours formula: `dutyHours - (dhdBlockMinutes / 2 / 60)`
- Monthly total flying hours match payslip expectations (e.g., 97h 12m for the Jan 2026 test case)
- Duty cards show red "DHD" label and corrected block time for DHD duties
- Manual entry allows toggling sectors as DHD, which correctly affects pay calculation
- Non-DHD flights are completely unaffected by the change
- Flights with `*` prefix but no `D` indicator remain classified as flagged but not deadhead

## Open Questions

- Should the DHD toggle in manual entry also visually match the red styling used on the duty cards? Yes
- For the per-sector DHD toggle, should it be a small icon button or a checkbox/switch? Checkbox/switch

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- DHD detection: confirm dual-signal requirement (`*` prefix + `D` indicator)
- DHD detection: reject when only one signal present
- Pay calculation: verify deduction formula with known values (6h 04m block -> 3h 02m deduction)
- Pay calculation: verify non-DHD flights are unaffected
- Pay calculation: multi-sector duty with partial DHD (only flagged sectors deducted)
- Pay calculation: missing block minutes on DHD sector falls back to regular calculation

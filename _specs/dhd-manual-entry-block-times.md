# Spec for DHD Manual Entry Block Times

branch: claude/feature/sector-block-times-display

## Summary

- Complete the DHD manual entry flow by showing departure/arrival time fields when the user toggles a sector as deadhead
- Add DHD toggles to turnaround flights (standard and double-sector) — currently only layovers have them
- Pipe the entered times through the conversion layer so `blockMinutes` is populated on DHD sectors, enabling the existing 50% pay deduction in the calculation engine
- No database, calculation engine, or card display changes needed — the gap is purely in the form UI and conversion layer

## Functional Requirements

### 1. Layover DHD Time Fields

- When the user toggles the DHD switch on the **outbound** sector (index 0), reveal two `TimeInput` fields below the toggle: "Departure" and "Arrival"
- These represent the actual departure and arrival times of the deadhead flight (not the report/debrief times, which cover the full duty)
- Same behavior for the **inbound** sector (index 1): toggling DHD reveals departure/arrival time fields for that sector
- When DHD is toggled off, hide the time fields and clear their values
- Use the same `TimeInput` component and styling already used for report/debrief times throughout the form

### 2. Turnaround DHD Toggles + Time Fields

- **Standard turnaround** (2 sectors: outbound + return): Add a DHD switch next to each flight number input (indices 0 and 1), matching the same pattern used in layovers (red `Switch` with "DHD" label)
- **Double-sector turnaround** (4 sectors): Add a DHD switch next to each of the 4 flight number inputs (indices 0–3)
- When any turnaround sector's DHD is toggled on, reveal departure/arrival `TimeInput` fields for that specific sector
- When toggled off, hide and clear the time fields for that sector
- The `deadheadSectors` boolean array should align with the `flightNumbers` array (index-for-index)

### 3. Form Data Model Changes

- Add two new optional fields to `ManualFlightEntryData`:
  - `deadheadDepartureTimes?: string[]` — parallel array to `deadheadSectors`, HH:MM format
  - `deadheadArrivalTimes?: string[]` — parallel array to `deadheadSectors`, HH:MM format
- These arrays should only be populated for indices where `deadheadSectors[i] === true`

### 4. Conversion Layer Updates

- Update `buildDeadheadSector()` in `conversion.ts` to accept optional `departureTime` and `arrivalTime` parameters
- When times are provided, call `calculateBlockMinutes()` (from `sector-time-parser.ts`) to compute `blockMinutes` and store all three fields (`departureTime`, `arrivalTime`, `blockMinutes`) on the `Sector` object
- Update the layover conversion path (outbound + inbound) to pass DHD times from form data into `buildDeadheadSector()`
- Update the turnaround conversion path to pass DHD times into the sector-building loop

### 5. Edit Reconstruction

- In `flight-data-converter.ts`, when reconstructing form data from a saved `FlightDuty`:
  - If a sector in `sectorDetails` has `isDeadhead === true` and has `departureTime`/`arrivalTime`, populate the corresponding indices in `deadheadDepartureTimes` and `deadheadArrivalTimes`
- This ensures editing a previously saved DHD duty pre-fills the time fields

### 6. Validation

- When `deadheadSectors[i] === true`, both `deadheadDepartureTimes[i]` and `deadheadArrivalTimes[i]` should be required
- Show validation errors on the time fields if they are empty when DHD is toggled on and the user attempts to submit
- Arrival time must differ from departure time (block time must be > 0)

## Possible Edge Cases

- User toggles DHD on, enters times, then toggles DHD off — times should be cleared to prevent stale data from being submitted
- User toggles DHD on for all sectors of a turnaround — entire duty would be deadhead; the calculation engine already handles this (deducts 50% of total block time, payable hours can go to 0 but not negative via `Math.max(0, ...)`)
- Cross-day DHD flights (departure before midnight, arrival after) — `calculateBlockMinutes()` already handles cross-day via its `depCrossDay`/`arrCrossDay` parameters; for simplicity, assume DHD sector times do not cross day boundaries in manual entry (roster upload handles this automatically)
- Editing a legacy DHD entry that was saved without times — `deadheadDepartureTimes`/`deadheadArrivalTimes` will be undefined; the DHD toggle will be on but time fields will be empty, prompting the user to fill them
- Standard turnaround where only one of the two sectors is DHD — the non-DHD sector should have no deduction; the DHD sector's block time is deducted at 50%

## Acceptance Criteria

- Toggling DHD on a layover outbound sector reveals departure/arrival time inputs; entering "08:30" / "11:45" and saving results in a sector with `blockMinutes: 195` and the calculation engine deducting 97.5 minutes (1h 37m) from payable hours
- Toggling DHD on a layover inbound sector works identically to outbound
- Standard turnaround shows DHD toggles next to both flight numbers; toggling either one reveals time fields for that sector
- Double-sector turnaround shows DHD toggles next to all 4 flight numbers
- Submitting with DHD toggled on but empty time fields shows validation errors
- Toggling DHD off clears the time fields
- Editing a saved DHD flight with block times pre-fills the departure/arrival fields
- The calculation engine's 50% deduction fires correctly (no more "DHD sectors detected but block minutes unavailable" warning)
- Non-DHD flights are completely unaffected

## Open Questions

- None — all design decisions are resolved based on the existing patterns in the codebase

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- `buildDeadheadSector()` with departure/arrival times produces correct `blockMinutes`
- `buildDeadheadSector()` without times produces no `blockMinutes` (backward compatibility)
- Layover conversion with DHD times populates `blockMinutes` on the outbound sector detail
- Layover conversion with DHD times populates `blockMinutes` on the inbound sector detail
- Turnaround conversion with DHD times on one sector populates `blockMinutes` only for the flagged sector
- Form data reconstruction from a saved DHD flight with times populates `deadheadDepartureTimes` and `deadheadArrivalTimes`
- End-to-end: manual entry with DHD + times → conversion → calculation engine produces correct reduced flight pay

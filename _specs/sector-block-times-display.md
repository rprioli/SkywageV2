# Spec for Sector Block Times and Display

branch: claude/feature/sector-block-times-display

## Summary

- Parse the per-sector actual departure and arrival times from the roster's actualTimes column (currently read but only consumed for recurrent/sby duties)
- Calculate block minutes per sector from the parsed departure/arrival times
- Introduce a `Sector` type that bundles flight number, origin, destination, departure time, arrival time, block minutes, cross-day flag, and flagged-sector indicator per sector
- Add `sectorDetails` to the `FlightDuty` type so each duty carries its full sector-level breakdown
- Persist sector details in the database via a new `sector_details` JSONB column on the `flights` table
- Display per-sector rows on the duty cards in the dashboard UI, showing flight number, route, departure/arrival times, and block time for each sector

## Functional Requirements

- Parse the actualTimes column for ALL flight duty types (turnaround, layover), not only recurrent/sby
- Split multi-line actualTimes values by newline to get one timing entry per sector
- For each sector timing line, extract:
  - Departure time: strip the `A` prefix if present, yielding `HH:MM`
  - Arrival time: strip the `A` prefix if present, yielding `HH:MM`
  - Cross-day indicator: detect the `⁺¹` suffix on either departure or arrival
  - Ignore the `/HH:MM` delay suffix entirely (not displayed, not stored)
- Calculate block minutes as arrival minus departure, accounting for cross-day (`⁺¹`) arrivals and departures
- Build a `sectorDetails` array on each `FlightDuty` by index-matching:
  - `flightNumbers[i]` from the duties column
  - `sectors[i]` (origin/destination) from the details column
  - Parsed times from `actualTimesLines[i]`
- Carry the `isFlaggedSector` boolean from Phase 1's `extractSectorsWithFlags` onto each individual `Sector` object (the `*` prefix detection already captured at the duty level via `hasFlaggedSectors`)
- Support any number of sectors per duty (2-sector turnarounds, 4-sector double turnarounds, single-sector layover legs)
- Add a `sector_details JSONB` column to the `flights` table via a Supabase migration
- Update database CRUD helpers (`flights.ts`) to persist and retrieve `sectorDetails`
- Update the duty card UI component to show an expandable or inline per-sector breakdown with: flight number, route (origin-destination), departure time, arrival time, and block time (formatted as `Xh XXm`)
- Do not display delay information on the duty cards

## Possible Edge Cases

- Fewer actualTimes lines than sectors (e.g., one sector has no actual times recorded) — create the `Sector` object with flight number and route but `departureTime`, `arrivalTime`, and `blockMinutes` as undefined
- More actualTimes lines than flight numbers (e.g., an extra repositioning leg without a separate flight number) — skip unmatched lines and add a parsing warning
- Cross-day departure AND arrival on the same sector (e.g., BUD return: `A02:23⁺¹ - A07:53⁺¹`) — both times are on the next day, block time is simply arrival minus departure (no 24h offset needed)
- Cross-day arrival only (e.g., `A22:36 - A02:06⁺¹`) — add 24h to arrival before subtracting departure
- Departure with no `A` prefix (on-time departure, e.g., `20:15 - A02:01⁺¹`) — treat as actual departure time regardless of prefix
- Arrival with no `A` prefix (e.g., `A02:43 - 06:35/00:08`) — treat as actual arrival time regardless of prefix
- Non-flight duties (off, sick, rest, annual leave, BP, asby, sby, recurrent) — `sectorDetails` should be an empty array or undefined, not parsed
- Existing database rows without `sector_details` — reading a `NULL` JSONB column should map to `undefined` on the `FlightDuty` object without errors
- Manual flight entry duties (no roster upload) — `sectorDetails` is undefined until a roster is uploaded or the user adds sector times manually in a future phase

## Acceptance Criteria

- A turnaround duty with 2 sectors (e.g., FZ661/FZ662 DXB-HGA-DXB) produces a `sectorDetails` array of length 2, each with correct flight number, origin, destination, departure time, arrival time, and block minutes
- A 4-sector double turnaround (e.g., DXB-MCT-DXB, DXB-DMM-DXB) produces a `sectorDetails` array of length 4
- A single-sector layover leg (e.g., FZ965 DXB-VKO) produces a `sectorDetails` array of length 1
- Block minutes calculated from `A11:02 - A14:37` equals 215 minutes (3h 35m)
- Cross-day block minutes calculated from `A22:36 - A02:06⁺¹` equals 210 minutes (3h 30m)
- Cross-day on both dep and arr (e.g., `A02:23⁺¹ - A07:53⁺¹`) calculates block minutes correctly as 330 minutes (5h 30m)
- `sectorDetails` is persisted to and retrieved from the database via the `sector_details` JSONB column
- Duty cards in the dashboard display per-sector rows with flight number, route, departure/arrival times, and block time
- No delay information is shown on the duty card
- Sectors with a `*` prefix in the original roster have `isFlaggedSector: true` on their `Sector` object
- Non-flight duties have no `sectorDetails` (empty array or undefined)
- Existing flights without `sector_details` in the database continue to load and display correctly (backward compatible)
- No regression in salary calculations — `sectorDetails` is informational in Phase 2 and does not affect `flightPay` or `dutyHours`

## Open Questions

- Should the duty card show sectors expanded by default, or collapsed behind a toggle/accordion? An accordion keeps the card compact for months with many duties, while inline is more scannable. - I think it's best if we focus first on making it work, and then we can worry about the UI.
- For manual flight entries (no roster), should we provide a UI to add sector times, or defer that to Phase 3? - defer to phase 3
- Should the total block time per duty (sum of all sector block minutes) be displayed as a summary on the duty card alongside the existing duty hours? - Yes, it should be displayed on the duty card as a summary of all sector block minutes.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Parse a 2-line actualTimes string into two sector timing objects with correct dep/arr/blockMinutes
- Parse a 4-line actualTimes string into four sector timing objects
- Parse a single-line actualTimes string (layover leg)
- Strip `A` prefix from departure and arrival times
- Ignore `/HH:MM` delay suffix
- Calculate block minutes for a same-day sector (e.g., `A11:02 - A14:37` = 215 min)
- Calculate block minutes for a cross-day arrival (e.g., `A22:36 - A02:06⁺¹` = 210 min)
- Calculate block minutes when both dep and arr are cross-day (e.g., `A02:23⁺¹ - A07:53⁺¹` = 330 min)
- Handle departure without `A` prefix (e.g., `20:15 - A02:01⁺¹`)
- Handle missing actualTimes line for a sector (produces Sector with undefined times)
- Index-match flightNumbers, sectors, and actualTimesLines correctly for 2-sector and 4-sector duties
- `isFlaggedSector` is true for sectors with `*` prefix in the original details string

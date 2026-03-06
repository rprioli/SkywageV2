# Spec for Fix DHD Sector Asterisk Parsing

branch: claude/feature/fix-dhd-sector-asterisk

## Summary

- The Flydubai roster uses an asterisk (`*`) prefix on sector routes in the Details column (e.g., `*DXB  - BEG`) to flag special sectors — currently known to indicate Deadheading (DHD)
- This `*` prefix is not stripped during parsing, causing the airport code to be stored as `*DXB` instead of `DXB`
- This breaks layover pair matching in `calculateLayoverRestPeriods` because `isOutboundFlight` checks `airports[0] === 'DXB'`, which fails for `*DXB`
- As a result, DHD layover duties get no rest period created and no per diem calculated
- Additionally, the `*` prefix should be captured as sector-level metadata (a "flagged sector" indicator) before being stripped, to support future DHD auto-detection
- A new duty code `SICK` also needs to be recognized by the parser (discovered during roster analysis)

## Functional Requirements

- Strip the `*` prefix from airport codes in sector strings so that all downstream logic (layover pairing, destination matching, outbound/inbound detection) works correctly
- Before stripping, capture the presence of `*` as a boolean metadata flag on the sector (e.g., `isFlaggedSector: true`) to preserve the information for future DHD implementation
- The `*` stripping must happen early enough that both the Excel parser's `extractSectors` and the calculation engine's `parseSectors` helper produce clean 3-letter IATA codes
- Add `SICK` as a recognized non-working duty code (no flight pay, treated similarly to `off` for calculation purposes)
- Ensure the `X` duty code (REST DAY) is correctly handled — it already maps to `rest` via `detectNonWorkingDay`, but verify it also works in `classifyFlightDuty`

## Possible Edge Cases

- Sector string with `*` on the destination side rather than origin (e.g., `DXB  - *BEG`) — strip from any position in the airport code
- Multiple `*` prefixes or other non-alpha characters adjacent to airport codes — only strip leading `*` to avoid over-aggressive cleaning
- The `*` appearing in turnaround multi-line cells where only one of two sector lines has the prefix (e.g., `*DXB - MCT\nMCT - DXB`)
- Rosters where `*` has a different meaning in a non-DHD context — by storing it as generic `isFlaggedSector` metadata rather than directly as `isDeadhead`, we keep the interpretation layer separate
- Cross-month layover where the DHD outbound is in month N and the operated return is in month N+1 — the `*` stripping fix must work for boundary duties too
- `SICK` duty appearing with indicators like `F` (Fit For Duty) — should still be classified as non-working
- Existing stored data in the database that already has `*DXB` in sector strings — the calculation engine's `parseSectors` must also strip `*` so recalculation of historical data works without re-uploading

## Acceptance Criteria

- A roster containing `*DXB  - BEG` in the Details column parses into a sector with origin `DXB` and destination `BEG` (no asterisk in airport codes)
- The parsed sector retains a `isFlaggedSector: true` metadata flag indicating the `*` was present
- Layover pairing correctly identifies an outbound DHD flight (e.g., FZ1745 DXB→BEG) and matches it with its return (e.g., FZ1518 BEG→DXB)
- A layover rest period is created for the DHD layover with correct rest hours and per diem
- `SICK` duty code is recognized and classified as a non-working day with no flight pay
- Recalculation of a month containing DHD layover duties produces correct per diem (previously missing)
- No regression: existing turnaround duties, non-DHD layovers, and all other duty types continue to parse and calculate correctly

## Open Questions

- Should `SICK` be its own `DutyType` variant (e.g., `'sick'`) or reuse the existing `'off'` type? A dedicated type would allow future sick-leave-specific reporting but adds a schema change. For now, mapping to `'off'` is the minimal approach. - It should be its own type, as it's not a rest day, but a non-working day with no flight pay.
- Are there other characters besides `*` that can prefix sector routes in Flydubai rosters? If discovered later, the stripping logic should be easy to extend. - I am not sure yet, might be something to check on later.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Sector parsing strips `*` from origin: `*DXB  - BEG` produces `['DXB', 'BEG']` with `isFlaggedSector: true`
- Sector parsing strips `*` from destination: `DXB  - *BEG` produces `['DXB', 'BEG']` with flag set
- Sector parsing leaves normal sectors unchanged: `DXB  - BEG` produces `['DXB', 'BEG']` with `isFlaggedSector: false`
- Multi-line sector cell with one flagged line parses correctly
- `isOutboundFlight` returns `true` for a sector originally prefixed with `*DXB`
- `getDestination` returns the correct destination for a `*`-prefixed sector
- Layover pairing finds a match when outbound sector had `*` prefix
- `SICK` duty code is detected as non-working day
- `X` duty code (REST DAY) is detected as non-working day

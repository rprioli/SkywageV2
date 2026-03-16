# Spec for V2 Glassmorphic Card Implementation

branch: claude/feature/sector-block-times-display

## Summary

- Replace all existing duty card components (TurnaroundCard, LayoverConnectedCard, StandardDutyCard, OffDayCard) with the new glassmorphic v2 card designs
- Build a data adapter layer that maps raw `FlightDuty` objects into the pre-formatted props expected by v2 card components
- Preserve full feature parity: edit times, delete, bulk selection, layover pairing (in-month and cross-month), off-day toggle
- Update the card router (`NewFlightDutyCard`) to render v2 components instead of old ones
- Remove old card components once v2 cards are fully integrated and tested

## Functional Requirements

### Data Adapter Layer

- Create a mapper function that transforms `FlightDuty` + context (position, layover rest periods) into the props expected by each v2 card component
- **Turnaround mapping**: Extract destinations from `sectorDetails` or `sectors` array, format report/debrief times as inline faded spans (e.g., `15:40 . 16:40-18:55 . 19:25`), compute per-sector block times from `sectorDetails[].blockMinutes`, detect double-sector pattern via existing `isDoubleSectorTurnaroundPattern()`, format duty/block time as `XXh XXm Duty` / `XXh XXm Block`
- **Layover mapping**: Build `LayoverSectorData[]` from the outbound+inbound `LayoverPair`, each sector having its own date, pay (split evenly or per-sector), flights, duty time, and block time. Format rest duration and per diem from `LayoverPair.restHours` and `LayoverPair.perDiemPay`. Handle cross-month layovers where only outbound exists in-month (use persisted `LayoverRestPeriod` for rest/per diem display)
- **Simple duty mapping**: Map duty type to icon (reuse existing `getDutyTypeConfig()` from `flight-duty-card/utils.ts`), format label (ASBY, SBY, REC, BP, OFF, REST, AL, SICK), compute tags array (e.g., `['Airport Standby', '04h 00m Fixed']`), include pay only for paid duties
- **Date formatting**: Use short format like `27 Mar` consistent with test page designs
- **City name resolution**: Map IATA codes to city names for the subtitle field (e.g., IKA -> Tehran, Iran). Determine strategy — static lookup table or derive from existing data

### Card Router Update

- Update `NewFlightDutyCard` to route to v2 components instead of old ones
- Maintain the same routing logic: layover with pair -> LayoverCardV2, turnaround -> TurnaroundCardV2, off/rest/annual_leave/sick -> SimpleDutyCardV2, asby/recurrent/sby/business_promotion -> SimpleDutyCardV2
- Preserve the layover inbound filtering in `FlightDutiesTable` (only outbound displayed when part of in-month pair)
- Preserve `showOffDays` toggle behavior

### Edit & Delete Functionality

- V2 cards currently have no edit/delete UI — this must be added
- Add a contextual action menu (e.g., three-dot dropdown or long-press) to expandable cards (TurnaroundCardV2, LayoverCardV2) and editable simple duty cards (ASBY, SBY)
- The action menu should trigger the existing `EditTimesDialog` for edits and call `onDelete` for deletions
- Edit conditions must match current behavior: turnarounds always editable, layover segments editable, only ASBY + SBY editable among simple duties, off-day types never editable
- After edit: call `recalculateMonthlyTotals()` and fire `onEditComplete()` as existing cards do

### Bulk Selection Mode

- When `bulkMode=true`, show a selection checkbox on each card (except off-day types)
- Selected state should have a visual indicator (e.g., ring/border highlight on the CardShell)
- Wire `onToggleSelection` through to the checkbox

### Layover Edge Cases

- **Cross-month layovers**: Outbound in month N with no in-month inbound — display as LayoverCardV2 with single sector (outbound only), using persisted `LayoverRestPeriod` data for rest duration and per diem
- **Unpaired layovers**: Layover duty with no pair found and no persisted rest period — fall back to SimpleDutyCardV2 (matching current StandardDutyCard fallback)
- **Inbound filtering**: Inbound flights that are part of an in-month pair must be filtered from the list (handled by FlightDutiesTable, not the card itself)

### Visual Integration

- Cards should use `w-full` (already set in CardShell) to fill their container width
- The `card-entrance` animation keyframes currently live in the test page — move to a global stylesheet or the card component itself
- Ensure cards align properly in the existing `FlightDutiesTable` list layout (vertical stack, not horizontal grid)

## Possible Edge Cases

- **Missing sectorDetails**: Older flights may not have `sectorDetails` populated — fall back to `flightNumbers` + `sectors` arrays for route display, omit per-sector block times
- **Missing departure/arrival times in sectors**: Some sectors may lack `departureTime`/`arrivalTime` — show only report/debrief times from the parent FlightDuty
- **Single-flight layover (cross-month)**: Only one sector visible — LayoverCardV2 should handle single-sector gracefully (hide SectorNav or disable both arrows)
- **Zero flight pay**: Duties like SBY have `flightPay = 0` — SimpleDutyCardV2 should show icon badge instead of pay badge (already handled by `pay?: string` prop)
- **Flagged sectors**: Sectors with `isFlaggedSector = true` (asterisk in roster) — consider visual indicator in FlightRow
- **Very long flight numbers or routes**: Ensure grid layout doesn't overflow (e.g., codeshare flight numbers)
- **Double-sector turnaround with mixed destinations**: Two different destinations in one turnaround — sector nav must correctly group sectors per destination

## Acceptance Criteria

- All 10 duty types render correctly with the new v2 glassmorphic design
- Expand/collapse animation works smoothly on turnaround and layover cards
- Sector navigation (chevrons) works for double-sector turnarounds and layover pairs
- Edit times dialog opens and saves correctly for all editable duty types
- Delete action works for all deletable duty types
- Bulk selection mode shows checkboxes and tracks selection state
- Layover rest duration and per diem display correctly for both in-month pairs and cross-month pairs
- Off-day cards respect the `showOffDays` toggle
- Per-sector block times display in FlightRow when sectorDetails are available
- Report and debrief times show as faded inline text in the times column
- No visual regressions — old card components can be removed after v2 is confirmed working
- Cards fill container width responsively (not fixed 420px)

## Open Questions

- **City name lookup**: Should we build a static IATA-to-city mapping table, or derive city names from existing data? The test page hardcodes city names but production needs dynamic resolution. - What's the best implementation option? I think it's easier to have only the places that flydubai currently flies to. I've a list with the cities, then you can think about something to check the airport code. Give me your recommendation on this matter.
- **Action menu placement**: Where should the edit/delete menu live on v2 cards? Options: (a) three-dot icon in PrimaryPanel header, (b) revealed on hover/long-press, (c) inside the expanded FlightsPanel. - Option A
- **Entrance animation**: Should the `card-entrance` animation apply on initial page load only, or also when cards are filtered/toggled? Consider performance with 30+ cards. - initial page load only
- **Layover pay split**: Current LayoverConnectedCard may show total pay on each segment. Should v2 split pay per-segment or show total on both? It should show the per sector pay (I believe the current implementation is already like this)

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Data adapter correctly maps a turnaround FlightDuty (with sectorDetails) to TurnaroundCardV2Props
- Data adapter correctly maps a double-sector turnaround to props with two destinations and four sectors
- Data adapter correctly maps a layover pair to LayoverCardV2Props with two sector entries
- Data adapter handles cross-month layover (outbound only + persisted LayoverRestPeriod)
- Data adapter handles missing sectorDetails gracefully (falls back to flightNumbers/sectors)
- Simple duty mapping produces correct icon, label, and tags for each duty type (asby, sby, recurrent, business_promotion, off, rest, annual_leave, sick)
- Date formatting produces short format (e.g., "27 Mar")
- Duty/block time formatting produces correct "XXh XXm" strings

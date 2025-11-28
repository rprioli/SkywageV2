# Skywage Codebase Refactoring Plan

> **Created:** November 27, 2025  
> **Status:** Planning  
> **Risk Level:** Medium (phased approach minimizes risk)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Expected Outcomes](#expected-outcomes)
3. [Branch Strategy](#branch-strategy)
4. [Phase Overview](#phase-overview)
5. [Detailed Phases](#detailed-phases)
6. [Testing Checklist](#testing-checklist)
7. [Rollback Strategy](#rollback-strategy)

---

## Executive Summary

This refactoring addresses **technical debt** accumulated during rapid feature development (Phases 1-7). The primary goals are:

- Reduce file sizes to under 300 lines (per project standards)
- Eliminate 327 console.log statements
- Remove 6 empty directories
- Consolidate duplicate parsing logic
- Improve maintainability and developer experience

**Timeline Estimate:** 4-6 development sessions  
**Risk Mitigation:** Phased approach with feature branch testing

---

## Expected Outcomes

### 🎯 Immediate Benefits

| Benefit | Description | Impact |
|---------|-------------|--------|
| **Faster Debugging** | Smaller files = easier to locate issues | High |
| **Reduced Cognitive Load** | Developers can understand modules in isolation | High |
| **Better Test Coverage** | Smaller units are easier to test | Medium |
| **Cleaner Git History** | Changes are localized to specific modules | Medium |
| **Faster Code Reviews** | Reviewers can focus on specific functionality | Medium |

### 📈 Long-Term Benefits

| Benefit | Description | Impact |
|---------|-------------|--------|
| **Easier Onboarding** | New developers understand codebase faster | High |
| **Reduced Bug Surface** | Single-responsibility modules have fewer edge cases | High |
| **Feature Velocity** | Adding features is faster with clear boundaries | High |
| **Reusability** | Extracted utilities can be shared across features | Medium |
| **Production Stability** | No console.log noise in production logs | Medium |

### 📊 Quantitative Goals

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Files over 300 lines | 25+ | 0 | -100% |
| Largest file (lines) | 1,026 | <300 | -71% |
| Console.log statements | 327 | 0 | -100% |
| Empty directories | 6 | 0 | -100% |
| Average file size | ~350 | <200 | -43% |

---

## Branch Strategy

### Overview

```
main
  │
  ├── refactor/cleanup-and-hygiene (Phase 1 + 2)
  │     └── PR → main (after testing)
  │
  ├── refactor/parsers-consolidation (Phase 3)
  │     └── PR → main (after testing)
  │
  ├── refactor/processors-split (Phase 4)
  │     └── PR → main (after testing)
  │
  └── refactor/components-split (Phase 5 + 6)
        └── PR → main (after testing)
```

### Branch Groupings Rationale

| Branch | Phases | Rationale |
|--------|--------|-----------|
| `refactor/cleanup-and-hygiene` | 1 + 2 | Low-risk changes, no logic changes, easy to test together |
| `refactor/parsers-consolidation` | 3 | Core parsing logic, needs isolated testing |
| `refactor/processors-split` | 4 | Business logic extraction, critical to test thoroughly |
| `refactor/components-split` | 5 + 6 | UI changes, can be visually tested together |

### Branch Rules

1. **Always branch from latest `main`**
2. **Run full test suite before PR**
3. **Manual testing checklist must pass**
4. **Squash merge to keep history clean**
5. **Delete branch after merge**

---

## Phase Overview

| Phase | Focus | Files Affected | Risk | Effort |
|-------|-------|----------------|------|--------|
| 1 | Console.log Cleanup | 47 files | 🟢 Low | 1-2 hours |
| 2 | Empty Directory & Dead Code Removal | 6 directories | 🟢 Low | 30 min |
| 3 | Parser Consolidation | 4 files → 6 files | 🟡 Medium | 3-4 hours |
| 4 | Processor File Splits | 2 files → 8 files | 🟡 Medium | 4-5 hours |
| 5 | Component File Splits | 3 files → 12 files | 🟡 Medium | 3-4 hours |
| 6 | Dashboard Page Split | 1 file → 4 files | 🟡 Medium | 2-3 hours |

---

## Detailed Phases

### Phase 1: Console.log Cleanup 🟢

**Branch:** `refactor/cleanup-and-hygiene`  
**Risk:** Low  
**Effort:** 1-2 hours

#### Objective
Remove all 327 console.log/warn/error statements from production code.

#### Strategy
1. **Keep essential error logging** - Replace with proper error boundaries or toast notifications
2. **Remove debug logs** - All `console.log` used for debugging
3. **Convert warnings to proper handling** - Replace `console.warn` with user-facing feedback where appropriate

#### Files to Update (Top 10 by count)

| File | Console Calls | Action |
|------|---------------|--------|
| `flydubai-excel-parser.ts` | 47 | Remove debug, keep parse errors as thrown errors |
| `csv-parser.ts` | 36 | Remove debug, keep parse errors as thrown errors |
| `database/flights.ts` | 22 | Remove debug, errors should throw |
| `database/friends.ts` | 20 | Remove debug, errors should throw |
| `auth.ts` | 19 | Remove debug, critical errors can stay temporarily |
| `manual-entry-processor.ts` | 14 | Remove debug logs |
| `calculation-engine.ts` | 14 | Remove debug logs |
| `database/calculations.ts` | 17 | Remove debug, errors should throw |
| `AuthProvider.tsx` | 14 | Remove debug logs |
| `database/audit.ts` | 13 | Remove debug logs |

#### Acceptance Criteria
- [ ] Zero `console.log` statements in `src/`
- [ ] Zero `console.warn` statements (converted to proper handling)
- [ ] `console.error` only in catch blocks that re-throw or notify user
- [ ] Application functions identically

---

### Phase 2: Empty Directory & Dead Code Removal 🟢

**Branch:** `refactor/cleanup-and-hygiene` (same as Phase 1)  
**Risk:** Low  
**Effort:** 30 minutes

#### Objective
Remove empty directories and any orphaned code.

#### Directories to Remove

```
src/components/debug/           # Empty
src/components/design-test/     # Empty
src/app/(dashboard)/duties/     # Empty
src/app/(dashboard)/messages/   # Empty
src/app/(dashboard)/reports/    # Empty
src/app/(dashboard)/settings/   # Empty
```

#### Additional Cleanup
- Review `DashboardSidebar.tsx` for links to removed routes
- Update any navigation that references these empty routes
- Check for dead imports

#### Acceptance Criteria
- [ ] All empty directories removed
- [ ] No broken navigation links
- [ ] No TypeScript errors
- [ ] Sidebar only shows implemented features

---

### Phase 3: Parser Consolidation 🟡

**Branch:** `refactor/parsers-consolidation`  
**Risk:** Medium  
**Effort:** 3-4 hours

#### Objective
Extract shared parsing utilities and reduce duplication between CSV and Excel parsers.

#### Current State

```
csv-parser.ts (789 lines)
excel-parser.ts (629 lines)
flydubai-excel-parser.ts (829 lines)
airlines/flydubai-parser.ts
```

#### Target State

```
parsing/
├── core/
│   ├── time-parsing.ts (~100 lines)      # Shared time utilities
│   ├── date-extraction.ts (~80 lines)    # Shared date utilities
│   ├── flight-validation.ts (~100 lines) # Shared validation
│   └── row-converter.ts (~120 lines)     # Row → FlightDuty conversion
├── csv/
│   ├── csv-reader.ts (~80 lines)         # CSV file reading
│   └── flydubai-csv.ts (~200 lines)      # Flydubai CSV specifics
├── excel/
│   ├── excel-reader.ts (~100 lines)      # Excel file reading
│   ├── cell-utilities.ts (~80 lines)     # Cell extraction helpers
│   └── flydubai-excel.ts (~250 lines)    # Flydubai Excel specifics
└── index.ts                              # Barrel exports
```

#### Extraction Order

1. **Extract `time-parsing.ts`** - Pull all `parseTimeString`, `parseTimeStringWithCrossDay`, etc.
2. **Extract `date-extraction.ts`** - Pull `extractMonthFromCSV`, date parsing logic
3. **Extract `flight-validation.ts`** - Pull `validateFlightNumber`, `validateSector`
4. **Extract `row-converter.ts`** - Unified row-to-FlightDuty conversion
5. **Refactor CSV parser** to use shared utilities
6. **Refactor Excel parser** to use shared utilities

#### Acceptance Criteria
- [ ] All parser files under 300 lines
- [ ] Existing tests pass
- [ ] CSV upload works identically
- [ ] Excel upload works identically
- [ ] No duplicate parsing logic

---

### Phase 4: Processor File Splits 🟡

**Branch:** `refactor/processors-split`  
**Risk:** Medium  
**Effort:** 4-5 hours

#### Objective
Split the two massive processor files into focused modules.

#### File 1: `upload-processor.ts` (1,026 lines → ~4 files)

**Target Structure:**

```
upload/
├── validation.ts (~150 lines)
│   - validateFileQuick()
│   - validateCSVContent()
│   - checkFileType()
│
├── parsing.ts (~200 lines)
│   - parseFileContent()
│   - parseCSVContent()
│   - parseExcelContent()
│
├── database-sync.ts (~200 lines)
│   - saveFlightDuties()
│   - saveLayoverRestPeriods()
│   - upsertMonthlyCalculation()
│
├── workflow.ts (~250 lines)
│   - processCSVUpload()
│   - processFileUpload()
│   - processFileUploadWithReplacement()
│
└── index.ts
    - Re-exports all public APIs
```

#### File 2: `manual-entry-processor.ts` (856 lines → ~4 files)

**Target Structure:**

```
manual-entry/
├── conversion.ts (~200 lines)
│   - convertToFlightDuty()
│   - convertToFlightDutyLegacy()
│   - handleLayoverConversion()
│
├── suggestions.ts (~100 lines)
│   - getSuggestedFlightNumbers()
│   - getSuggestedSectors()
│
├── batch-processor.ts (~200 lines)
│   - processBatchManualEntries()
│   - validateBatch()
│
├── workflow.ts (~200 lines)
│   - processManualEntry()
│   - validateManualEntryRealTime()
│
└── index.ts
    - Re-exports all public APIs
```

#### Acceptance Criteria
- [ ] All files under 300 lines
- [ ] Existing functionality unchanged
- [ ] Upload roster flow works
- [ ] Manual entry flow works
- [ ] Batch entry flow works
- [ ] Monthly recalculation works

---

### Phase 5: Component File Splits 🟡

**Branch:** `refactor/components-split`  
**Risk:** Medium  
**Effort:** 3-4 hours

#### Objective
Split large component files into focused sub-components.

#### File 1: `FlightEntryForm.tsx` (803 lines → ~5 files)

**Target Structure:**

```
flight-entry/
├── FlightEntryForm.tsx (~150 lines)     # Main orchestrator
├── DateSection.tsx (~80 lines)          # Date picker section
├── FlightDetailsSection.tsx (~150 lines) # Flight numbers, sectors
├── TimeSection.tsx (~100 lines)          # Report/debrief times
├── LayoverSection.tsx (~120 lines)       # Layover-specific fields
├── FormActions.tsx (~80 lines)           # Submit, batch buttons
└── index.ts
```

#### File 2: `FlightDutyCard.tsx` (572 lines → ~4 files)

**Target Structure:**

```
flight-duty-card/
├── FlightDutyCard.tsx (~150 lines)      # Main card wrapper
├── CardHeader.tsx (~80 lines)           # Title, badge, actions
├── CardDetails.tsx (~120 lines)         # Flight info display
├── CardFooter.tsx (~80 lines)           # Pay, hours summary
└── index.ts
```

#### File 3: `FlightDutiesTable.tsx` (410 lines → ~3 files)

**Target Structure:**

```
flight-duties-table/
├── FlightDutiesTable.tsx (~150 lines)   # Table container
├── TableHeader.tsx (~80 lines)          # Column headers, sort
├── TableRow.tsx (~120 lines)            # Individual row
└── index.ts
```

#### Acceptance Criteria
- [ ] All component files under 300 lines
- [ ] No visual changes to UI
- [ ] All interactions work identically
- [ ] No TypeScript errors

---

### Phase 6: Dashboard Page Split 🟡

**Branch:** `refactor/components-split` (same as Phase 5)  
**Risk:** Medium  
**Effort:** 2-3 hours

#### Objective
Split the dashboard page into logical sections.

#### Current: `dashboard/page.tsx` (592 lines)

#### Target Structure:

```
dashboard/
├── page.tsx (~100 lines)                    # Main page, layout
├── components/
│   ├── DashboardHeader.tsx (~80 lines)      # Month/year selector, title
│   ├── SummaryCards.tsx (~120 lines)        # Stats cards at top
│   ├── FlightDutiesSection.tsx (~150 lines) # Flight duties list
│   └── DeleteDialogs.tsx (~100 lines)       # Delete confirmation modals
├── hooks/
│   └── useDashboardState.ts (~100 lines)    # Extracted state logic
└── index.ts
```

#### State Extraction

Move to `useDashboardState.ts`:
- `selectedOverviewMonth` / `setSelectedOverviewMonth`
- `selectedYear` / `setSelectedYear`
- `deleteDialogOpen` / `selectedFlightForDelete`
- `bulkDeleteDialogOpen` / `selectedFlightsForBulkDelete`
- Delete handlers

#### Acceptance Criteria
- [ ] Dashboard page under 150 lines
- [ ] All dashboard functionality works
- [ ] Month/year selection works
- [ ] Delete single/bulk works
- [ ] Data loading/refresh works

---

## Testing Checklist

### After Each Phase

#### Automated Tests
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Existing unit tests pass

#### Manual Testing - Core Flows

| Flow | Test Steps | Pass? |
|------|------------|-------|
| **Upload Roster (CSV)** | Dashboard → Upload → Select CSV → Verify duties appear | ☐ |
| **Upload Roster (Excel)** | Dashboard → Upload → Select Excel → Verify duties appear | ☐ |
| **Manual Entry** | Dashboard → Manual → Enter flight → Save → Verify | ☐ |
| **Batch Entry** | Manual → Add multiple → Save batch → Verify all | ☐ |
| **Edit Flight** | Click duty → Edit → Save → Verify changes | ☐ |
| **Delete Flight** | Click duty → Delete → Confirm → Verify removed | ☐ |
| **Bulk Delete** | Select multiple → Delete → Confirm → Verify | ☐ |
| **Month Switch** | Change month → Verify correct data loads | ☐ |
| **Year Switch** | Change year → Verify correct data loads | ☐ |
| **Salary Calculation** | Upload roster → Check salary breakdown | ☐ |
| **Friends Roster Compare** | Friends → Select friend → Compare rosters | ☐ |
| **Statistics** | Statistics page → Verify charts render | ☐ |
| **Profile** | Profile → Update position → Verify saved | ☐ |

---

## Rollback Strategy

### If Issues Are Found

1. **During Development**
   - `git stash` current changes
   - `git checkout main`
   - Investigate issue on main
   - Return to branch with `git stash pop`

2. **After Merge to Main**
   - `git revert <merge-commit-hash>`
   - Push revert to main
   - Investigate and fix on branch
   - Re-merge when fixed

### Branch Protection Rules (Recommended)

```yaml
# Suggested GitHub branch protection for main
- Require pull request reviews: 1
- Require status checks: lint, build
- Require branches to be up to date
- Restrict who can push: maintainers only
```

---

## Timeline Estimate

| Week | Branch | Phases | Deliverable |
|------|--------|--------|-------------|
| 1 | `refactor/cleanup-and-hygiene` | 1 + 2 | Clean codebase, no console logs |
| 2 | `refactor/parsers-consolidation` | 3 | Modular parsing utilities |
| 3 | `refactor/processors-split` | 4 | Split processor files |
| 4 | `refactor/components-split` | 5 + 6 | Split UI components |

**Total Effort:** ~15-20 hours  
**Calendar Time:** 2-4 weeks (depending on availability)

---

## Success Metrics

After all phases complete:

- ✅ **Zero files over 300 lines**
- ✅ **Zero console.log statements**
- ✅ **Zero empty directories**
- ✅ **All tests passing**
- ✅ **No user-facing changes**
- ✅ **Improved developer experience**

---

## Appendix: Files by Size (Reference)

<details>
<summary>Click to expand full file size list</summary>

```
upload-processor.ts                1026 lines
manual-entry-processor.ts           856 lines
flydubai-excel-parser.ts            829 lines
FlightEntryForm.tsx                 803 lines
csv-parser.ts                       789 lines
excel-parser.ts                     629 lines
dashboard/page.tsx                  592 lines
database/flights.ts                 575 lines
FlightDutyCard.tsx                  572 lines
calculation-engine.ts               572 lines
database/friends.ts                 465 lines
manual-entry-validation.ts          436 lines
flight-classifier.ts                435 lines
FlightDutiesTable.tsx               410 lines
database/calculations.ts            382 lines
card-data-mapper.ts                 373 lines
supabase.ts                         367 lines
excel-validator.ts                  353 lines
RosterComparison.tsx                352 lines
statistics/calculations.ts          351 lines
LayoverConnectedCard.tsx            348 lines
SectorInput.tsx                     340 lines
EditTimesDialog.tsx                 329 lines
FlightNumberInput.tsx               328 lines
auth.ts                             327 lines
```

</details>


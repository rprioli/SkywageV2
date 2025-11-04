# Pre-Refactoring Baseline Documentation

**Date**: 2025-11-03
**Branch**: main
**Purpose**: Document current state before refactoring begins

---

## Environment Information

### Node & Package Manager
- **Node Version**: v23.5.0
- **NPM Version**: 11.2.0
- **Current Branch**: main

### Key Dependencies
- **Next.js**: 15.3.2
- **React**: 19.1.0
- **TypeScript**: 5.8.3
- **Tailwind CSS**: 4.1.14
- **Supabase**: 2.49.4
- **ESLint**: 9.26.0
- **Radix UI**: Multiple components (dialogs, dropdowns, etc.)
- **Recharts**: 2.15.3 (for charts)
- **Lucide React**: 0.510.0 (icons)
- **PapaParse**: 5.5.3 (CSV parsing)
- **XLSX**: 0.18.5 (Excel parsing)

See `package.json` for complete list of dependencies.

---

## File Size Baseline

### Critical Files to be Refactored

| File | Lines | Status |
|------|-------|--------|
| `src/app/(dashboard)/dashboard/page.tsx` | 1380 | ⚠️ Too large - Target: ~300 lines |
| `next.config.ts` | 41 | ⚠️ Has build bypasses |
| `src/lib/salary-calculator/upload-processor.ts` | 1052 | ⚠️ Has duplicate validation |

### Target After Refactoring

| File | Current | Target | Reduction |
|------|---------|--------|-----------|
| Dashboard page | 1380 lines | ~300 lines | ~1080 lines (78%) |
| Build config | Has bypasses | No bypasses | Clean config |
| Upload processor | Duplicate code | Consolidated | DRY principle |

---

## Lint Status Baseline

### Current Lint Results

**Exit Code**: 0 (Success)

**Warnings**: 2 warnings (non-blocking)

1. `./src/components/dashboard/DashboardSidebar.tsx:101:13`
   - Warning: Using `<img>` instead of `<Image />` from `next/image`
   - Impact: Performance (LCP and bandwidth)
   - Note: Not blocking, can be addressed separately

2. `./src/components/profile/AvatarUpload.tsx:142:11`
   - Warning: Using `<img>` instead of `<Image />` from `next/image`
   - Impact: Performance (LCP and bandwidth)
   - Note: Not blocking, can be addressed separately

**Errors**: 0 ✅

**Status**: Clean lint (only performance warnings, no errors)

---

## Build Configuration Issues

### Current Build Bypasses (to be removed in Phase 1)

From `next.config.ts`:

```typescript
eslint: {
  ignoreDuringBuilds: true,  // ⚠️ Line 9 - REMOVE
},
typescript: {
  ignoreBuildErrors: true,   // ⚠️ Line 16 - REMOVE
},
```

**Risk**: These bypasses allow builds to succeed even with errors.
**Action**: Remove in Phase 1 after fixing all lint/type errors.

---

## Code Duplication Issues

### Duplicate Refresh Functions (to be consolidated in Phase 2)

Located in `src/app/(dashboard)/dashboard/page.tsx`:

1. `refreshAfterDelete()` - Refreshes data after single flight deletion
2. `refreshAfterBulkDelete()` - Refreshes data after bulk deletion
3. `refreshDashboard()` - General dashboard refresh
4. `refreshAfterManualEntry()` - Refreshes after manual entry

**Issue**: All 4 functions have similar logic with slight variations
**Solution**: Consolidate into single `useDataRefresh` hook in Phase 2

### Duplicate Validation Functions (to be consolidated in Phase 5)

1. `validateCSVFile()` in `src/lib/salary-calculator/csv-validator.ts`
2. `validateCSVFileQuick()` in `src/lib/salary-calculator/upload-processor.ts` (lines 430-455)

**Issue**: Identical validation logic duplicated
**Solution**: Remove duplicate, use single source in Phase 5

---

## Performance Baseline

### Metrics to Measure

**Before Refactoring** (to be measured during Phase 0 manual testing):

- [ ] Dashboard initial load time: _____ ms
- [ ] Data refresh time (after delete): _____ ms
- [ ] Data refresh time (after upload): _____ ms
- [ ] Statistics page load time: _____ ms
- [ ] Component re-render count (React DevTools): _____

**After Each Phase** (to be compared):

- Phase 2: Data refresh optimization
- Phase 3: Dashboard component extraction
- Phase 5: Query parallelization

**Target Improvements**:
- Data refresh: 30% faster
- Statistics load: 20% faster
- Component re-renders: 50% reduction

---

## Functionality Baseline

### Critical Features to Verify (Manual Testing Checklist)

#### ✅ Dashboard Core Features
- [ ] Dashboard loads without errors
- [ ] Monthly calculations display correctly
- [ ] Flight duties table displays correctly
- [ ] Month selection works
- [ ] Current month is highlighted

#### ✅ Roster Upload
- [ ] CSV upload works
- [ ] Excel upload works
- [ ] File validation works
- [ ] Roster replacement confirmation appears
- [ ] Month selection preserved during upload
- [ ] All duty types processed correctly

#### ✅ Manual Entry
- [ ] Single flight entry works
- [ ] Batch entry mode works
- [ ] Can add multiple flights to batch
- [ ] Can save batch with incomplete new form
- [ ] Validation works correctly

#### ✅ Delete Operations
- [ ] Single flight delete works
- [ ] Layover pair delete works (both flights)
- [ ] Bulk delete works
- [ ] Delete all flights works
- [ ] Calculations update after delete

#### ✅ Layover Functionality
- [ ] Layover pairs identified correctly
- [ ] Navigation arrows work (left/right)
- [ ] Rest period displays on outbound only
- [ ] Rest hours calculated correctly
- [ ] Per diem pay calculated correctly (8.82 AED/hour)

#### ✅ Flight Calculations
- [ ] Cross-day turnarounds calculate correctly
- [ ] Cross-day layovers calculate correctly
- [ ] Duty hours correct for all types
- [ ] Flight pay correct for all types

#### ✅ Special Duty Types
- [ ] ASBY shows 4 hours at flight rate
- [ ] Regular recurrent shows 4-hour pay
- [ ] ELD recurrent shows 0 AED
- [ ] Home Standby shows 0 AED (no badge)
- [ ] Ground duties display correctly
- [ ] Rest days filtered out

#### ✅ Position-Based Calculations
- [ ] CCM calculations correct
- [ ] SCCM calculations correct
- [ ] Position change updates calculations

#### ✅ Date-Aware Rates
- [ ] Legacy rates (pre-2025) applied correctly
- [ ] New rates (2025+) applied correctly

---

## Known Issues (Not Part of Refactoring)

### Performance Warnings (Image Optimization)
- DashboardSidebar.tsx: Using `<img>` instead of `<Image />`
- AvatarUpload.tsx: Using `<img>` instead of `<Image />`

**Note**: These are performance optimizations, not critical errors. Can be addressed in a separate PR.

---

## Git Status

### Current State
- **Branch**: main
- **Status**: Clean working directory (assumed)
- **Last Commit**: (to be documented)

### Backup Branch
- **Name**: `pre-refactoring-backup`
- **Purpose**: Safety net to revert if needed
- **Created**: (to be created in Phase 0)

---

## Success Criteria for Refactoring

After all phases complete, we should have:

✅ **Code Quality**
- Dashboard page: 1380 → ~300 lines (78% reduction)
- No build bypasses in next.config.ts
- No code duplication
- All lint errors fixed (0 errors)

✅ **Performance**
- 30% faster data refresh
- 20% faster statistics load
- 50% fewer component re-renders

✅ **Functionality**
- All features work exactly as before
- No regressions
- All business logic tests pass

✅ **Maintainability**
- Clear separation of concerns
- Reusable hooks and components
- Better testability
- Comprehensive test coverage

---

## Next Steps

1. ✅ Complete manual testing checklist (Phase 0)
2. ✅ Create backup branch (Phase 0)
3. ✅ Proceed to Phase 1: Fix Build Config

---

**Document Status**: In Progress
**Last Updated**: 2025-11-03
**Updated By**: AI Assistant (Phase 0 execution)


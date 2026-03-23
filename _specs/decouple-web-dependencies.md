# Spec for Decouple Web Dependencies

branch: claude/feature/decouple-web-dependencies

## Summary

- Refactor shared code layers (database, salary engine, file parsing) to remove web-specific dependencies, preparing for React Native code sharing
- Four targeted changes: Supabase client injection (database + auth), v2-card-adapter separation, and excel-parser file reading abstraction
- The web app must continue working identically after all changes — zero functional regressions

## Functional Requirements

### 1. Supabase Client Injection

- All database layer files (`src/lib/database/flights.ts`, `calculations.ts`, `audit.ts`, `friends.ts`) currently import the `supabase` singleton directly from `@/lib/supabase`
- `src/lib/user-position-history.ts` also imports the singleton directly
- Refactor all exported functions in these files to accept an optional `SupabaseClient` parameter, defaulting to the existing singleton when not provided
- This preserves all existing call sites (no changes needed in components, hooks, or API routes) while allowing React Native to inject its own client
- The `supabase` import stays in each file as the default — it is NOT removed
- The `Database` type import from `@/lib/supabase` remains unchanged
- `src/lib/auth.ts` also imports the singleton — apply the same injection pattern here to complete the set of all Supabase-consuming shared files

### 2. v2-card-adapter Separation

- `src/lib/salary-calculator/v2-card-adapter.ts` imports `React` and uses `React.createElement()` in the `buildTimesNode()` function to return `React.ReactNode`
- It also imports component prop types from `@/components/salary-calculator/v2-cards` and utility functions from `@/components/salary-calculator/flight-duty-card/utils`
- Extract pure data mapping logic (everything that doesn't touch React) into a new file `src/lib/salary-calculator/v2-card-data-mapper.ts`
- The new file should return plain data objects (strings, arrays, numbers) instead of React nodes
- `buildTimesNode()` stays in `v2-card-adapter.ts` (it is inherently React-specific)
- The existing `v2-card-adapter.ts` imports from the new mapper file and continues to work as before
- All existing imports of `v2-card-adapter.ts` from components remain unchanged

### 3. Excel Parser File Reading Abstraction

- `src/lib/salary-calculator/excel-parser.ts` has a `readExcelFile()` function that uses the browser `FileReader` API
- Extract `readExcelFile()` into a separate concern by defining a `ReadFileAsArrayBuffer` function type
- Create a default browser implementation using `FileReader` (maintains current behavior)
- Modify `readExcelFile()` to accept an optional file reader function parameter, defaulting to the browser implementation
- All other functions in the file (`getFirstWorksheet`, `getCellValue`, `validateExcelFile`, etc.) are already pure and need no changes
- The `validateExcelFile()` function uses the browser `File` type for name/size checks — this is acceptable as validation will differ per platform anyway

## Possible Edge Cases

- Database functions that are called from API routes (`src/app/api/`) also import the singleton — these call sites should continue working without any changes via the default parameter
- `src/lib/user-position-history.ts` also imports `updateProfile` from `./db` — only the `supabase` import needs the injection pattern, not `updateProfile`
- `parseSectors`, `formatTime`, and `getDutyTypeConfig` from component utils are NOT moved in this pass — that's scope creep for a separate refactor. The new `v2-card-data-mapper.ts` returns raw data (TimeValue objects, sector strings) and lets each platform's UI layer handle formatting. `v2-card-adapter.ts` stays web-only and continues importing from component utils as before.

## Acceptance Criteria

- All existing call sites compile and work without modification (default parameter provides backward compatibility)
- Database functions accept an optional `SupabaseClient` parameter as their last argument
- `user-position-history.ts` functions accept an optional `SupabaseClient` parameter
- `auth.ts` exported functions accept an optional `SupabaseClient` parameter
- A new `v2-card-data-mapper.ts` file exists with zero React or component imports
- `v2-card-adapter.ts` imports from the new mapper and continues to pass all existing usage
- `readExcelFile()` accepts an optional file reader function, defaulting to browser `FileReader`
- `npm run build` passes with zero errors
- `npm run lint` passes with zero errors
- No new dependencies are added to `package.json`

## Resolved Decisions

- **Component utils (`parseSectors`, `formatTime`, `getDutyTypeConfig`):** NOT moved in this pass. The new mapper returns raw data objects; each platform formats in its UI layer. Moving these utils is a separate refactor if needed later.
- **`src/lib/auth.ts` client injection:** YES, included in this pass. Same pattern as database files — completes the full set of Supabase-consuming shared files in one refactor.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Verify that database functions work with default client (no parameter passed) — simulating existing behavior
- Verify that database functions accept and use a custom client when provided
- Verify that auth functions work with default client and accept a custom client
- Verify that `v2-card-data-mapper.ts` exports produce correct plain data objects for turnaround, layover, and simple duty types
- Verify that `readExcelFile()` works with default browser reader and with a custom reader function

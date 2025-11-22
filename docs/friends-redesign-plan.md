# Friends Page & Roster Comparison – Phased Delivery Plan

This document describes how we will redesign the Friends experience (left-hand friend list + roster comparison grid) in safe, reviewable phases. Each phase produces a feature branch, a focused PR, and a manual QA gate performed by the user before we move forward. Lint must pass at the end of every phase.

---

## Guiding Principles & Constraints

1. **No duplication / respect existing patterns** – Extend the current data layer (`src/lib/database/friends.ts`, `useFriends`, etc.) instead of introducing parallel APIs or component systems.
2. **Avatar fallbacks** – Every friend may lack an `avatar_url`. We derive initials (first letter of first name; fallback to email) and reuse existing avatar styles so the UI stays consistent.
3. **Type safety first** – Update shared TypeScript types and fix any downstream breakage immediately; never introduce `any`.
4. **UI consistency** – Keep Add Friend + Pending Requests cards above the new layout, per user direction. Avoid layout regressions on mobile.
5. **Tests & lint** – Run `pnpm lint` (or the project’s lint command) at the end of every phase and include results in the PR description.

---

## GitHub Workflow

1. **Branch naming** – `feature/friends-phase-0-planning`, `feature/friends-phase-1-data`, etc.
2. **One phase per branch** – Never mix scope between phases; if a later phase needs an earlier change, rebase/merge the latest `main` after that phase is approved.
3. **Manual QA gate** – After lint passes, deliver the branch for user testing. Wait for “OK” before committing locally.
4. **Commit & PR etiquette**
   - Squash commits per phase (e.g., `feat(friends): add friend sidebar component`).
   - Open PR targeting `main`, include:
     - Summary of work.
     - Testing checklist (manual steps + `pnpm lint` output).
     - Outstanding follow-ups (if any).
   - User handles merge + branch deletion.

---

## Phased Implementation

### Phase 0 – Planning & Setup

**Goal:** Produce this plan, confirm workflow, and ensure the repo is ready.

- Add `docs/friends-redesign-plan.md` (this file) and review it with the user.
- Validate existing contexts/hooks (FriendsProvider + useFriends) to understand data flow.
- Outcome: approved plan + clear branch strategy.

**Definition of done**

- Plan reviewed and accepted.
- Baseline lint (`pnpm lint`) run to ensure repo is clean.

---

### Phase 1 – Data & Context Enhancements

**Goal:** Enrich friend data so UI work has everything it needs.

- Extend `FriendWithProfile` / `PendingRequest` to include `firstName`, `lastName`, `avatarUrl`.
- Update Supabase queries in `src/lib/database/friends.ts` to select those fields.
- Add derived helpers (e.g., `getFriendDisplayName`, `getFriendInitial`) so components stay DRY.
- Update `useFriends` consumers (Friends page, sidebar, RosterComparison modal) to use the richer data.

**Definition of done**

- TypeScript compiles with new fields; no `any`.
- Lint passes.
- Manual QA: ensure existing Friends page loads, displays old info, and roster comparison still opens.

---

### Phase 2 – Friend List Sidebar Component

**Goal:** Implement the left-hand list with avatars/initials and selection UX.

- Create `src/components/friends/FriendListSidebar.tsx`:
  - Avatar/initial display.
  - Friend name + airline/position.
  - Search/filter input (client-side).
  - Loading + empty states.
  - “Active” styling for selected friend.
- Expose callbacks so the Friends page can update `selectedFriend`.
- Keep component responsive (collapsible on small screens).

**Definition of done**

- Storybook-style manual test (if available) or in-page verification.
- Lint passes.
- Manual QA: verify list renders, selecting friend updates `selectedFriend`, fallback initial works without avatar.

---

### Phase 3 – Roster Comparison Grid Redesign

**Goal:** Replace the dual-column card list with the calendar-style grid from the screenshot.

- Create utilities to generate days for the selected month and map user/friend duties per day.
- Build compact “tile” components (e.g., `FlightTile`, `OffDayTile`) mirroring the reference colors/icons.
- Update `RosterComparison.tsx`:
  - Top header with both avatars/initials + month controls.
  - Three-column grid: day column + user column + friend column, locked row heights so dates align.
  - Show off-days explicitly; highlight flights with blue tiles, include airport codes + flight numbers.
- Reuse existing data filter logic (layover handling) but adapt to per-day structure.

**Definition of done**

- Visual layout matches reference (within existing design system constraints).
- Keyboard/scroll behavior remains usable.
- Lint passes.
- Manual QA: compare several months, confirm alignment and loading states.

---

### Phase 4 – Friends Page Layout Integration

**Goal:** Wire the sidebar + new grid into the page layout.

- Update `src/app/(dashboard)/friends/page.tsx`:
  - Keep Add Friend + Pending Requests cards on top.
  - Below, create responsive two-column layout:
    - Left: `FriendListSidebar`.
    - Right: Roster comparison canvas (shows prompting state when no friend selected).
  - Ensure mobile view stacks vertically; provide fallback CTA on small screens.
- Remove the old “Roster Comparison” card block triggered by `selectedFriend`.
- Verify contexts and selection logic still work.

**Definition of done**

- Layout responsive across breakpoints (Tailwind classes).
- Lint passes.
- Manual QA: add friend, select friend, view roster grid, confirm nothing overlaps.

---

### Phase 5 – Final QA & PR Handoff

**Goal:** Wrap up and prepare PR after user sign-off.

- Run full lint/test suite (`pnpm lint`, `pnpm test` if applicable).
- Capture screenshots/gifs for PR.
- Provide summary + checklist for user review.
- After user confirms, push branch and open PR. Await merge instructions.

---

## Testing & Lint Checklist (per phase)

1. `pnpm install` (once if dependencies changed).
2. `pnpm lint`.
3. Manual validation steps listed under each phase’s definition of done.
4. Document anything untested (e.g., mobile view) so the user can cover it.

---

## Next Actions

1. Confirm this plan is approved.
2. Start `feature/friends-phase-1-data`.
3. Execute Phase 1 steps, run lint, deliver for review/QA.

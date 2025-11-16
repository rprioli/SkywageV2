# Friends Feature - Implementation Plan

## Overview

This document outlines the implementation plan for adding a **Friends** feature to the Skywage application.

**Primary goals:**

- Allow users to add friends **by email** and manage friend relationships (pending, accepted, rejected, unfriend).
- Provide a **Friends** page at `/friends` that shows:
  - Add Friend input
  - Pending friend requests (sent + received)
  - Friends list with simple actions
- Provide a **side-by-side roster comparison** for a selected friend and month.
- In the comparison view, show **all duty types**, including:
  - Flying duties (turnaround, layover, standby, recurrent training, etc.)
  - **Days Off** and **Additional Days Off** and other off/rest/leave entries.
- Comparison view is **read-only**, shows **roster only** (no salary), and defaults to **current month** with a month selector.

### Simplified Scope (Agreed)

- Friend discovery: **email-only invite**, no search results or recommendations.
- Relationship model: **mutual friendship** with statuses: `pending`, `accepted`, `rejected`.
- Data sharing: **roster only**, no salary or per diem in this feature.
- No blocking, messaging, comments, public profiles, or recommendations.
- Notifications: pending requests shown on Friends page + **global indicator** (badge) for pending count.
- Technology stack: Supabase (Postgres + RLS), Next.js App Router, TypeScript, ShadCN UI, existing Skywage patterns.

---

## Implementation Summary

| Aspect                 | Details                                                        |
| ---------------------- | -------------------------------------------------------------- |
| **Complexity**         | Medium                                                         |
| **Total Phases**       | 3 main phases                                                  |
| **User-visible Steps** | Phase 2 (Friends core UI) + Phase 3 (Roster comparison)        |
| **Database Migration** | Yes (friendships table; off/rest duty handling)                |
| **Breaking Changes**   | None planned (main dashboard behavior preserved)               |
| **Key Risk Areas**     | RLS correctness, roster data for off days, parser changes      |
| **Git Workflow**       | One feature branch per phase/group, PR per branch, user merges |

---

## Front-End Design & Layout (Friends Page)

This section describes the **/friends** screen in more detail so the UI can be implemented consistently and with reusable components.

### High-level screen structure

- Three main areas:
  - **Header bar** across the top: title + primary/secondary actions.
  - **Left sidebar**: list of friends (including a "You" row), fixed width.
  - **Main comparison panel**: roster comparison (date rail + you + friend) with vertical scrolling.
- Desktop layout: sidebar on the left, comparison panel on the right; on mobile we can stack sections vertically or defer fine-tuning.

### Header ("Compare Roster" bar)

- Appears at the top of `/friends`, inside the dashboard content area.
- **Left:** page title `Compare Roster`.
- **Right:** two actions in a horizontal group:
  - Primary button: **Add Friend** (opens email-based add-friend flow / modal).
  - Secondary button: **Friend Requests** with a badge showing pending count.
- Visuals:
  - White background with a subtle bottom border (no heavy shadow).
  - Horizontal layout with 16–24 px padding.
  - Buttons as rounded rectangles (pill-like) using existing brand colors.

### Friends sidebar (left)

- Width: approximately **220–260 px**.
- Background: white with a right-hand border to separate it from the main panel.
- Structure:
  - Top fixed block:
    - Title: `Friends`.
  - Below: scrollable list of friends.
- Friend row pattern:
  - Height: 48–56 px.
  - Left: circular avatar (initials or simple colored circle).
  - Right: friend name (single line with ellipsis if long).
  - Selected friend:
    - Different background (soft highlight).
    - 3–4 px vertical accent strip in brand purple (`#4C49ED`) on the left.
- Behaviour:
  - Clicking a friend row:
    - Sets `selectedFriendId` in state.
    - Updates the comparison panel to load that friend's roster.
  - If **no friend is selected**:
    - Right panel shows a friendly empty state: _"Select a friend on the left to compare rosters."_

### Roster comparison panel (right)

The right side of the screen is the **Roster Comparison panel**, which is only active once a friend is selected.

#### Panel sub-header

- Centered horizontally above the grid.
- Shows:
  - `[Avatar You]  You   vs   [Avatar Friend]  Friend Name`.
  - Small labels under each avatar (e.g. `You`, friend's first name / airline / position).
- The month selector for comparison can sit near this header (aligned right) but remains outside the scrollable grid.

#### Comparison grid

- Three aligned columns, repeated for every day in the selected month:
  - **Date rail** (fixed width ~80–90 px).
  - **Your roster column** (flex: 1).
  - **Friend roster column** (flex: 1, read-only).
- Date rail cell:
  - Vertical stack, center-aligned:
    - Weekday (small uppercase, e.g. `SAT`).
    - Day number (large, e.g. `01`).
    - Month (small uppercase, e.g. `NOV`).
  - Subtle divider under each date row.
- Data model (conceptual):
  - Build a normalized array such as:
    - `DailyComparisonRow = { date, youDuty?, friendDuty? }`.
  - One row per calendar day, ensuring predictable alignment between the two rosters.

### Duty cards & reusable components

We should avoid duplicating card logic by reusing and extending the existing flight duty card patterns.

- Introduce or extend a reusable `DutyCard` component that can be used both:
  - In the existing salary calculator / dashboard views.
  - In the Friends roster comparison panel.
- Variants (driven by `dutyType` and available data):
  - **Flight duty card** (all flying types):
    - Large rounded rectangle with colored background (e.g. pastel blue, respecting brand palette).
    - Left: airplane icon.
    - Right (vertical stack):
      - Main routing or airport codes (e.g. `DXB -> CMB -> DXB`) as primary text.
      - Flight number(s) as smaller secondary text.
    - Multi-leg sectors rendered as a vertical list inside the same card.
  - **Ground / recurrent / similar duties (no flight number)**:
    - Same overall card frame.
    - Type-specific icon and label.
    - Flight number row omitted when not applicable.
  - **Rest day card**:
    - White/light background with thin border.
    - Sleep/rest icon.
    - Label `REST` in small caps.
  - **Off / Additional Day Off / Leave card**:
    - White/light background with thin border.
    - Green house icon.
    - Labels like `OFF`, `ADDITIONAL DO`, `LEAVE` depending on source data.
- Visual rules:
  - Large corner radius (soft, friendly look) and generous internal padding.
  - Very subtle or no shadow; rely on a light border to match overall dashboard style.
  - Typography hierarchy: date number (in rail) > routing/airport code > flight number > small labels.
  - Color intensity indicates **working vs non-working** days:
    - Stronger color for duties that involve work.
    - Neutral cards for rest/off/leave.
- In the **friend column** of the comparison grid, `DutyCard` is rendered in a strictly **read-only** mode (no interactive controls).

### Interaction, scrolling & empty states

- Scrolling:
  - The entire comparison grid (date rail + both roster columns) lives in a single vertical scroll container.
  - The sub-header and month selector remain fixed above the scroll area.
- Empty states:
  - **No friend selected:** right panel shows a simple illustration or icon and the text _"Select a friend on the left to compare rosters."_
  - **Friend selected but no roster data for that month:**
    - Show a message like _"No roster available for this period."_ while still keeping the header and month selector visible so users can try a different month.

### Phase mapping for the front-end

- **Phase 2:**
  - Implement `/friends` route, header bar, friends sidebar, and basic layout scaffolding.
  - Wire up `useFriends` hook and pending requests badge; comparison panel can initially show only empty-state content.
- **Phase 3:**
  - Implement the roster comparison API and `DailyComparisonRow` mapping.
  - Extend the comparison panel with the sub-header, month selector, comparison grid, and `DutyCard` variants.
  - Ensure off/rest/leave days appear using the neutral card variants described above.

---

## Phase 1 – Database & RLS Foundation

**Git branch:** `feature/friends-phase-1-database`

**Goals:**

- Introduce a `friendships` table in Supabase.
- Add RLS policies so only participants can see or modify a friendship row.
- Prepare types in `src/lib/supabase.ts` for the new table.

### Scope

1. **Create `friendships` table** (SQL migration in `sql/` following existing timestamp naming):

   - Columns:
     - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
     - `requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
     - `receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
     - `status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected'))`
     - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
     - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
     - `responded_at TIMESTAMPTZ NULL`
   - Constraints / indexes:
     - `UNIQUE (requester_id, receiver_id)` to enforce one row per pair.
     - Index on `(receiver_id, status)` to speed up pending-requests queries.

2. **Enable RLS and policies on `friendships`:**

   - Enable RLS: `ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;`.
   - Policies (conceptual):
     - **SELECT** – participants only:
       - `auth.uid() = requester_id OR auth.uid() = receiver_id`.
     - **INSERT** – only as requester:
       - `WITH CHECK (auth.uid() = requester_id)`.
     - **UPDATE/DELETE** – participants only:
       - `USING` and `WITH CHECK` require `auth.uid()` to be requester or receiver.
   - Business rules for status transitions (who can accept/reject) will be enforced at the API layer in Phase 2.

3. **Types and Supabase client integration:**
   - Extend `Database` types in `src/lib/supabase.ts` with `friendships` table definition.
   - Confirm code builds and type-checks.

### Testing & Verification

- Run existing unit tests and type checks.
- From a temporary script / Supabase SQL console:
  - Insert a friendship row as user A and confirm user B can see it when authenticated as B.
  - Confirm a third user C cannot see or modify that row.

### Why separate branch?

- The database foundation can be safely merged without any UI.
- Keeps schema/RLS review focused and isolated from later feature logic.

---

## Phase 2 – Core Friends API & UI (No Roster Comparison Yet)

**Git branch:** `feature/friends-phase-2-core-ui`

**Goals:**

- Implement core friends operations (send, accept, reject, unfriend) via API routes.
- Add a `/friends` page within the dashboard layout.
- Show pending requests and friends list, with a global pending-requests indicator in the sidebar.

### Scope

1. **Backend helpers (database layer):**

   - New module, e.g. `src/lib/database/friends.ts` with functions:
     - `getFriendsForUser(userId)` – returns accepted friendships, including profile info for both sides.
     - `getPendingFriendRequests(userId)` – separates sent vs received pending requests.
     - `sendFriendRequest(requesterId, targetUserId)` – creates or reuses a row; enforces uniqueness and status rules.
     - `respondToFriendRequest(friendshipId, newStatus)` – `accepted` or `rejected` for the receiver.
     - `unfriend(friendshipId)` – sets `status='rejected'` (or deletes) for accepted friendships.

2. **API routes (Next.js App Router):**

   - Folder: `src/app/api/friends` with route handlers that follow existing API patterns:
     - `POST /api/friends/send-request`:
       - Input: `{ email: string }`.
       - Steps: get authenticated user; look up `profiles` by `email`; disallow self-friend; check existing `friendships` row; return meaningful errors:
         - "Already friends", "Request pending", "User not found".
     - `POST /api/friends/respond`:
       - Input: `{ friendshipId: string, status: 'accepted' | 'rejected' }`.
       - Checks: current user must be `receiver_id` for pending requests.
     - `POST /api/friends/unfriend`:
       - Input: `{ friendshipId: string }`.
       - Checks: current user must be participant; flips status or deletes row.
     - `GET /api/friends/list`:
       - Returns `{ friends, incomingRequests, outgoingRequests, pendingCount }` (including basic profile info).

3. **Friends page UI:**

   - New route: `src/app/(dashboard)/friends/page.tsx`.
   - Uses existing `Dashboard` layout and Auth patterns.
   - Client component structure:
     - **Add Friend section**:
       - Email input + "Send request" button.
       - Inline errors/toasts from `send-request` API.
     - **Pending Requests section**:
       - "Requests you received" – each row with Accept / Reject.
       - "Requests you sent" – each row with status and optional Cancel.
     - **Friends list section**:
       - Cards/list showing friend name/email, airline, position, and "Unfriend" button.
   - Styling: ShadCN UI (Card, Button, Input) with existing brand colors, flat design, minimal UX.

4. **Hooks & state management:**

   - `useFriends` hook (e.g. `src/hooks/useFriends.ts`):
     - Fetches `/api/friends/list`.
     - Exposes `friends`, `incomingRequests`, `outgoingRequests`, `pendingCount`, `refresh`, and action helpers that call the API routes.

5. **Global pending indicator:**
   - Update `DashboardSidebar` nav items to include Friends:
     - `{ name: 'Friends', href: '/friends', icon: Users }`.
   - Use a light-weight hook or data fetch in the sidebar to show a small badge with `pendingCount` for the current user.
   - Ensure this fetch is efficient and cached to avoid excessive requests.

### Testing & Verification

- Unit tests for `friends` DB helpers where practical (or targeted integration tests).
- Manual API testing via HTTP client or browser.
- UI testing:
  - Send request to another test account and verify correct pending states.
  - Accept/reject/unfriend flows work and lists refresh.
  - Pending badge updates when requests are created/resolved.
- Start dev server from this branch so you can test /friends end-to-end before merging.

### Why separate branch?

- Phase 2 introduces user-facing Friends functionality that is fully usable **even without roster comparison**.
- Keeps the PR focused on relationship management and UI, without parser or comparison complexity.

---

## Phase 3 – Roster Comparison & Off/Rest-Day Support

**Git branch:** `feature/friends-phase-3-roster-comparison`

**Goals:**

- Implement side-by-side roster comparison between the current user and a selected friend.
- Ensure comparison shows **all duty types**, including off/rest/leave days.
- Keep the main dashboard behavior (hiding off days in the new card design) intact.

> **Important:** Parser/data changes and roster comparison UI/API should live in **the same branch** so they can be tested together. Without parser changes, off/rest days would not exist in the DB; without the comparison view, parser changes would not be fully validated in context.

### Scope

1. **Parser & data model changes (off/rest days):**

   - Update `flydubai-excel-parser` and `csv-parser` so that **rest/off/leave days are not filtered out** before persistence.
   - Instead of returning `null` for:
     - REST DAY, DAY OFF, ADDITIONAL DAY OFF, ANNUAL LEAVE, OFF, X, etc.,
     - create `FlightDuty` entries with:
       - `dutyType: 'off'` (or a small set of off-related types if needed).
       - Zero pay/time fields (so salary calculations remain correct).
       - Descriptive label in a notes/description field where available.
   - Confirm that salary calculation engine ignores `dutyType === 'off'` for pay/hours, or adjust filters as needed.

2. **Roster comparison API endpoint:**

   - New route: `GET /api/friends/compare-roster` (e.g. `src/app/api/friends/compare-roster/route.ts`).
   - Query parameters: `friendId`, `month`, `year` (month/year default to current if omitted).
   - Steps:
     1. Get authenticated user from Supabase in the route.
     2. Verify there is a `friendships` row with `status='accepted'` where both users are participants.
     3. Use a **service-role Supabase client** on the server to fetch flights for both users for the selected month/year.
     4. Return payload containing both rosters (all duty types), along with basic friend profile info.
   - No salary data should be included in the response.

3. **Roster comparison UI on Friends page:**

   - Extend `/friends` page with a **Roster Comparison panel**:
     - When user selects a friend from the list, show a panel with:
       - Friend name/basic info.
       - Month selector initialized to the **current month** (and year consistent with existing year-selection feature).
       - Side-by-side columns: "Your roster" and "Friend's roster".
     - For each column:
       - Render duties for the selected month **including off/rest days**.
       - The friend column is **strictly read-only** (no edit/delete actions).
   - Component strategy:
     - Reuse existing card/table patterns from `FlightDutiesTable` and `FlightDutyCard` for consistency.
     - Introduce a prop or variant to **include off duties** (overriding the current behavior that skips `dutyType === 'off'` in the main dashboard).
     - Avoid duplicating large portions of UI; prefer a configurable table/card component.

4. **Day Off visualization:**
   - Ensure that the comparison view clearly indicates:
     - Working days (any duty type other than off).
     - Off/Additional Day Off/Leave days, with a clear label (e.g. "Off" / "Additional DO" / "Annual Leave").
   - For days where there is no record at all, consider treating them as implicit "off" in the comparison layout (calendar or list), as long as this does not conflict with data semantics.

### Testing & Verification

- Parser tests:
  - Feed sample CSV/Excel rows containing REST DAY, DAY OFF, ADDITIONAL DAY OFF, ANNUAL LEAVE, OFF, X and confirm `FlightDuty` objects are created with `dutyType='off'`.
  - Confirm salary calculations remain unchanged for paid duties.
- API tests:
  - Verify unauthorized users or non-friends cannot access comparison data.
  - Verify accepted friends can fetch each other's rosters for a month.
- UI tests:
  - Confirm side-by-side comparison works for multiple months.
  - Confirm all duty types, including off/rest/leave, are visible in the comparison view.
  - Confirm friend side is read-only.
- Start dev server from this branch and perform end-to-end roster comparison testing before merging.

### Why combined in one branch?

- Data shape change (off/rest days now persisted) and new UI/API that depends on that data must be tested together to avoid:
  - Persisting new off-duty records without any UI to verify them.
  - A comparison UI that expects off-duty records that do not yet exist.

---

## Git Workflow Strategy (Summary)

1. **Phase 1 – Database & RLS:**

   - Branch: `feature/friends-phase-1-database`.
   - Implement friendships table + RLS + types.
   - Run tests and type checks; start dev server briefly to ensure no regressions.
   - Create PR; you review, test, merge, and delete branch.

2. **Phase 2 – Core Friends UI & API:**

   - Branch: `feature/friends-phase-2-core-ui` (created from updated `main`).
   - Implement DB helpers, API routes, `/friends` page, hooks, and global indicator.
   - Run tests, type checks, and manual UI testing; start dev server.
   - Create PR; you review, test, merge, and delete branch.

3. **Phase 3 – Roster Comparison & Off/Rest Days:**
   - Branch: `feature/friends-phase-3-roster-comparison` (created from updated `main`).
   - Implement parser changes, comparison API, and comparison UI.
   - Run parser tests, salary regression checks, and full end-to-end comparison testing; start dev server.
   - Create PR; you review, test, merge, and delete branch.

After all three phases are merged, the Friends feature will provide:

- Email-based friend management with pending requests and global indicators.
- Side-by-side roster comparison per month, including all duty types (working duties, off days, additional days off, and other rest/leave entries), with read-only friend rosters and no salary sharing.

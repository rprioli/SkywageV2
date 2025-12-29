## Skywage V2 — Product Requirements Document (PRD)

### Document control

- **Product**: Skywage V2
- **Doc type**: PRD (implementation-aligned; reflects current repo behavior + clarified product intent)
- **Version**: 1.0
- **Last updated**: 2025-12-29
- **Primary platform**: Web (desktop + mobile responsive)
- **Tech baseline (current)**: Next.js App Router + TypeScript + Tailwind + shadcn/ui + Supabase (Auth + Postgres + Storage)

---

## 1) Executive summary

### What Skywage V2 is

Skywage V2 is an authenticated web app for airline cabin crew to **upload rosters**, **manually add/edit duties**, and **calculate salary outcomes** (monthly totals + pay breakdown) with an emphasis on **accuracy**, **auditability**, and **simple UX**. It also adds two engagement/retention features:

- **Statistics**: year-to-date and month-to-month earnings insights derived from saved calculations and duties.
- **Friends + roster comparison**: connect with colleagues, then compare rosters side-by-side without exposing salary amounts.

### Why it exists

Cabin crew pay is composed of fixed monthly components plus variable duty-based components (flight pay, per diem, standby/training). Rosters are often messy (cross-day times, training codes, rest/leave/off patterns), and “manual spreadsheet math” is error-prone. Skywage exists to:

- reduce time and errors in pay estimation,
- provide month/year tracking,
- support quick “what changed?” via an audit trail,
- help the crew to take control of his finances and stop guessing his salary every month
- enable social utility through roster comparison.

### Current scope anchor (Flydubai first)

The system is built as a multi-airline framework, but **Flydubai** is the initial fully-supported airline configuration. Data volumes are small (typical month ~13–14 flight duties), so the UX prioritizes clarity over large-data performance patterns.

---

## 2) Product goals, non-goals, and success metrics

### Goals

- **G1 — Accurate salary calculation**: produce reliable monthly totals and component breakdowns based on user position (CCM/SCCM), duty type, durations, and per-diem/rest rules.
- **G2 — Low-friction workflow**: roster upload and manual entry should be fast (few clicks), with clear errors and progress feedback.
- **G3 — Trust & auditability**: users can see edits, revert changes, and understand why totals changed.
- **G4 — “Month view as truth”**: users can switch months/years and view the associated duties + calculations consistently.
- **G5 — Social value without privacy risk**: roster comparison should help plan swaps/meetups without revealing compensation info.

### Non-goals (for current version)

- **NG1**: Payroll-grade compliance across all airlines and jurisdictions (this is a salary estimator).
- **NG2**: Handling extremely large datasets (virtualized lists, heavy performance engineering).
- **NG3**: Admin dashboards, employer-side tooling, or managerial analytics.
- **NG4**: Storing roster files as long-term artifacts (only avatar storage is implemented today; roster file backup is optional future).

### Success metrics (measurable)

- **Activation**
  - % of new users who complete registration → land on dashboard → set/confirm position.
  - % of users who upload at least one roster or add at least one duty within first session.
- **Accuracy & trust**
  - User-reported calculation issue rate per uploaded month.
  - % of edited duties subsequently reverted (proxy for “edit mistakes”).
- **Engagement**
  - Monthly active users (MAU), returning users.
  - % of users who view Statistics after having ≥2 months of data.
  - % of users who create at least one friendship and run a roster comparison.
- **UX efficiency**
  - Median time from “Upload Roster” click → duties visible on dashboard for that month.
  - Manual entry completion time for a single duty and for a batch.

---

## 3) Target users & personas

### Primary personas

- **P1 — Cabin Crew Member (CCM)**
  - Needs quick monthly pay estimate + ability to validate suspicious roster entries.
  - Wants easy “upload → view totals” and manual corrections.
- **P2 — Senior Cabin Crew Member (SCCM)**
  - Same as CCM, but pay rates differ and salary is more sensitive to position.
  - Frequently uses stats to compare months and identify best duty patterns.

### Secondary personas

- **P3 — Social planner / colleague coordinator**
  - Uses Friends + roster comparison to align days off / layovers.
- **P4 — Power user**
  - Adds multiple duties manually (batch entry) and expects fast repeat workflows.

---

## 4) Scope & information architecture

### Routes (current)

- **Unauthenticated**
  - `/` — Login (primary landing for MVP)
  - `/register` — Register
  - `/auth/callback` — Supabase OAuth/PKCE callback exchange
- **Authenticated (dashboard group)**
  - `/dashboard` — Main dashboard + salary calculator experience
  - `/statistics` — Statistics & insights
  - `/friends` — Friends management + roster comparison
  - `/profile` — Profile & account settings

### Navigation (current)

Sidebar: Dashboard, Statistics, Friends (badge: pending requests), Profile, Logout.

---

## 5) Core domain concepts

### Duty types (domain)

Duty types represent roster activities and drive pay logic and UI representation:

- **turnaround**: multi-sector duty that returns to base within the duty.
- **layover**: outbound + inbound duties separated by a rest period; per diem is computed from rest time.
- **asby**: airport standby; fixed paid duration (Flydubai: 4h × hourly rate).
- **recurrent**: training duty; paid as fixed hours except ELD (unpaid).
- **business_promotion**: special duty paid by rostered duration (not a fixed default).
- **sby**: home standby; unpaid (but may display duty hours if provided).
- **off**: day off; unpaid.
- **rest**: rest day; unpaid. (Typically parsed from roster; not a manual entry option today.)
- **annual_leave**: annual leave; unpaid. (Typically parsed from roster; not a manual entry option today.)

### Position (domain)

Position is a **profile attribute** and is a critical input to calculation:

- **CCM**
- **SCCM**

Position is treated as “source of truth” from the `profiles` table, with a fallback to auth metadata for resilience.

### Supported year range

- App uses a **minimum supported year = 2025** (data prior is ignored/hidden).

---

## 6) User journeys (end-to-end)

### J1 — Registration → first dashboard view

- User visits `/register`, enters:
  - email, password, first/last name, airline (Flydubai only currently), position (CCM/SCCM), optional nationality.
- System creates auth user and a `profiles` row via DB trigger.
- User lands on `/dashboard`.

**Acceptance criteria**

- Registration validates required fields and password length.
- On success, user is authenticated and can access `/dashboard` without redirect loops.

### J2 — Login → dashboard

- User logs in at `/` using email/password.
- If user attempted a protected route, app redirects back to that route after login; otherwise default `/dashboard`.

**Acceptance criteria**

- Login error messages are user-friendly (invalid credentials, email not confirmed, network issues).
- Network retries apply only to network-like failures, not invalid credentials.

### J3 — Upload roster for a month (CSV/Excel) with replacement option

- From `/dashboard`, user clicks **Upload Roster**.
- User selects target month (1–12); file chooser opens automatically.
- User selects `.csv`, `.xlsx`, or `.xlsm`.
- System validates file (type, size <= 10MB, non-empty; deeper validation differs by file type).
- System checks whether the user already has roster data for that month/year:
  - If no, proceed.
  - If yes, prompt: **replace existing roster data** for that month/year.
- System processes file with progress UI and on success:
  - writes duties to `flights`,
  - computes and writes layover rest periods to `layover_rest_periods`,
  - computes and upserts `monthly_calculations`,
  - refreshes dashboard.

**Acceptance criteria**

- Upload flow is month-first (user chooses month before file).
- Replacement prompt appears only when existing month/year data exists.
- On success, the dashboard reflects the updated duties and totals for the selected month/year.

### J4 — Add duty manually (single or batch)

- From `/dashboard`, user clicks **Add Flight**.
- User selects duty type and enters required fields.
- System validates in real-time and on submit:
  - creates duty record(s) in `flights` (layover creates paired records),
  - recalculates `monthly_calculations`,
  - recalculates `layover_rest_periods` as needed.
- Batch mode:
  - user can “Add Another Duty” repeatedly,
  - then “Save Batch Only” or “Save Flight Duty” (save batch + current).

**Acceptance criteria**

- Duty type selection controls which fields are required (e.g., off/asby/recurrent/bp don’t require flight numbers/sectors).
- Layover entry supports separate dates and times for outbound/inbound contexts (as defined by current form structure).
- On success, the dashboard updates without requiring a full refresh.

### J5 — Manage duties: edit times, revert edits, delete (single/bulk), delete all

- User views duty list/cards for selected month/year.
- User can:
  - edit report/debrief times (with cross-day detection),
  - see layover rest-period preview when editing a layover duty,
  - revert an edited duty to its original values,
  - delete a single duty (layover deletion removes both paired records),
  - bulk select and bulk delete,
  - delete all duties in the current view/month.
- System writes audit entries to `flight_audit_trail`.

**Acceptance criteria**

- Editing times updates duty hours and pay correctly and triggers recalculation for affected month/year.
- Layover edit impacts rest period/per diem outcomes and persists correctly.
- Deleting a layover duty deletes its paired segment as a single conceptual action.
- Audit trail is written for create/update/delete and does not block the operation if audit logging fails.

### J6 — Update profile (position/nationality/avatar)

- From `/profile`, user can:
  - upload an avatar (requires Supabase Storage bucket `avatars` + policies),
  - update nationality,
  - update position (CCM/SCCM).
- Position change triggers:
  - recalculation of existing duties and monthly totals to match new rates,
  - dashboard refresh via event signaling.

**Acceptance criteria**

- If avatars bucket/policies are missing, the UI provides a clear admin-actionable error message.
- Position update reliably changes pay rates applied across all existing months (within supported years) and refreshes visible totals.

### J7 — View statistics (year selector)

- From `/statistics`, user selects a year (>= 2025).
- System loads:
  - monthly calculations for the user,
  - flight duties for the year (for accurate duty-type stats and top duties),
  - computes statistics cards and charts:
    - YTD earnings + progression
    - monthly comparison (current vs previous, best/worst)
    - duty types breakdown (variable-pay only; per diem allocated to layovers)
    - top duty rankings (highest paying turnarounds & layover pairs)

**Acceptance criteria**

- Statistics loads gracefully with empty states and retry on error.
- Year selector only shows years with supported data.

### J8 — Friends & roster comparison (privacy-safe)

- From `/friends`, user can:
  - send friend request by email,
  - accept/reject received requests,
  - see sent pending requests,
  - select a friend to compare rosters.
- In roster comparison:
  - user navigates month/year,
  - system fetches both rosters only if friendship is accepted,
  - salary info is not exposed (flight pay is sanitized to zero in API response),
  - UI shows a calendar-style grid comparing duties.

**Acceptance criteria**

- A user cannot view a non-friend’s roster.
- Compare endpoint requires a bearer token, verifies friendship, and returns only duty metadata (not salary).

---

## 7) Functional requirements (detailed)

### 7.1 Authentication & session management

- **FR-AUTH-1**: Email/password login and registration via Supabase Auth.
- **FR-AUTH-2**: Route protection:
  - middleware redirects unauthenticated users from protected routes to `/`.
  - client-side `ProtectedRoute` shows a loading state and redirects when session is absent.
- **FR-AUTH-3**: Session stability:
  - cookie-based auth support for SSR/middleware (via `@supabase/ssr` browser client).
- **FR-AUTH-4**: Retry strategy for auth:
  - network-like failures retry with exponential backoff (max 3).
  - auth failures do not retry.

### 7.2 Profiles & settings

- **FR-PROFILE-1**: Profiles store: email, airline, position, nationality, first/last name, avatar URL.
- **FR-PROFILE-2**: Position is the calculation input; updating it triggers recalculation of persisted salary data.
- **FR-PROFILE-3**: Avatar upload to `avatars` storage bucket (public URL), with explicit UX for missing bucket/policies.
- **FR-PROFILE-4**: Theme preference persisted in `localStorage` (`light` default, optional `dark`).

### 7.3 Duty ingestion (roster upload)

- **FR-UPLOAD-1**: Supported file types: `.csv`, `.xlsx`, `.xlsm` (max 10MB, non-empty).
- **FR-UPLOAD-2**: Month/year targeting:
  - user selects a month; year comes from dashboard year selector (default current, clamped to >= 2025).
  - processing assigns duties to that month/year where needed.
- **FR-UPLOAD-3**: Replace flow:
  - before save, check whether duties already exist for month/year.
  - if exists, show confirm modal to replace that month/year’s data.
- **FR-UPLOAD-4**: Progress feedback:
  - validating → parsing → calculating → saving → complete, with clear error details.
- **FR-UPLOAD-5**: Persist results:
  - duties saved to `flights`,
  - layover rest periods saved to `layover_rest_periods`,
  - monthly totals saved to `monthly_calculations`.

### 7.4 Manual duty entry

- **FR-MANUAL-1**: Duty type selection controls required inputs.
- **FR-MANUAL-2**: Batch entry:
  - add multiple duties before saving,
  - save batch-only,
  - save batch + current.
- **FR-MANUAL-3**: Layover entry:
  - supports paired outbound/inbound representation (two `flights` records),
  - supports independent date/time handling as per current form.
- **FR-MANUAL-4**: Validation:
  - real-time validation ensures correct formats (dates, times, destination/sector rules).

### 7.5 Salary calculation rules (Flydubai configuration)

- **FR-CALC-1 — Fixed components**:
  - Basic salary, housing allowance, transport allowance based on position.
- **FR-CALC-2 — Variable components**:
  - Flight pay: \(dutyHours \times hourlyRate\) (turnaround, layover, business_promotion).
  - Per diem: \(restHours \times perDiemRate\) (layover rest only).
  - ASBY: fixed hours × hourly rate.
  - Recurrent: fixed 4 hours × hourly rate, except ELD (unpaid).
- **FR-CALC-3 — Date-aware rates**:
  - Salary rates can change over time (new Flydubai rates effective from July 2025 onward).
- **FR-CALC-4 — Time rules**:
  - Cross-day detection: debrief < report implies next day (and affects duration).
  - Layover rest period uses outbound debrief and inbound report plus days-between-flights.
- **FR-CALC-5 — Unpaid duties**:
  - off, rest, annual_leave, sby: flight pay = 0.
  - sby may display duty hours for informational purposes if present.

### 7.6 Data management & audit trail

- **FR-AUDIT-1**: On create/update/delete of a duty, write audit entry with:
  - action, old data, new data, optional reason.
- **FR-AUDIT-2**: “Edited” duties preserve original values in `original_data` to allow revert.
- **FR-AUDIT-3**: System recalculations may update computed fields without marking as user-edited, but still write an audit entry with reason “System recalculation.”

### 7.7 Dashboard UX (salary calculator as primary dashboard)

- **FR-DASH-1**: Month + year selection drives which duties and totals are shown.
- **FR-DASH-2**: Overview cards show key metrics (salary total, duty hours, flight pay, per diem, etc.).
- **FR-DASH-3**: Duties list:
  - show duty cards (with updated design via feature flag),
  - allow bulk selection and bulk actions,
  - allow showing/hiding off days (off/rest/annual_leave),
  - handle layover pairing (display outbound+inbound as a single conceptual unit where appropriate).

### 7.8 Statistics

- **FR-STATS-1**: YTD totals and progression chart.
- **FR-STATS-2**: Monthly comparison (current vs previous; best/worst month).
- **FR-STATS-3**: Duty type breakdown:
  - computed from flight duties when available,
  - duty breakdown is **variable-pay only** (fixed salary is not allocated),
  - per diem is allocated to layovers.
- **FR-STATS-4**: Top duty rankings:
  - top 5 highest paying turnarounds by flight pay,
  - top 5 highest paying layovers computed on paired layover duties.

### 7.9 Friends + roster comparison

- **FR-FRIENDS-1**: Send friend requests by email, prevent self-friending, prevent duplicates.
- **FR-FRIENDS-2**: Accept/reject requests (receiver only), unfriend (either party).
- **FR-FRIENDS-3**: Pending request count displayed in sidebar.
- **FR-COMPARE-1**: Compare roster endpoint:
  - requires bearer access token,
  - validates accepted friendship,
  - fetches both rosters using service role access (bypassing RLS),
  - returns duties sanitized to remove salary fields.
- **FR-COMPARE-2**: Calendar comparison UI:
  - month navigation restricted to supported years (>= 2025),
  - visual grouping/connection rules (work/off/rest/annual_leave categories).

---

## 8) Data model & permissions (Supabase)

### Tables (current / expected)

- **profiles**
  - key fields: `id`, `email`, `airline`, `position`, `nationality`, `first_name`, `last_name`, `avatar_url`
- **flights**
  - user-owned flight duties (new schema + legacy columns supported)
  - key fields: `user_id`, `date`, `flight_numbers[]`, `sectors[]`, `duty_type`, `report_time`, `debrief_time`, `duty_hours`, `flight_pay`, `data_source`, `original_data`, `month`, `year`
- **monthly_calculations**
  - key fields: `user_id`, `month`, `year`, fixed components, variable components, totals
- **layover_rest_periods**
  - key fields: `user_id`, `outbound_flight_id`, `inbound_flight_id`, `rest_start_time`, `rest_end_time`, `rest_hours`, `per_diem_pay`, `month`, `year`
- **flight_audit_trail**
  - key fields: `user_id`, `flight_id`, `action`, `old_data`, `new_data`, `change_reason`
- **friendships**
  - key fields: `requester_id`, `receiver_id`, `status`, `responded_at`
- **user_settings**
  - generic settings storage; currently minimal usage in UI.

### Row Level Security (RLS)

Expected posture:

- User-owned tables are RLS-protected so users can only access their own rows (e.g., flights, calculations, rest periods, audit trail).
- Friendships RLS allows users to read/update/delete friendships they are part of.

### Privacy model for roster comparison

Roster comparison is allowed only for accepted friends:

- Server verifies friendship using service role.
- Server fetches both users’ duties using service role.
- Server strips salary fields (e.g., `flightPay = 0`) before returning.

---

## 9) Non-functional requirements

### Performance & scalability

- Optimize for **small roster sizes**; avoid complex virtualization.
- Month switching should feel immediate; show “switching” UI only when needed.

### Reliability & correctness

- Calculations must be deterministic and re-runnable (recalculation engine).
- Time parsing must handle cross-day and malformed roster artifacts gracefully.

### Accessibility

- Interactive controls must have:
  - keyboard support,
  - ARIA labels where non-textual,
  - clear focus states.

### Security

- No salary data exposed across users.
- Supabase keys:
  - anon key used client-side,
  - service role key used only server-side (route handlers).
- Avoid leaking sensitive info in errors/toasts.

### Observability (recommended)

- Structured logs for upload workflow (validation/parsing/calculation/saving steps).
- Error reporting pipeline for client + server (Sentry or similar).

---

## 10) Analytics & instrumentation (recommended events)

### Key events

- **auth.sign_up** (airline, position, hasNationality)
- **auth.sign_in** (success/failure reason, retryCount)
- **dashboard.month_changed** (month, year)
- **roster.upload_started** (fileType, month, year, fileSizeKB)
- **roster.upload_completed** (success, dutiesCount, warningsCount, replacedExisting)
- **duty.manual_add** (dutyType, batchSize, success)
- **duty.edit_times** (dutyType, wasCrossDay, success)
- **duty.revert** (success)
- **duty.delete** (single/bulk/deleteAll, count, success)
- **stats.viewed** (year)
- **friends.request_sent / accepted / rejected / unfriended**
- **friends.roster_compare_viewed** (month, year)

---

## 11) Rollout, migrations, and operational considerations

### Rollout strategy

- Ship as Flydubai-first with explicit airline selection (currently only Flydubai option in UI).
- Expand airline support by adding:
  - parser/validator per airline,
  - rates config,
  - duty classification variants as needed.

### Data migrations

- Salary calculator schema migrations must:
  - maintain backward compatibility where needed (legacy columns),
  - keep RLS policies consistent.

### Operational prerequisites

- Supabase project configured with:
  - Auth enabled (email/password),
  - DB schema tables + RLS,
  - `avatars` storage bucket and policies (for profile pictures),
  - service role key configured in server environment for roster comparison route.

---

## 12) QA strategy & acceptance testing

### Critical test scenarios

- **Auth**
  - login, logout, redirect-after-login, session persistence across refresh.
- **Upload**
  - CSV upload success and errors; Excel upload success and errors; replacement flow.
  - month/year correctness (uploaded month shows duties and totals).
- **Manual entry**
  - each duty type’s required fields and pay rules.
  - layover pairing and per diem generation.
  - batch save flows.
- **Edit/Revert/Delete**
  - edit times impacts pay and rest periods; revert restores original; delete pair deletion for layovers.
  - bulk delete and delete-all recalculations.
  - audit trail entries created.
- **Statistics**
  - empty state; populated stats; year selector; duty-type stats align with duties.
- **Friends**
  - send request, accept/reject, unfriend; compare roster access control; salary privacy.

---

## 13) Risks, issues, and mitigations

### Key risks

- **R1 — Month/year data mismatch after upload**
  - Risk: user uploads for month M but dashboard refreshes current month.
  - Mitigation: ensure refresh targets uploaded month/year or navigates user to that selection.
- **R2 — Rate changes over time**
  - Risk: misapplying legacy vs new rates.
  - Mitigation: enforce date-aware rate selection in all calculation pathways (upload, manual entry, recalculation).
- **R3 — Privacy leakage in friends compare**
  - Risk: salary info accidentally returned.
  - Mitigation: server-side sanitization and test coverage for “no pay fields returned.”
- **R4 — Storage bucket misconfiguration**
  - Risk: avatar upload fails silently.
  - Mitigation: explicit bucket/policy checks and user-facing admin guidance.

---

## 14) Open questions (to finalize PRD scope)

### Product

- Should Skywage persist original roster files (CSV/Excel) for later reprocessing, or is storing parsed duties enough?
- Is email verification required before login (currently supported via Supabase; UX messaging exists)?
- Do we want manual entry for **rest** / **annual leave**, or only parse them from uploaded rosters?

### Friends & privacy

- Should roster comparison show only “work/off” categories or full duty details (flight numbers/sectors)?
- Do we need additional privacy controls (e.g., “hide flight numbers”)?

### Multi-airline roadmap

- Which airline is next, and what roster formats must be supported?
- Do different airlines require different per diem rules and rate schedules?

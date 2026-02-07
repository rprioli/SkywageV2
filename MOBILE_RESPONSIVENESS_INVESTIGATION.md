# Mobile Responsiveness Investigation (Skywage V2)

**Date**: 2026-02-07  
**Revision**: 2 (incorporates critique / second-pass findings)  
**Scope**: Mobile responsiveness best practices (Next.js App Router + Tailwind v4 + shadcn/ui + Radix) vs current implementation, with prioritized recommendations.  
**Constraint**: No code changes in this investigation.

---

## 1) Tech stack context

- **Framework**: Next.js App Router (Next `^16.0.8`, React `19`)
- **UI**: Tailwind CSS `^4` (CSS-first config), shadcn/ui (New York style), Radix primitives, lucide icons
- **Styling strategy**: heavy utility usage + ~640-line custom responsive utility layer in `src/app/globals.css`
- **Deployment**: Netlify (via `@netlify/plugin-nextjs`)

---

## 2) Methodology

### 2.1 Code review

Reviewed mobile-related layout + responsive utilities across the highest-risk pages/components:

- **App shell**: `src/app/(dashboard)/layout.tsx`, `src/components/dashboard/DashboardSidebar.tsx`, `src/contexts/MobileNavigationProvider.tsx`
- **Dashboard pages**: `dashboard/page.tsx`, `statistics/page.tsx`, `settings/page.tsx`, `friends/page.tsx`
- **Data-dense mobile**: `MultiRosterComparison.tsx`, `CompactDutyTile.tsx`, `FriendListSidebar.tsx`
- **Auth pages**: `src/app/page.tsx`, `src/app/register/page.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`
- **Salary cards**: `FlightDutiesTable.tsx`, `FlightDutyCard.tsx`, `TurnaroundCard.tsx`, `LayoverConnectedCard.tsx`
- **Global CSS**: `src/app/globals.css`

### 2.2 Runtime spot-check (local, browser resize)

Started the dev server and inspected at phone-sized viewports (**390x844**, **360x800**).

Key observations:
- At phone widths, the **dashboard sidebar rendered in "desktop" mode** before hydration corrected it (a flash-of-desktop-UI / FOUC). Details in Finding B.
- Login page renders cleanly at mobile widths.
- Settings page renders well (scrollable tabs with fade indicators).

### 2.3 Limitations of this investigation

- Runtime spot-check used **browser resize only**, not real device testing or Chrome DevTools device emulation with safe-area simulation.
- No **landscape orientation** testing was performed.
- No **throttled network / CPU** profiling was done to assess mobile performance.
- Accessibility of overlays/toasts on mobile was **not validated** with a screen reader.

---

## 3) Best-practice baseline (Context7 sources)

These are "state-of-the-art" patterns that fit the current stack without introducing new technologies.

### 3.1 Tailwind v4: mobile-first, dynamic viewport units, container queries

- **Mobile-first**: Unprefixed utilities are the mobile baseline; add breakpoint variants only when scaling up (e.g. `text-center sm:text-left`).  
  Source: [Tailwind Responsive Design docs](https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/responsive-design.mdx)

- **Dynamic viewport units (built-in)**: Tailwind v4 ships **`h-dvh`** (`100dvh`), **`h-svh`** (`100svh`), and **`h-lvh`** (`100lvh`) as first-class utility classes. It also supports `calc()` with `dvh` in arbitrary values, e.g. `max-h-[calc(100dvh-(--spacing(6)))]`. This means replacing `h-screen` is a **class-name swap**, not an architectural change.  
  Source: [Tailwind CSS height docs](https://tailwindcss.com/docs/height) — "Matching viewport" section

- **Container queries (Tailwind v4)**: Use `@container` and `@sm:` / `@lg:` variants to make components responsive to *their container width*, not just viewport width. Especially valuable in dashboards with sidebars and variable content widths.  
  Source: [Tailwind v4 blog](https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/blog/tailwindcss-v4/index.mdx)

### 3.2 shadcn/ui: Dialog (desktop) / Drawer (mobile) overlay pattern

- For overlays that feel like a modal on desktop but should feel like a bottom sheet on mobile, shadcn explicitly recommends switching **Dialog on desktop** and **Drawer on mobile** using a `useMediaQuery` hook.  
  Source: [shadcn Drawer docs](https://ui.shadcn.com/docs/components/radix/drawer)

### 3.3 Next.js: viewport, responsive images, hydration safety

- Next.js provides defaults for viewport meta; configurable via `export const viewport` when needed.  
  Source: [Next.js viewport API](https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/03-api-reference/04-functions/generate-viewport.mdx)

- For responsive images, `next/image` with `sizes` prop prevents unnecessarily large image downloads on mobile.  
  Source: [Next.js Image docs](https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/03-api-reference/02-components/image.mdx)

- **Hydration mismatch avoidance**: When client state depends on browser APIs (like `window.innerWidth`), Next.js recommends rendering a **stable fallback on the server** and updating after mount. Initial state should be `null`/`undefined` (not a concrete default like `isDesktop: true`) to avoid layout flash.  
  Source: [Next.js usePathname hydration pattern](https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/03-api-reference/04-functions/use-pathname.mdx) — "Avoid hydration mismatch" section

### 3.4 Radix: accessible overlay behavior (focus management)

- Ensure overlays manage focus predictably on open (Radix examples use `onOpenAutoFocus` and refs).  
  Source: [Radix primitives docs](https://www.radix-ui.com/docs/primitives)

---

## 4) Current mobile-responsive system (what exists today)

### 4.1 Global responsive utilities (strong foundation)

`src/app/globals.css` (~640 lines) defines a coherent responsive system:

- **Fluid typography**: `text-responsive-*` uses `clamp()` for scalable text (12px–56px range).
- **Fluid spacing**: `space-responsive-*`, `responsive-container`, `card-responsive-padding`.
- **Mobile UX utilities**: `touch-target` (min 44x44px), `scrollbar-hide`, `input-mobile-optimized` (16px font to prevent iOS zoom), sidebar slide animations.
- **Modal system**: `.modal-fullscreen-mobile` with desktop restoration at `sm:` breakpoint.
- **Form helpers**: `form-input-touch`, `form-button-touch`, `form-label-responsive`.

This is a modern approach and generally aligns with state-of-the-art responsive design.

### 4.2 Page patterns (positives)

- **Dashboard metric cards**: Responsive `grid-cols-3 sm:grid-cols-2 xl:grid-cols-1` with separate compact/full layouts for mobile/desktop. Well done.
- **Salary calculator cards grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — a clean responsive pattern.
- **Settings tabs**: Horizontal scroll with fade indicators — a mobile-friendly, modern pattern.
- **Roster comparison grid**: Horizontal scrolling + sticky headers + sticky first column — the correct approach for wide calendar data on mobile.
- **Consistent header pattern**: All dashboard pages share a header block with a conditional hamburger menu and `aria-label`/`aria-expanded` attributes.

---

## 5) Findings (gaps and likely issues)

### Finding A — High risk: `100vh` / `h-screen` usage (mobile browser UI)

**Evidence:**
- `src/app/(dashboard)/layout.tsx`: `h-screen` on root flex container
- `src/components/dashboard/DashboardSidebar.tsx`: `h-screen` on sidebar (3 occurrences)
- `src/app/(dashboard)/friends/page.tsx`: `h-[calc(100vh-16rem)]` + `min-h-[600px]`
- `src/app/globals.css`: multiple `100vh`/`calc(100vh - …)` in modal rules

**Why it matters:**  
On mobile browsers (especially iOS Safari), `100vh` includes the area behind the browser chrome (URL bar, bottom nav). This commonly produces clipped content, un-scrollable areas, and "jump" behavior when the browser UI shows/hides.

**How easy is the fix:**  
**Easy.** Tailwind v4 ships `h-dvh`, `h-svh`, `h-lvh` as built-in utilities. In most cases this is a direct class-name swap. For `calc()` expressions, use arbitrary values: `h-[calc(100dvh-16rem)]`.

**Impact:** User-visible scrolling/cropping bugs on real phones. High severity for the Friends comparison page and the dashboard shell.

---

### Finding B — High risk: hydration flash of desktop UI on mobile (FOUC)

**Evidence:**
- `MobileNavigationProvider` initializes: `isMobile = false`, `isTablet = false`, **`isDesktop = true`**
- These values are only corrected *after* a `useEffect` runs `window.innerWidth`
- Sidebar visibility and the main content `ml-[280px]` margin depend on `isDesktop`

**Precise diagnosis:**  
This is a **hydration FOUC** (Flash of Unstyled Content), not necessarily a persistent bug. The server/initial render assumes desktop; the client corrects to mobile after the first effect fires. During that brief window, mobile users see the desktop sidebar + constrained content. On slow devices or connections, this flash can be noticeable (hundreds of milliseconds).

**Root cause:** The initial state defaults to a concrete value (`isDesktop: true`) instead of a neutral/indeterminate state.

**Best-practice fix direction (per Next.js docs):**
1. Use `window.matchMedia('(min-width: 1024px)')` instead of raw `window.innerWidth` (guarantees CSS breakpoint alignment).
2. Default the initial state to **`null`/`undefined`** and render a neutral layout (or loading skeleton) until the client resolves — this avoids hydration mismatch.
3. Alternatively, let **CSS media queries own the layout** (sidebar hidden by default, shown at `lg:` breakpoint) and only use JS for interactive open/close.

**Impact:** Severe perceived quality regression on mobile. Medium risk of becoming a persistent layout bug if effects don't fire as expected.

---

### Finding C — Padding compounding on mobile reduces usable width

**Evidence:**
- Layout wrapper applies `px-3 py-3` when `isMobile` (in `layout.tsx`)
- Four page headers independently add `px-6 pt-6` (dashboard, statistics, friends, settings)
- On a 390px screen: `12px (layout) + 24px (page) = 36px` padding per side, consuming ~18% of screen width

**Impact:** Medium-to-high. Causes more truncation, text wrapping, and cramped cards on small screens.

---

### Finding D — Safe-area handling is incomplete

**Evidence:**
- `MobileHeader` uses a `safe-area-inset-top` CSS class, but this class is **never defined** in `globals.css` or anywhere else in the codebase.

**How to fix:**  
Tailwind v4's arbitrary value syntax supports safe areas: `pt-[env(safe-area-inset-top)]`. Alternatively, add a one-line utility in `globals.css`. For the root `<html>`, also set `viewport-fit=cover` in the viewport meta export.

**Impact:** Medium. On notched/Dynamic Island devices, headers and close buttons can overlap with unsafe areas. Becomes high if the app is used as a PWA (full-screen, no browser chrome).

---

### Finding E — Overlays/modal responsiveness is CSS override heavy

**Evidence:**
- `globals.css` contains a ~120-line `.modal-fullscreen-mobile` section with **25+ `!important` declarations** to force full-screen dialog behavior on mobile.
- It overrides display, dimensions, positioning, padding, and child element styles.

**Why it matters:**
- Brittle: any shadcn/Radix dialog update can break the overrides.
- Fights the component model instead of working with it.
- Doesn't handle scroll-locking, safe-areas, or keyboard behavior as well as Drawer primitives do natively.

**Best-practice alternative:** The shadcn Dialog ↔ Drawer responsive pattern uses a `useMediaQuery` hook to render different components, avoiding CSS overrides entirely.

**Impact:** Medium. Maintainability debt + edge-case bugs on mobile keyboards/scrolling.

---

### Finding F — NEW: Avatar images use raw `<img>` instead of `next/image`

**Evidence:**
- `DashboardSidebar.tsx`: `<img src={profile?.avatar_url || ...} />`
- `FriendListSidebar.tsx`: `<img src={friend.avatarUrl} />`
- `MultiRosterComparison.tsx`: `<img src={...} />`

**Why it matters:**  
Raw `<img>` tags have no lazy loading, no `srcset` generation, no format optimization (WebP/AVIF), and no automatic sizing for mobile. On slow mobile connections, avatar images load at full resolution unnecessarily.

**Impact:** Medium. Affects mobile performance (LCP, bandwidth) and can cause layout shift if dimensions aren't reserved.

---

### Finding G — NEW: Inline `style={{}}` attributes bypass Tailwind's responsive system

**Evidence:**
- `layout.tsx`: `style={{ backgroundColor: 'rgba(76, 73, 237, 0.05)' }}`
- `FriendListSidebar.tsx` buttons: `style={{ backgroundColor: '#4C49ED' }}`
- `DashboardPage.tsx` metric cards: multiple `style={{ backgroundColor: '...' }}` and `style={{ color: '...' }}`

**Why it matters:**  
Inline styles cannot be overridden by Tailwind breakpoint variants. If a color or spacing needs to change at a mobile breakpoint, inline styles make that impossible without JS-driven conditional rendering.

**Impact:** Low-to-medium. Reduces flexibility for future responsive refinements.

---

### Finding H — NEW: No landscape orientation consideration

**Evidence:**
- `Friends` page: `min-h-[600px]` — a landscape phone viewport may only be ~400px tall.
- `DashboardSidebar`: `h-screen` (or future `h-dvh`) on the sidebar — in landscape a sidebar consuming 100% height on a ~400px-tall screen leaves minimal vertical space.
- No `orientation:` media query usage or landscape-specific adjustments found anywhere.

**Why it matters:**  
Airline crew frequently use devices in landscape orientation, including tablets. Fixed height constraints become problematic when viewport height is short.

**Impact:** Medium. Produces scroll traps and clipped content in landscape. Particularly relevant given the app's target audience.

---

### Finding I — NEW: `globals.css` size and overlap with Tailwind v4 built-ins

**Evidence:**
- `globals.css` is ~640 lines, containing custom utilities that may now overlap with Tailwind v4 built-in features:
  - `h-screen` → `h-dvh` / `h-svh` (now built-in)
  - Container queries (now built-in `@container` / `@sm:`)
  - Safe-area insets (achievable via arbitrary values)
  - Some custom clamp-based spacing that could be configured via `@theme`

**Impact:** Low-to-medium (maintenance debt). As Tailwind v4 adoption deepens, custom utilities that duplicate built-in features become confusing and hard to maintain.

---

## 6) Page-by-page mobile assessment

### Auth (Login / Register)
- **Good**: Simple vertical flow; `max-w-md mx-auto`; responsive padding (`p-4 md:p-8`).
- **Watch**: Raw `<input>` elements don't consistently use `form-input-touch` or `input-mobile-optimized` utilities. Can reintroduce iOS zoom-on-focus.
- **Watch**: Register form has 8+ fields — long forms on mobile need keyboard-aware scrolling consideration (no issues found, but worth testing on real devices).

### Dashboard shell + Sidebar
- **Most critical**: FOUC from hydration mismatch (Finding B) is the #1 mobile risk.
- **Good**: Hamburger menu has proper accessibility attributes.
- `h-screen` on the shell and sidebar (Finding A).

### Dashboard page (main)
- **Good**: Metric cards have explicit mobile layout (`grid-cols-3` compact cards with `md:` full layout). Well-considered dual-format approach.
- **Watch**: Inline `style={{}}` on metric cards limits responsive flexibility (Finding G).

### Statistics
- **Good**: Standard header; `responsive-container` for content.
- **Not assessed**: Recharts chart responsiveness and touch interactivity were not validated.

### Settings
- **Good**: Tabs are horizontally scrollable with fade indicators. Clean mobile pattern.
- **Watch**: Padding compounding (Finding C).

### Friends
- **Good**: Roster grid uses sticky headers + horizontal scroll.
- **High risk**: `h-[calc(100vh-16rem)]` + `min-h-[600px]` — problematic on short viewports (landscape) and mobile browser UI changes (Findings A, H).
- **Watch**: On mobile, the two-column layout (`grid-cols-1 lg:grid-cols-12`) correctly stacks, but the sidebar card + comparison card each take significant vertical space, potentially requiring excessive scrolling.

---

## 7) Recommendations (prioritized)

### Quick wins (can be done in minutes)

| # | What | How | Files |
|---|------|-----|-------|
| QW-1 | Replace `h-screen` with `h-dvh` | Class-name swap | `layout.tsx`, `DashboardSidebar.tsx` |
| QW-2 | Replace `100vh` in calc expressions with `100dvh` | Text replacement in CSS/JSX | `friends/page.tsx`, `globals.css` |
| QW-3 | Define `safe-area-inset-top` utility | Add `padding-top: env(safe-area-inset-top)` to `globals.css` | `globals.css` |
| QW-4 | Replace inline `style={{}}` brand colors with Tailwind classes | Use existing `bg-primary`, `text-brand-ink`, or `bg-[rgba(76,73,237,0.05)]` | Multiple dashboard files |

### P0 — Do first (high-impact structural fixes)

**1) Fix hydration FOUC for mobile navigation state**
- **Importance**: Prevents the most jarring mobile UX bug (flash of desktop sidebar on phones).
- **Approach**: Change `MobileNavigationProvider` initial state to `null`; render a minimal/neutral shell until the effect resolves. Consider using `window.matchMedia` instead of `window.innerWidth` for CSS-alignment. Or: let CSS media queries own sidebar visibility entirely, removing the JS-driven layout logic.
- **Effort**: Small-medium (provider refactor + layout adjustment)
- **Files**: `MobileNavigationProvider.tsx`, `layout.tsx`, `DashboardSidebar.tsx`

**2) Deduplicate mobile padding (single source of truth)**
- **Importance**: Immediately improves readability and eliminates overflow edge-cases across all dashboard pages.
- **Approach**: Remove `px-6 pt-6` from individual page headers; let the layout wrapper own all page padding (it already applies `px-3 py-3` on mobile).
- **Effort**: Small (remove padding from 4 page headers)
- **Files**: `dashboard/page.tsx`, `statistics/page.tsx`, `friends/page.tsx`, `settings/page.tsx`

**3) Remove `min-h-[600px]` from Friends comparison grid**
- **Importance**: Prevents scroll traps on short viewports (landscape phones, tablets).
- **Approach**: Replace with a flex-based layout that uses available space without enforcing a minimum.
- **Effort**: Small
- **Files**: `friends/page.tsx`

### P1 — Next (medium-impact improvements)

**4) Replace CSS-heavy modal overrides with shadcn Dialog ↔ Drawer pattern**
- **Importance**: More robust mobile UX (keyboard, scroll lock, safe areas), far less `!important` in CSS.
- **Approach**: Install `@shadcn/drawer` component; create a `ResponsiveModal` wrapper using `useMediaQuery` hook; migrate existing modal usages.
- **Effort**: Medium (create wrapper + update call sites)
- **Reference**: [shadcn Drawer docs](https://ui.shadcn.com/docs/components/radix/drawer)

**5) Replace raw `<img>` with `next/image` for avatars**
- **Importance**: Improves mobile performance (lazy loading, srcset, format optimization).
- **Approach**: Swap `<img>` for `<Image>` with appropriate `width`/`height` and `sizes` props.
- **Effort**: Small-medium (update 3-4 components)
- **Files**: `DashboardSidebar.tsx`, `FriendListSidebar.tsx`, `MultiRosterComparison.tsx`

**6) Add landscape orientation handling for height-constrained pages**
- **Importance**: Airline crew commonly use landscape; fixed heights break on short viewports.
- **Approach**: Use `@media (orientation: landscape)` or Tailwind's `landscape:` variant to reduce/remove fixed heights; test Friends grid at ~400px viewport height.
- **Effort**: Small
- **Files**: `friends/page.tsx`, `DashboardSidebar.tsx`

### P2 — Polish / scalable improvements

**7) Adopt Tailwind v4 container queries for dashboard components**
- **Importance**: Makes components resilient to sidebar open/close, split panes, and future layout changes.
- **Approach**: Wrap dashboard content area in `@container`; use `@sm:` / `@lg:` variants instead of viewport breakpoints where component behavior depends on available width.
- **Effort**: Medium (incremental, can be adopted component-by-component)

**8) Normalize all forms to mobile-friendly input patterns**
- **Importance**: Prevent iOS zoom, ensure consistent 44px tap targets, improve perceived quality.
- **Approach**: Apply `input-mobile-optimized` and `form-input-touch` classes to Login/Register `<input>` elements (they already exist in `globals.css` but aren't used everywhere).
- **Effort**: Small

**9) Audit `globals.css` for overlap with Tailwind v4 built-ins**
- **Importance**: Reduces maintenance confusion as Tailwind v4 adoption deepens.
- **Approach**: Review each custom utility block; remove or replace with built-in Tailwind v4 equivalents where available.
- **Effort**: Medium (needs testing per utility)

**10) Validate accessibility of overlays/toasts on mobile with screen reader**
- **Importance**: Ensures the app is usable by all users on mobile, not just sighted users.
- **Approach**: Test with VoiceOver (iOS) or TalkBack (Android); verify focus traps, toast announcements, and hamburger menu state.
- **Effort**: Small (manual testing session)

---

## 8) Key files inventory (responsive behavior)

| Category | Files |
|----------|-------|
| **Global styles** | `src/app/globals.css` |
| **Dashboard shell** | `src/app/(dashboard)/layout.tsx` |
| **Sidebar** | `src/components/dashboard/DashboardSidebar.tsx` |
| **Breakpoint state** | `src/contexts/MobileNavigationProvider.tsx` |
| **Friends** | `src/app/(dashboard)/friends/page.tsx`, `MultiRosterComparison.tsx` |
| **Settings** | `src/app/(dashboard)/settings/page.tsx` |
| **Auth** | `LoginForm.tsx`, `RegisterForm.tsx` |
| **Modal system** | `src/components/ui/dialog.tsx`, `globals.css` (.modal-fullscreen-mobile) |
| **Avatar images** | `DashboardSidebar.tsx`, `FriendListSidebar.tsx`, `MultiRosterComparison.tsx` |

---

## 9) Suggested implementation order

```
Phase 1 (Quick wins + P0) — ~1-2 sessions
├── QW-1: h-screen → h-dvh (class swap)
├── QW-2: 100vh → 100dvh in calc expressions
├── QW-3: Define safe-area utility
├── QW-4: Inline styles → Tailwind classes
├── P0-1: Fix hydration FOUC in MobileNavigationProvider
├── P0-2: Deduplicate page padding
└── P0-3: Remove min-h-[600px] from Friends

Phase 2 (P1) — ~2-3 sessions
├── P1-4: Dialog ↔ Drawer responsive pattern
├── P1-5: <img> → next/image for avatars
└── P1-6: Landscape orientation handling

Phase 3 (P2) — incremental
├── P2-7: Container queries adoption
├── P2-8: Form input normalization
├── P2-9: globals.css audit
└── P2-10: Accessibility validation
```

---

## 10) Summary

**Top 3 actions** (most impact per effort):
1. **Swap `h-screen`/`100vh` to `h-dvh`/`100dvh`** — literal class-name replacements that fix the most common real-device mobile bug.
2. **Fix the hydration FOUC** in `MobileNavigationProvider` — eliminates the flash of desktop sidebar on mobile.
3. **Deduplicate padding** — small change across 4 files that immediately improves every dashboard page on mobile.

**Keep**: The existing `clamp()`-based fluid typography/spacing system, touch-target utilities, and horizontal-scroll tab/grid patterns.

**Remove/replace**: JS-driven layout breakpoints (let CSS own it), `!important`-heavy modal overrides (use Drawer), inline `style={{}}` (use Tailwind classes), raw `<img>` tags (use `next/image`).

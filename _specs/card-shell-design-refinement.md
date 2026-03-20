# Spec for Card Shell Design Refinement

branch: claude/feature/card-shell-design-refinement

## Summary

- Refine the v2 duty card shell (`CardShell.tsx` and `PrimaryPanel.tsx`) to produce a subtler, cleaner visual appearance based on a reference design
- The changes are **shell-only** — all typography, spacing, and content inside the cards must remain untouched
- Build a test page at `src/app/test/page.tsx` that renders the current v2 card components with hardcoded sample data so changes can be visually verified in isolation

## Context — Current vs Reference Design Analysis

A reference design (`premium_flight_dashboard_redesign.jsx`) was compared against the current implementation. Both share the same two-layer architecture (outer shell + inner panel), but the reference is dialed back:

### Outer Shell (`CardShell.tsx`)

| Property | Current | Reference (target direction) |
|---|---|---|
| Background | `bg-white/64` (64% white) | `bg-[rgba(255,255,255,0.42)]` (42% white) |
| Backdrop blur | `backdrop-blur-[30px]` | `backdrop-blur-2xl` (~40px) |
| Border | `border-white/60` | `border-white/70` |
| Border radius | `rounded-[36px]` | `rounded-[34px]` |
| Shadow | `0_24px_80px` at 0.14 opacity + inset highlight | `0_24px_60px` at 0.08 opacity only (no inset) |
| Gradient overlay | Yes (white linear gradient) | **None** |
| Decorative blobs | 2 blurred blobs (purple + white) | **None** |
| Padding | Delegated to PrimaryPanel (`px-4 pt-4 pb-4`) | `p-3` |

### Inner Panel (`PrimaryPanel.tsx`)

| Property | Current | Reference (target direction) |
|---|---|---|
| Background | `bg-white/60` (60% white) | `bg-white/85` (85% white) — reads more solid |
| Border | `border-white/68` | `border-white/80` |
| Border radius | `rounded-[30px]` | `rounded-[28px]` |
| Shadow | Inset highlight + `0_12px_30px` drop shadow | Inset highlight only (no drop shadow) |

### Pay Badge

| Property | Current | Reference (target direction) |
|---|---|---|
| Background | `bg-[#4C49ED]` | `bg-indigo-600` |
| Padding | `py-2.5` | `py-3` |
| Shadow | `0_12px_24px` at 0.24 opacity | `0_14px_28px` at 0.26 opacity |
| Ring | `ring-1 ring-white/22` | **None** |

### Chip/Tag styling

| Property | Current | Reference (target direction) |
|---|---|---|
| Border | (varies) | `border-[#ececfa]` |
| Background | (varies) | `bg-[#f6f6fd]` |
| Text | (varies) | `text-xs text-slate-500` |
| Spacing | `mt-5 gap-1.5` | `mt-8 gap-2` |

## Functional Requirements

- Modify `CardShell.tsx` to adopt the reference shell styling: more transparent outer background, lighter shadow, no decorative blobs, no gradient overlay
- Modify `PrimaryPanel.tsx` inner panel to adopt the reference styling: more opaque background, no outward drop shadow, slightly tighter radius
- Update `PayBadge` in `PrimaryPanel.tsx`: remove the white ring, slightly adjust padding and shadow to match reference
- **Do NOT change any typography** — title size (`text-[52px]`), subtitle size, date size, font weights, letter spacing, line height, and all text colors must remain exactly as they are
- **Do NOT change content spacing** — gaps between date/title/subtitle, tag row `mt-5`, tag `gap-1.5` must remain as-is
- **Do NOT change tag/chip spacing** — keep existing `mt-5` and `gap-1.5` (the reference uses `mt-8 gap-2` but user wants no content/typography changes)
- Create a test page at `src/app/test/page.tsx` that renders sample cards (turnaround, layover, simple duty) with hardcoded data to preview changes without needing real data
- All existing card functionality must be preserved: bulk selection mode, expand/collapse, sector navigation, card actions

## Possible Edge Cases

- Bulk selection ring styling (`ring-2 ring-[#4C49ED]`) — must still be visible against the updated shell background
- Cards with expanded `FlightsPanel` — the panel sits below PrimaryPanel inside CardShell; verify the lighter shell still provides adequate visual containment
- Very long IATA codes or city names — verify layout doesn't break with refined padding
- Mobile viewports — the refined shadows and borders should still read well at smaller sizes
- Dark mode (if applicable) — confirm the transparency/opacity changes don't cause readability issues

## Acceptance Criteria

- [ ] `CardShell.tsx` no longer renders decorative gradient overlay or blur blobs
- [ ] `CardShell.tsx` outer shell uses lighter shadow (reduced opacity/spread)
- [ ] `CardShell.tsx` outer shell is more transparent (lower white opacity)
- [ ] `PrimaryPanel.tsx` inner panel is more opaque (`bg-white/85` range)
- [ ] `PrimaryPanel.tsx` inner panel has no outward drop shadow (inset only)
- [ ] `PayBadge` has no ring, slightly adjusted padding/shadow
- [ ] All typography (sizes, weights, spacing, colors) is completely unchanged
- [ ] All content spacing (gaps, margins) is completely unchanged
- [ ] Test page at `/test` renders sample turnaround, layover, and simple duty cards
- [ ] Bulk selection mode still works visually (ring visible on refined shell)
- [ ] Expand/collapse and sector navigation still function correctly
- [ ] No visual regressions on mobile viewports

## Open Questions

- Should the `IconBadge` component receive the same ring removal treatment as `PayBadge`?
- The reference uses `p-3` on the outer shell vs current `px-4 pt-4 pb-4` on PrimaryPanel — should outer padding shift to CardShell or stay on PrimaryPanel?

## Testing Guidelines

This is a visual/styling change. No unit tests are applicable. Verification is done via:

- The test page at `/test` with sample card variants
- Manual visual comparison against the reference design screenshot

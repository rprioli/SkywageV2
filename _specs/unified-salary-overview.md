# Spec for Unified Salary Overview

branch: claude/feature/card-shell-design-refinement

## Summary

- Merge the separate Overview card (`MonthSelector`) and three KPI side cards (`DashboardMetricCards`) into a single unified salary overview component
- The KPI stats (Flight Hours, Flight Pay, Per Diem) become inline items within the overview card, separated by vertical dividers, instead of separate card components
- The chart sits inside a recessed container within the same card
- The entire component is wrapped in `CardShell` + inner panel styling to match the refined flight duty cards
- Reference design: `salary_overview_redesign (2).jsx` — already prototyped on the test page at `/test`

## Context — Current vs Unified Design

### Current (two separate components)

```
┌─────────────────────────┐  ┌──────────┐
│  MonthSelector          │  │ KPI Card │
│  - Overview title       │  │ Hours    │
│  - Salary amount        │  ├──────────┤
│  - Subtitle             │  │ KPI Card │
│  - Recharts BarChart    │  │ Pay      │
│                         │  ├──────────┤
│                         │  │ KPI Card │
│                         │  │ Per Diem │
└─────────────────────────┘  └──────────┘
```

- `MonthSelector.tsx` — Interactive chart with month/year selection
- `DashboardMetricCards.tsx` — 3 separate cards in a responsive grid
- Dashboard page wires them in a `xl:grid-cols-[1fr_auto]` layout

### Unified (single component)

```
┌──────────────────────────────────────────┐
│  CardShell                               │
│  ┌────────────────────────────────────┐  │
│  │  Inner Panel                       │  │
│  │  Overview          [Year: 2026]    │  │
│  │  AED 15,015.47                     │  │
│  │  Expected salary for Mar, 2026     │  │
│  │                                    │  │
│  │  🕐 Hours | 💵 Pay | 🍴 Per Diem  │  │
│  │  ──────────────────────────────    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │  Recessed chart container    │  │  │
│  │  │  [Recharts BarChart]         │  │  │
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Functional Requirements

- Modify `MonthSelector.tsx` to accept additional props for KPI data: `dutyHours`, `flightPay`, `perDiemPay`, and the currency formatters (`formatCurrency`, `formatCurrencyCompact`)
- Render the KPI stats as an inline row below the salary subtitle, with icon + label + value for each, separated by vertical divider lines on desktop
- Wrap the entire component in `CardShell` with an inner panel (`rounded-[28px] border border-white/80 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]`)
- Place the Recharts `BarChart` inside a recessed container (`rounded-[30px] bg-[#FCFBFF]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.68)]`)
- Add a horizontal border (`border-b border-[#ECE9FA]`) between the salary/stats section and the chart section
- Restyle the year selector as a pill element (`rounded-[18px] border border-[#ECE8F8] bg-white/72`)
- Update `dashboard/page.tsx` to pass KPI data to `MonthSelector` and remove `DashboardMetricCards` from the overview layout grid
- Change the dashboard overview grid from `xl:grid-cols-[1fr_auto]` to full-width single column
- All existing interactive behavior must be preserved: month click selection, year change, hover states, chart tooltips, loading states, responsive layout
- The KPI stats row should collapse gracefully on mobile (stack vertically or wrap)
- `DashboardMetricCards.tsx` should remain in the codebase but be removed from the dashboard page import/render (in case it's used elsewhere or needed for rollback)

## Possible Edge Cases

- **Loading state**: KPI values show "..." when loading — must still work inline
- **Zero values**: When no data exists for a month, KPI stats should show 0 / AED 0.00
- **Long currency values**: Large amounts (e.g., AED 99,999.99) must not break the inline layout — use truncation or compact formatting on mobile
- **Responsive breakpoints**: The inline stats row uses vertical dividers on desktop but should stack on mobile; the chart height may need adjustment at different breakpoints
- **Year switching**: When the year changes, both the chart and the KPI stats should update (they already do via props, but verify the unified layout handles the transition)

## Acceptance Criteria

- [ ] Overview and KPI stats render in a single unified card
- [ ] Card is wrapped in `CardShell` + inner panel styling
- [ ] KPI stats display inline with icons and vertical dividers on desktop
- [ ] KPI stats stack/wrap on mobile
- [ ] Chart sits in a recessed container with inset shadow
- [ ] Year selector is styled as a pill
- [ ] All month selection, hover, and tooltip interactions work as before
- [ ] Loading states display correctly for both salary and KPI values
- [ ] `DashboardMetricCards` is removed from the dashboard page render
- [ ] No visual regressions on mobile viewports
- [ ] Build passes with no type errors

## Open Questions

- Should `DashboardMetricCards.tsx` be fully deleted or kept as unused for potential rollback?
- The reference design uses a `border-b` separator — should this use the same `border-[#ECE9FA]` color or align with the existing card border colors (`border-white/80`)?
- Should the recessed chart container use the exact reference styling or adapt to match the existing Recharts configuration more closely?

## Testing Guidelines

This is a visual/layout change with interactive behavior. No unit tests are applicable. Verification is done via:

- The test page at `/test` already has a static prototype of the unified design
- Manual verification on the actual dashboard with real data
- Responsive testing at mobile, tablet, and desktop breakpoints
- Verify month selection, year switching, and tooltip interactions

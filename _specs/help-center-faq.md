# Spec for Help Center FAQ Page

branch: claude/feature/help-center-faq

## Summary

- Add a Help Center page at `/help` within the dashboard layout, containing an FAQ organized by category
- The sidebar already links to `/help` ("Help Center" with `HelpCircle` icon under the Account section) — this page fulfills that link
- Static content, no data fetching — the simplest page in the app
- FAQ content covers both new users (what is Skywage, how to get started) and existing users (salary rules, troubleshooting)

## Functional Requirements

- **Route:** `src/app/(dashboard)/help/page.tsx` — client component (`'use client'`) inside the existing dashboard layout
- **Header:** Follows the exact same pattern as Settings/Statistics/Friends pages:
  - `text-responsive-3xl font-bold text-brand-ink` title: "Help Center"
  - `text-responsive-base text-primary font-bold` subtitle: "Frequently asked questions about Skywage"
  - Hamburger menu button on mobile/tablet via `useMobileNavigation()`
- **Content area:** Wrapped in `<div className="pb-6 space-y-4 md:space-y-6">`
- **FAQ component:** `src/components/help/HelpFAQ.tsx` — renders one Card per FAQ category
- **Card style:** `bg-white rounded-3xl !border-0 !shadow-none` — matching the Settings page card pattern
- **Card header:** Category title using `text-xl font-bold text-brand-ink` inside `CardHeader`
- **Accordion:** Uses the existing `src/components/ui/accordion.tsx` (Radix-based, already installed)
  - `type="multiple"` so users can open several questions at once
  - One `Accordion` per category card, inside `CardContent`
  - `AccordionTrigger`: question text, styled `font-medium text-brand-ink`
  - `AccordionContent`: answer text, styled `text-responsive-sm text-gray-600` with `space-y-3` for multi-paragraph answers
  - Answers may contain inline bold text, bullet lists (`<ul>` with `list-disc`), and one table (salary rates) using a minimal styled `<table>`
- **FAQ data:** Defined as a typed array within `HelpFAQ.tsx` — no separate data file

### FAQ Categories and Questions

**1. General**

- What is Skywage?
- Who is Skywage for?
- Is my data private?
- Is Skywage affiliated with Flydubai?

**2. Getting Started**

- How do I get started?
- Where do I set my position?
- What if I was promoted from CCM to SCCM during the year?

**3. Uploading Your Roster**

- What file formats can I upload?
- What's the maximum file size?
- Where do I get my roster file?
- What happens if I already have data for that month?
- My upload failed. What should I check?
- My roster uploaded but some flights look wrong. What happened?

**4. Adding Flights Manually**

- How do I add a flight manually?
- What format should flight numbers be in?
- What format should sectors be in?
- Can I add multiple flights at once?

**5. Salary Calculation**

- How is my monthly salary calculated?
- What are the current rates? (contains a table)
- What counts as duty hours?
- How is per diem calculated?
- How is ASBY paid?
- How are deadhead (DHD) flights handled?
- What about Recurrent training?
- Are standby days, rest days, and leave paid?
- Why doesn't my Skywage total exactly match my payslip?

**6. Friends & Roster Comparison**

- What is the Friends feature?
- How do I add a friend?
- How many friends can I compare at once?
- What does the comparison grid show?
- Can my friends see my salary figures?

**7. Statistics**

- What does the Statistics page show?
- Can I compare across years?
- Why is a month missing from my statistics?

**8. Settings & Account**

- How do I update my name or username?
- How do I change my password?
- How do I record a position change?
- Can I hide rest days and off-days from my dashboard?
- How do I delete my account?

**9. Troubleshooting**

- My salary looks lower than expected. What should I check?
- A flight is showing the wrong duty type. Can I fix it?
- I uploaded my roster but some flights are missing. Why?
- Can I undo a roster upload?
- Can I use Skywage if my airline isn't Flydubai?

## Possible Edge Cases

- Long answer content should not break card layout — answers use `prose`-like spacing but not the Tailwind prose plugin (too opinionated for this context)
- The rates table inside "What are the current rates?" must be readable on mobile — use `overflow-x-auto` wrapper and `min-w-0` on the table container
- Accordion open/close animations already handled by the existing accordion component (animate-accordion-up/down)
- If a user lands on `/help` directly (deep link), the dashboard layout and sidebar should render normally — no special handling needed

## Acceptance Criteria

- Clicking "Help Center" in the sidebar navigates to `/help` and the sidebar item shows active state
- Page header matches the visual pattern of Settings, Statistics, and Friends pages exactly
- All 9 FAQ categories render as separate cards with accordions
- Accordion items expand/collapse independently (multiple can be open)
- All answer content is readable on mobile, tablet, and desktop
- The rates table in "Salary Calculation" is horizontally scrollable on small screens
- Hamburger menu works on mobile/tablet for sidebar toggle
- Page has no loading state or spinner (static content)
- No new dependencies added — uses only existing UI components (Card, Accordion)
- `HelpFAQ.tsx` stays under 300 lines; if it exceeds, the FAQ data array should be extracted to a separate file

## Open Questions

- Should the FAQ content be available to unauthenticated users (e.g., on a public `/faq` route for the landing page)? For now, building it inside the dashboard layout (authenticated only). Can extract the component later for a public route. - No, it should not. We will build another section later for the landing page.

## Testing Guidelines

No test runner is configured in this project. No test files needed for static content pages.

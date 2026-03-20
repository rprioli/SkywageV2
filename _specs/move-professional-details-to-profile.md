# Spec for Move Professional Details to Profile Tab

branch: claude/feature/move-professional-details-to-profile

## Summary

- Remove the "Professional Details" tab from the Settings page tab bar
- Move all professional details content (Role, Compensation, Rate Info) into the Profile tab
- Place it between the existing "Personal details" and "Manage account" sections
- The Profile tab section order becomes: Personal details, Professional details (Role + Compensation), Manage account
- Reduce the tab count from 4 to 3: Profile, Preferences, Subscription

## Functional Requirements

- The Profile tab must render professional details content (Role section with PositionUpdate, Compensation section with read-only salary rates, and the rate information note) between "Personal details" and "Manage account"
- The "Professional Details" tab trigger and its TabsContent must be removed from the settings page
- The professional details content must retain all existing behavior: position update with event listener, rate calculation based on current date, currency formatting, airline support check, and loading state
- The ProfessionalDetailsTab component export should be removed from the settings barrel file since it is no longer used as a standalone tab
- The professional details logic (position state, rate computation, event listeners) must be integrated into or composed within ProfileTab

## Possible Edge Cases

- The combined ProfileTab file may approach ~250 lines — monitor that it stays within the 300-line guideline; if it exceeds, extract the professional details into a reusable section component (not a tab) that ProfileTab imports
- The loading spinner in ProfessionalDetailsTab currently replaces the entire tab content — when embedded in ProfileTab, it should only replace the professional details section, not the entire profile view
- Both ProfileTab and ProfessionalDetailsTab independently call useAuth and useProfile — after merging, deduplicate these hook calls

## Acceptance Criteria

- Settings page shows exactly 3 tabs: Profile, Preferences, Subscription
- Profile tab renders sections in this order: Personal details, Professional details (Role + Compensation), Manage account
- Position update (PositionUpdate component) works correctly within the Profile tab, including the position history timeline
- Compensation rates display correctly and update when position changes (via the userPositionUpdated event)
- Rate information note appears below the compensation section when applicable
- The loading state for professional details does not block the rest of the Profile tab from rendering
- Mobile horizontal tab scroll still works correctly with the reduced tab count
- No dead code: ProfessionalDetailsTab is either removed or repurposed as a non-tab section component

## Open Questions

- Should the professional details sections use the same section title style ("Role", "Compensation") or be grouped under a single "Professional details" heading to match the naming pattern of "Personal details" and "Manage account"?

## Testing Guidelines

No test runner is configured in this project. Manual verification should cover:

- Verify all 3 tabs render and switch correctly
- Verify position update works from within the Profile tab
- Verify compensation rates reflect the correct position
- Verify mobile tab scrolling with 3 tabs
- Verify the loading state is scoped to the professional section only

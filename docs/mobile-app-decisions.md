# Skywage Mobile App — Technical Decisions

## Tech Stack

| Decision | Choice |
|----------|--------|
| Framework | React Native + Expo |
| Platforms | iOS + Android (test primarily on iPhone) |
| Backend | Supabase (shared instance with web app) |
| Build/Deploy | EAS Build + Submit |
| UI Library | NativeWind (Tailwind CSS for React Native) |
| Navigation | Bottom tabs (React Navigation) |
| Offline Storage | expo-sqlite + sync queue |
| File Uploads | Excel only (no CSV) |
| Auth | Email/password + biometric (Face ID / fingerprint) |
| Charts | TBD (victory-native or react-native-svg-charts) |

## Feature Scope

Full feature parity with web app:

- Dashboard with month selector, KPI cards, salary breakdown
- Roster upload (Excel only) + manual flight entry
- Friends comparison
- Statistics (YTD earnings, monthly trends, duty breakdowns)
- Settings (position history, preferences)
- Offline support

## Code Strategy

- **Separate repository** from the web app
- Copy shared TypeScript logic (salary engine, database layer, types, auth helpers)
- Web app remains active for desktop users
- Both apps share the same Supabase instance and database

## Offline Strategy

| Concern | Approach |
|---------|----------|
| Local storage | expo-sqlite for flights, calculations, rest periods |
| Sync | Pull on launch + background refresh |
| Offline writes | Queue pattern — local entries with `synced: false` flag, push when online |
| Conflict resolution | Server wins (Supabase is source of truth) |
| Requires connection | Roster upload, friends comparison, initial login |

## Distribution

| Platform | Requirement |
|----------|------------|
| Google Play | $25 one-time developer account |
| Apple App Store | $99/year Apple Developer Program |
| OTA updates | EAS Update for JS-only changes (bypasses store review) |

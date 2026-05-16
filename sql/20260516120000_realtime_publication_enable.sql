-- Migration: Enable Supabase Realtime publication on six user-owned tables
-- Description: Backfills the source-of-truth schema with the SQL that was
--   applied mobile-first to the shared Supabase project during skywage-mobile
--   Phase 4 Slice 2 (2026-05-16). The publication membership is already live
--   in production; this file simply tracks it in version control here so a
--   fresh-clone web-app developer running `supabase db push` against a clean
--   local DB gets the same shape the remote project has.
-- Affected tables (added to publication supabase_realtime):
--   - public.flights
--   - public.layover_rest_periods
--   - public.monthly_calculations
--   - public.profiles
--   - public.user_position_history
--   - public.friendships
-- Date: 2026-05-16
-- Special notes: Mobile-app subscribers (skywage-mobile Phase 4 Slice 2) need
--   these tables in the publication for postgres_changes events to fire. Web
--   app benefits transparently — if/when it adds its own realtime listeners,
--   the same publication membership is what makes them work. Additive-only;
--   no data touched. Companion migration:
--   20260516120001_realtime_replica_identity_full.sql (required so filtered
--   DELETE events deliver correctly — see that file for the why).

ALTER PUBLICATION supabase_realtime ADD TABLE
  public.flights,
  public.layover_rest_periods,
  public.monthly_calculations,
  public.profiles,
  public.user_position_history,
  public.friendships;

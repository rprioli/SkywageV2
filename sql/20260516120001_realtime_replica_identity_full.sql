-- Migration: Set REPLICA IDENTITY FULL on six user-owned tables for realtime
-- Description: Backfills the source-of-truth schema with the SQL that was
--   applied mobile-first to the shared Supabase project during skywage-mobile
--   Phase 4 Slice 2 (2026-05-16). The replica identity is already live in
--   production; this file simply tracks it in version control here so a
--   fresh-clone web-app developer running `supabase db push` against a clean
--   local DB gets the same shape the remote project has.
-- Affected tables (REPLICA IDENTITY changed from DEFAULT to FULL):
--   - public.flights
--   - public.layover_rest_periods
--   - public.monthly_calculations
--   - public.profiles
--   - public.user_position_history
--   - public.friendships
-- Date: 2026-05-16
-- Special notes: Required for filtered postgres_changes DELETE events to
--   deliver. With the default REPLICA IDENTITY, only the primary key is
--   replicated for DELETE events, so payload.old carries only `id`. Channel
--   filters that reference any non-PK column — e.g. mobile uses
--   `user_id=eq.{uid}` on five tables and `requester_id=eq.{uid}` /
--   `receiver_id=eq.{uid}` on friendships — cannot evaluate against a
--   truncated payload.old, and Supabase silently drops the event server-side.
--   FULL replicates the entire old row so the filter can evaluate any column.
--   Cost: WAL size grows because UPDATE/DELETE records now carry the full old
--   row. Negligible at our scale (small per-user row counts).
--   Companion migration: 20260516120000_realtime_publication_enable.sql.

ALTER TABLE public.flights               REPLICA IDENTITY FULL;
ALTER TABLE public.layover_rest_periods  REPLICA IDENTITY FULL;
ALTER TABLE public.monthly_calculations  REPLICA IDENTITY FULL;
ALTER TABLE public.profiles              REPLICA IDENTITY FULL;
ALTER TABLE public.user_position_history REPLICA IDENTITY FULL;
ALTER TABLE public.friendships           REPLICA IDENTITY FULL;

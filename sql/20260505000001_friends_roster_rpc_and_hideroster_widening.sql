-- Migration: Friend roster RPC + hideRoster widening on public profile RPCs
-- Description: Backfills the source-of-truth schema with the SQL that was
--   applied mobile-first to the shared Supabase project during skywage-mobile
--   Phase 2 Slice 7 (2026-05-05). The RPCs are already live in production; this
--   file simply tracks them in version control here so a fresh-clone web-app
--   developer running `supabase db push` against a clean local DB gets the
--   same shape the remote project has.
-- Affected functions:
--   - find_profile_by_username(text) — widened to return hide_roster_from_friends
--   - get_profiles_public_by_ids(uuid[]) — widened to return hide_roster_from_friends
--   - get_friend_roster(uuid, integer, integer) — new, used by mobile friends grid
-- Date: 2026-05-05
-- Special notes: Web-app callers ignore the new column (additive widening); no
--   web behavior changes. The web app's existing /api/friends/compare-roster
--   HTTPS route now overlaps logically with get_friend_roster — dedupe is
--   tracked as a separate follow-up in the mobile risk register.

-- =====================================================
-- 1. Widen find_profile_by_username to include hide_roster_from_friends
-- =====================================================

DROP FUNCTION IF EXISTS public.find_profile_by_username(text);

CREATE OR REPLACE FUNCTION public.find_profile_by_username(p_username text)
RETURNS TABLE (
  id uuid,
  username text,
  first_name text,
  last_name text,
  airline text,
  "position" text,
  avatar_url text,
  hide_roster_from_friends boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.airline,
    p.position,
    p.avatar_url,
    COALESCE((us.settings->>'hideRosterFromFriends')::boolean, false) AS hide_roster_from_friends
  FROM public.profiles p
  LEFT JOIN public.user_settings us ON us.user_id = p.id
  WHERE p.username = p_username
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_profile_by_username(text) TO authenticated;

COMMENT ON FUNCTION public.find_profile_by_username(text) IS
  'SECURITY DEFINER lookup of a profile by username. Returns public-safe fields plus the friend-roster privacy flag from user_settings. Requires authentication.';

-- =====================================================
-- 2. Widen get_profiles_public_by_ids to include hide_roster_from_friends
-- =====================================================

DROP FUNCTION IF EXISTS public.get_profiles_public_by_ids(uuid[]);

CREATE OR REPLACE FUNCTION public.get_profiles_public_by_ids(p_ids uuid[])
RETURNS TABLE (
  id uuid,
  username text,
  first_name text,
  last_name text,
  airline text,
  "position" text,
  avatar_url text,
  hide_roster_from_friends boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.airline,
    p.position,
    p.avatar_url,
    COALESCE((us.settings->>'hideRosterFromFriends')::boolean, false) AS hide_roster_from_friends
  FROM public.profiles p
  LEFT JOIN public.user_settings us ON us.user_id = p.id
  WHERE p.id = ANY(p_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profiles_public_by_ids(uuid[]) TO authenticated;

COMMENT ON FUNCTION public.get_profiles_public_by_ids(uuid[]) IS
  'SECURITY DEFINER batched lookup of profiles by ID. Returns public-safe fields plus the friend-roster privacy flag from user_settings. Requires authentication.';

-- =====================================================
-- 3. New get_friend_roster RPC
-- =====================================================
-- Returns a friend's flights for the requested month/year if the caller has an
-- accepted friendship with the friend AND the friend has not enabled
-- hideRosterFromFriends. Salaries (`flight_pay`, `pay`) are zeroed before
-- return so pay information never crosses the friendship boundary.
--
-- Return shape (json):
--   { hidden: boolean, flights: <flights rows array> }
--
-- Errors raise SQL exceptions (caught by the mobile client as `.error`).

DROP FUNCTION IF EXISTS public.get_friend_roster(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.get_friend_roster(
  p_friend_id uuid,
  p_month integer,
  p_year integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_friendship_exists boolean;
  v_hidden boolean;
  v_flights json;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_friend_id IS NULL OR p_friend_id = v_caller THEN
    RAISE EXCEPTION 'Invalid friend id';
  END IF;

  -- Verify accepted friendship in either direction
  SELECT EXISTS (
    SELECT 1
    FROM public.friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.requester_id = v_caller AND f.receiver_id = p_friend_id)
        OR (f.requester_id = p_friend_id AND f.receiver_id = v_caller)
      )
  ) INTO v_friendship_exists;

  IF NOT v_friendship_exists THEN
    RAISE EXCEPTION 'Not friends with this user';
  END IF;

  -- Read the friend's hideRosterFromFriends preference
  SELECT COALESCE((us.settings->>'hideRosterFromFriends')::boolean, false)
  INTO v_hidden
  FROM public.user_settings us
  WHERE us.user_id = p_friend_id;

  IF v_hidden IS NULL THEN
    v_hidden := false;
  END IF;

  IF v_hidden THEN
    RETURN json_build_object('hidden', true, 'flights', '[]'::json);
  END IF;

  -- Fetch the friend's flights for the requested month/year. Salary fields are
  -- zeroed in the projection so pay information never leaks across the
  -- friendship boundary. All other columns are passed through untouched so the
  -- mobile-side rowToFlightDuty maps the row identically to its own-roster path.
  SELECT COALESCE(
    json_agg(row_to_json(t) ORDER BY t.date ASC),
    '[]'::json
  )
  INTO v_flights
  FROM (
    SELECT
      f.id,
      f.user_id,
      f.date,
      f.flight_number,
      f.sector,
      f.reporting_time,
      f.debriefing_time,
      f.hours,
      0::double precision AS pay,
      f.flight_numbers,
      f.sectors,
      f.duty_type,
      f.report_time,
      f.debrief_time,
      f.duty_hours,
      0::numeric AS flight_pay,
      f.is_cross_day,
      f.data_source,
      f.original_data,
      f.last_edited_at,
      f.last_edited_by,
      f.month,
      f.year,
      f.sector_details,
      f.position_used,
      f.hourly_rate_used,
      f.created_at,
      f.updated_at
    FROM public.flights f
    WHERE f.user_id = p_friend_id
      AND f.month = p_month
      AND f.year = p_year
      AND COALESCE(f.data_source, '') <> 'cross_month_pairing'
  ) t;

  RETURN json_build_object('hidden', false, 'flights', v_flights);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_friend_roster(uuid, integer, integer) TO authenticated;

COMMENT ON FUNCTION public.get_friend_roster(uuid, integer, integer) IS
  'SECURITY DEFINER fetch of a friend''s flights for a month/year, gated on accepted friendship and the friend''s hideRosterFromFriends setting. Salary fields are zeroed in the projection. Used by skywage-mobile Slice 7 friends roster comparison.';

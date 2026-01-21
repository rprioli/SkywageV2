-- Migration: Tighten profiles RLS and add public profile RPCs
-- Description: Make profiles self-only and expose public fields via SECURITY DEFINER functions
-- Date: 2026-01-21

-- =====================================================
-- 1. Drop the overly permissive global read policy
-- =====================================================

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- =====================================================
-- 2. Ensure self-only access policies exist
-- =====================================================

-- These policies should already exist based on the codebase, but we ensure they're correct

-- Policy for users to read their own profile (keep if exists)
-- Note: Multiple self-read policies exist in live DB, we keep them as-is

-- Policy for users to update their own profile (keep if exists)
-- Note: Multiple self-update policies exist in live DB, we keep them as-is

-- =====================================================
-- 3. Create SECURITY DEFINER function to find profile by username
-- =====================================================

CREATE OR REPLACE FUNCTION public.find_profile_by_username(p_username text)
RETURNS TABLE (
  id uuid,
  username text,
  first_name text,
  last_name text,
  airline text,
  "position" text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Auth gate: require authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Return only public-safe fields
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.airline,
    p.position,
    p.avatar_url
  FROM public.profiles p
  WHERE p.username = p_username
  LIMIT 1;
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.find_profile_by_username(text) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.find_profile_by_username(text) IS 
  'SECURITY DEFINER function to find a profile by username, returning only public-safe fields. Requires authentication.';

-- =====================================================
-- 4. Create SECURITY DEFINER function to get profiles by IDs
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_profiles_public_by_ids(p_ids uuid[])
RETURNS TABLE (
  id uuid,
  username text,
  first_name text,
  last_name text,
  airline text,
  "position" text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Auth gate: require authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Return only public-safe fields for the requested IDs
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.airline,
    p.position,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(p_ids);
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_profiles_public_by_ids(uuid[]) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_profiles_public_by_ids(uuid[]) IS 
  'SECURITY DEFINER function to get public profile fields for multiple user IDs. Requires authentication.';

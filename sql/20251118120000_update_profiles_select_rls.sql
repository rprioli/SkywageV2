-- Migration: Update profiles SELECT RLS for friend discovery
-- Description: Allow authenticated users to view profiles for friend discovery while preserving existing self-access policies.
-- Date: 2025-11-18

-- Ensure Row Level Security is enabled on profiles (should already be enabled, but this is safe/idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all profiles (needed for email-based friend discovery)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING ( true );


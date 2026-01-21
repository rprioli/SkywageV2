-- Migration: Sync auth.users email changes to public.profiles
-- Description: Add trigger to keep profiles.email synchronized with auth.users.email
-- Date: 2026-01-21

-- =====================================================
-- Create function to sync email from auth.users to profiles
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_auth_email_to_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update the profile email when auth.users email changes
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- Create trigger to run on auth.users UPDATE
-- =====================================================

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;

-- Create trigger to sync email on update
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_auth_email_to_profiles();

-- Add comment for documentation
COMMENT ON FUNCTION public.sync_auth_email_to_profiles() IS 
  'SECURITY DEFINER trigger function to sync email changes from auth.users to public.profiles';

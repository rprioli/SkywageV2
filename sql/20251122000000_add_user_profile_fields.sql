-- Migration: Add first_name, last_name, and avatar_url to profiles table
-- Description: Extends profiles table with user display information and updates the handle_new_user trigger
-- Phase: Friends Feature Phase 1 - Data Enhancements

-- Add new columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, airline, position, nationality, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'airline',
    NEW.raw_user_meta_data->>'position',
    NEW.raw_user_meta_data->>'nationality',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$function$;

-- Backfill existing users' data from auth.users metadata
UPDATE public.profiles p
SET 
  first_name = (SELECT raw_user_meta_data->>'first_name' FROM auth.users WHERE id = p.id),
  last_name = (SELECT raw_user_meta_data->>'last_name' FROM auth.users WHERE id = p.id),
  avatar_url = (SELECT raw_user_meta_data->>'avatar_url' FROM auth.users WHERE id = p.id)
WHERE p.first_name IS NULL OR p.last_name IS NULL OR p.avatar_url IS NULL;


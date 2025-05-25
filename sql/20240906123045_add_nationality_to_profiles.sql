-- Migration: Add nationality field to profiles table
-- Description: Adds an optional nationality field to user profiles and updates the handle_new_user trigger function

-- Add nationality column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT;

-- Update the handle_new_user function to include nationality in profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, airline, position, nationality)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'airline',
    NEW.raw_user_meta_data->>'position',
    NEW.raw_user_meta_data->>'nationality'
  );
  RETURN NEW;
END;
$function$;

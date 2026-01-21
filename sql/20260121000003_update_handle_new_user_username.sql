-- Migration: Update handle_new_user to include username
-- Description: Updates the handle_new_user function to extract and store username from user metadata
-- Date: 2026-01-21

-- Update the handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, airline, "position", nationality, first_name, last_name, avatar_url, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'airline',
    NEW.raw_user_meta_data->>'position',
    NEW.raw_user_meta_data->>'nationality',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$;

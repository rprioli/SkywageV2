-- Migration: Add username to profiles
-- Description: Adds username column with format validation and uniqueness constraint
-- Date: 2026-01-21

-- Add username column (nullable to support existing users)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Add CHECK constraint for username format
-- Rules: 3-20 chars, lowercase letters, numbers, and underscore only
ALTER TABLE public.profiles 
  ADD CONSTRAINT username_format_check 
  CHECK (
    username IS NULL OR (
      char_length(username) >= 3 
      AND char_length(username) <= 20 
      AND username ~ '^[a-z0-9_]+$'
      AND username = lower(username)
    )
  );

-- Add unique constraint on username (case-insensitive safe due to lowercase enforcement)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx 
  ON public.profiles (username) 
  WHERE username IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.username IS 'Unique username for friend discovery: 3-20 chars, lowercase letters/numbers/underscore only';

-- SQL script to set up the avatars storage bucket and RLS policies
-- Run this in the Supabase SQL Editor to fix profile picture upload issues

-- First, check if the avatars bucket exists and create it if it doesn't
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) INTO bucket_exists;

  IF NOT bucket_exists THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
    RAISE NOTICE 'Created avatars bucket';
  ELSE
    RAISE NOTICE 'Avatars bucket already exists';
  END IF;
END $$;

-- Clear any existing policies for the avatars bucket to avoid conflicts
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own avatars" ON storage.objects;

-- Create policy to allow public access to avatars (read-only)
CREATE POLICY "Public Access to Avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Create policy to allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Create policy to allow users to update their own avatars
CREATE POLICY "Allow users to update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Create policy to allow users to delete their own avatars
CREATE POLICY "Allow users to delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Verify the policies were created
SELECT
  policyname,
  cmd AS operation,
  qual AS definition
FROM
  pg_policies
WHERE
  tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%avatars%';

-- Migration: Create friendships table for Friends feature
-- Description: Adds friendships table with RLS policies for friend management
-- Phase: 1 - Database & RLS Foundation
-- Feature: Friends Feature

-- =====================================================
-- 1. Create friendships table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ NULL,
  
  -- Ensure one friendship row per user pair
  CONSTRAINT unique_friendship UNIQUE (requester_id, receiver_id),
  
  -- Prevent self-friendship
  CONSTRAINT no_self_friendship CHECK (requester_id != receiver_id)
);

-- =====================================================
-- 2. Create indexes for performance
-- =====================================================

-- Index for finding pending requests received by a user
CREATE INDEX IF NOT EXISTS idx_friendships_receiver_status 
  ON public.friendships(receiver_id, status);

-- Index for finding all friendships for a user (as requester)
CREATE INDEX IF NOT EXISTS idx_friendships_requester 
  ON public.friendships(requester_id);

-- Index for finding accepted friendships (most common query)
CREATE INDEX IF NOT EXISTS idx_friendships_status 
  ON public.friendships(status) 
  WHERE status = 'accepted';

-- =====================================================
-- 3. Enable Row Level Security
-- =====================================================

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. Create RLS Policies
-- =====================================================

-- Policy: Users can view friendships they are part of
CREATE POLICY "Users can view their own friendships"
  ON public.friendships
  FOR SELECT
  USING (
    auth.uid() = requester_id OR auth.uid() = receiver_id
  );

-- Policy: Users can create friend requests (as requester only)
CREATE POLICY "Users can send friend requests"
  ON public.friendships
  FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id
  );

-- Policy: Users can update friendships they are part of
-- (Receiver can accept/reject, both can update status)
CREATE POLICY "Users can update their friendships"
  ON public.friendships
  FOR UPDATE
  USING (
    auth.uid() = requester_id OR auth.uid() = receiver_id
  )
  WITH CHECK (
    auth.uid() = requester_id OR auth.uid() = receiver_id
  );

-- Policy: Users can delete friendships they are part of
CREATE POLICY "Users can delete their friendships"
  ON public.friendships
  FOR DELETE
  USING (
    auth.uid() = requester_id OR auth.uid() = receiver_id
  );

-- =====================================================
-- 5. Create trigger for updated_at timestamp
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_friendships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Set responded_at when status changes from pending
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    NEW.responded_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_friendships_timestamp
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_friendships_updated_at();

-- =====================================================
-- 6. Add helpful comments
-- =====================================================

COMMENT ON TABLE public.friendships IS 'Stores friend relationships between users with pending/accepted/rejected status';
COMMENT ON COLUMN public.friendships.requester_id IS 'User who sent the friend request';
COMMENT ON COLUMN public.friendships.receiver_id IS 'User who received the friend request';
COMMENT ON COLUMN public.friendships.status IS 'Status of friendship: pending, accepted, or rejected';
COMMENT ON COLUMN public.friendships.responded_at IS 'Timestamp when receiver responded to the request';


/**
 * API Route: Respond to Friend Request
 * POST /api/friends/respond
 * Handles accepting or rejecting friend requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { respondToFriendRequest } from '@/lib/database/friends';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { friendshipId, status } = body;

    if (!friendshipId || typeof friendshipId !== 'string') {
      return NextResponse.json(
        { error: 'Friendship ID is required' },
        { status: 400 }
      );
    }

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "accepted" or "rejected"' },
        { status: 400 }
      );
    }

    // Respond to friend request
    const { data, error } = await respondToFriendRequest(
      friendshipId,
      user.id,
      status as 'accepted' | 'rejected'
    );

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


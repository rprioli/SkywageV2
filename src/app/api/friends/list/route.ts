/**
 * API Route: List Friends
 * GET /api/friends/list
 * Returns all friends and pending requests for the authenticated user
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  getFriendsForUser,
  getPendingFriendRequests,
  getPendingRequestsCount,
} from '@/lib/database/friends';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[Friends API] Auth check:', { user: user?.id, error: authError?.message });

    if (authError || !user) {
      console.log('[Friends API] Unauthorized - no user or auth error');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch friends and pending requests in parallel
    const [friendsResult, pendingResult, countResult] = await Promise.all([
      getFriendsForUser(user.id),
      getPendingFriendRequests(user.id),
      getPendingRequestsCount(user.id),
    ]);

    if (friendsResult.error) {
      return NextResponse.json(
        { error: friendsResult.error },
        { status: 500 }
      );
    }

    if (pendingResult.error) {
      return NextResponse.json(
        { error: pendingResult.error },
        { status: 500 }
      );
    }

    if (countResult.error) {
      return NextResponse.json(
        { error: countResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        friends: friendsResult.data || [],
        pending: pendingResult.data || { sent: [], received: [] },
        pendingCount: countResult.data || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in list API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


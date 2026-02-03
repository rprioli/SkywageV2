/**
 * API Route: Batch Compare Roster with Multiple Friends
 * GET /api/friends/compare-roster-batch?friendIds=id1,id2,id3&month={month}&year={year}
 * 
 * Returns user's roster once + all selected friends' rosters for comparison.
 * Supports up to 5 friends at a time.
 * Respects each friend's "hideRosterFromFriends" preference individually.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';
import type { FlightDuty } from '@/types/salary-calculator';
import { rowToFlightDuty } from '@/lib/database/flights';
import { createServiceClient } from '@/lib/supabase-service';
import { MIN_SUPPORTED_YEAR } from '@/lib/constants/dates';
import { parsePreferences } from '@/lib/user-preferences';

/** Maximum number of friends that can be compared at once */
const MAX_FRIENDS = 5;

/** Response shape for a single friend's roster data */
interface FriendRosterData {
  friendId: string;
  roster: FlightDuty[];
  rosterHidden: boolean;
}

/** Full batch response shape */
interface BatchCompareResponse {
  myRoster: FlightDuty[];
  friends: FriendRosterData[];
  month: number;
  year: number;
}

export async function GET(request: NextRequest) {
  try {
    // ========================================================================
    // Auth validation
    // ========================================================================
    const authHeader =
      request.headers.get('authorization') ?? request.headers.get('Authorization');

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = authHeader.split(' ')[1]?.trim();

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);

    // Authenticate user using the access token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ========================================================================
    // Parse and validate query parameters
    // ========================================================================
    const searchParams = request.nextUrl.searchParams;
    const friendIdsParam = searchParams.get('friendIds');
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');

    if (!friendIdsParam || !monthStr || !yearStr) {
      return NextResponse.json(
        { error: 'Missing required parameters: friendIds, month, year' },
        { status: 400 }
      );
    }

    // Parse friend IDs from comma-separated string
    const friendIds = friendIdsParam
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (friendIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one friendId is required' },
        { status: 400 }
      );
    }

    if (friendIds.length > MAX_FRIENDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FRIENDS} friends can be compared at once` },
        { status: 400 }
      );
    }

    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < MIN_SUPPORTED_YEAR) {
      return NextResponse.json(
        { error: `Invalid month or year. Year must be ${MIN_SUPPORTED_YEAR} or later.` },
        { status: 400 }
      );
    }

    // ========================================================================
    // Verify all friendships exist and are accepted
    // ========================================================================
    const serviceSupabase = createServiceClient();

    // Build OR conditions for all friend IDs
    // Each friendship can be: (user=requester, friend=receiver) OR (user=receiver, friend=requester)
    const friendshipConditions = friendIds
      .map(
        (friendId) =>
          `and(requester_id.eq.${user.id},receiver_id.eq.${friendId}),` +
          `and(requester_id.eq.${friendId},receiver_id.eq.${user.id})`
      )
      .join(',');

    const { data: friendships, error: friendshipError } = await serviceSupabase
      .from('friendships')
      .select('id, requester_id, receiver_id')
      .eq('status', 'accepted')
      .or(friendshipConditions);

    if (friendshipError) {
      return NextResponse.json(
        { error: 'Failed to verify friendships' },
        { status: 500 }
      );
    }

    // Extract the friend IDs that have valid friendships
    const validFriendIds = new Set<string>();
    for (const friendship of friendships || []) {
      // Determine which ID is the friend (not the current user)
      const friendId =
        friendship.requester_id === user.id
          ? friendship.receiver_id
          : friendship.requester_id;
      validFriendIds.add(friendId);
    }

    // Check if all requested friends are valid
    const invalidFriendIds = friendIds.filter((id) => !validFriendIds.has(id));
    if (invalidFriendIds.length > 0) {
      return NextResponse.json(
        {
          error: `Some friendships not found or not accepted`,
          invalidFriendIds,
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // Fetch user settings for all friends (to check hideRosterFromFriends)
    // ========================================================================
    const { data: friendSettingsRows } = await serviceSupabase
      .from('user_settings')
      .select('user_id, settings')
      .in('user_id', friendIds);

    // Build a map of friendId -> hideRosterFromFriends
    type SettingsRow = { user_id: string; settings: Record<string, unknown> };
    const settingsRowsTyped = (friendSettingsRows || []) as unknown as SettingsRow[];
    
    const hiddenRosterMap = new Map<string, boolean>();
    for (const row of settingsRowsTyped) {
      const prefs = parsePreferences(row.settings);
      hiddenRosterMap.set(row.user_id, prefs.hideRosterFromFriends);
    }

    // ========================================================================
    // Fetch all rosters in parallel (user + all friends)
    // ========================================================================
    type FlightRow = Database['public']['Tables']['flights']['Row'];

    const sanitizeRoster = (rows: FlightRow[]): FlightDuty[] => {
      return rows.map((row) => {
        const duty = rowToFlightDuty(row);
        // Never expose salary information in friends comparison
        return {
          ...duty,
          flightPay: 0,
        };
      });
    };

    // Fetch user's roster
    const myRosterPromise = serviceSupabase
      .from('flights')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)
      .order('date', { ascending: true });

    // Fetch all friends' rosters in parallel
    const friendRosterPromises = friendIds.map((friendId) =>
      serviceSupabase
        .from('flights')
        .select('*')
        .eq('user_id', friendId)
        .eq('month', month)
        .eq('year', year)
        .order('date', { ascending: true })
        .then((result) => ({
          friendId,
          result,
          rosterHidden: hiddenRosterMap.get(friendId) || false,
        }))
    );

    // Execute all fetches in parallel
    const [myRosterResult, ...friendResults] = await Promise.all([
      myRosterPromise,
      ...friendRosterPromises,
    ]);

    if (myRosterResult.error) {
      return NextResponse.json(
        { error: 'Failed to fetch your roster' },
        { status: 500 }
      );
    }

    // Process friend results
    const friends: FriendRosterData[] = friendResults.map(
      ({ friendId, result, rosterHidden }) => {
        if (result.error) {
          // If we can't fetch a friend's roster, return empty with error flag
          // We could also choose to fail the entire request, but partial data is more resilient
          return {
            friendId,
            roster: [],
            rosterHidden: true, // Treat fetch errors as hidden for UI purposes
          };
        }

        return {
          friendId,
          roster: rosterHidden ? [] : sanitizeRoster(result.data || []),
          rosterHidden,
        };
      }
    );

    // ========================================================================
    // Return combined response
    // ========================================================================
    const response: BatchCompareResponse = {
      myRoster: sanitizeRoster(myRosterResult.data || []),
      friends,
      month,
      year,
    };

    return NextResponse.json(response, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

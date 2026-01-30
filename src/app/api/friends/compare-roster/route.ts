/**
 * API Route: Compare Roster with Friend
 * GET /api/friends/compare-roster?friendId={id}&month={month}&year={year}
 * Returns both users' rosters for comparison (all duty types including off days)
 * Respects the friend's "hideRosterFromFriends" preference
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';
import type { FlightDuty } from '@/types/salary-calculator';
import { rowToFlightDuty } from '@/lib/database/flights';
import { createServiceClient } from '@/lib/supabase-service';
import { MIN_SUPPORTED_YEAR } from '@/lib/constants/dates';
import { parsePreferences } from '@/lib/user-preferences';

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const friendId = searchParams.get('friendId');
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');

    // Validate parameters
    if (!friendId || !monthStr || !yearStr) {
      return NextResponse.json(
        { error: 'Missing required parameters: friendId, month, year' },
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

    // Use service client to verify friendship and fetch both rosters (bypassing RLS)
    const serviceSupabase = createServiceClient();

    // Verify friendship exists and is accepted using service client (not subject to RLS)
    const { data: friendship, error: friendshipError } = await serviceSupabase
      .from('friendships')
      .select('id')
      .eq('status', 'accepted')
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${friendId}),` +
          `and(requester_id.eq.${friendId},receiver_id.eq.${user.id})`
      )
      .maybeSingle();

    if (friendshipError) {
      return NextResponse.json(
        { error: 'Failed to verify friendship' },
        { status: 500 }
      );
    }

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friendship not found or not accepted' },
        { status: 403 }
      );
    }

    // Check if the friend has hidden their roster
    const { data: friendSettings } = await serviceSupabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', friendId)
      .maybeSingle();

    // NOTE:
    // Our hand-written `Database` types can cause Supabase select() inference to become `never`
    // during production type-checking (Netlify). We intentionally narrow via `unknown` here
    // to keep this route type-safe without using `any`.
    type FriendSettingsRow = { settings: Record<string, unknown> } | null;
    const friendSettingsRow = friendSettings as unknown as FriendSettingsRow;

    const friendPreferences = parsePreferences(friendSettingsRow?.settings);
    const friendRosterHidden = friendPreferences.hideRosterFromFriends;

    // Fetch both users' rosters in parallel
    const [myRosterResult, friendRosterResult] = await Promise.all([
      serviceSupabase
        .from('flights')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
        .order('date', { ascending: true }),
      serviceSupabase
        .from('flights')
        .select('*')
        .eq('user_id', friendId)
        .eq('month', month)
        .eq('year', year)
        .order('date', { ascending: true })
    ]);

    if (myRosterResult.error) {
      return NextResponse.json(
        { error: 'Failed to fetch your roster' },
        { status: 500 }
      );
    }

    if (friendRosterResult.error) {
      return NextResponse.json(
        { error: 'Failed to fetch friend roster' },
        { status: 500 }
      );
    }

    // Remove salary-related fields from both rosters and map to FlightDuty shape
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

    return NextResponse.json(
      {
        myRoster: sanitizeRoster(myRosterResult.data || []),
        // Return empty roster if friend has hidden it, but include flag for UI
        friendRoster: friendRosterHidden ? [] : sanitizeRoster(friendRosterResult.data || []),
        friendRosterHidden,
        month,
        year,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


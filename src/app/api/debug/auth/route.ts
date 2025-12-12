import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase-server';

/**
 * Debug endpoint to validate SSR/middleware auth cookies in production.
 *
 * IMPORTANT:
 * - Does NOT return any PII or secrets (only booleans and cookie names).
 * - Intended to be removed once login flow is confirmed stable.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Only return Supabase cookie *names* (never values).
    const cookieNames = cookieStore
      .getAll()
      .map((c) => c.name)
      .filter((name) => name.startsWith('sb-'));

    return NextResponse.json(
      {
        serverSeesUser: !!user,
        cookieNames,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { serverSeesUser: false, cookieNames: [] },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}


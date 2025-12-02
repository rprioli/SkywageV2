import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This route is called by Supabase Auth after a user signs in
// It exchanges the auth code for a session
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    try {
      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      // Redirect to error page if code exchange fails
      return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
    }
  }

  // Redirect to the home page or dashboard after successful authentication
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
}

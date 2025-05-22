import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from './src/lib/supabase';

export async function middleware(request: NextRequest) {
  // Create a response object that we'll modify and return
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Try to get the user's session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error refreshing auth session:', error);
    }

    // If we have cookies to set from the Supabase client, set them on the response
    const supabaseCookies = request.cookies.getAll();
    if (supabaseCookies.length > 0) {
      for (const cookie of supabaseCookies) {
        response.cookies.set(cookie.name, cookie.value, {
          path: '/',
          sameSite: 'lax',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        });
      }
    }

    return response;
  } catch (err) {
    console.error('Unexpected error in auth middleware:', err);
    return response;
  }
}

// Only run the middleware on routes that need authentication
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

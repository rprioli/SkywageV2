import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from './src/lib/supabase';

// Session cache to reduce API calls
const sessionCache = new Map<string, { session: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/statistics'
];

// Check if route is protected
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

// Get cached session or fetch new one
async function getCachedSession(cacheKey: string) {
  const cached = sessionCache.get(cacheKey);
  const now = Date.now();

  // Return cached session if valid
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return { session: cached.session, fromCache: true };
  }

  // Fetch new session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (!error && session) {
      // Cache the session
      sessionCache.set(cacheKey, {
        session,
        timestamp: now
      });
    }

    return { session, error, fromCache: false };
  } catch (error) {
    return { session: null, error, fromCache: false };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for non-protected routes
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  // Create a response object that we'll modify and return
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Use IP + User-Agent as cache key for session caching
    // Note: request.ip is not available in NextRequest, use x-forwarded-for header instead
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    const cacheKey = `${ip}-${request.headers.get('user-agent') || 'unknown'}`;

    // Get session (cached or fresh)
    const { session, error, fromCache } = await getCachedSession(cacheKey);

    if (error) {
      console.error('Error getting auth session:', error);
    }

    // Log cache performance
    if (process.env.NODE_ENV === 'development') {
      console.log(`Middleware session ${fromCache ? 'cached' : 'fresh'} for ${pathname}`);
    }

    // Set session info in headers for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('X-Auth-Session', session ? 'present' : 'none');
      response.headers.set('X-Auth-Cached', fromCache ? 'true' : 'false');
    }

    return response;
  } catch (err) {
    console.error('Unexpected error in auth middleware:', err);
    return response;
  }
}

// Only run the middleware on protected routes for better performance
export const config = {
  matcher: [
    /*
     * Match only protected routes that require authentication:
     * - /dashboard and all sub-routes
     * - /profile and all sub-routes
     * - /settings and all sub-routes
     * - /statistics and all sub-routes
     */
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/statistics/:path*'
  ],
};

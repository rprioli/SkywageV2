'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If not loading and no session, redirect to login
    if (!loading && !session) {
      // Store the current path to redirect back after login
      if (pathname !== '/' && pathname !== '/register') {
        sessionStorage.setItem('redirectAfterLogin', pathname);
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ce01aa14-ec59-43dd-9417-a71f721f979b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H5',
          location: 'src/components/ProtectedRoute.tsx:useEffect',
          message: 'ProtectedRoute redirecting unauthenticated user to root',
          data: { pathname },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      router.push('/');
    }
  }, [session, loading, router, pathname]);

  // Show nothing while loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we have a session, render the children
  return session ? <>{children}</> : null;
}

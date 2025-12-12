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

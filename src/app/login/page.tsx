'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Login Page - Redirects to home page (/) for backward compatibility
 * The home page now serves as the primary login page for the MVP
 */
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page which is now the login page
    router.replace('/');
  }, [router]);

  // Return null while redirecting
  return null;
}

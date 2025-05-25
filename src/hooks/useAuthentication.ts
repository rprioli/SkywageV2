'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, signOut } from '@/lib/auth';

export function useAuthentication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { user, error: signInError } = await signIn(email, password);

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (user) {
        // Check if there's a redirect path stored
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterLogin');
          router.push(redirectPath);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    airline: string,
    position: 'CCM' | 'SCCM',
    nationality?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Sign up the user with Supabase Auth
      const { user, error: signUpError } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        airline,
        position,
        nationality
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (user) {
        // No need to manually create a profile - it's created by the database trigger

        // Redirect to dashboard or confirmation page
        router.push('/dashboard');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: signOutError } = await signOut();

      if (signOutError) {
        throw new Error(signOutError.message);
      }

      // Redirect to home page
      router.push('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleLogin,
    handleRegister,
    handleLogout
  };
}

'use client';

import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { LoginForm } from '@/components/auth/LoginForm';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex flex-col justify-start pt-[10vh] p-4 md:p-8">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground">
              Sign in to your Skywage account
            </p>
          </div>

          <LoginForm />

          <div className="mt-8 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

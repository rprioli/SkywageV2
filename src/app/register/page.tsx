'use client';

import React, { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow flex flex-col justify-start pt-[8vh] md:pt-[12vh] p-4 md:p-8">
        <div className="w-full max-w-md mx-auto">
          {/* Centered Logo */}
          <div className="flex justify-center mb-8">
            <Logo variant="color" width={180} height={48} />
          </div>

          {/* Register Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'rgb(58, 55, 128)' }}>Create your account</h1>
            <p className="text-muted-foreground">
              Join Skywage to calculate and track your airline salary
            </p>
          </div>

          {/* Register Form - Wrapped in Suspense for useSearchParams */}
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <RegisterForm />
          </Suspense>

          {/* Sign In Link */}
          <div className="mt-8 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

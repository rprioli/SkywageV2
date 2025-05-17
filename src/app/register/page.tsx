'use client';

import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex flex-col justify-start pt-[10vh] p-4 md:p-8">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Create your account</h1>
            <p className="text-muted-foreground">
              Join Skywage to calculate and track your airline salary
            </p>
          </div>

          <RegisterForm />

          <div className="mt-8 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

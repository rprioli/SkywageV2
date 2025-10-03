'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/brand';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  return (
    <header className="w-full py-4 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Logo variant="color" width={150} height={40} />
        </Link>

        {/* CTA Buttons and Theme Toggle */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild className="rounded-hd">
            <Link href="/">
              Sign In
            </Link>
          </Button>
          <Button asChild className="rounded-hd">
            <Link href="/register">
              Get Started
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default Navbar;

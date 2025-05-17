'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
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

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="/app"
            className="text-foreground hover:text-primary transition-colors font-medium"
          >
            App
          </Link>
          <Link
            href="/about"
            className="text-foreground hover:text-primary transition-colors font-medium"
          >
            About
          </Link>
          <Link
            href="/support"
            className="text-foreground hover:text-primary transition-colors font-medium"
          >
            Support
          </Link>
          <Link
            href="/contact"
            className="text-foreground hover:text-primary transition-colors font-medium"
          >
            Contact
          </Link>
        </nav>

        {/* CTA Button and Theme Toggle */}
        <div className="flex items-center space-x-4">
          <Link
            href="/register"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default Navbar;

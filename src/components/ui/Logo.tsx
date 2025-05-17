'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'color' | 'white' | 'auto';
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Logo component that displays the Skywage logo
 * 
 * @param variant 'color' for colored logo, 'white' for white logo, 'auto' to choose based on theme
 * @param width Width of the logo in pixels
 * @param height Height of the logo in pixels
 * @param className Additional CSS classes
 */
export function Logo({
  variant = 'auto',
  width = 150,
  height = 40,
  className,
}: LogoProps) {
  // For auto variant, we need to detect if we're in dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [logoSrc, setLogoSrc] = useState(BRAND.logo.color);

  // Effect to detect dark mode
  useEffect(() => {
    // Check if we're in dark mode
    const isDark = 
      document.documentElement.classList.contains('dark') || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setIsDarkMode(isDark);
    
    // Set up listener for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update logo source when variant or dark mode changes
  useEffect(() => {
    if (variant === 'color') {
      setLogoSrc(BRAND.logo.color);
    } else if (variant === 'white') {
      setLogoSrc(BRAND.logo.white);
    } else {
      // Auto - use white logo on dark backgrounds, colored logo on light backgrounds
      setLogoSrc(isDarkMode ? BRAND.logo.white : BRAND.logo.color);
    }
  }, [variant, isDarkMode]);

  return (
    <div className={cn('relative', className)}>
      <Image
        src={logoSrc}
        alt="Skywage Logo"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    </div>
  );
}

'use client';

/**
 * Mobile Navigation Context Provider for Skywage
 * Provides shared navigation state across all dashboard components
 * Ensures consistent mobile navigation behavior throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface MobileNavigationContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isReady: boolean;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

const MobileNavigationContext = createContext<MobileNavigationContextType | undefined>(undefined);

// Breakpoint constants matching Tailwind defaults
const MOBILE_BREAKPOINT = 768; // md breakpoint
const DESKTOP_BREAKPOINT = 1024; // lg breakpoint

interface MobileNavigationProviderProps {
  children: React.ReactNode;
}

export function MobileNavigationProvider({ children }: MobileNavigationProviderProps) {
  // Start with indeterminate state (all false) to avoid hydration mismatch
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Update screen size state based on window.matchMedia (CSS-aligned breakpoints)
  const updateScreenSize = useCallback(() => {
    // Use matchMedia for CSS-aligned breakpoint detection
    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const desktopQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    
    const mobile = mobileQuery.matches;
    const desktop = desktopQuery.matches;
    const tablet = !mobile && !desktop;

    setIsMobile(mobile);
    setIsTablet(tablet);
    setIsDesktop(desktop);
    setIsReady(true);

    // Auto-close sidebar on mobile when switching to desktop
    if (desktop && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isSidebarOpen]);

  // Handle window resize events
  useEffect(() => {
    // Set initial state
    updateScreenSize();

    // Add resize listener
    window.addEventListener('resize', updateScreenSize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateScreenSize);
    };
  }, [updateScreenSize]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when sidebar is open on mobile
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, isMobile]);

  // Navigation control functions
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const value: MobileNavigationContextType = {
    isMobile,
    isTablet,
    isDesktop,
    isReady,
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar,
  };

  return (
    <MobileNavigationContext.Provider value={value}>
      {children}
    </MobileNavigationContext.Provider>
  );
}

/**
 * Hook to use mobile navigation context
 */
export function useMobileNavigation(): MobileNavigationContextType {
  const context = useContext(MobileNavigationContext);
  if (context === undefined) {
    throw new Error('useMobileNavigation must be used within a MobileNavigationProvider');
  }
  return context;
}

/**
 * Hook to handle click outside sidebar to close it
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback, enabled]);
}

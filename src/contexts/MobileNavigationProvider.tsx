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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Update screen size state based on window width
  const updateScreenSize = useCallback(() => {
    const width = window.innerWidth;
    
    const mobile = width < MOBILE_BREAKPOINT;
    const tablet = width >= MOBILE_BREAKPOINT && width < DESKTOP_BREAKPOINT;
    const desktop = width >= DESKTOP_BREAKPOINT;

    setIsMobile(mobile);
    setIsTablet(tablet);
    setIsDesktop(desktop);

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
  ref: React.RefObject<HTMLElement>,
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

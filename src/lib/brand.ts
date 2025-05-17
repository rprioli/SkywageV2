/**
 * Skywage Brand Configuration
 *
 * This file contains brand-related constants and utilities
 * for maintaining consistent branding across the application.
 */

export const BRAND = {
  name: 'Skywage',
  tagline: 'Airline Salary Calculator',
  description: 'Salary calculator for airline cabin crew and pilots',

  // Brand Colors
  colors: {
    primary: '#4C49ED', // Purple
    accent: '#6DDC91',  // Green
    background: '#FFFFFF', // White
    text: '#1A1A1A', // Dark text

    // Additional UI colors
    secondary: '#F5F5F5',
    muted: '#F0F0F0',
    border: '#E5E7EB',
    destructive: '#EF4444',
  },

  // Dark mode colors
  darkColors: {
    primary: '#5D5AFF', // Slightly lighter purple
    accent: '#7DEEA0',  // Slightly lighter green
    background: '#121212', // Dark background
    text: '#F9FAFB', // Light text

    // Additional UI colors
    secondary: '#2D2D2D',
    muted: '#2D2D2D',
    border: '#333333',
    destructive: '#F87171',
  },

  // Logo paths
  logo: {
    color: '/images/logo_maincolor.png',
    white: '/images/logo__white.png',
    favicon: '/favicon.ico',
  },

  // Social media
  social: {
    twitter: 'https://twitter.com/skywage',
    facebook: 'https://facebook.com/skywage',
    instagram: 'https://instagram.com/skywage',
  },

  // Contact information
  contact: {
    email: 'info@skywage.com',
    support: 'support@skywage.com',
  },
};

/**
 * Get a CSS variable reference to a brand color
 * @param colorName The name of the color to reference
 * @returns A CSS variable reference string
 */
export function brandColor(colorName: keyof typeof BRAND.colors): string {
  return `var(--skywage-${colorName})`;
}

export default BRAND;

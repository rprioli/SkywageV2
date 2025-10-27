/**
 * Feature Flags System
 * Manages feature toggles for gradual rollout and A/B testing
 */

export const FEATURE_FLAGS = {
  // New flight cards redesign - enabled for testing
  NEW_FLIGHT_CARDS: process.env.NEXT_PUBLIC_NEW_FLIGHT_CARDS === 'true' || true, // Temporarily enabled for development

  // Layover pairing fix - controlled rollout (enabled for development testing)
  LAYOVER_PAIRING_FIX: process.env.NEXT_PUBLIC_LAYOVER_PAIRING_FIX === 'true' ||
                       (process.env.NODE_ENV === 'development' && true), // Temporarily enabled for dev testing

  // Future feature flags can be added here
  // ENHANCED_ROSTER_UPLOAD: process.env.NEXT_PUBLIC_ENHANCED_ROSTER_UPLOAD === 'true',
  // MOBILE_OPTIMIZATIONS: process.env.NEXT_PUBLIC_MOBILE_OPTIMIZATIONS === 'true',
} as const;

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Get all enabled feature flags
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag);
}

/**
 * Development helper to override feature flags
 * Only works in development mode
 */
export function overrideFeatureFlag(
  flag: keyof typeof FEATURE_FLAGS,
  enabled: boolean
): void {
  if (process.env.NODE_ENV === 'development') {
    // @ts-expect-error - Intentionally modifying readonly object in development
    FEATURE_FLAGS[flag] = enabled;
    console.log(`Feature flag ${flag} overridden to ${enabled}`);
  } else {
    console.warn('Feature flag overrides are only available in development mode');
  }
}

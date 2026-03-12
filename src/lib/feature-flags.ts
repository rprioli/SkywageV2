/**
 * Feature Flags System
 * Manages feature toggles for gradual rollout and A/B testing
 */

export const FEATURE_FLAGS = {
  // Layover pairing fix - controlled rollout (enabled for development testing)
  LAYOVER_PAIRING_FIX: process.env.NEXT_PUBLIC_LAYOVER_PAIRING_FIX === 'true' ||
                       (process.env.NODE_ENV === 'development' && true), // Temporarily enabled for dev testing
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
  }
  // Feature flag overrides are only available in development mode
}

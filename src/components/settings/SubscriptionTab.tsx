'use client';

import { ProfileSettingsSection } from '@/components/profile/ProfileSettingsSection';

/**
 * SubscriptionTab - Subscription management
 * Will be implemented in a future phase
 */
export const SubscriptionTab = () => {
  return (
    <div className="space-y-6">
      <ProfileSettingsSection title="Subscription">
        <div className="py-5">
          <p className="text-sm text-muted-foreground">
            Subscription management will be available soon.
          </p>
        </div>
      </ProfileSettingsSection>
    </div>
  );
};

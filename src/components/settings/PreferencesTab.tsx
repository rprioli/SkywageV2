'use client';

import { ProfileSettingsSection } from '@/components/profile/ProfileSettingsSection';

/**
 * PreferencesTab - User preferences with toggle switches
 * Persistence will be implemented in Phase 3
 */
export const PreferencesTab = () => {
  return (
    <div className="space-y-6">
      <ProfileSettingsSection title="Privacy">
        <div className="py-5">
          <p className="text-sm text-muted-foreground">
            Privacy preferences will be available soon.
          </p>
        </div>
      </ProfileSettingsSection>

      <ProfileSettingsSection title="Display">
        <div className="py-5">
          <p className="text-sm text-muted-foreground">
            Display preferences will be available soon.
          </p>
        </div>
      </ProfileSettingsSection>
    </div>
  );
};

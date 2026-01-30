'use client';

import { ProfileSettingsSection } from '@/components/profile/ProfileSettingsSection';
import { PositionUpdate } from '@/components/profile/PositionUpdate';

/**
 * ProfessionalDetailsTab - Display professional details and salary rates
 * Full implementation will be in Phase 5
 */
export const ProfessionalDetailsTab = () => {
  return (
    <div className="space-y-6">
      <ProfileSettingsSection title="Role">
        <PositionUpdate />
      </ProfileSettingsSection>

      <ProfileSettingsSection title="Compensation">
        <div className="py-5">
          <p className="text-sm text-muted-foreground">
            Salary rate details will be available soon.
          </p>
        </div>
      </ProfileSettingsSection>
    </div>
  );
};

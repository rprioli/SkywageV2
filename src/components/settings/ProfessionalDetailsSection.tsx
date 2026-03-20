'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/contexts/ProfileProvider';
import { ProfileSettingsSection } from '@/components/profile/ProfileSettingsSection';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { PositionUpdate } from '@/components/profile/PositionUpdate';
import { getPositionName } from '@/lib/positionUtils';
import { getPositionRatesForDate } from '@/lib/salary-calculator/calculation-engine';
import { getProfile } from '@/lib/db';
import { Position, SalaryRates } from '@/types/salary-calculator';
import { Loader2, Info } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatCurrency = (amount: number): string => currencyFormatter.format(amount);

export const ProfessionalDetailsSection = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [positionLoading, setPositionLoading] = useState(false);

  useEffect(() => {
    if (profile?.position) {
      setCurrentPosition(profile.position as Position);
    }
  }, [profile?.position]);

  const refreshPosition = useCallback(async () => {
    if (!user?.id) return;

    setPositionLoading(true);
    try {
      const { data: freshProfile, error } = await getProfile(user.id);
      if (freshProfile && !error && freshProfile.position) {
        setCurrentPosition(freshProfile.position as Position);
      }
    } catch {
      // Silently handle error
    } finally {
      setPositionLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const handlePositionUpdate = () => {
      refreshPosition();
    };

    window.addEventListener('userPositionUpdated', handlePositionUpdate);
    return () => {
      window.removeEventListener('userPositionUpdated', handlePositionUpdate);
    };
  }, [refreshPosition]);

  const rates: SalaryRates | null = useMemo(() => {
    if (!currentPosition) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return getPositionRatesForDate(currentPosition, currentYear, currentMonth);
  }, [currentPosition]);

  const isAirlineSupported = profile?.airline?.toLowerCase() === 'flydubai';

  const loading = profileLoading || positionLoading;

  if (loading && !currentPosition) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#4C49ED]" />
        <span className="ml-2 text-muted-foreground">Loading professional details...</span>
      </div>
    );
  }

  return (
    <ProfileSettingsSection title="Professional details">
      <PositionUpdate />
      {!isAirlineSupported ? (
          <div className="py-5">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Salary configuration not available
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Salary rate details are currently only available for Flydubai crew members.
                  Your airline ({profile?.airline || 'Not set'}) is not yet supported.
                </p>
              </div>
            </div>
          </div>
        ) : !rates ? (
          <div className="py-5">
            <p className="text-sm text-muted-foreground">
              Unable to load salary rates. Please ensure your position is set.
            </p>
          </div>
        ) : (
          <>
            <ProfileSettingsRow
              label="Base Salary"
              value={formatCurrency(rates.basicSalary)}
            />
            <ProfileSettingsRow
              label="Housing Allowance"
              value={formatCurrency(rates.housingAllowance)}
            />
            <ProfileSettingsRow
              label="Transportation Allowance"
              value={formatCurrency(rates.transportAllowance)}
            />
            <ProfileSettingsRow
              label="Flight Hour Rate"
              value={`${formatCurrency(rates.hourlyRate)}/hr`}
            />
            <ProfileSettingsRow
              label="Per Diem Rate"
              value={`${formatCurrency(rates.perDiemRate)}/hr`}
            />
            <div className="py-4">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  These rates are based on your current position ({getPositionName(currentPosition || '')})
                  and reflect the latest salary structure effective from July 2025.
                  Rates may vary for calculations on months before this date.
                </p>
              </div>
            </div>
          </>
        )}
    </ProfileSettingsSection>
  );
};

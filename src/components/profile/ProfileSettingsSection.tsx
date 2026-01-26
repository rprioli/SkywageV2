import React from 'react';
import { cn } from '@/lib/utils';

interface ProfileSettingsSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ProfileSettingsSection({
  title,
  children,
  className,
}: ProfileSettingsSectionProps) {
  return (
    <section className={cn("mb-10", className)}>
      <h2 className="text-2xl font-bold mb-4 text-[#3A3780]">{title}</h2>
      <div className="divide-y divide-border border-t border-b border-border">
        {children}
      </div>
    </section>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card className={cn("bg-white rounded-3xl !border-0 !shadow-none mb-6", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-brand-ink">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

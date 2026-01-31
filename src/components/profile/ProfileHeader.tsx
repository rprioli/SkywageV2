'use client';

import React from 'react';
import { AvatarUpload } from './AvatarUpload';
import { Card, CardContent } from '@/components/ui/card';

interface ProfileHeaderProps {
  fullName: string;
  email: string;
  onAvatarUploadComplete: () => void;
}

export function ProfileHeader({
  fullName,
  email,
  onAvatarUploadComplete,
}: ProfileHeaderProps) {
  return (
    <Card className="bg-white rounded-3xl !border-0 !shadow-none">
      <CardContent className="px-8 py-6 flex flex-col sm:flex-row items-center gap-8">
        <div className="flex-shrink-0">
          <AvatarUpload onUploadComplete={onAvatarUploadComplete} size={100} />
        </div>
        
        <div className="min-w-0 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-brand-ink mb-1">{fullName}</h2>
          <p className="text-muted-foreground">{email}</p>
        </div>
      </CardContent>
    </Card>
  );
}

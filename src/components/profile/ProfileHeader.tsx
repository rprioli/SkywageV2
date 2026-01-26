'use client';

import React from 'react';
import { AvatarUpload } from './AvatarUpload';
import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const { isMobile, toggleSidebar, isSidebarOpen } = useMobileNavigation();

  return (
    <div className="mb-10 relative">
      {/* Hamburger Menu - Mobile Only - Absolute positioned to not mess with vertical layout */}
      {isMobile && (
        <div className="absolute top-0 right-0 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={`flex-shrink-0 p-3 rounded-lg touch-target transition-colors ${
              isSidebarOpen
                ? 'bg-primary/10 hover:bg-primary/20 text-primary'
                : 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
            }`}
            aria-label="Toggle navigation menu"
            aria-expanded={isSidebarOpen}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      )}

      <div className="flex flex-col items-start gap-4">
        <div className="flex-shrink-0">
          <AvatarUpload onUploadComplete={onAvatarUploadComplete} size={100} />
        </div>
        
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-[#3A3780] mb-1">{fullName}</h1>
          <p className="text-muted-foreground">{email}</p>
        </div>
      </div>
    </div>
  );
}

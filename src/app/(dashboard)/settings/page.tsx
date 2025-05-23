'use client';

import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="p-6 border border-border rounded-lg bg-card mb-6">
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
      
      <div className="p-6 border border-border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        
        <p className="text-muted-foreground mb-4">
          Manage your account settings and preferences
        </p>
        
        {/* Account settings will be implemented in future iterations */}
      </div>
    </div>
  );
}

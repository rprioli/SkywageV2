'use client';

import { useAuth } from '@/contexts/AuthProvider';

export default function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Welcome, {user?.user_metadata?.first_name || 'User'}
      </h1>
      
      <p className="text-muted-foreground mb-8">
        This is your dashboard where you can view your latest roster and earnings.
      </p>
      
      {/* Dashboard content will be implemented in future iterations */}
      <div className="p-8 border border-border rounded-lg bg-card text-center">
        <h2 className="text-xl font-semibold mb-2">Your Flight Roster</h2>
        <p className="text-muted-foreground">
          Upload your roster to see your flights and earnings.
        </p>
      </div>
    </div>
  );
}

'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen" style={{ backgroundColor: 'rgba(76, 73, 237, 0.05)' }}>
        <DashboardSidebar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

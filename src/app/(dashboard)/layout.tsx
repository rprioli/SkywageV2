'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { MobileHeader } from '@/components/dashboard/MobileHeader';
import { MobileNavigationProvider, useMobileNavigation } from '@/contexts/MobileNavigationProvider';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobile, isTablet, isSidebarOpen, closeSidebar } = useMobileNavigation();

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'rgba(76, 73, 237, 0.05)' }}>
      {/* Mobile Header - Hidden for dashboard page (hamburger integrated into greeting) */}
      {/* Kept for other pages that might need it */}
      {/* {isMobile && <MobileHeader />} */}

      {/* Sidebar */}
      <DashboardSidebar />

      {/* Mobile Overlay - Only visible when sidebar is open on mobile */}
      {(isMobile || isTablet) && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main Content - No top padding on mobile since MobileHeader is hidden */}
      <main className={`
        flex-1 overflow-auto transition-all duration-300
        ${isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-6'}
      `}>
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <MobileNavigationProvider>
        <DashboardLayoutContent>
          {children}
        </DashboardLayoutContent>
      </MobileNavigationProvider>
    </ProtectedRoute>
  );
}

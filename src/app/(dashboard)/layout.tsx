'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { MobileNavigationProvider, useMobileNavigation } from '@/contexts/MobileNavigationProvider';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobile, isTablet, isDesktop, isSidebarOpen, closeSidebar } = useMobileNavigation();

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'rgba(76, 73, 237, 0.05)' }}>
      {/* Mobile Header - Hidden for dashboard page (hamburger integrated into greeting) */}
      {/* Kept for other pages that might need it */}
      {/* {isMobile && <MobileHeader />} */}

      {/* Sidebar - Fixed on desktop, overlay on mobile/tablet */}
      <DashboardSidebar />

      {/* Mobile Overlay - Only visible when sidebar is open on mobile */}
      {(isMobile || isTablet) && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main Content - Centered on desktop, full-width on mobile/tablet */}
      <main className={`
        flex-1 overflow-auto transition-all duration-300
        ${isDesktop ? 'ml-[280px]' : ''}
      `}>
        {/* Centered content wrapper - only applies max-width on desktop */}
        <div className={`
          ${isDesktop ? 'max-w-[1600px] mx-auto' : ''}
          ${isMobile ? 'px-3 py-3' : isTablet ? 'px-4 py-4' : 'px-6 py-6'}
        `}>
          {children}
        </div>
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

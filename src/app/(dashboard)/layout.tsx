'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { MobileNavigationProvider, useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import { FriendsProvider } from '@/contexts/FriendsProvider';
import { ProfileProvider } from '@/contexts/ProfileProvider';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobile, isTablet, isDesktop, isReady, isSidebarOpen, closeSidebar } = useMobileNavigation();

  // Show minimal loading state until screen size is determined (avoids FOUC)
  if (!isReady) {
    return (
      <div className="flex h-dvh bg-[rgba(76,73,237,0.05)]">
        <div className="flex-1 overflow-hidden" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh bg-[rgba(76,73,237,0.05)]">
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

      {/* Main Content - CSS-driven sidebar margin prevents hydration mismatch */}
      {/* overflow-y-scroll ensures scrollbar space is always reserved, preventing layout shift */}
      <main className="flex-1 overflow-y-scroll overflow-x-hidden transition-all duration-300 lg:ml-[280px]">
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
        <ProfileProvider>
          <FriendsProvider>
            <DashboardLayoutContent>
              {children}
            </DashboardLayoutContent>
          </FriendsProvider>
        </ProfileProvider>
      </MobileNavigationProvider>
    </ProtectedRoute>
  );
}

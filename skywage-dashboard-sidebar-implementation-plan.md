# beep-beep! Skywage Dashboard Navigation Sidebar Implementation Plan

## Introduction

This document outlines the implementation plan for the Skywage Dashboard Navigation Sidebar based on the provided requirements. The sidebar will serve as the main navigation component for authenticated users, providing access to key application features while maintaining the Skywage brand identity.

## Requirements Analysis

### 1. Navigation Sidebar Styling
- Use ONLY the official Skywage brand colors:
  - Primary: Purple (#4C49ED) - For sidebar background
  - Accent: Green (#6DDC91)
  - Neutral: White (#FFFFFF) - For text and icons in the sidebar

### 2. Sidebar Navigation Structure
- Implement exactly these menu items in this order:
  1. **Dashboard** - Main overview showing the latest uploaded roster with flight details and associated earnings
  2. **Statistics** - Data visualizations including YTD earnings, monthly earnings trends, and flight data analytics
  3. **Profile** - User profile management
  4. **Settings** - Application preferences and account settings
- Place the Skywage logo at the top of the sidebar above the user profile information
- Add a "Logout" option at the very bottom of the sidebar

### 3. Component Implementation
- Skip the Flight Map Visualization for now
- Flight/Duty Cards will be implemented later

## Current Codebase Analysis

### Existing Components and Utilities

1. **Brand and Styling**
   - `src/lib/brand.ts`: Contains BRAND object with color definitions
   - `src/app/globals.css`: CSS variables for brand colors
   - Tailwind CSS for styling

2. **UI Components**
   - `src/components/ui/Logo.tsx`: Logo component with color and white variants
   - `src/components/ui/ThemeToggle.tsx`: Theme toggle component

3. **Authentication**
   - `src/contexts/AuthProvider.tsx`: Auth context provider
   - `src/hooks/useAuthentication.ts`: Authentication hooks including handleLogout
   - `src/components/ProtectedRoute.tsx`: Component for securing authenticated routes

4. **Routing**
   - Next.js App Router for page routing
   - No existing dashboard components or layout

## Implementation Plan

### 1. File Structure

```
src/
├── app/
│   ├── (dashboard)/           # Route group for authenticated pages
│   │   ├── layout.tsx         # Shared dashboard layout
│   │   ├── dashboard/         # Main dashboard page
│   │   │   └── page.tsx
│   │   ├── statistics/        # Statistics page
│   │   │   └── page.tsx
│   │   ├── profile/           # Profile page
│   │   │   └── page.tsx
│   │   └── settings/          # Settings page
│   │       └── page.tsx
├── components/
│   ├── dashboard/
│   │   └── DashboardSidebar.tsx  # Sidebar navigation component
```

### 2. Component Implementation

#### 2.1 Dashboard Sidebar Component

The `DashboardSidebar.tsx` component will:
- Use the primary brand color (#4C49ED) as background
- Display the Skywage logo (white variant) at the top
- Show user profile information below the logo
- Provide navigation links for Dashboard, Statistics, Profile, and Settings
- Include a Logout button at the bottom
- Highlight the active route

#### 2.2 Dashboard Layout

The dashboard layout will:
- Wrap content in the ProtectedRoute component to ensure authentication
- Use a flex layout with the sidebar on the left and main content on the right
- Make the main content area scrollable

#### 2.3 Basic Page Components

Create minimal page components for:
- Dashboard
- Statistics
- Profile
- Settings

### 3. Step-by-Step Implementation Process

1. **Create Dashboard Directory Structure**
   - Create the necessary directories and files as outlined in the file structure

2. **Implement DashboardSidebar Component**
   - Create the sidebar component with proper styling and navigation
   - Integrate with authentication context for user data and logout functionality

3. **Create Dashboard Layout**
   - Implement the layout component that includes the sidebar and main content area
   - Ensure proper authentication protection

4. **Create Basic Page Components**
   - Implement minimal versions of each page component
   - Include placeholders for future content

5. **Test Navigation and Authentication Flow**
   - Verify that navigation works correctly
   - Ensure authentication and redirection function as expected

## Detailed Component Specifications

### DashboardSidebar Component

```tsx
// src/components/dashboard/DashboardSidebar.tsx
'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { useAuthentication } from '@/hooks/useAuthentication';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BarChart, 
  User, 
  Settings,
  LogOut
} from 'lucide-react';

export default function DashboardSidebar() {
  const { user } = useAuth();
  const { handleLogout, loading } = useAuthentication();
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Statistics', href: '/statistics', icon: BarChart },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];
  
  return (
    <div className="w-64 bg-primary text-white flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 flex justify-center">
        <Logo variant="white" width={150} height={40} />
      </div>
      
      {/* Profile section */}
      <div className="px-6 py-4 flex flex-col items-center border-b border-white/10">
        <div className="w-16 h-16 rounded-full bg-white/20 overflow-hidden mb-3">
          <img 
            src={user?.user_metadata?.avatar_url || '/images/default-avatar.png'} 
            alt="Profile" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/default-avatar.png';
            }}
          />
        </div>
        <h3 className="font-medium text-sm">
          {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
        </h3>
        <p className="text-xs text-white/70 truncate max-w-full">
          {user?.email}
        </p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link 
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-white/10 text-white" 
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Logout button */}
      <div className="p-4 mt-auto border-t border-white/10">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center w-full px-3 py-3 rounded-md text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
```

### Dashboard Layout

```tsx
// src/app/(dashboard)/layout.tsx
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
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

## Testing Plan

1. **Authentication Flow**
   - Verify that unauthenticated users are redirected to login
   - Confirm that after login, users are redirected to the dashboard
   - Test logout functionality

2. **Navigation Testing**
   - Verify that all navigation links work correctly
   - Confirm that the active route is properly highlighted
   - Test that the sidebar displays correctly on different screen sizes

3. **User Data Display**
   - Verify that user profile information is displayed correctly
   - Test fallbacks for missing user data

## Future Considerations

1. **Flight/Duty Cards Implementation**
   - Plan for displaying flight information extracted from uploaded rosters
   - Design cards to show route, duration, and pay information

2. **Responsive Design**
   - Consider how the sidebar will behave on smaller screens
   - Plan for mobile navigation alternatives

3. **Additional Features**
   - Consider adding notifications or alerts in the sidebar
   - Plan for potential additional navigation items

## Conclusion

This implementation plan provides a comprehensive roadmap for creating the Skywage Dashboard Navigation Sidebar according to the specified requirements. By following this plan, we can ensure a consistent, user-friendly navigation experience that aligns with the Skywage brand identity while maintaining clean, organized code that follows best practices.

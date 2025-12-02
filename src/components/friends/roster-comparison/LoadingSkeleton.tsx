'use client';

/**
 * Loading Skeleton Component
 * Shows placeholder rows while roster data is loading
 */

export function LoadingSkeleton() {
  return (
    <div className="space-y-0.5 sm:space-y-1">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="grid grid-cols-[50px_1fr_1fr] sm:grid-cols-[70px_1fr_1fr] gap-1 sm:gap-2 py-0.5 sm:py-1">
          {/* Date skeleton */}
          <div className="flex flex-col items-center justify-center py-1 sm:py-2">
            <div className="h-2.5 sm:h-3 w-4 sm:w-8 animate-pulse rounded-lg bg-gray-100" />
            <div className="mt-1 h-5 sm:h-7 w-5 sm:w-6 animate-pulse rounded-lg bg-gray-100" />
            <div className="mt-1 h-2.5 sm:h-3 w-6 sm:w-8 animate-pulse rounded-lg bg-gray-100" />
          </div>
          {/* User tile skeleton */}
          <div className="min-h-[48px] sm:min-h-[60px] animate-pulse rounded-xl bg-gray-100" />
          {/* Friend tile skeleton */}
          <div className="min-h-[48px] sm:min-h-[60px] animate-pulse rounded-xl bg-gray-100" />
        </div>
      ))}
    </div>
  );
}


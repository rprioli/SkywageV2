'use client';

/**
 * Loading Skeleton for Flight Duties Table
 * Shows placeholder cards while data is loading
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function LoadingSkeleton() {
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4 px-2 md:px-4">
        <h2 className="text-responsive-2xl font-bold" style={{ color: '#3A3780' }}>Flight Duties</h2>
      </CardHeader>
      <CardContent className="px-2 md:px-4">
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 bg-gray-50/50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="h-5 w-20 bg-gray-200 animate-pulse rounded-md"></div>
                    <div className="h-6 w-24 bg-gray-200 animate-pulse rounded-full"></div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-28 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-lg"></div>
                  <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


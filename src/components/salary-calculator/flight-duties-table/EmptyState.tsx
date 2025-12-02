'use client';

/**
 * Empty State for Flight Duties Table
 * Shown when no flight duties are found
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane } from 'lucide-react';

export function EmptyState() {
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4 px-2 md:px-4">
        <CardTitle className="text-responsive-xl font-semibold">Flight Duties</CardTitle>
      </CardHeader>
      <CardContent className="px-2 md:px-4">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plane className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-responsive-lg font-medium text-gray-900 space-responsive-sm">No flight duties found</h3>
          <p className="text-responsive-sm text-gray-500 max-w-sm mx-auto">
            Upload a roster CSV file or add flights manually to get started with your salary calculations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


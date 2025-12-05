'use client';

/**
 * Empty State for Flight Duties Table
 * Shown when no flight duties are found
 */

import { Plane } from 'lucide-react';

interface EmptyStateProps {
  /** Whether this is showing because duties are filtered out vs no duties at all */
  isFilteredEmpty?: boolean;
}

export function EmptyState({ isFilteredEmpty = false }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Plane className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-responsive-lg font-medium text-gray-900 space-responsive-sm">
        {isFilteredEmpty ? 'No flight duties to display' : 'No flight duties found'}
      </h3>
      <p className="text-responsive-sm text-gray-500 max-w-sm mx-auto">
        {isFilteredEmpty 
          ? 'Toggle "Off Days" to show days off, rest days, and annual leave.'
          : 'Upload a roster CSV file or add flights manually to get started with your salary calculations.'}
      </p>
    </div>
  );
}


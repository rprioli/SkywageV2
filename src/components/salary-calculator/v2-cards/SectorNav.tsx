'use client';

/**
 * SectorNav — Left/right chevron buttons for navigating between destinations/sectors.
 * Absolutely positioned at the right-center of the parent (must be position: relative).
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SectorNavProps {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function SectorNav({ canPrev, canNext, onPrev, onNext }: SectorNavProps) {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        disabled={!canPrev}
        className="text-[#3A3780]/40 disabled:opacity-15 hover:enabled:text-[#4C49ED] transition-colors"
        aria-label="Previous sector"
      >
        <ChevronLeft size={26} strokeWidth={1.75} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        disabled={!canNext}
        className="text-[#3A3780]/40 disabled:opacity-15 hover:enabled:text-[#4C49ED] transition-colors"
        aria-label="Next sector"
      >
        <ChevronRight size={26} strokeWidth={1.75} />
      </button>
    </div>
  );
}

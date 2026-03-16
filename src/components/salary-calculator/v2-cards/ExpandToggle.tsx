'use client';

/**
 * ExpandToggle — Small chevron button that sits at the bottom edge of a panel.
 * Rotates 180° when expanded.
 */

import { ChevronDown } from 'lucide-react';

interface ExpandToggleProps {
  expanded: boolean;
  onClick: () => void;
}

export function ExpandToggle({ expanded, onClick }: ExpandToggleProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10 rounded-full bg-white/80 border border-white/80 shadow-[0_4px_12px_rgba(58,55,128,0.10)] p-1 text-[#3A3780]/40 hover:text-[#4C49ED] transition-all"
      aria-label={expanded ? 'Collapse details' : 'Expand details'}
    >
      <ChevronDown
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
      />
    </button>
  );
}

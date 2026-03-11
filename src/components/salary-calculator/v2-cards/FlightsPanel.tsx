/**
 * FlightsPanel — Secondary panel showing flight rows and summary tags.
 * Uses min-height + flex justify-between so cards with fewer rows match taller ones.
 */

import { TAG_CLASS } from './constants';

interface FlightsPanelProps {
  children: React.ReactNode;
  tags: React.ReactNode;
}

export function FlightsPanel({ children, tags }: FlightsPanelProps) {
  return (
    <div className="relative mx-4 mb-4 rounded-[28px] bg-white/36 backdrop-blur-[24px] border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_14px_32px_rgba(58,55,128,0.08)] px-5 py-2.5 flex flex-col justify-between min-h-[108px]">
      <div className="space-y-0.5">
        {children}
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-white/70 flex items-center gap-2.5">
        {tags}
      </div>
    </div>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className={TAG_CLASS}>{children}</span>;
}

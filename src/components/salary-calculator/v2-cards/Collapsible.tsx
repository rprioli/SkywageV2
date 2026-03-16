/**
 * Collapsible — Smooth height animation using CSS grid-template-rows trick.
 * Transitions between 0fr (collapsed) and 1fr (expanded) for buttery animation.
 */

import { GRID_EXPANDED, GRID_COLLAPSED } from './constants';

interface CollapsibleProps {
  open: boolean;
  children: React.ReactNode;
}

export function Collapsible({ open, children }: CollapsibleProps) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-in-out"
      style={open ? GRID_EXPANDED : GRID_COLLAPSED}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

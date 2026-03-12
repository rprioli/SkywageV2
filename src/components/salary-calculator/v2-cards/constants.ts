/**
 * Shared constants for v2 card components.
 */

export const TAG_CLASS = "text-[11px] font-medium text-[#3A3780]/80 px-2.5 py-1 rounded-full bg-[#4C49ED]/8 border border-[#4C49ED]/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.70)] whitespace-nowrap";

/** Pre-computed style objects for Collapsible to avoid re-allocation on render. */
export const GRID_EXPANDED = { gridTemplateRows: '1fr' } as const;
export const GRID_COLLAPSED = { gridTemplateRows: '0fr' } as const;

'use client';

/**
 * PrimaryPanel — The top "header" section of every duty card.
 * Shows date, large IATA/label, subtitle, pay badge, tags, and optional expand toggle.
 */

import { ExpandToggle } from './ExpandToggle';
import { INNER_PANEL_CLASS } from './constants';

interface PrimaryPanelProps {
  date: string;
  title: string;
  subtitle?: string;
  payBadge?: React.ReactNode;
  tags: React.ReactNode;
  nav?: React.ReactNode;
  actions?: React.ReactNode;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export function PrimaryPanel({
  date,
  title,
  subtitle,
  payBadge,
  tags,
  nav,
  actions,
  expandable = false,
  expanded = false,
  onToggle,
}: PrimaryPanelProps) {
  return (
    <div className="relative">
      <div
        className={`relative ${INNER_PANEL_CLASS} px-4 py-5 ${
          expandable ? 'cursor-pointer select-none' : ''
        }`}
        onClick={expandable && onToggle ? onToggle : undefined}
      >
        {actions}
        {nav}

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-slate-400">
              {date}
            </p>
            <p className="-ml-1 text-[52px] leading-none font-semibold tracking-[-0.04em] text-[#3A3780]">
              {title}
            </p>
            {subtitle && (
              <p className="text-[13px] leading-none font-medium text-[#3A3780]/70">
                {subtitle}
              </p>
            )}
          </div>
          {payBadge}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          {tags}
        </div>

        {expandable && onToggle && (
          <ExpandToggle expanded={expanded} onClick={onToggle} />
        )}
      </div>
    </div>
  );
}

export function PayBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full bg-[#4C49ED] text-white px-4 py-3 text-sm font-semibold shadow-[0_14px_28px_rgba(85,84,255,0.26)] whitespace-nowrap">
      {children}
    </div>
  );
}

export function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full bg-[#4C49ED] text-white p-2.5 shadow-[0_14px_28px_rgba(85,84,255,0.26)]">
      {children}
    </div>
  );
}


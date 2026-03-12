'use client';

/**
 * PrimaryPanel — The top "header" section of every duty card.
 * Shows date, large IATA/label, subtitle, pay badge, tags, and optional expand toggle.
 */

import { ExpandToggle } from './ExpandToggle';

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
    <div className="relative px-6 pt-6 pb-5">
      <div
        className={`relative rounded-[30px] bg-white/40 backdrop-blur-[24px] border border-white/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.90),0_12px_30px_rgba(58,55,128,0.08)] px-5 py-5 ${
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
            <p className="text-[52px] leading-none font-semibold tracking-[-0.04em] text-[#3A3780]">
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

        <div className="mt-5 flex flex-wrap items-center gap-2">
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
    <div className="rounded-full bg-[#4C49ED] text-white px-4 py-2.5 text-sm font-semibold shadow-[0_12px_24px_rgba(76,73,237,0.24)] ring-1 ring-white/22 whitespace-nowrap">
      {children}
    </div>
  );
}

export function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full bg-[#4C49ED] text-white p-2.5 shadow-[0_12px_24px_rgba(76,73,237,0.24)] ring-1 ring-white/22">
      {children}
    </div>
  );
}


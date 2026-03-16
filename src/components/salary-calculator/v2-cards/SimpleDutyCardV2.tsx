'use client';

/**
 * SimpleDutyCardV2 — Glassmorphic card for non-flight duties.
 * Used for: ASBY, SBY, Recurrent, Business Promotion, Off, Rest, Annual Leave, Sick.
 * Shows an icon badge (no-pay duties) or a pay badge (paid duties).
 */

import { type LucideIcon } from 'lucide-react';
import { CardShell } from './CardShell';
import { PrimaryPanel, PayBadge, IconBadge } from './PrimaryPanel';
import { Tag } from './FlightsPanel';

export interface SimpleDutyCardV2Props {
  date: string;
  label: string;
  subtitle?: string;
  icon: LucideIcon;
  pay?: string;
  tags: string[];
  actions?: React.ReactNode;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export function SimpleDutyCardV2({
  date,
  label,
  subtitle = 'Dubai, UAE',
  icon: Icon,
  pay,
  tags,
  actions,
  bulkMode = false,
  isSelected = false,
  onToggleSelection,
}: SimpleDutyCardV2Props) {
  return (
    <CardShell bulkMode={bulkMode} isSelected={isSelected} onToggleSelection={onToggleSelection}>
      <PrimaryPanel
        date={date}
        title={label}
        subtitle={subtitle}
        actions={actions}
        payBadge={
          pay ? (
            <PayBadge>{pay}</PayBadge>
          ) : (
            <IconBadge>
              <Icon size={18} strokeWidth={2} />
            </IconBadge>
          )
        }
        tags={
          <>
            {tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </>
        }
      />
    </CardShell>
  );
}

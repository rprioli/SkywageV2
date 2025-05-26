'use client';

import { cn } from '@/lib/utils';

interface PositionSelectProps {
  value: 'CCM' | 'SCCM' | '';
  onValueChange: (value: 'CCM' | 'SCCM') => void;
  disabled?: boolean;
  className?: string;
}

const positions = [
  { value: 'CCM' as const, label: 'Cabin Crew Member', short: 'CCM' },
  { value: 'SCCM' as const, label: 'Senior Cabin Crew Member', short: 'SCCM' },
];

export function PositionSelect({ 
  value, 
  onValueChange, 
  disabled = false, 
  className 
}: PositionSelectProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {positions.map((position) => (
        <button
          key={position.value}
          type="button"
          onClick={() => onValueChange(position.value)}
          disabled={disabled}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium rounded-md border transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            value === position.value
              ? "bg-primary text-white border-primary hover:bg-primary/90"
              : "bg-background text-foreground border-border hover:bg-muted/50"
          )}
          title={position.label}
        >
          <div className="text-center">
            <div className="font-semibold">{position.short}</div>
            <div className="text-xs opacity-90">{position.label}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

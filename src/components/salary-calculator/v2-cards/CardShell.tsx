/**
 * CardShell — Outer card wrapper with subtle glass styling.
 * Provides background, shadow, and optional bulk-selection visual state.
 */

import { Checkbox } from '@/components/ui/checkbox';

interface CardShellProps {
  children: React.ReactNode;
  className?: string;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export function CardShell({
  children,
  className = '',
  bulkMode = false,
  isSelected = false,
  onToggleSelection,
}: CardShellProps) {
  const selectionRing = bulkMode && isSelected ? 'ring-2 ring-[#4C49ED] ring-offset-2' : '';
  const cursor = bulkMode ? 'cursor-pointer' : '';

  return (
    <div
      className={`relative isolate w-full rounded-[34px] border border-white/70 bg-white/35 p-3 shadow-[0_24px_60px_rgba(62,60,140,0.08)] overflow-hidden ${selectionRing} ${cursor} ${className}`}
      onClick={bulkMode && onToggleSelection ? onToggleSelection : undefined}
    >
      {bulkMode && (
        <div className="absolute top-5 left-5 z-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection?.()}
            className="h-5 w-5 border-[#3A3780]/30 data-[state=checked]:bg-[#4C49ED] data-[state=checked]:border-[#4C49ED]"
          />
        </div>
      )}

      {children}
    </div>
  );
}

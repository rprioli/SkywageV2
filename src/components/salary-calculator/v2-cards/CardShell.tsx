/**
 * CardShell — Glassmorphic outer card wrapper
 * Provides the frosted glass background, decorative blobs, shadow,
 * and optional bulk-selection visual state.
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
      className={`relative w-full rounded-[36px] bg-white/64 backdrop-blur-[30px] border border-white/60 shadow-[0_24px_80px_rgba(58,55,128,0.14),inset_0_1px_0_rgba(255,255,255,0.84)] overflow-hidden ${selectionRing} ${cursor} ${className}`}
      onClick={bulkMode && onToggleSelection ? onToggleSelection : undefined}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.56)_0%,rgba(255,255,255,0.18)_100%)] pointer-events-none" />
      <div className="absolute -top-20 right-[-40px] h-52 w-52 rounded-full bg-[#4C49ED]/12 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-40px] h-52 w-52 rounded-full bg-white/38 blur-3xl pointer-events-none" />

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

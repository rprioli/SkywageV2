'use client';

/**
 * CardActions — Three-dot dropdown menu for edit/delete actions on v2 cards.
 * Positioned absolutely in the PrimaryPanel header.
 */

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CardActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CardActions({ onEdit, onDelete }: CardActionsProps) {
  if (!onEdit && !onDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-[#3A3780]/50 hover:text-[#3A3780] hover:bg-white/60 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Times
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PositionSelect } from '@/components/ui/PositionSelect';
import { PositionHistoryEntry } from '@/lib/user-position-history';
import { Position } from '@/types/salary-calculator';
import { Pencil, Trash2 } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: MONTH_NAMES[i] }));
const MIN_YEAR = 2025;
const MAX_YEAR = new Date().getFullYear() + 1;
const YEAR_OPTIONS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

interface EditingState {
  id: string;
  position: Position;
  year: number;
  month: number;
}

interface PositionHistoryTimelineProps {
  entries: PositionHistoryEntry[];
  onUpdate: (id: string, position: Position, year: number, month: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function PositionHistoryTimeline({
  entries,
  onUpdate,
  onDelete,
  isLoading,
}: PositionHistoryTimelineProps) {
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">No position history found.</p>
    );
  }

  const isBaseline = (entry: PositionHistoryEntry) => entry.id === entries[0]?.id;

  const handleEditStart = (entry: PositionHistoryEntry) => {
    setEditing({
      id: entry.id,
      position: entry.position,
      year: entry.effectiveFromYear,
      month: entry.effectiveFromMonth,
    });
  };

  const handleEditSave = async () => {
    if (!editing) return;
    await onUpdate(editing.id, editing.position, editing.year, editing.month);
    setEditing(null);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    await onDelete(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isEditingThis = editing?.id === entry.id;
        const isDeletingThis = confirmDeleteId === entry.id;
        const baseline = isBaseline(entry);

        return (
          <div
            key={entry.id}
            className="rounded-lg border bg-muted/30 p-3 space-y-2"
          >
            {!isEditingThis && !isDeletingThis && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-brand-ink">
                    {entry.position}
                  </span>
                  <span className="text-muted-foreground">
                    effective from {MONTH_NAMES[entry.effectiveFromMonth - 1]} {entry.effectiveFromYear}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleEditStart(entry)}
                    disabled={isLoading}
                    aria-label="Edit position change"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {!baseline && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive/90"
                      onClick={() => setConfirmDeleteId(entry.id)}
                      disabled={isLoading}
                      aria-label="Delete position change"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isEditingThis && editing && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">Edit position change</p>
                <div className="grid grid-cols-3 gap-2">
                  <PositionSelect
                    value={editing.position}
                    onValueChange={(val) => setEditing({ ...editing, position: val as Position })}
                    className="w-full"
                  />
                  <Select
                    value={String(editing.month)}
                    onValueChange={(val) => setEditing({ ...editing, month: Number(val) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(editing.year)}
                    onValueChange={(val) => setEditing({ ...editing, year: Number(val) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_OPTIONS.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEditSave} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(null)} disabled={isLoading}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {isDeletingThis && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Delete this entry? Months from{' '}
                  <strong>{MONTH_NAMES[entry.effectiveFromMonth - 1]} {entry.effectiveFromYear}</strong>{' '}
                  will be recalculated with the previous position.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Deleting...' : 'Delete'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDeleteId(null)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

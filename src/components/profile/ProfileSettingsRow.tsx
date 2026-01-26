import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ProfileSettingsRowProps {
  label: string;
  value?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
    className?: string; // Allow custom classes for the button
  };
  children?: React.ReactNode; // For edit mode content
  className?: string;
  isEditing?: boolean;
}

export function ProfileSettingsRow({
  label,
  value,
  action,
  children,
  className,
  isEditing = false,
}: ProfileSettingsRowProps) {
  return (
    <div className={cn("py-5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 mr-4">
          <p className="text-base font-bold text-[#3A3780]">{label}</p>
          {!isEditing && value && (
            <div className="mt-1 text-sm text-muted-foreground truncate">
              {value}
            </div>
          )}
        </div>
        
        {action && !isEditing && (
          <Button
            variant={action.variant || "ghost"}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              "font-bold h-auto px-2 py-1", 
              action.variant === 'destructive' 
                ? "text-destructive hover:text-destructive/90" 
                : "text-[#3A3780] hover:text-[#3A3780]/90",
              action.className
            )}
          >
            {action.label}
          </Button>
        )}
      </div>
      
      {isEditing && children && (
        <div className="mt-4 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

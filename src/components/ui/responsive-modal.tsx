'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface ResponsiveModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * ResponsiveModal - Adaptive modal component
 * Renders as Dialog on desktop (≥640px), Drawer on mobile (<640px)
 * Avoids CSS overrides by using the appropriate component for each breakpoint
 */
function ResponsiveModal({ children, open, onOpenChange }: ResponsiveModalProps) {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {children}
    </Drawer>
  );
}

function ResponsiveModalTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  if (isDesktop) {
    return (
      <DialogTrigger className={className} {...props}>
        {children}
      </DialogTrigger>
    );
  }

  return (
    <DrawerTrigger className={className} {...props}>
      {children}
    </DrawerTrigger>
  );
}

function ResponsiveModalContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  if (isDesktop) {
    return (
      <DialogContent className={className} {...props}>
        {children}
      </DialogContent>
    );
  }

  // Drawer path: keep the shell clean (vaul-managed classes only).
  // Caller className goes on an inner scroll container so overflow-y-auto
  // doesn't conflict with vaul's drag-to-dismiss gesture.
  return (
    <DrawerContent {...props}>
      <div
        className={cn(
          'overflow-y-auto flex-1 min-h-0 overscroll-contain',
          className,
        )}
      >
        {children}
      </div>
    </DrawerContent>
  );
}

function ResponsiveModalHeader({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  if (isDesktop) {
    return (
      <DialogHeader className={className} {...props}>
        {children}
      </DialogHeader>
    );
  }

  return (
    <DrawerHeader className={className} {...props}>
      {children}
    </DrawerHeader>
  );
}

function ResponsiveModalTitle({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  if (isDesktop) {
    return (
      <DialogTitle className={className} {...props}>
        {children}
      </DialogTitle>
    );
  }

  return (
    <DrawerTitle className={className} {...props}>
      {children}
    </DrawerTitle>
  );
}

function ResponsiveModalDescription({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  if (isDesktop) {
    return (
      <DialogDescription className={className} {...props}>
        {children}
      </DialogDescription>
    );
  }

  return (
    <DrawerDescription className={className} {...props}>
      {children}
    </DrawerDescription>
  );
}

function ResponsiveModalFooter({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  if (isDesktop) {
    return (
      <DialogFooter className={className} {...props}>
        {children}
      </DialogFooter>
    );
  }

  return (
    <DrawerFooter className={className} {...props}>
      {children}
    </DrawerFooter>
  );
}

function ResponsiveModalClose({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerClose>) {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  // Note: Dialog has auto close button, Drawer needs explicit DrawerClose
  if (isDesktop) {
    // For Dialog, we can return null or a custom close button
    // Since Dialog already has a built-in close button, we'll return null
    return null;
  }

  return (
    <DrawerClose className={className} {...props}>
      {children}
    </DrawerClose>
  );
}

export {
  ResponsiveModal,
  ResponsiveModalTrigger,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalClose,
};

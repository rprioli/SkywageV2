'use client';

/**
 * Toast Utility Hook for Skywage
 * Provides easy-to-use toast notifications with Skywage branding
 * Following existing hook patterns in the codebase
 */

import { toast } from 'sonner';
import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const showSuccess = (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: React.createElement(CheckCircle, { className: "h-4 w-4" }),
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      style: {
        background: 'var(--background)',
        border: '1px solid #6DDC91',
        color: 'var(--foreground)',
      },
    });
  };

  const showError = (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      icon: React.createElement(XCircle, { className: "h-4 w-4" }),
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      style: {
        background: 'var(--background)',
        border: '1px solid var(--destructive)',
        color: 'var(--foreground)',
      },
    });
  };

  const showWarning = (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: React.createElement(AlertCircle, { className: "h-4 w-4" }),
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      style: {
        background: 'var(--background)',
        border: '1px solid #f59e0b',
        color: 'var(--foreground)',
      },
    });
  };

  const showInfo = (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: React.createElement(Info, { className: "h-4 w-4" }),
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      style: {
        background: 'var(--background)',
        border: '1px solid #4C49ED',
        color: 'var(--foreground)',
      },
    });
  };

  const showLoading = (message: string, options?: Omit<ToastOptions, 'duration'>) => {
    return toast.loading(message, {
      description: options?.description,
      icon: React.createElement(Loader2, { className: "h-4 w-4 animate-spin" }),
      style: {
        background: 'var(--background)',
        border: '1px solid var(--border)',
        color: 'var(--foreground)',
      },
    });
  };

  const dismiss = (toastId?: string | number) => {
    toast.dismiss(toastId);
  };

  const dismissAll = () => {
    toast.dismiss();
  };

  // Salary Calculator specific toast messages
  const salaryCalculator = {
    csvUploadSuccess: (fileName: string, flightCount: number, customMessage?: string) => {
      showSuccess('Roster uploaded successfully', {
        description: customMessage || `Processed ${flightCount} flights from ${fileName}`,
        duration: 5000,
      });
    },

    csvUploadError: (error: string) => {
      showError('CSV upload failed', {
        description: error,
        duration: 8000,
      });
    },

    flightSaved: (flightNumbers: string[]) => {
      showSuccess('Flight saved successfully', {
        description: `${flightNumbers.join(' ')} has been added to your duties`,
        duration: 4000,
      });
    },

    flightUpdated: (flightNumbers: string[]) => {
      showSuccess('Flight updated successfully', {
        description: `${flightNumbers.join(' ')} has been updated`,
        duration: 4000,
      });
    },

    flightDeleted: (flightNumbers: string[]) => {
      showSuccess('Flight deleted successfully', {
        description: `${flightNumbers.join(' ')} has been removed from your duties`,
        duration: 4000,
      });
    },

    bulkDeleteSuccess: (count: number) => {
      showSuccess(`${count} flights deleted successfully`, {
        description: 'Your monthly calculation has been updated',
        duration: 4000,
      });
    },

    calculationError: (error: string) => {
      showError('Calculation error', {
        description: error,
        duration: 6000,
      });
    },

    validationError: (field: string, error: string) => {
      showWarning(`${field} validation error`, {
        description: error,
        duration: 5000,
      });
    },

    processingStarted: (fileName: string) => {
      return showLoading(`Processing ${fileName}...`, {
        description: 'Please wait while we calculate your salary',
      });
    },

    // Add dismiss function to salaryCalculator object
    dismiss: (toastId?: string | number) => {
      toast.dismiss(toastId);
    },
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismiss,
    dismissAll,
    salaryCalculator,
  };
}

export type Toast = ReturnType<typeof useToast>;

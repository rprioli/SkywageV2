"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertCircle } from "lucide-react"

interface FormFieldProps {
  children: React.ReactNode
  label?: string
  error?: string
  success?: string
  hint?: string
  required?: boolean
  className?: string
  id?: string
}

export function FormField({
  children,
  label,
  error,
  success,
  hint,
  required = false,
  className,
  id
}: FormFieldProps) {
  const fieldId = id || React.useId()
  const hasError = !!error
  const hasSuccess = !!success && !hasError

  return (
    <div className={cn("form-field-spacing-sm", className)}>
      {label && (
        <label 
          htmlFor={fieldId} 
          className="form-label-responsive block"
        >
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          className: cn(
            (children as React.ReactElement).props.className,
            hasError && "form-field-error",
            hasSuccess && "form-field-success"
          ),
          "aria-invalid": hasError,
          "aria-describedby": cn(
            error && `${fieldId}-error`,
            success && `${fieldId}-success`,
            hint && `${fieldId}-hint`
          ).trim() || undefined
        })}
        
        {/* Success icon */}
        {hasSuccess && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )}
        
        {/* Error icon */}
        {hasError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <p 
          id={`${fieldId}-error`}
          className="text-destructive form-error-responsive flex items-center gap-1"
          role="alert"
        >
          <span className="text-destructive">•</span>
          {error}
        </p>
      )}
      
      {/* Success message */}
      {success && !error && (
        <p 
          id={`${fieldId}-success`}
          className="text-green-600 form-error-responsive flex items-center gap-1"
        >
          <span className="text-green-600">•</span>
          {success}
        </p>
      )}
      
      {/* Hint text */}
      {hint && !error && !success && (
        <p 
          id={`${fieldId}-hint`}
          className="text-muted-foreground form-error-responsive"
        >
          {hint}
        </p>
      )}
    </div>
  )
}

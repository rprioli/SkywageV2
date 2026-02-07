'use client';

import React, { useState } from 'react';
import { useAuthentication } from '@/hooks/useAuthentication';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const { handleLogin, loading, error, isRetrying, retryCount } = useAuthentication();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
  });
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user types
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
    };
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setValidationErrors(errors);
    
    // Return true if no errors
    return !Object.values(errors).some(error => error);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await handleLogin(formData.email, formData.password);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className={cn(
            validationErrors.email ? "border-destructive" : ""
          )}
          placeholder="your.email@example.com"
        />
        {validationErrors.email && (
          <p className="text-destructive text-sm">{validationErrors.email}</p>
        )}
      </div>
      
      {/* Password */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className={cn(
            validationErrors.password ? "border-destructive" : ""
          )}
          placeholder="••••••••"
        />
        {validationErrors.password && (
          <p className="text-destructive text-sm">{validationErrors.password}</p>
        )}
      </div>

      {/* Error message from API with retry status */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-destructive text-sm">{error}</p>
          {isRetrying && retryCount > 0 && (
            <p className="text-muted-foreground text-xs mt-1">
              Retrying... (attempt {retryCount}/3)
            </p>
          )}
        </div>
      )}

      {/* Retry status without error */}
      {isRetrying && !error && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm">
            Connection issue detected. Retrying... (attempt {retryCount}/3)
          </p>
        </div>
      )}
      
      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isRetrying ? `Retrying... (${retryCount}/3)` : 'Signing in...'}
          </span>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthentication } from '@/hooks/useAuthentication';
import { cn } from '@/lib/utils';
import { CountrySelect } from '@/components/ui/CountrySelect';

export function RegisterForm() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';

  const { handleRegister, loading, error } = useAuthentication();

  // Form state
  const [formData, setFormData] = useState({
    email: emailFromQuery,
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
    airline: 'Flydubai', // Default airline
    position: 'CCM' as 'CCM' | 'SCCM', // Default position
    nationality: '', // Optional nationality
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
  });

  // Update email if it changes in the URL
  useEffect(() => {
    if (emailFromQuery) {
      setFormData(prev => ({ ...prev, email: emailFromQuery }));
    }
  }, [emailFromQuery]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear validation error when user types
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle position selection
  const handlePositionSelect = (position: 'CCM' | 'SCCM') => {
    setFormData(prev => ({ ...prev, position }));
  };

  // Handle nationality selection
  const handleNationalitySelect = (nationality: string) => {
    setFormData(prev => ({ ...prev, nationality }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      firstName: '',
      lastName: '',
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
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Username validation
    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3 || formData.username.length > 20) {
      errors.username = 'Username must be between 3 and 20 characters';
    } else if (!/^[a-z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain lowercase letters, numbers, and underscores';
    }

    // Name validation
    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    }

    setValidationErrors(errors);

    // Return true if no errors
    return !Object.values(errors).some(error => error);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      await handleRegister(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.airline,
        formData.position,
        formData.username,
        formData.nationality || undefined // Only pass nationality if it's not empty
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className={cn(
            "w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/50",
            validationErrors.email ? "border-destructive" : "border-border"
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
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className={cn(
            "w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/50",
            validationErrors.password ? "border-destructive" : "border-border"
          )}
          placeholder="••••••••"
        />
        {validationErrors.password && (
          <p className="text-destructive text-sm">{validationErrors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={cn(
            "w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/50",
            validationErrors.confirmPassword ? "border-destructive" : "border-border"
          )}
          placeholder="••••••••"
        />
        {validationErrors.confirmPassword && (
          <p className="text-destructive text-sm">{validationErrors.confirmPassword}</p>
        )}
      </div>

      {/* Username */}
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={(e) => {
            // Enforce lowercase and format in real-time
            const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
            setFormData(prev => ({ ...prev, username: sanitized }));
          }}
          className={cn(
            "w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/50",
            validationErrors.username ? "border-destructive" : "border-border"
          )}
          placeholder="username"
          maxLength={20}
        />
        <p className="text-xs text-muted-foreground">
          3-20 characters, lowercase letters, numbers, and underscores only
        </p>
        {validationErrors.username && (
          <p className="text-destructive text-sm">{validationErrors.username}</p>
        )}
      </div>

      {/* First Name */}
      <div className="space-y-2">
        <label htmlFor="firstName" className="block text-sm font-medium">
          First Name
        </label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleChange}
          className={cn(
            "w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/50",
            validationErrors.firstName ? "border-destructive" : "border-border"
          )}
          placeholder="John"
        />
        {validationErrors.firstName && (
          <p className="text-destructive text-sm">{validationErrors.firstName}</p>
        )}
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <label htmlFor="lastName" className="block text-sm font-medium">
          Last Name
        </label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={handleChange}
          className={cn(
            "w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/50",
            validationErrors.lastName ? "border-destructive" : "border-border"
          )}
          placeholder="Doe"
        />
        {validationErrors.lastName && (
          <p className="text-destructive text-sm">{validationErrors.lastName}</p>
        )}
      </div>

      {/* Airline */}
      <div className="space-y-2">
        <label htmlFor="airline" className="block text-sm font-medium">
          Airline
        </label>
        <select
          id="airline"
          name="airline"
          value={formData.airline}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="Flydubai">Flydubai</option>
          {/* Add more airlines as needed */}
        </select>
      </div>

      {/* Position */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Position</label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handlePositionSelect('CCM')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              formData.position === 'CCM'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            CCM
          </button>
          <button
            type="button"
            onClick={() => handlePositionSelect('SCCM')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              formData.position === 'SCCM'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            SCCM
          </button>
        </div>
      </div>

      {/* Nationality (Optional) */}
      <div className="space-y-2">
        <label htmlFor="nationality" className="block text-sm font-medium">
          Nationality (Optional)
        </label>
        <CountrySelect
          value={formData.nationality}
          onValueChange={handleNationalitySelect}
          placeholder="Select your nationality"
          className="w-full"
        />
      </div>

      {/* Error message from API */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}

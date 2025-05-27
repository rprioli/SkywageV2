'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email submission - could redirect to registration with email prefilled
    if (email) {
      window.location.href = `/register?email=${encodeURIComponent(email)}`;
    }
  };

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/80 rounded-bl-[30%] md:rounded-bl-[40%] -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6 md:space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Salary calculator for airline cabin crew and pilots
            </h1>
            
            <p className="text-white/90 text-lg md:text-xl max-w-lg">
              Skywage processes your flight roster to break down your salary by fixed and variable components, 
              giving you clear insights into your monthly earnings.
            </p>
            
            {/* Email Input */}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                type="email"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow px-4 py-3 rounded-md text-foreground bg-white border border-transparent focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-accent text-accent-foreground font-medium rounded-md hover:bg-accent/90 transition-colors"
              >
                GO
              </button>
            </form>
          </div>
          
          {/* Right Column - Illustration */}
          <div className="flex justify-center md:justify-end">
            <div className="relative w-full max-w-lg aspect-square">
              {/* Placeholder for illustration - in a real implementation, you'd use an actual illustration */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                <div className="relative w-full h-full">
                  {/* Dashboard mockup */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] bg-white rounded-lg shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="h-8 bg-gray-100 flex items-center px-4">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      {/* Chart */}
                      <div className="w-full h-24 bg-primary/10 rounded-md mb-4 flex items-end justify-between px-2">
                        <div className="w-4 h-12 bg-primary rounded-t-md"></div>
                        <div className="w-4 h-16 bg-primary rounded-t-md"></div>
                        <div className="w-4 h-8 bg-primary rounded-t-md"></div>
                        <div className="w-4 h-20 bg-primary rounded-t-md"></div>
                        <div className="w-4 h-14 bg-primary rounded-t-md"></div>
                        <div className="w-4 h-10 bg-primary rounded-t-md"></div>
                      </div>
                      
                      {/* Data cards */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-16 bg-accent/10 rounded-md"></div>
                        <div className="h-16 bg-primary/10 rounded-md"></div>
                        <div className="h-16 bg-gray-100 rounded-md"></div>
                        <div className="h-16 bg-gray-100 rounded-md"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile app mockup */}
                  <div className="absolute bottom-4 right-4 w-[30%] h-[40%] bg-white rounded-lg shadow-xl overflow-hidden border-4 border-white">
                    {/* Mobile header */}
                    <div className="h-2 bg-accent w-full"></div>
                    
                    {/* Mobile content */}
                    <div className="p-2">
                      <div className="w-full h-8 bg-gray-100 rounded-md mb-2"></div>
                      <div className="w-full h-12 bg-primary/10 rounded-md mb-2"></div>
                      <div className="w-full h-8 bg-accent/10 rounded-md"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

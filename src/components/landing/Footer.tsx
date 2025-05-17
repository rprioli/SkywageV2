'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
  currentPage?: number;
  totalPages?: number;
}

export function Footer({ 
  className,
  currentPage = 1,
  totalPages = 3
}: FooterProps) {
  return (
    <footer className={cn("w-full py-6", className)}>
      <div className="max-w-7xl mx-auto flex justify-center items-center">
        <div className="flex space-x-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-8 h-2 rounded-full transition-colors",
                index + 1 === currentPage 
                  ? "bg-primary" 
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;

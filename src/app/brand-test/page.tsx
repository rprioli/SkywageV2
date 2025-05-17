'use client';

import React from 'react';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BRAND } from '@/lib/brand';

export default function BrandTestPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Logo variant="auto" width={200} height={50} />
          <ThemeToggle />
        </div>

        <h1 className="text-3xl font-bold mb-6">Skywage Brand Test Page</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Brand Colors</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-lg" style={{ backgroundColor: BRAND.colors.primary }}>
              <p className="text-white font-medium">Primary Color</p>
              <p className="text-white opacity-80 text-sm">{BRAND.colors.primary}</p>
            </div>
            
            <div className="p-6 rounded-lg" style={{ backgroundColor: BRAND.colors.accent }}>
              <p className="text-black font-medium">Accent Color</p>
              <p className="text-black opacity-80 text-sm">{BRAND.colors.accent}</p>
            </div>
            
            <div className="p-6 rounded-lg border border-border" style={{ backgroundColor: BRAND.colors.background }}>
              <p className="text-black font-medium">Background Color</p>
              <p className="text-black opacity-80 text-sm">{BRAND.colors.background}</p>
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Logo Variants</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-lg border border-border">
              <h3 className="text-lg font-medium mb-3">Color Logo</h3>
              <Logo variant="color" width={200} height={50} />
            </div>
            
            <div className="p-6 rounded-lg bg-primary">
              <h3 className="text-lg font-medium mb-3 text-white">White Logo</h3>
              <Logo variant="white" width={200} height={50} />
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">UI Elements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-3">Buttons</h3>
              
              <div className="flex flex-wrap gap-4">
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
                  Primary Button
                </button>
                
                <button className="bg-accent text-accent-foreground px-4 py-2 rounded-md">
                  Accent Button
                </button>
                
                <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md">
                  Secondary Button
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-3">Cards</h3>
              
              <div className="bg-card text-card-foreground p-4 rounded-lg border border-border">
                <h4 className="font-medium">Card Title</h4>
                <p className="text-sm text-muted-foreground">This is a card with the brand styling.</p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Typography</h2>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <h2 className="text-3xl font-bold">Heading 2</h2>
            <h3 className="text-2xl font-bold">Heading 3</h3>
            <h4 className="text-xl font-bold">Heading 4</h4>
            <p className="text-base">Regular paragraph text</p>
            <p className="text-sm text-muted-foreground">Muted text</p>
            <p className="text-primary">Primary colored text</p>
            <p className="text-accent">Accent colored text</p>
          </div>
        </section>
      </div>
    </div>
  );
}

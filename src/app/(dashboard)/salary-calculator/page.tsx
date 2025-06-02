'use client';

/**
 * Main Salary Calculator Page for Skywage
 * Phase 3: CSV Upload & Processing Workflow
 * Following existing dashboard page patterns
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Calculator, FileText, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function SalaryCalculatorPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Get user position for display
  const userPosition = user?.user_metadata?.position || 'CCM';
  const userAirline = user?.user_metadata?.airline || 'Flydubai';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">
          Salary Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate your monthly salary from roster files or manual entry
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculator Settings
          </CardTitle>
          <CardDescription>
            Your current airline and position settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Airline</p>
              <p className="font-medium">{userAirline}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Position</p>
              <p className="font-medium">{userPosition}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Upload */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Roster
            </CardTitle>
            <CardDescription>
              Upload your {userAirline} CSV roster file for automatic calculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>• Supports {userAirline} CSV format</p>
                <p>• Automatic flight classification</p>
                <p>• Complete salary breakdown</p>
              </div>
              <Button asChild className="w-full">
                <Link href="/salary-calculator/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CSV File
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Manual Entry
            </CardTitle>
            <CardDescription>
              Enter flight duties manually for custom calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>• Add individual flights</p>
                <p>• Real-time calculation</p>
                <p>• Edit and modify entries</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/salary-calculator/manual')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Manual Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Calculations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Recent Calculations
          </CardTitle>
          <CardDescription>
            Your latest salary calculations and roster uploads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No calculations yet</p>
            <p className="text-sm">Upload a roster file to get started</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

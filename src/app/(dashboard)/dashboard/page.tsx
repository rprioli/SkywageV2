'use client';

/**
 * Main Dashboard Page for Skywage - Now featuring Salary Calculator
 * Restructured from separate salary calculator section to main dashboard
 * Following existing dashboard page patterns
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Calculator, FileText, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
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
          Welcome, {user?.user_metadata?.first_name || 'User'}
        </h1>
        <p className="text-muted-foreground">
          Calculate your monthly salary from roster files or manual entry
        </p>
      </div>

      {/* User Info */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Current Settings</p>
            <div className="flex gap-6 mt-1">
              <span className="text-sm">
                <span className="text-muted-foreground">Position: </span>
                <span className="font-medium">{userPosition}</span>
              </span>
              <span className="text-sm">
                <span className="text-muted-foreground">Airline: </span>
                <span className="font-medium">{userAirline}</span>
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile">Update Profile</Link>
          </Button>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Upload */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Roster
            </CardTitle>
            <CardDescription>
              Upload your CSV roster file for automatic calculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>• Drag & drop CSV files</p>
                <p>• Automatic flight detection</p>
                <p>• Real-time processing</p>
              </div>
              <Button
                className="w-full"
                onClick={() => router.push('/dashboard/upload')}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Roster
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
                onClick={() => router.push('/dashboard/manual')}
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

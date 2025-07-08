'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { getProfile } from '@/lib/db';
import { FLYDUBAI_RATES } from '@/lib/salary-calculator/calculation-engine';
import { Position } from '@/types/salary-calculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PositionTestPage() {
  const { user } = useAuth();
  const [position, setPosition] = useState<Position>('CCM');
  const [loading, setLoading] = useState(true);
  const [authPosition, setAuthPosition] = useState<string>('');
  const [dbPosition, setDbPosition] = useState<string>('');

  useEffect(() => {
    const loadPositions = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        
        // Get position from auth metadata
        const authPos = user?.user_metadata?.position || 'Not set';
        setAuthPosition(authPos);
        
        // Get position from database profile
        const { data: profile, error } = await getProfile(user.id);
        if (profile && !error) {
          setDbPosition(profile.position || 'Not set');
          setPosition(profile.position as Position || 'CCM');
        } else {
          setDbPosition('Error loading');
        }
      } catch (error) {
        console.error('Error loading positions:', error);
        setDbPosition('Error loading');
      } finally {
        setLoading(false);
      }
    };

    loadPositions();
  }, [user?.id]);

  const rates = FLYDUBAI_RATES[position];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Position & Rates Test</h1>
        <p className="text-muted-foreground">
          Test page to verify position retrieval and rate application
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Position Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Position Sources</CardTitle>
            <CardDescription>Compare position from different sources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Auth Metadata:</p>
              <p className="text-lg font-semibold">{authPosition}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Database Profile (Source of Truth):</p>
              <p className="text-lg font-semibold text-primary">{dbPosition}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Currently Used:</p>
              <p className="text-lg font-semibold text-accent">{position}</p>
            </div>
          </CardContent>
        </Card>

        {/* Current Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Current Salary Rates</CardTitle>
            <CardDescription>Rates being applied for {position}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Basic Salary:</span>
              <span className="font-semibold">AED {rates.basicSalary.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Housing Allowance:</span>
              <span className="font-semibold">AED {rates.housingAllowance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Transport Allowance:</span>
              <span className="font-semibold">AED {rates.transportAllowance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Hourly Rate:</span>
              <span className="font-semibold">AED {rates.hourlyRate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Per Diem Rate:</span>
              <span className="font-semibold">AED {rates.perDiemRate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">ASBY Hours:</span>
              <span className="font-semibold">{rates.asbyHours} hours</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Comparison</CardTitle>
          <CardDescription>Compare CCM vs SCCM rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Component</th>
                  <th className="text-right p-2">CCM</th>
                  <th className="text-right p-2">SCCM</th>
                  <th className="text-right p-2">Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Basic Salary</td>
                  <td className="text-right p-2">AED {FLYDUBAI_RATES.CCM.basicSalary.toLocaleString()}</td>
                  <td className="text-right p-2">AED {FLYDUBAI_RATES.SCCM.basicSalary.toLocaleString()}</td>
                  <td className="text-right p-2 text-accent">+AED {(FLYDUBAI_RATES.SCCM.basicSalary - FLYDUBAI_RATES.CCM.basicSalary).toLocaleString()}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Housing Allowance</td>
                  <td className="text-right p-2">AED {FLYDUBAI_RATES.CCM.housingAllowance.toLocaleString()}</td>
                  <td className="text-right p-2">AED {FLYDUBAI_RATES.SCCM.housingAllowance.toLocaleString()}</td>
                  <td className="text-right p-2 text-accent">+AED {(FLYDUBAI_RATES.SCCM.housingAllowance - FLYDUBAI_RATES.CCM.housingAllowance).toLocaleString()}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Hourly Rate</td>
                  <td className="text-right p-2">AED {FLYDUBAI_RATES.CCM.hourlyRate}</td>
                  <td className="text-right p-2">AED {FLYDUBAI_RATES.SCCM.hourlyRate}</td>
                  <td className="text-right p-2 text-accent">+AED {FLYDUBAI_RATES.SCCM.hourlyRate - FLYDUBAI_RATES.CCM.hourlyRate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

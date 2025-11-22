'use client';

/**
 * Roster Comparison Component
 * Side-by-side roster comparison between user and friend
 * Phase 3 - Friends Feature
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { NewFlightDutyCard } from '@/components/salary-calculator/NewFlightDutyCard';
import { FlightDuty } from '@/types/salary-calculator';
import { identifyLayoverPairs } from '@/lib/salary-calculator/card-data-mapper';
import { useAuth } from '@/contexts/AuthProvider';

interface RosterComparisonProps {
  friendId: string;
  friendEmail: string;
  onClose: () => void;
}

interface RosterData {
  myRoster: FlightDuty[];
  friendRoster: FlightDuty[];
  month: number;
  year: number;
}

interface SerializableFlightDuty
  extends Omit<FlightDuty, 'date' | 'lastEditedAt' | 'createdAt' | 'updatedAt'> {
  date?: string | Date;
  lastEditedAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}


function filterLayoverInboundFlights(flightDuties: FlightDuty[]): FlightDuty[] {
  const layoverPairs = identifyLayoverPairs(flightDuties);
  const inboundLayoverIds = new Set(layoverPairs.map(pair => pair.inbound.id));

  return flightDuties.filter(duty => {
    // Keep off days visible in the roster
    if (duty.dutyType === 'off') return true;

    // Hide inbound layover flights that are already part of a connected pair
    if (duty.dutyType === 'layover' && inboundLayoverIds.has(duty.id)) {
      return false;
    }

    return true;
  });
}

export function RosterComparison({ friendId, friendEmail, onClose }: RosterComparisonProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rosterData, setRosterData] = useState<RosterData | null>(null);

  // Initialize to current month/year
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Fetch roster data when month/year changes
  useEffect(() => {
    fetchRosterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, friendId, session]);

  const fetchRosterData = async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/friends/compare-roster?friendId=${friendId}&month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch roster data');
      }

      const rawData = await response.json();

      const normalizeDuty = (duty: SerializableFlightDuty): FlightDuty => {
        return {
          ...duty,
          // Convert date-like fields back to Date instances for UI components
          date: duty.date ? new Date(duty.date) : new Date(),
          lastEditedAt: duty.lastEditedAt ? new Date(duty.lastEditedAt) : undefined,
          createdAt: duty.createdAt ? new Date(duty.createdAt) : undefined,
          updatedAt: duty.updatedAt ? new Date(duty.updatedAt) : undefined,
        };
      };

      const myRoster = (rawData.myRoster || []).map(normalizeDuty);
      const friendRoster = (rawData.friendRoster || []).map(normalizeDuty);

      setRosterData({
        myRoster,
        friendRoster,
        month: rawData.month,
        year: rawData.year,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Month navigation
  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Format month name
  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Roster Comparison with {friendEmail}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </Button>
        </div>

        {/* Month Selector */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
            disabled={loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4" />
            <span>
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            disabled={loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {loading && (
          <div className="py-12 text-center text-sm text-gray-500">
            Loading rosters...
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && rosterData && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* My Roster Column */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Your Roster</h3>
              {rosterData.myRoster.length === 0 ? (
                <p className="text-sm text-gray-500">No duties for this month</p>
              ) : (
                filterLayoverInboundFlights(rosterData.myRoster).map((duty) => (
                  <NewFlightDutyCard
                    key={duty.id}
                    flightDuty={duty}
                    allFlightDuties={rosterData.myRoster}
                    showActions={false}
                    showOffDays={true}
                  />
                ))
              )}
            </div>

            {/* Friend's Roster Column */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">{friendEmail}&apos;s Roster</h3>
              {rosterData.friendRoster.length === 0 ? (
                <p className="text-sm text-gray-500">No duties for this month</p>
              ) : (
                filterLayoverInboundFlights(rosterData.friendRoster).map((duty) => (
                  <NewFlightDutyCard
                    key={duty.id}
                    flightDuty={duty}
                    allFlightDuties={rosterData.friendRoster}
                    showActions={false}
                    showOffDays={true}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupabaseTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSupabaseConnection = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      addResult('Testing Supabase connection...');
      
      // Test 1: Simple query to auth.users (should work with anon key)
      addResult('Test 1: Checking Supabase client initialization...');
      if (!supabase) {
        addResult('❌ Supabase client not initialized');
        return;
      }
      addResult('✅ Supabase client initialized');

      // Test 2: Try to get current session
      addResult('Test 2: Getting current session...');
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        addResult(`❌ Session error: ${sessionError.message}`);
      } else {
        addResult(`✅ Session check successful (user: ${session?.session?.user?.email || 'none'})`);
      }

      // Test 3: Try a simple database query
      addResult('Test 3: Testing database connection...');
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        addResult(`❌ Database query failed: ${error.message}`);
        addResult(`Error details: ${JSON.stringify(error, null, 2)}`);
      } else {
        addResult('✅ Database connection successful');
        addResult(`Query result: ${JSON.stringify(data, null, 2)}`);
      }

      // Test 4: Try to access flights table
      addResult('Test 4: Testing flights table access...');
      const { data: flightsData, error: flightsError } = await supabase
        .from('flights')
        .select('count')
        .limit(1);
      
      if (flightsError) {
        addResult(`❌ Flights table query failed: ${flightsError.message}`);
        addResult(`Error details: ${JSON.stringify(flightsError, null, 2)}`);
      } else {
        addResult('✅ Flights table access successful');
        addResult(`Query result: ${JSON.stringify(flightsData, null, 2)}`);
      }

    } catch (error) {
      addResult(`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Supabase test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
          <CardDescription>
            Test the Supabase connection and database access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testSupabaseConnection} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Run Supabase Tests'}
          </Button>

          {testResults.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="space-y-1 text-sm font-mono">
                {testResults.map((result, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Supabase Service Client
 * Uses service role key to bypass RLS for admin operations
 * ONLY use this in server-side API routes where you need to access data across users
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

/**
 * Create a Supabase client with service role key
 * This bypasses Row Level Security (RLS) policies
 * Use with extreme caution and only in trusted server-side code
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for service client');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}


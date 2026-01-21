/**
 * API Route: Delete Account
 * POST /api/account/delete
 * Deletes user account including all data and storage objects
 * Requires service role for admin operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication with regular client
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Create service role client for admin operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Delete all avatar storage objects for this user
    try {
      // List all objects under the user's folder
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from('avatars')
        .list(userId, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        console.error('Error listing avatars:', listError);
        // Continue with deletion even if list fails
      }

      if (files && files.length > 0) {
        // Build paths for deletion
        const filePaths = files.map(file => `${userId}/${file.name}`);
        
        const { error: deleteStorageError } = await supabaseAdmin.storage
          .from('avatars')
          .remove(filePaths);

        if (deleteStorageError) {
          console.error('Error deleting avatars:', deleteStorageError);
          // Continue with user deletion even if storage cleanup fails
        }
      }
    } catch (storageError) {
      console.error('Storage cleanup error:', storageError);
      // Continue with user deletion
    }

    // 2. Delete the auth user (this triggers cascade deletion of profiles and related tables)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      return NextResponse.json(
        { error: `Failed to delete user: ${deleteUserError.message}` },
        { status: 500 }
      );
    }

    // 3. Sign out the user session
    await supabase.auth.signOut();

    return NextResponse.json(
      { success: true, message: 'Account deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

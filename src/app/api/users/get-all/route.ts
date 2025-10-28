import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const revalidate = 0;

export async function GET() {
  // Always set JSON content type header
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, max-age=0'
  };

  try {
    // Create Supabase client with error handling
    let supabase;
    try {
      supabase = createRouteHandlerClient({ cookies });
    } catch (error: any) {
      console.error('[API] Failed to create Supabase client:', error);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: error.message 
      }, { status: 500, headers });
    }

    // Initialize empty arrays for users
    let authUsers: any = { users: [] };
    let dbUsers: any[] = [];

    // Get users from auth.users table with explicit error handling
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('[API] Error fetching auth users:', error);
        return NextResponse.json({ 
          error: 'Failed to fetch authentication users', 
          details: error.message 
        }, { status: 500 });
      }
      
      if (data) {
        authUsers = data;
      }
    } catch (error: any) {
      console.error('[API] Exception in auth.admin.listUsers():', error);
      return NextResponse.json({ 
        error: 'Failed to fetch authentication users', 
        details: error.message 
      }, { status: 500, headers });
    }

    // Get users from users table with explicit error handling
    try {
      const { data, error } = await supabase.from('users').select('*');
      
      if (error) {
        console.error('[API] Error fetching database users:', error);
        return NextResponse.json({ 
          error: 'Failed to fetch database users', 
          details: error.message 
        }, { status: 500, headers });
      }
      
      if (data) {
        dbUsers = data;
      } else {
        dbUsers = [];
      }
    } catch (error: any) {
      console.error('[API] Exception in users table fetch:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch database users', 
        details: error.message 
      }, { status: 500, headers });
    }

    // Combine users from both sources
    const allUsers: any[] = [];
    
    // Add all DB users first
    if (dbUsers && dbUsers.length > 0) {
      console.log('[API] Adding', dbUsers.length, 'database users');
      allUsers.push(...dbUsers);
    }
    
    // Add auth users that aren't in the DB
    if (authUsers && authUsers.users && Array.isArray(authUsers.users)) {
      console.log('[API] Processing', authUsers.users.length, 'auth users');
      
      for (const authUser of authUsers.users) {
        if (!authUser || !authUser.id) continue;
        
        const existingUser = allUsers.find(u => u.id === authUser.id);
        if (!existingUser) {
          allUsers.push({
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email || 'Unknown User',
            role: authUser.user_metadata?.role || 'employee',
            department: authUser.user_metadata?.department || 'Unassigned',
            position: authUser.user_metadata?.position || 'Staff',
            created_at: authUser.created_at || new Date().toISOString(),
            status: 'active'
          });
        }
      }
    }
    
    console.log('[API] Returning', allUsers.length, 'total users');
    
    // Return the combined users array with proper headers
    return NextResponse.json(allUsers, { 
      status: 200, 
      headers 
    });
    
  } catch (error: any) {
    // Catch any unexpected errors
    console.error('[API] Unexpected server error:', error);
    return NextResponse.json({ 
      error: 'Unexpected server error', 
      details: error.message || 'Unknown error' 
    }, { status: 500, headers });
  }
}
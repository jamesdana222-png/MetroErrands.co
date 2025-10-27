import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createSuccessResponse, createServerErrorResponse, createNotFoundResponse } from '@/lib/api-utils';
import { validateRequest, userSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// Get all users
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const role = searchParams.get('role');
    
    // Build query
    let query = supabase.from('users').select('*');
    
    // Add filters if provided
    if (role) {
      query = query.eq('role', role);
    }
    
    // Add pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching users:', error);
      return createServerErrorResponse('Failed to fetch users', error.message);
    }
    
    return createSuccessResponse({
      users: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('Exception in users GET:', error);
    return createServerErrorResponse('Internal server error', error.message);
  }
}

// Create a new user
export async function POST(request: NextRequest) {
  // Validate request body against schema
  const validation = await validateRequest(request, userSchema);
  
  if (!validation.success) {
    return validation.response;
  }
  
  const { data: body } = validation;
  
  try {
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Create user in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });
    
    if (authError) {
      console.error('Error creating user in Auth:', authError);
      return createServerErrorResponse('Failed to create user', authError.message);
    }
    
    // Insert additional user data into the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          name: body.name,
          email: body.email,
          role: body.role || 'user',
          phone: body.phone || null,
        }
      ])
      .select()
      .single();
    
    if (userError) {
      console.error('Error inserting user data:', userError);
      
      // Attempt to clean up the auth user if db insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return createServerErrorResponse('Failed to create user profile', userError.message);
    }
    
    // Return success response with the created user
    return createSuccessResponse(
      { 
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          created_at: userData.created_at
        }
      }, 
      201
    );
  } catch (error: any) {
    console.error('Exception in users POST:', error);
    return createServerErrorResponse('Internal server error', error.message);
  }
}
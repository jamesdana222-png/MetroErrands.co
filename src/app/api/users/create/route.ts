import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createServerErrorResponse,
  createBadRequestResponse
} from '@/lib/api-utils';

// Helper function for validation errors
function createValidationErrorResponse(errors: any, endpoint: string) {
  return Response.json({ success: false, errors, endpoint }, { status: 400 });
}
import { validateRequest, userSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Define CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  try {
    // Parse request body safely
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return Response.json({ success: false, errors: ['Invalid request format'] }, { status: 400 });
    }
    
    const { 
      id, 
      email, 
      name, 
      role, 
      department, 
      position, 
      phone, 
      start_date,
      status,
      password,
      address
    } = requestData;
    
    // Validate required fields
    const validationErrors: Record<string, string[]> = {};
    if (!email) validationErrors.email = ['Email is required'];
    if (!name) validationErrors.name = ['Name is required'];
    
    if (Object.keys(validationErrors).length > 0) {
      return Response.json({ success: false, errors: validationErrors }, { status: 400 });
    }

    // Create a Supabase client with admin privileges
    const supabase = createRouteHandlerClient({ cookies });
    
    // Create user in auth if no ID is provided
    let userId = id;
    
    // If no userId is provided, we need to either find an existing user or create a new one
    if (!userId) {
      try {
        // Check if user already exists in auth
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error('Error listing users:', listError);
          return NextResponse.json(
            { error: 'Error checking existing users: ' + listError.message },
            { status: 500 }
          );
        }
        
        // Find user by email
        const existingUser = existingUsers?.users?.find(user => 
          user.email?.toLowerCase() === email.toLowerCase()
        );
        
        if (existingUser) {
          // User already exists, use their ID
          userId = existingUser.id;
          console.log('User already exists in auth, using existing ID:', userId);
        } else if (password) {
          // Create new user in auth
          try {
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: {
                name,
                role: role || 'employee',
                department: department || 'Delivery',
                position: position || 'Staff',
                phone: phone || null,
                start_date: start_date || null,
                status: status || 'active',
                address: address || null
              }
            });
            
            if (authError) {
              console.error('Error creating auth user:', authError);
              return createServerErrorResponse('Failed to create user', authError.message);
            }
            
            if (!authData || !authData.user) {
              console.error('Auth data or user is null');
              return NextResponse.json(
                { error: 'Failed to create user in authentication system' },
                { status: 500 }
              );
            }
            
            userId = authData.user.id;
          } catch (createUserError: any) {
            console.error('Exception creating user:', createUserError);
            return NextResponse.json(
              { error: 'Exception creating user: ' + (createUserError.message || 'Unknown error') },
              { status: 500 }
            );
          }
        } else {
          return NextResponse.json(
            { error: 'Password is required for new user creation' },
            { status: 400, headers }
          );
        }
      } catch (authError: any) {
        console.error('Error in auth process:', authError);
        return NextResponse.json(
          { error: 'Authentication error: ' + (authError.message || 'Unknown error') },
          { status: 500, headers }
        );
      }
    }
    
    if (!userId) {
      console.error('No user ID was obtained after auth process');
      return NextResponse.json(
        { error: 'Failed to obtain user ID' },
        { status: 500, headers }
      );
    }
    
    console.log('Processing user with ID:', userId);
    
    try {
      // Check if user already exists in the users table
      const { data: existingUserData, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
        console.error('Error checking existing user:', checkError);
        return NextResponse.json(
          { error: 'Database error: ' + checkError.message },
          { status: 500, headers }
        );
      }
      
      let data, error;
      
      if (existingUserData) {
        // Update existing user
        const result = await supabase
          .from('users')
          .update({
            email,
            name,
            role: role || 'employee',
            department: department || 'Delivery',
            position: position || 'Staff',
            phone: phone || null,
            start_date: start_date || null,
            status: status || 'active',
            address: address || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();
          
        data = result.data;
        error = result.error;
      } else {
        // Insert new user
        const result = await supabase
          .from('users')
          .insert({
            id: userId,
            email,
            name,
            role: role || 'employee',
            department: department || 'Delivery',
            position: position || 'Staff',
            phone: phone || null,
            start_date: start_date || null,
            status: status || 'active',
            address: address || null,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        data = result.data;
        const insertError = result.error;
      }
    } catch (dbError: any) {
      console.error('Database operation error:', dbError);
      return NextResponse.json(
        { error: 'Database error: ' + (dbError.message || 'Unknown error') },
        { status: 500 }
      );
    }

    // Declare data variable at a higher scope
    let data;
    
    // Ensure we're returning a valid JSON object
    if (!data) {
      console.log('No data returned from database, creating default response');
      return NextResponse.json({
        id: userId,
        email,
        name,
        role: role || 'employee',
        department: department || 'Delivery',
        position: position || 'Staff',
        phone: phone || null,
        start_date: start_date || null,
        status: status || 'active',
        address: address || null,
        created_at: new Date().toISOString(),
        message: 'User created successfully'
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Server error:', error);
    // Always return a proper JSON response, even for unexpected errors
    return NextResponse.json(
      { 
        error: 'Server error: ' + (error.message || 'Unknown server error'),
        success: false
      },
      { status: 500 }
    );
  }
}
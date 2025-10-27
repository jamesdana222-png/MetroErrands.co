import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createSuccessResponse, createServerErrorResponse, createBadRequestResponse } from '@/lib/api-utils';
import { validateRequest, userSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Validate request body against schema
  const validation = await validateRequest(request, userSchema);
  
  if (!validation.success) {
    return validation.response;
  }
  
  const { data: body } = validation;
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', body.email)
      .single();
    
    if (existingUser) {
      return createBadRequestResponse('User with this email already exists');
    }
    
    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          name: body.name,
          role: body.role || 'user'
        }
      }
    });
    
    if (authError) {
      console.error('Error creating user in auth:', authError);
      return createServerErrorResponse('Failed to create user', authError.message);
    }
    
    if (!authData.user) {
      return createServerErrorResponse('Failed to create user', 'No user returned from auth');
    }
    
    // Insert additional user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: body.email,
          name: body.name,
          role: body.role || 'user',
          phone: body.phone || null
        }
      ])
      .select()
      .single();
    
    if (userError) {
      console.error('Error inserting user data:', userError);
      
      // Clean up auth user if user data insertion fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return createServerErrorResponse('Failed to create user profile', userError.message);
    }
    
    return createSuccessResponse({
      user: userData,
      message: 'User registered successfully. Please check your email for verification.'
    }, 201);
  } catch (error: any) {
    console.error('Exception in register:', error);
    return createServerErrorResponse('Internal server error', error.message);
  }
}
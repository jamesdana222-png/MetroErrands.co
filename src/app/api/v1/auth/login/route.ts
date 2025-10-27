import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createSuccessResponse, createServerErrorResponse, createUnauthorizedResponse } from '@/lib/api-utils';
import { validateRequest, loginSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Validate request body against schema
  const validation = await validateRequest(request, loginSchema);
  
  if (!validation.success) {
    return validation.response;
  }
  
  const { data: body } = validation;
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    
    if (error) {
      console.error('Login error:', error.message);
      return createUnauthorizedResponse('Invalid login credentials');
    }
    
    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      // Still return success since authentication succeeded
    }
    
    return createSuccessResponse({
      user: {
        id: data.user.id,
        email: data.user.email,
        ...userData
      },
      session: {
        expires_at: data.session?.expires_at
      }
    });
  } catch (error: any) {
    console.error('Exception in login:', error);
    return createServerErrorResponse('Internal server error', error.message);
  }
}
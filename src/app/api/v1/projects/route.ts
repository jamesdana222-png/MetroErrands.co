import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createSuccessResponse, createServerErrorResponse, createNotFoundResponse } from '@/lib/api-utils';
import { validateRequest, projectSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// Get all projects with optional filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const managerId = searchParams.get('managerId');
    
    // Build query
    let query = supabase.from('projects').select('*, manager:managerId(id, name, email)');
    
    // Add filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    if (managerId) {
      query = query.eq('managerId', managerId);
    }
    
    // Add pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching projects:', error);
      return createServerErrorResponse('Failed to fetch projects', error.message);
    }
    
    return createSuccessResponse({
      projects: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('Exception in projects GET:', error);
    return createServerErrorResponse('Internal server error', error.message);
  }
}

// Create a new project
export async function POST(request: NextRequest) {
  // Validate request body against schema
  const validation = await validateRequest(request, projectSchema);
  
  if (!validation.success) {
    return validation.response;
  }
  
  const { data: body } = validation;
  
  try {
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify manager exists
    const { data: manager, error: managerError } = await supabase
      .from('users')
      .select('id')
      .eq('id', body.managerId)
      .single();
    
    if (managerError || !manager) {
      return createNotFoundResponse('Manager not found', { managerId: body.managerId });
    }
    
    // Insert project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([
        {
          name: body.name,
          description: body.description,
          startDate: body.startDate,
          endDate: body.endDate,
          status: body.status || 'planning',
          managerId: body.managerId
        }
      ])
      .select()
      .single();
    
    if (projectError) {
      console.error('Error creating project:', projectError);
      return createServerErrorResponse('Failed to create project', projectError.message);
    }
    
    // Return success response with the created project
    return createSuccessResponse({ project }, 201);
  } catch (error: any) {
    console.error('Exception in projects POST:', error);
    return createServerErrorResponse('Internal server error', error.message);
  }
}
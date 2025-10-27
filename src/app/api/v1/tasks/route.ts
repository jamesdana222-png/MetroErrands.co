import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createSuccessResponse, createServerErrorResponse, createNotFoundResponse } from '@/lib/api-utils';
import { validateRequest, taskSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// Get all tasks with optional filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const assigneeId = searchParams.get('assigneeId');
    
    // Build query
    let query = supabase.from('tasks').select('*, project:projectId(*), assignee:assigneeId(id, name, email)');
    
    // Add filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    if (projectId) {
      query = query.eq('projectId', projectId);
    }
    
    if (assigneeId) {
      query = query.eq('assigneeId', assigneeId);
    }
    
    // Add pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching tasks:', error);
      return createServerErrorResponse('Failed to fetch tasks', error.message);
    }
    
    return createSuccessResponse({
      tasks: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('Exception in tasks GET:', error);
    return createServerErrorResponse('Internal server error', error.message);
  }
}

// Create a new task
export async function POST(request: NextRequest) {
  // Validate request body against schema
  const validation = await validateRequest(request, taskSchema);
  
  if (!validation.success) {
    return validation.response;
  }
  
  const { data: body } = validation;
  
  try {
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', body.projectId)
      .single();
    
    if (projectError || !project) {
      return createNotFoundResponse('Project not found', { projectId: body.projectId });
    }
    
    // Verify assignee exists if provided
    if (body.assigneeId) {
      const { data: assignee, error: assigneeError } = await supabase
        .from('users')
        .select('id')
        .eq('id', body.assigneeId)
        .single();
      
      if (assigneeError || !assignee) {
        return createNotFoundResponse('Assignee not found', { assigneeId: body.assigneeId });
      }
    }
    
    // Insert task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert([
        {
          title: body.title,
          description: body.description,
          dueDate: body.dueDate,
          priority: body.priority || 'medium',
          status: body.status || 'pending',
          projectId: body.projectId,
          assigneeId: body.assigneeId
        }
      ])
      .select()
      .single();
    
    if (taskError) {
      console.error('Error creating task:', taskError);
      return createServerErrorResponse('Failed to create task', taskError.message);
    }
    
    // Return success response with the created task
    return createSuccessResponse({ task }, 201);
  } catch (error: any) {
    console.error('Exception in tasks POST:', error);
    return createServerErrorResponse('Internal server error', error.message);
  }
}
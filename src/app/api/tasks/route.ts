import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ success: false, message: 'Failed to fetch tasks' }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    }
    
    return NextResponse.json({ success: true, tasks: data }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, assignedBy, assignedTo, priority, deadline } = body;
    
    // Validate required fields
    if (!title || !assignedBy || !assignedTo || !priority) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    
    // Get assigned user's name
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name')
      .eq('id', assignedTo)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ success: false, message: 'Invalid assigned user' }, { status: 400 });
    }
    
    // Create task in Supabase
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert([
        {
          title,
          description,
          assigned_by: assignedBy,
          assigned_to: assignedTo,
          assigned_to_name: userData.name,
          priority,
          status: 'pending',
          deadline: deadline || null
        }
      ])
      .select()
      .single();
    
    if (taskError) {
      console.error('Error creating task:', taskError);
      return NextResponse.json({ success: false, message: 'Failed to create task' }, { status: 500 });
    }
    
    // Log the action
    await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: assignedBy,
          user_name: 'Admin User', // In production, get actual user name
          action: 'create',
          entity_type: 'task',
          entity_id: taskData.id,
          details: `Created new task: ${title}, assigned to: ${userData.name}`
        }
      ]);
    
    return NextResponse.json({ success: true, task: taskData });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create task' }, { status: 500 });
  }
}
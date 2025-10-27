import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_members(*)');
    
    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch projects' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      projects: data 
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch projects' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, deadline, priority, team, createdBy } = body;
    
    // Validate required fields
    if (!title || !deadline || !priority || !createdBy) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Create project in Supabase
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert([
        {
          title,
          description,
          deadline,
          status: 'planning',
          priority,
          progress: 0,
          created_by: createdBy
        }
      ])
      .select()
      .single();
    
    if (projectError) {
      console.error('Error creating project:', projectError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to create project' 
      }, { status: 500 });
    }
    
    // Add team members if provided
    if (team && team.length > 0) {
      const projectMembers = team.map((userId: string) => ({
        project_id: projectData.id,
        user_id: userId,
        role: 'member'
      }));
      
      const { error: membersError } = await supabase
        .from('project_members')
        .insert(projectMembers);
      
      if (membersError) {
        console.error('Error adding project members:', membersError);
      }
    }
    
    // Log the action
    await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: createdBy,
          user_name: 'Admin User', // In production, get actual user name
          action: 'create',
          entity_type: 'project',
          entity_id: projectData.id,
          details: `Created new project: ${title}`
        }
      ]);
    
    return NextResponse.json({ 
      success: true, 
      project: projectData
    });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create project' 
    }, { status: 500 });
  }
}
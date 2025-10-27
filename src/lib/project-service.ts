import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Project service to handle project-related operations
export const projectService = {
  // Create a new project
  async createProject(projectData: any) {
    const supabase = createClientComponentClient();
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },
  
  // Record a task assignment in the project
  async recordTaskAssignment(taskData: any) {
    const supabase = createClientComponentClient();
    
    try {
      // Check if a project already exists for this employee
      const { data: existingProjects, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('assignedTo', taskData.assignedTo)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (fetchError) throw fetchError;
      
      // If a project exists, update it to include this task
      if (existingProjects && existingProjects.length > 0) {
        const project = existingProjects[0];
        const tasks = project.tasks || [];
        
        // Add the new task ID to the tasks array
        tasks.push(taskData.id);
        
        // Update the project progress based on task status
        const progress = calculateProjectProgress(tasks, taskData.status);
        
        // Update the project
        const { data, error } = await supabase
          .from('projects')
          .update({
            tasks,
            progress,
            // Update status if needed based on task status
            status: determineProjectStatus(taskData.status, project.status),
          })
          .eq('id', project.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create a new project for this employee
        const newProject = {
          title: `${taskData.assignedToName}'s Project`,
          description: `Project containing tasks for ${taskData.assignedToName}`,
          status: 'in_progress',
          priority: taskData.priority,
          deadline: taskData.deadline,
          assignedTo: taskData.assignedTo,
          tasks: [taskData.id],
          progress: taskData.status === 'completed' ? 100 : 0,
        };
        
        const { data, error } = await supabase
          .from('projects')
          .insert(newProject)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error recording task assignment:', error);
      throw error;
    }
  }
};

// Helper function to calculate project progress based on tasks
function calculateProjectProgress(taskIds: string[], currentTaskStatus: string) {
  // In a real implementation, you would fetch all tasks and calculate
  // For this demo, we'll use a simple approach
  if (currentTaskStatus === 'completed') {
    return 100;
  } else if (currentTaskStatus === 'in_progress') {
    return 50;
  } else {
    return 0;
  }
}

// Helper function to determine project status based on task status
function determineProjectStatus(taskStatus: string, currentProjectStatus: string) {
  if (taskStatus === 'completed') {
    return 'completed';
  } else if (taskStatus === 'in_progress') {
    return 'in_progress';
  }
  return currentProjectStatus;
}
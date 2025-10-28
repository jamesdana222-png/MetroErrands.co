'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Calendar, Clock, Users, 
  CheckCircle, AlertCircle, MoreHorizontal, ChevronDown 
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// Removed database types import as it's not available
// import { Database } from '@/lib/database.types';
import { projectService } from '@/lib/project-service';

type Employee = {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  projectId?: string;
  createdAt: string;
};

export default function TaskAssignment() {
  const supabase = createClientComponentClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    projectId: '',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        console.log('Fetching employee and task data...');
        
        // Get all users from Supabase with error handling
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email, position, department, role')
          .eq('role', 'employee');
        
        if (userError) {
          console.error('Error fetching employees:', userError.message);
          throw userError;
        }
        
        if (!userData || userData.length === 0) {
          console.log('No employees found or empty response');
        } else {
          console.log(`Found ${userData.length} employees`);
        }
        
        // Format employees for display with null checks
        const formattedEmployees: Employee[] = (userData || []).map(user => ({
          id: user.id || '',
          name: user.name || (user.email ? user.email.split('@')[0] : 'Unknown'),
          email: user.email || '',
          position: user.position || 'Employee',
          department: user.department || 'General'
        }));
        
        // Get all tasks from Supabase with error handling
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select(`
            id, title, description, assigned_to, deadline, priority, status, created_at
          `);
          
        // Get user details separately
        let userMap: Record<string, any> = {};
        if (!taskError && taskData && taskData.length > 0) {
          const userIds = taskData
            .map(task => task.assigned_to)
            .filter(id => id && id.length > 0);
            
          if (userIds.length > 0) {
            const { data: usersData } = await supabase
              .from('users')
              .select('id, name, email')
              .in('id', userIds);
              
            if (usersData) {
              userMap = usersData.reduce((acc: Record<string, any>, user: any) => {
                acc[user.id] = user;
                return acc;
              }, {});
            }
          }
        }
        
        if (taskError) {
          console.error('Error fetching tasks:', taskError.message);
          throw taskError;
        }
        
        if (!taskData || taskData.length === 0) {
          console.log('No tasks found or empty response');
        } else {
          console.log(`Found ${taskData.length} tasks`);
        }
        
        // Format tasks for display with null checks
        const formattedTasks: Task[] = (taskData || []).map(task => {
          const assignedUser = task.assigned_to ? userMap[task.assigned_to] : null;
          
          return {
            id: task.id || '',
            title: task.title || '',
            description: task.description || '',
            assignedTo: task.assigned_to || '',
            assignedToName: assignedUser?.name || 
                           (assignedUser?.email ? assignedUser.email.split('@')[0] : 'Unassigned'),
            deadline: task.deadline || '',
            priority: (task.priority as 'low' | 'medium' | 'high') || 'medium',
            status: (task.status as 'pending' | 'in_progress' | 'completed') || 'pending',
            projectId: '',
            createdAt: task.created_at || new Date().toISOString()
          };
        });
        
        setEmployees(formattedEmployees);
        setTasks(formattedTasks);
        console.log('Data fetching completed successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching data:', errorMessage);
        
        // Set default values to prevent UI errors
        setEmployees([]);
        setTasks([]);
        
        // Show error in UI (optional)
        alert(`Error loading data: ${errorMessage}. Please refresh the page or contact support.`);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Filter tasks based on search term and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date set';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color and accessibility attributes
  const getStatusBadge = (status: string) => {
    let color = '';
    let ariaLabel = '';
    
    switch (status) {
      case 'pending':
        color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
        ariaLabel = 'Task status: Pending';
        break;
      case 'in_progress':
        color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
        ariaLabel = 'Task status: In Progress';
        break;
      case 'completed':
        color = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
        ariaLabel = 'Task status: Completed';
        break;
      default:
        color = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        ariaLabel = 'Task status: Unknown';
    }
    
    return { color, ariaLabel };
  };

  // Get priority badge color and accessibility attributes
  const getPriorityBadge = (priority: string) => {
    let color = '';
    let ariaLabel = '';
    
    switch (priority.toLowerCase()) {
      case 'high':
        color = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
        ariaLabel = 'Priority: High';
        break;
      case 'medium':
        color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
        ariaLabel = 'Priority: Medium';
        break;
      case 'low':
        color = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
        ariaLabel = 'Priority: Low';
        break;
      default:
        color = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        ariaLabel = 'Priority: Unknown';
    }
    
    return { color, ariaLabel };
  };

  const handleCreateTask = async () => {
    try {
      // Validate form
      if (!newTask.title || !newTask.description || !newTask.assignedTo || !newTask.deadline) {
        alert('Please fill in all required fields');
        return;
      }

      // Get the assigned employee name
      const assignedEmployee = employees.find(emp => emp.id === newTask.assignedTo);
      if (!assignedEmployee) {
        alert('Invalid employee selection');
        return;
      }

      // Create new task in Supabase
      const { data: newTaskData, error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description,
          assignedTo: newTask.assignedTo,
          deadline: new Date(newTask.deadline).toISOString(),
          priority: newTask.priority,
          status: 'pending',
          projectId: newTask.projectId || null,
          createdAt: new Date().toISOString(),
          // Add notification flag for new assignments
          notified: false
        })
        .select()
        .single();

      if (error) throw error;
      
      // Send notification to the employee
      await supabase
        .from('notifications')
        .insert({
          userId: newTask.assignedTo,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `You have been assigned a new task: ${newTask.title}`,
          read: false,
          createdAt: new Date().toISOString()
        });

      // Record this task in the project section
      await projectService.recordTaskAssignment({
        taskId: newTaskData.id,
        taskTitle: newTaskData.title,
        assignedTo: newTaskData.assignedTo,
        assignedToName: assignedEmployee.name,
        deadline: newTaskData.deadline,
        priority: newTaskData.priority,
        status: newTaskData.status,
        projectId: newTask.projectId || undefined
      });

      // Add to tasks list with the assigned employee name
      const formattedNewTask: Task = {
        id: newTaskData.id,
        title: newTaskData.title,
        description: newTaskData.description,
        assignedTo: newTaskData.assignedTo,
        assignedToName: assignedEmployee.name,
        deadline: newTaskData.deadline,
        priority: newTaskData.priority as 'low' | 'medium' | 'high',
        status: newTaskData.status as 'pending' | 'in_progress' | 'completed',
        projectId: newTaskData.projectId || undefined,
        createdAt: newTaskData.createdAt
      };

      // Record this task in the project section
      try {
        await projectService.recordTaskAssignment({
          ...formattedNewTask,
          assignedToName: assignedEmployee.name
        });
        console.log('Task recorded in project section');
      } catch (projectError) {
        console.error('Error recording task in project:', projectError);
        // Continue with task creation even if project recording fails
      }

      setTasks(prevTasks => [...prevTasks, formattedNewTask]);

      // Reset form
      setNewTask({
        title: '',
        description: '',
        assignedTo: '',
        deadline: '',
        priority: 'medium',
        projectId: '',
      });

      // Close modal
      setShowTaskModal(false);

      // Show success message
      alert('Task assigned successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to assign task. Please try again.');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      // Update task in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      
      if (error) throw error;
      
      // Update the local state
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      setTasks(updatedTasks);
      alert(`Task status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Assignment</h1>
        <button 
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          onClick={() => setShowTaskModal(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Assign New Task</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 mb-8">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex items-center">
                <select
                  className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Task</th>
                <th className="px-6 py-3 text-left">Assigned To</th>
                <th className="px-6 py-3 text-left">Deadline</th>
                <th className="px-6 py-3 text-left">Priority</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading tasks...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No tasks found
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1" dangerouslySetInnerHTML={{ __html: task.description.length > 100 ? task.description.substring(0, 100) + '...' : task.description }}></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-3">
                          {task.assignedToName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{task.assignedToName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-900 dark:text-white">{formatDate(task.deadline)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(task.priority).color}`} aria-label={getPriorityBadge(task.priority).ariaLabel}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(task.status).color}`} aria-label={getStatusBadge(task.status).ariaLabel}>
                          {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Assignment Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Assign New Task</h3>
              <button 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                onClick={() => setShowTaskModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    placeholder="Enter task title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Task Description *
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className="w-full h-48 px-3 py-2 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter detailed task description..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assign To *
                    </label>
                    <select
                      value={newTask.assignedTo}
                      onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} - {employee.position}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deadline *
                    </label>
                    <input
                      type="date"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'low' | 'medium' | 'high'})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Related Project (Optional)
                    </label>
                    <select
                      value={newTask.projectId}
                      onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    >
                      <option value="">None</option>
                      <option value="1">Corporate Event Planning</option>
                      <option value="2">Residential Moving Service</option>
                      <option value="3">Weekly Grocery Delivery Program</option>
                      <option value="4">Office Supply Restocking</option>
                      <option value="5">Restaurant Delivery Partnership</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowTaskModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                onClick={handleCreateTask}
              >
                Assign Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, Clock, 
  CheckCircle, AlertCircle, MoreHorizontal, ChevronDown 
} from 'lucide-react';
import { taskService, errandService } from '@/lib/db-service';
import { Task as TaskModel } from '@/lib/models';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type Task = {
  id: string;
  title: string;
  description: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  projectId?: string;
  createdAt: string;
};

export default function EmployeeTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<{
    status: string;
    priority: string;
  }>({
    status: 'all',
    priority: 'all',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: any = null;
    let tasksSubscription: any = null;

    async function fetchTasks() {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get tasks assigned to the current user
        const [userTasks, userErrandRequests] = await Promise.all([
          taskService.getUserTasks(user.id),
          errandService.getUserRequests(user.id)
        ]);
        
        // Mark newly assigned tasks as notified
        const unnotifiedTasks = userTasks.filter(task => task.notified === false);
        if (unnotifiedTasks.length > 0) {
          const taskIds = unnotifiedTasks.map(task => task.id);
          await supabase
            .from('tasks')
            .update({ notified: true })
            .in('id', taskIds);
        }
        
        // Subscribe to real-time task updates
        tasksSubscription = supabase
          .channel('tasks-channel')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'tasks',
              filter: `assignedTo=eq.${user.id}`
            }, 
            (payload) => {
              fetchTasks(); // Refresh tasks when changes occur
            }
          )
          .subscribe();
        
        // Format tasks for display
        const formattedTasks: Task[] = [
          // Regular tasks
          ...userTasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            deadline: task.deadline,
            priority: task.priority as 'low' | 'medium' | 'high',
            status: task.status as 'pending' | 'in_progress' | 'completed',
            createdAt: task.createdAt
          })),
          
          // Errand requests
          ...userErrandRequests.map(errand => ({
            id: `errand-${errand.id}`,
            title: errand.title,
            description: errand.description,
            deadline: errand.due_date,
            priority: errand.priority,
            status: errand.status === 'approved' ? 'in_progress' : 
                   errand.status === 'completed' ? 'completed' : 'pending',
            createdAt: errand.created_at
          }))
        ];
        
        setTasks(formattedTasks);
        
        // Subscribe to real-time updates for tasks
        subscription = await errandService.subscribeToUserRequests(user.id, (payload) => {
          if (!payload) return;
          
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          if (eventType === 'INSERT') {
            setTasks(prev => [
              ...prev,
              {
                id: `errand-${newRecord.id}`,
                title: newRecord.title,
                description: newRecord.description,
                deadline: newRecord.due_date,
                priority: newRecord.priority,
                status: newRecord.status === 'approved' ? 'in_progress' : 
                       newRecord.status === 'completed' ? 'completed' : 'pending',
                createdAt: newRecord.created_at
              }
            ]);
          } else if (eventType === 'UPDATE') {
            setTasks(prev => prev.map(task => 
              task.id === `errand-${newRecord.id}` 
                ? {
                    ...task,
                    title: newRecord.title,
                    description: newRecord.description,
                    deadline: newRecord.due_date,
                    priority: newRecord.priority,
                    status: newRecord.status === 'approved' ? 'in_progress' : 
                           newRecord.status === 'completed' ? 'completed' : 'pending',
                  } 
                : task
            ));
          } else if (eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== `errand-${oldRecord.id}`));
          }
        });
        
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setError('Failed to load tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchTasks();
    
    return () => {
      // Clean up subscription when component unmounts
      if (subscription) {
        subscription.unsubscribe();
      }
      if (tasksSubscription) {
        tasksSubscription.unsubscribe();
      }
    };
  }, [user?.id]);

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      setError(null);
      
      if (taskId.startsWith('errand-')) {
        // Handle errand request status update
        const errandId = taskId.replace('errand-', '');
        const errandStatus = newStatus === 'in_progress' ? 'approved' : 
                            newStatus === 'completed' ? 'completed' : 'pending';
        
        await errandService.updateRequest(errandId, { status: errandStatus });
      } else {
        // Handle regular task status update
        await taskService.updateTaskStatus(taskId, newStatus);
        
        // Update the local state (for regular tasks)
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status. Please try again.');
    }
  };

  // Filter tasks based on search term and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filter.status === 'all' || task.status === filter.status;
    const matchesPriority = filter.priority === 'all' || task.priority === filter.priority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'in_progress': return 'text-blue-500';
      case 'pending': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
          <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}
      
      {/* Search and filter bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search tasks..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <select
              className="appearance-none pl-4 pr-10 py-2 border rounded-lg bg-white"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
          
          <div className="relative">
            <select
              className="appearance-none pl-4 pr-10 py-2 border rounded-lg bg-white"
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>
      </div>
      
      {/* Task list */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">
            {searchTerm || filter.status !== 'all' || filter.priority !== 'all'
              ? "No tasks match your current filters. Try adjusting your search or filters."
              : "You don't have any assigned tasks at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map(task => (
            <div key={task.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{task.title}</h2>
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                  </span>
                  <div className="relative">
                    <button className="p-1 rounded-full hover:bg-gray-100">
                      <MoreHorizontal size={20} />
                    </button>
                    {/* Dropdown menu would go here */}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600">{task.description}</p>
              </div>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center text-gray-500">
                  <Calendar size={18} className="mr-2" />
                  <span>Due: {formatDate(task.deadline)}</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <Clock size={18} className="mr-2" />
                  <span>Created: {formatDate(task.createdAt)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className={`flex items-center ${getStatusColor(task.status)}`}>
                  {task.status === 'completed' ? (
                    <CheckCircle size={18} className="mr-2" />
                  ) : (
                    <AlertCircle size={18} className="mr-2" />
                  )}
                  <span className="font-medium">
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  {task.status !== 'in_progress' && task.status !== 'completed' && (
                    <button
                      onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                    >
                      Start Task
                    </button>
                  )}
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                      className="px-3 py-1 bg-green-100 text-green-600 rounded-md hover:bg-green-200"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
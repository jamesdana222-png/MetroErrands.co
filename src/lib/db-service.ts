// Database service for the attendance and task management system
import { AttendanceRecord, Task, Project, ProjectMember, AuditLog, User } from './models';
import { supabase } from './supabase';
import { logError, handleError, formatError, ErrorDetails, getUserFriendlyMessage } from './error-utils';
import { logDbError } from './error-logger';

// Define ErrandRequest type
export type ErrandRequest = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high';
  requested_by: string;
  assigned_to?: string;
  due_date?: string;
  location?: string;
  created_at: string;
  updated_at: string;
};

// Timeout constants for database operations
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const LONG_OPERATION_TIMEOUT = 20000; // 20 seconds

// Helper function to execute a promise with a timeout
const executeWithTimeout = async (promise: Promise<any>, timeoutMs: number, operationName: string) => {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation '${operationName}' timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
};

// Function to get all users from the database
export const getUsers = async (): Promise<{ data: User[] | null; error: any }> => {
  try {
    // First try to get users from the users table
    const { data: dbUsers, error: dbError } = await executeWithTimeout(
      supabase
        .from('users')
        .select('*'),
      DEFAULT_TIMEOUT,
      'Get users from database'
    );
    
    if (dbError) {
      throw dbError;
    }
    
    return { data: dbUsers, error: null };
  } catch (error) {
    logError(error, 'getUsers', { 
      context: 'Failed to fetch users from database'
    });
    
    // FALLBACK STRATEGY FOR DEVELOPMENT ONLY
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using fallback user data in development mode');
      return { 
        data: [
          {
            id: '1',
            email: 'admin@metro.com',
            name: 'Admin User',
            role: 'admin',
            department: 'Management',
            position: 'System Administrator',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          },
          {
            id: '2',
            email: 'employee@metro.com',
            name: 'Employee User',
            role: 'employee',
            department: 'Operations',
            position: 'Field Agent',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          }
        ], 
        error: null 
      };
    }
    
    return { data: null, error };
  }
};

// Function to get tasks from database
export const getTasks = async (userId?: string, status?: string): Promise<{ data: Task[] | null; error: any }> => {
  try {
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('assigned_to', userId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await executeWithTimeout(
      query,
      DEFAULT_TIMEOUT,
      'Get tasks'
    );
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    logError(error, 'getTasks', {
      context: 'Failed to fetch tasks from database',
      metadata: { userId, status }
    });
    
    // Fallback mock data for development
    if (process.env.NODE_ENV !== 'production') {
      return { 
        data: [
          {
            id: '1',
            title: 'Complete client proposal',
            description: 'Finalize the proposal for Metro City client',
            assignedBy: '1',
            assignedTo: '2',
            assignedToName: 'Employee User',
            priority: 'high',
            status: 'in_progress',
            deadline: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
            completedAt: null,
            createdAt: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString(),
            updatedAt: new Date(new Date().setHours(new Date().getHours() - 3)).toISOString()
          },
          {
            id: '2',
            title: 'Review marketing materials',
            description: 'Review and approve new marketing materials',
            assignedBy: '1',
            assignedTo: '2',
            assignedToName: 'Employee User',
            priority: 'medium',
            status: 'pending',
            deadline: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
            completedAt: null,
            createdAt: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(),
            updatedAt: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString()
          }
        ], 
        error: null 
      };
    }
    
    return { data: [], error };
  }
};

// Function to get projects from database
export const getProjects = async (status?: string): Promise<{ data: Project[] | null; error: any }> => {
  try {
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await executeWithTimeout(
      query,
      DEFAULT_TIMEOUT,
      'Get projects'
    );
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    logError(error, 'getProjects', {
      context: 'Failed to fetch projects from database',
      metadata: { status }
    });
    
    // Fallback mock data for development
    if (process.env.NODE_ENV !== 'production') {
      return { 
        data: [
          {
            id: '1',
            title: 'Metro City Revitalization',
            description: 'Urban renewal project for downtown Metro City',
            createdBy: '1',
            status: 'in_progress',
            priority: 'high',
            deadline: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
            progress: 35,
            needsApproval: false,
            team: ['2'],
            createdAt: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
            updatedAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString()
          },
          {
            id: '2',
            title: 'Westside Park Maintenance',
            description: 'Regular maintenance and improvements for Westside Park',
            createdBy: '1',
            status: 'planning',
            priority: 'medium',
            deadline: new Date(new Date().setDate(new Date().getDate() + 45)).toISOString(),
            progress: 10,
            needsApproval: true,
            team: ['2'],
            createdAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
            updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString()
          }
        ], 
        error: null 
      };
    }
    
    return { data: [], error };
  }
};

let projects: Project[] = [
  {
    id: '1',
    title: 'Metro City Revitalization',
    description: 'Urban renewal project for downtown Metro City',
    createdBy: '1',
    status: 'in_progress',
    priority: 'high',
    deadline: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
    progress: 35,
    needsApproval: false,
    team: ['2'],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString()
  },
  {
    id: '2',
    title: 'Westside Park Maintenance',
    description: 'Regular maintenance and improvements for Westside Park',
    createdBy: '1',
    status: 'planning',
    priority: 'medium',
    deadline: new Date(new Date().setDate(new Date().getDate() + 45)).toISOString(),
    progress: 10,
    needsApproval: true,
    team: ['2'],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString()
  }
];

let projectMembers: ProjectMember[] = [
  {
    id: '1-2',
    projectId: '1',
    userId: '2',
    role: 'member',
    joinedAt: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString()
  },
  {
    id: '2-2',
    projectId: '2',
    userId: '2',
    role: 'member',
    joinedAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString()
  }
];
let auditLogs: AuditLog[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Admin User',
    action: 'create',
    entityType: 'project',
    entityId: '1',
    description: 'Project "Metro City Revitalization" created',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString()
  },
  {
    id: '2',
    userId: '1',
    userName: 'Admin User',
    action: 'create',
    entityType: 'project',
    entityId: '2',
    description: 'Project "Westside Park Maintenance" created',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString()
  },
  {
    id: '3',
    userId: '1',
    userName: 'Admin User',
    action: 'create',
    entityType: 'task',
    entityId: '1',
    description: 'Task "Complete client proposal" assigned to Employee User',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString()
  },
  {
    id: '4',
    userId: '1',
    userName: 'Admin User',
    action: 'create',
    entityType: 'task',
    entityId: '2',
    description: 'Task "Review marketing materials" assigned to Employee User',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString()
  },
  {
    id: '5',
    userId: '2',
    userName: 'Employee User',
    action: 'update',
    entityType: 'task',
    entityId: '1',
    description: 'Task status updated to in_progress',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 3)).toISOString()
  },
  {
    id: '6',
    userId: '2',
    userName: 'Employee User',
    action: 'create',
    entityType: 'attendance',
    entityId: '1',
    description: 'User checked in',
    timestamp: new Date(new Date().setHours(8, 30)).toISOString()
  }
];

// Errand Requests service
export const errandService = {
  // Check if table exists
  tableExists: async () => {
    try {
      const { data, error } = await supabase
        .from('errand_requests')
        .select('id')
        .limit(1);
      
      return !error || !error.message.includes('relation "errand_requests" does not exist');
    } catch (error) {
      return false;
    }
  },
  
  // Get all errand requests
  getAllRequests: async () => {
    try {
      // Check if table exists first
      const tableExists = await errandService.tableExists();
      if (!tableExists) {
        console.warn('errand_requests table does not exist yet. Returning empty array.');
        return [];
      }
      
      const { data, error } = await supabase
        .from('errand_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(error, 'attendanceService.getAllRecords', { context: 'catch block' });
      // Return mock data in development for better UX
      if (process.env.NODE_ENV !== 'production') {
        return getMockAttendanceRecords();
      }
      return [];
    }
  },
  
  // Mock attendance records for fallback
  getMockAttendanceRecords: () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    return [
      {
        id: 'mock-1',
        user_id: '1',
        date: today,
        check_in: '08:00:00',
        check_out: '17:00:00',
        status: 'present',
        users: { name: 'Admin User' }
      },
      {
        id: 'mock-2',
        user_id: '2',
        date: today,
        check_in: '08:30:00',
        check_out: '17:30:00',
        status: 'present',
        users: { name: 'Employee User' }
      },
      {
        id: 'mock-3',
        user_id: '2',
        date: yesterday,
        check_in: '08:15:00',
        check_out: '17:15:00',
        status: 'present',
        users: { name: 'Employee User' }
      }
    ];
  },
  
  // Get errand requests assigned to a specific user
  getUserRequests: async (userId: string) => {
    try {
      // Check if table exists first
      const tableExists = await errandService.tableExists();
      if (!tableExists) {
        console.warn('errand_requests table does not exist yet. Returning empty array.');
        return [];
      }
      
      const { data, error } = await supabase
        .from('errand_requests')
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logDbError(error, 'fetchUserErrandRequests');
      throw error;
    }
  },
  
  // Create a new errand request
  createRequest: async (request: Omit<ErrandRequest, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('errand_requests')
        .insert([{
          ...request,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('Error creating errand request:', error);
      throw error;
    }
  },
  
  // Update an errand request
  updateRequest: async (id: string, updates: Partial<ErrandRequest>) => {
    try {
      const { data, error } = await supabase
        .from('errand_requests')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('Error updating errand request:', error);
      throw error;
    }
  },
  
  // Delete an errand request
  deleteRequest: async (id: string) => {
    try {
      const { error } = await supabase
        .from('errand_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting errand request:', error);
      throw error;
    }
  },
  
  // Subscribe to errand requests changes for a specific user
  subscribeToUserRequests: async (userId: string, callback: (payload: any) => void) => {
    try {
      // Check if table exists first
      const tableExists = await errandService.tableExists();
      if (!tableExists) {
        console.warn('errand_requests table does not exist yet. Returning dummy subscription.');
        // Return a dummy subscription object with unsubscribe method
        return {
          unsubscribe: () => {}
        };
      }
      
      return supabase
        .channel('errand_requests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'errand_requests',
            filter: `assigned_to=eq.${userId}`
          },
          callback
        )
        .subscribe();
    } catch (error) {
      console.error('Error setting up subscription:', error);
      // Return a dummy subscription object with unsubscribe method
      return {
        unsubscribe: () => {}
      };
    }
  }
};

// Authentication service
export const authService = {
  // Login user
  login: async (email: string, password: string) => {
    try {
      // First try to authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        console.error('Supabase auth error:', authError);
        
        // Fallback to mock authentication for development
        const user = users.find(u => u.email === email);
        if (!user) {
          return { success: false, message: "Invalid email or password" };
        }
        
        // Update last login
        user.lastLogin = new Date().toISOString();
        
        // Log the login action
        logAction(
          user.id,
          user.name,
          'login',
          'user',
          user.id,
          `User logged in: ${user.email}`
        );
        
        return { 
          success: true, 
          user: { ...user, password: undefined } // Remove password from returned user
        };
      }
      
      // If Supabase authentication succeeded, get the user details from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (userError || !userData) {
        return { success: false, message: "User details not found" };
      }
      
      // Update last login timestamp
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);
      
      if (updateError) {
        console.error('Error updating last login:', updateError);
      }
      
      // Log the login action
      logAction(
        userData.id,
        userData.name,
        'login',
        'user',
        userData.id,
        `User logged in: ${userData.email}`
      );
      
      // Convert from snake_case to camelCase for frontend
      const user = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        position: userData.position,
        createdAt: userData.created_at,
        lastLogin: userData.last_login
      };
      
      return { 
        success: true, 
        user: user 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: "Authentication failed" };
    }
  },
  
  // Create new employee user
  createEmployee: async (employeeData: {
    email: string;
    name: string;
    department: string;
    position: string;
  }) => {
    try {
      // Check if email already exists in Supabase
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', employeeData.email)
        .single();
      
      if (existingUser) {
        return { 
          success: false, 
          message: "Email already exists" 
        };
      }
      
      // Generate a random password for the new user
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Create auth user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: employeeData.email,
        password: tempPassword
      });
      
      if (authError) {
        console.error('Error creating auth user:', authError);
        
        // Fallback to mock implementation
        // Check if email already exists
        if (users.find(u => u.email === employeeData.email)) {
          return { 
            success: false, 
            message: "Email already exists" 
          };
        }
        
        // Create new user
        const newUser: User = {
          id: (users.length + 1).toString(),
          email: employeeData.email,
          name: employeeData.name,
          role: 'employee',
          department: employeeData.department,
          position: employeeData.position,
          createdAt: new Date().toISOString(),
          lastLogin: null
        };
        
        // Add to users array
        users.push(newUser);
        
        // Log the action
        logAction(
          '1', // Admin ID
          'Admin User',
          'create',
          'user',
          newUser.id,
          `Created new employee: ${newUser.email}`
        );
        
        return { 
          success: true, 
          user: { ...newUser },
          tempPassword: 'employee123' // Default password for mock implementation
        };
      }
      
      // Create user record in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            email: employeeData.email,
            name: employeeData.name,
            role: 'employee',
            department: employeeData.department,
            position: employeeData.position
          }
        ])
        .select()
        .single();
      
      if (userError) {
        console.error('Error creating user record:', userError);
        return { success: false, message: "Failed to create user record" };
      }
      
      // Log the action
      logAction(
        '1', // Admin ID
        'Admin User',
        'create',
        'user',
        userData.id,
        `Created new employee: ${userData.email}`
      );
      
      return { 
        success: true, 
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          department: userData.department,
          position: userData.position,
          createdAt: userData.created_at,
          lastLogin: userData.last_login || null
        },
        tempPassword // Return the temporary password so it can be communicated to the user
      };
    } catch (error) {
      console.error('Create employee error:', error);
      return { success: false, message: "Failed to create employee" };
    }
  },
  
  // Get all users
  getAllUsers: async () => {
    try {
      // Add timeout for better error handling
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
        
      // Race between fetch and timeout
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => { throw new Error('Request timeout'); })
      ]);
      
      if (error) {
        logError(error, 'authService.getAllUsers', { operation: 'select' });
        return [...users]; // Fallback to mock data
      }
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return [...users]; // Fallback to mock data if no results
      }
      
      // Convert from snake_case to camelCase for frontend and validate data
      return data.map(user => ({
        id: user.id || 'unknown',
        email: user.email || 'no-email',
        name: user.name || 'Unknown User',
        role: user.role || 'employee',
        department: user.department || 'Unassigned',
        position: user.position || 'Staff',
        createdAt: user.created_at || new Date().toISOString(),
        lastLogin: user.last_login || null
      }));
    } catch (error) {
      handleError(error, 'authService.getAllUsers', { 
        context: 'catch block',
        fallback: 'using mock data'
      });
      return [...users]; // Fallback to mock data
    }
  }
};

// Audit logging function
const logAction = (
  userId: string,
  userName: string,
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'check_in' | 'check_out',
  entityType: 'user' | 'attendance' | 'task' | 'project',
  entityId: string,
  details: string
) => {
  const log: AuditLog = {
    id: Date.now().toString(),
    userId,
    userName,
    action,
    entityType,
    entityId,
    details,
    ipAddress: '127.0.0.1', // Would be actual IP in production
    timestamp: new Date().toISOString()
  };
  
  auditLogs.push(log);
  return log;
};

// Error utilities already imported at the top of the file

// Attendance services
export const attendanceService = {
  // Get all attendance records (admin only)
  getAllRecords: async () => {
    try {
      // Add timeout for better error handling
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('attendance')
        .select('*, users(name)')
        .order('date', { ascending: false });
        
      // Race between fetch and timeout
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => { throw new Error('Request timeout'); })
      ]);
      
      if (error) {
        logError(error, 'attendanceService.getAllRecords', { operation: 'select' });
        // Return mock data in development for better UX
        if (process.env.NODE_ENV !== 'production') {
          return getMockAttendanceRecords();
        }
        return [];
      }
      
      // Ensure we always return an array with proper validation
      if (!data) return [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      // Handle unexpected errors with more detailed logging
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Not an Error object',
        toString: String(error)
      };
      console.error('Exception in getAllRecords:', errorDetails);
      return [];
    }
  },
  
  // Get user's attendance records
  getUserRecords: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) {
        // Check if error is related to missing table
        if (error.message && error.message.includes('does not exist')) {
          console.log(`Attendance table does not exist yet for user ${userId}`);
        } else if (Object.keys(error).length === 0) {
          console.log(`Empty error object when fetching attendance for user ${userId}`);
        } else {
          console.log(`Issue fetching attendance records for user ${userId}`);
        }
        return [];
      }
      return data || [];
    } catch (error) {
      // More graceful error handling
      console.log(`Could not fetch attendance records for user ${userId}`);
      return [];
    }
  },
  
  // Check in
  checkIn: async (userId: string, notes: string = '') => {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error('Invalid user ID format');
      }
      
      // Get user info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      if (!userData) throw new Error('User not found');
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Check if already checked in today
      const { data: existingRecord, error: checkError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existingRecord) throw new Error('Already checked in today');
      
      // Determine status based on time
      const hour = now.getHours();
      const status = hour < 9 ? 'present' : 'late';
      
      // Create new attendance record
      const newRecord = {
        user_id: userId,
        date: today,
        check_in: now.toISOString(),
        check_out: null,
        status,
        notes,
        total_hours: 0,
        location: 'Remote', // Would be actual location in production
        ip_address: '127.0.0.1' // Would be actual IP in production
      };
      
      const { data, error } = await supabase
        .from('attendance')
        .insert(newRecord)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log the action
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'check_in',
        entity_type: 'attendance',
        entity_id: data.id,
        details: `User checked in at ${now.toLocaleTimeString()}`,
        ip_address: '127.0.0.1',
        timestamp: now.toISOString()
      });
      
      return data;
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  },
  
  // Check out
  checkOut: async (userId: string, notes: string = '') => {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error('Invalid user ID format');
      }
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Find today's record
      const { data: record, error: recordError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .is('check_out', null)
        .single();
      
      if (recordError) throw recordError;
      if (!record) throw new Error('No active check-in found');
      
      const checkInTime = new Date(record.check_in);
      const totalHours = ((now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(2);
      
      // Update record
      const { data, error } = await supabase
        .from('attendance')
        .update({
          check_out: now.toISOString(),
          total_hours: parseFloat(totalHours),
          notes: notes ? `${record.notes || ''}; ${notes}`.trim() : record.notes
        })
        .eq('id', record.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log the action
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'check_out',
        entity_type: 'attendance',
        entity_id: record.id,
        details: `User checked out at ${now.toLocaleTimeString()}`,
        ip_address: '127.0.0.1',
        timestamp: now.toISOString()
      });
      
      return data;
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  },
  
  // Get active users (currently checked in)
  getActiveUsers: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select('*, users(name)')
        .eq('date', today)
        .is('check_out', null);
      
      if (error) {
        console.error('Error fetching active users:', error);
        return [];
      }
      
      // Format the data to include user name
      return data.map(record => ({
        user_id: record.user_id,
        user_name: record.users?.name || 'Unknown User',
        check_in: record.check_in,
        status: record.status
      })) || [];
    } catch (error) {
      console.error('Error fetching active users:', error);
      return [];
    }
  }
};

// Task services
export const taskService = {
  // Get all tasks (admin only)
  getAllTasks: () => {
    return [...tasks];
  },
  
  // Get user's assigned tasks
  getUserTasks: (userId: string) => {
    return tasks.filter(task => task.assignedTo === userId);
  },
  
  // Create task (admin only)
  createTask: (
    title: string,
    description: string,
    assignedBy: string,
    assignedTo: string,
    priority: 'low' | 'medium' | 'high',
    deadline: string
  ) => {
    const admin = users.find(u => u.id === assignedBy);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Only admins can create tasks');
    }
    
    const employee = users.find(u => u.id === assignedTo);
    if (!employee) {
      throw new Error('Assigned employee not found');
    }
    
    const now = new Date();
    const task: Task = {
      id: Date.now().toString(),
      title,
      description,
      assignedBy,
      assignedTo,
      assignedToName: employee.name,
      priority,
      status: 'pending',
      deadline,
      completedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    
    tasks.push(task);
    
    // Log the action
    logAction(
      assignedBy,
      admin.name,
      'create',
      'task',
      task.id,
      `Task "${title}" assigned to ${employee.name}`
    );
    
    return task;
  },
  
  // Update task status
  updateTaskStatus: (taskId: string, userId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    
    const task = tasks[taskIndex];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Only assigned user or admin can update
    if (task.assignedTo !== userId && user.role !== 'admin') {
      throw new Error('Not authorized to update this task');
    }
    
    const now = new Date();
    const updatedTask: Task = {
      ...task,
      status,
      completedAt: status === 'completed' ? now.toISOString() : task.completedAt,
      updatedAt: now.toISOString()
    };
    
    tasks[taskIndex] = updatedTask;
    
    // Log the action
    logAction(
      userId,
      user.name,
      'update',
      'task',
      task.id,
      `Task status updated to ${status}`
    );
    
    return updatedTask;
  }
};

// Project services
export const projectService = {
  // Get all projects (admin only)
  getAllProjects: () => {
    return [...projects];
  },
  
  // Get user's projects
  getUserProjects: (userId: string) => {
    const userProjectIds = projectMembers
      .filter(member => member.userId === userId)
      .map(member => member.projectId);
    
    return projects.filter(project => userProjectIds.includes(project.id));
  },
  
  // Create project (admin only)
  createProject: (
    title: string,
    description: string,
    createdBy: string,
    team: string[],
    status: 'planning' | 'in_progress' | 'completed' | 'on_hold',
    priority: 'low' | 'medium' | 'high',
    deadline: string,
    needsApproval: boolean = false
  ) => {
    const admin = users.find(u => u.id === createdBy);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Only admins can create projects');
    }
    
    const project: Project = {
      id: Date.now().toString(),
      title,
      description,
      createdBy,
      status,
      priority,
      deadline,
      progress: 0,
      needsApproval,
      team: team || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    projects.push(project);
    
    // Add team members
    team.forEach(userId => {
      projectMembers.push({
        id: `${project.id}-${userId}`,
        projectId: project.id,
        userId,
        role: 'member',
        joinedAt: new Date().toISOString()
      });
    });
    
    // Log the action
    logAction(
      createdBy,
      admin.name,
      'create',
      'project',
      project.id,
      `Project "${title}" created`
    );
    
    return project;
  },
  
  // Update project status
  updateProjectStatus: (
    projectId: string,
    status: 'planning' | 'in_progress' | 'completed' | 'on_hold',
    updatedBy: string
  ) => {
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const user = users.find(u => u.id === updatedBy);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update project
    const updatedProject = {
      ...projects[projectIndex],
      status,
      updatedAt: new Date().toISOString()
    };
    
    projects[projectIndex] = updatedProject;
    
    // Log the action
    logAction(
      updatedBy,
      user.name,
      'update',
      'project',
      projectId,
      `Project status updated to "${status}"`
    );
    
    return updatedProject;
  },
  
  // Update project progress
  updateProjectProgress: (
    projectId: string,
    progress: number,
    updatedBy: string
  ) => {
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const user = users.find(u => u.id === updatedBy);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update project
    const updatedProject = {
      ...projects[projectIndex],
      progress: Math.min(100, Math.max(0, progress)), // Ensure progress is between 0-100
      updatedAt: new Date().toISOString()
    };
    
    projects[projectIndex] = updatedProject;
    
    // Log the action
    logAction(
      updatedBy,
      user.name,
      'update',
      'project',
      projectId,
      `Project progress updated to ${progress}%`
    );
    
    return updatedProject;
  },
  
  // Approve project
  approveProject: (
    projectId: string,
    approvedBy: string
  ) => {
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const admin = users.find(u => u.id === approvedBy);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Only admins can approve projects');
    }
    
    // Update project
    const updatedProject = {
      ...projects[projectIndex],
      needsApproval: false,
      updatedAt: new Date().toISOString()
    };
    
    projects[projectIndex] = updatedProject;
    
    // Log the action
    logAction(
      approvedBy,
      admin.name,
      'update',
      'project',
      projectId,
      `Project approved`
    );
    
    return updatedProject;
  },
  
  // Reject project
  rejectProject: (
    projectId: string,
    rejectedBy: string
  ) => {
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const admin = users.find(u => u.id === rejectedBy);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Only admins can reject projects');
    }
    
    // Update project
    const updatedProject = {
      ...projects[projectIndex],
      needsApproval: false,
      status: 'on_hold',
      updatedAt: new Date().toISOString()
    };
    
    projects[projectIndex] = updatedProject;
    
    // Log the action
    logAction(
      rejectedBy,
      admin.name,
      'update',
      'project',
      projectId,
      `Project rejected and put on hold`
    );
    
    return updatedProject;
  }
};

// User services
export const userService = {
  // Get all users (admin only)
  getAllUsers: () => {
    return [...users];
  },
  
  // Get user by ID
  getUserById: (userId: string) => {
    return users.find(user => user.id === userId);
  },
  
  // Get user by email
  getUserByEmail: (email: string) => {
    return users.find(user => user.email === email);
  }
};

// Audit log services
export const auditService = {
  // Get all logs (admin only)
  getAllLogs: () => {
    return [...auditLogs];
  },
  
  // Get logs by user
  getUserLogs: (userId: string) => {
    return auditLogs.filter(log => log.userId === userId);
  },
  
  // Get logs by entity
  getEntityLogs: (entityType: 'user' | 'attendance' | 'task' | 'project', entityId: string) => {
    return auditLogs.filter(
      log => log.entityType === entityType && log.entityId === entityId
    );
  }
};
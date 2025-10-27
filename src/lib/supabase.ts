import { createClient } from '@supabase/supabase-js';
import { logError, handleError } from './error-utils';

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  const errorMessage = 'Missing Supabase environment variables. Check your .env.local file.';
  logError({
    message: errorMessage,
    source: 'supabase.ts',
    context: { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    }
  });
  
  // In production, we might want to throw an error to prevent the app from starting
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMessage);
  }
}

// Default timeout values (in milliseconds)
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const LONG_OPERATION_TIMEOUT = 30000; // 30 seconds

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'errandsite',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    timeout: DEFAULT_TIMEOUT,
  },
});

// Function to create a timeout promise that rejects after specified milliseconds
export const createTimeout = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });
};

// Execute a database query with timeout
export const executeWithTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT,
  operationName: string = 'Database operation'
): Promise<T> => {
  try {
    // Race the operation against a timeout
    const result = await Promise.race([
      operation,
      createTimeout(timeoutMs)
    ]) as T;
    
    return result;
  } catch (error) {
    // Log the error with context
    logError({
      message: `${operationName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'supabase.ts:executeWithTimeout',
      context: { timeoutMs, operationName }
    });
    
    // Rethrow with more context
    throw handleError(error, `${operationName} failed`, { timeoutMs });
  }
};

// Define authentication error types for better error handling
export type AuthError = {
  message: string;
  status?: number;
  code?: string;
};

// Auth helper functions with real Supabase implementation and fallback strategy
export const signUp = async (email: string, password: string, userData = {}) => {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        data: null,
        error: { 
          message: 'Email and password are required',
          status: 400,
          code: 'VALIDATION_ERROR'
        }
      };
    }
    
    // Validate password strength
    if (password.length < 8) {
      return {
        data: null,
        error: { 
          message: 'Password must be at least 8 characters long',
          status: 400,
          code: 'PASSWORD_TOO_SHORT'
        }
      };
    }
    
    // Use timeout to prevent hanging operations
    const result = await executeWithTimeout(
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        }
      }),
      DEFAULT_TIMEOUT,
      'User signup'
    );
    
    if (result.error) {
      return result;
    }
    
    // Store user role in the users table
    if (result.data?.user) {
      try {
        await supabase.from('users').insert({
          id: result.data.user.id,
          email: email,
          role: userData.role || 'user',
          created_at: new Date().toISOString()
        });
      } catch (dbError) {
        logError({
          message: `Failed to store user role: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
          source: 'supabase.ts:signUp',
          context: { userId: result.data.user.id }
        });
      }
    }
    
    return {
      ...result,
      data: {
        ...result.data,
        emailVerification: true
      }
    };
  } catch (error) {
    logError({
      message: `Signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'supabase.ts:signUp',
      context: { email }
    });
    
    // Return a structured error response
    return {
      data: null,
      error: { 
        message: 'Signup failed. Please try again later.',
        status: 500,
        code: 'SIGNUP_ERROR'
      }
    };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        data: null,
        error: { message: 'Email and password are required' }
      };
    }

    // Attempt real Supabase authentication with timeout
    const authResult = await executeWithTimeout(
      supabase.auth.signInWithPassword({
        email,
        password
      }),
      DEFAULT_TIMEOUT,
      'User authentication'
    );
    
    // If successful, return the result
    if (authResult.data?.user) {
      // Get user role from user_metadata or from a database lookup
      const role = authResult.data.user.user_metadata?.role || await getUserRole(authResult.data.user.id);
      
      // Enhance the user object with role information
      const enhancedUser = {
        ...authResult.data.user,
        role: role
      };
      
      return {
        data: {
          ...authResult.data,
          user: enhancedUser
        },
        error: null
      };
    }
    
    // If we get here, authentication failed but didn't throw an error
    return {
      data: null,
      error: authResult.error || { message: 'Invalid login credentials' }
    };
  } catch (error) {
    logError({
      message: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'supabase.ts:signIn',
      context: { email }
    });
    
    // Return a structured error response
    return {
      data: null,
      error: { 
        message: 'Authentication failed. Please check your credentials and try again.',
        status: 401,
        code: 'AUTH_ERROR'
      }
    };
  }
};

// Get user role from the database
export const getUserRole = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data?.role || 'user';
  } catch (error) {
    logError({
      message: `Failed to get user role: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'supabase.ts:getUserRole',
      context: { userId }
    });
    return 'user'; // Default role as fallback
  }
};

export const signOut = async () => {
  try {
    // Use real Supabase signout with timeout
    const result = await executeWithTimeout(
      supabase.auth.signOut(),
      DEFAULT_TIMEOUT,
      'User signout'
    );
    
    // Clear any local storage items related to auth
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('errandsite.user');
    }
    
    return result;
  } catch (error) {
    logError({
      message: `Signout failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'supabase.ts:signOut'
    });
    
    // Return a structured error response
    return {
      error: { 
        message: 'Signout failed. Please try again.',
        originalError: error
      }
    };
  }
};

export const getCurrentUser = async () => {
  try {
    // Use real Supabase session check with timeout
    const { data: sessionData } = await executeWithTimeout(
      supabase.auth.getSession(),
      DEFAULT_TIMEOUT,
      'Get user session'
    );
    
    if (!sessionData.session) {
      return { user: null, error: null };
    }
    
    // Get user data with timeout
    const { data: userData, error } = await executeWithTimeout(
      supabase.auth.getUser(),
      DEFAULT_TIMEOUT,
      'Get user data'
    );
    
    if (error || !userData.user) {
      return { user: null, error };
    }
    
    // Get additional user data from the users table
    const { data: profileData } = await executeWithTimeout(
      supabase
        .from('users')
        .select('role, name, department, position')
        .eq('id', userData.user.id)
        .single(),
      DEFAULT_TIMEOUT,
      'Get user profile'
    );
    
    // Combine auth data with profile data
    const role = profileData?.role || userData.user.user_metadata?.role || 'employee';
    
    return { 
      user: { 
        id: userData.user.id,
        email: userData.user.email,
        role,
        name: profileData?.name || userData.user.user_metadata?.name,
        department: profileData?.department,
        position: profileData?.position
      }, 
      error: null 
    };
  } catch (error) {
    logError({
      message: `Get current user failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'supabase.ts:getCurrentUser'
    });
    
    // FALLBACK STRATEGY FOR DEVELOPMENT ONLY
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using fallback user data in development mode');
      return { 
        user: { 
          id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
          email: 'user@example.com',
          role: 'employee'
        }, 
        error: null 
      };
    }
    
    // Return null user with error in production
    return {
      user: null,
      error: { 
        message: 'Failed to get current user. Please try logging in again.',
        originalError: error
      }
    };
  }
};

// Service-related functions with real Supabase implementation and error recovery
export const getServiceCategories = async () => {
  try {
    // Use real Supabase query with timeout
    const { data, error } = await executeWithTimeout(
      supabase
        .from('service_categories')
        .select('id, name')
        .order('name'),
      DEFAULT_TIMEOUT,
      'Get service categories'
    );

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    logError({
      message: `Failed to fetch service categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'supabase.ts:getServiceCategories'
    });

    // FALLBACK STRATEGY FOR DEVELOPMENT ONLY
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using fallback service categories in development mode');
      return {
        data: [
          { id: 1, name: 'Delivery' },
          { id: 2, name: 'Pickup' },
          { id: 3, name: 'Shopping' },
          { id: 4, name: 'Waiting in Line' },
          { id: 5, name: 'Other' },
        ],
        error: null,
      };
    }

    // Return structured error in production
    return {
      data: [],
      error: { 
        message: 'Failed to load service categories. Please try again later.',
        originalError: error
      }
    };
  }
};

export const getServices = async (categoryId?: number) => {
  try {
    // Build query with optional filter
    let query = supabase
      .from('services')
      .select('id, name, category_id');
    
    // Apply category filter if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    // Execute query with timeout
    const { data, error } = await executeWithTimeout(
      query.order('name'),
      DEFAULT_TIMEOUT,
      'Get services'
    );

    if (error) {
      throw error;
    }

    // Transform data to match expected format
    const formattedData = data.map(service => ({
      id: service.id,
      name: service.name,
      categoryId: service.category_id
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    logError({
      message: `Failed to fetch services: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'supabase.ts:getServices',
      context: { categoryId }
    });

    // FALLBACK STRATEGY FOR DEVELOPMENT ONLY
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using fallback services in development mode');
      
      // Mock services
      const allServices = [
        { id: 1, name: 'Document Delivery', categoryId: 1 },
        { id: 2, name: 'Package Delivery', categoryId: 1 },
        { id: 3, name: 'Food Delivery', categoryId: 1 },
        { id: 4, name: 'Mail Pickup', categoryId: 2 },
        { id: 5, name: 'Package Pickup', categoryId: 2 },
        { id: 6, name: 'Grocery Shopping', categoryId: 3 },
        { id: 7, name: 'Retail Shopping', categoryId: 3 },
        { id: 8, name: 'Government Office', categoryId: 4 },
        { id: 9, name: 'Post Office', categoryId: 4 },
        { id: 10, name: 'Custom Errand', categoryId: 5 },
      ];

      const filteredServices = categoryId
        ? allServices.filter((s) => s.categoryId === categoryId)
        : allServices;

      return {
        data: filteredServices,
        error: null,
      };
    }

    // Return structured error in production
    return {
      data: [],
      error: { 
        message: 'Failed to load services. Please try again later.',
        originalError: error
      }
    };
  }
};

// Errand request functions with robust error handling and recovery
export const getErrandRequests = async (userId?: string, status?: string) => {
  try {
    // Build query with filters
    let query = supabase
      .from('errand_requests')
      .select('*, services(*)')
      .order('created_at', { ascending: false });
    
    // Apply user filter if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Execute query with timeout
    const { data, error } = await executeWithTimeout(
      query,
      LONG_OPERATION_TIMEOUT, // Use longer timeout for potentially larger result sets
      'Get errand requests'
    );

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    logError({
      message: `Failed to fetch errand requests: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'supabase.ts:getErrandRequests',
      context: { userId, status }
    });
    
    // Return structured error
    return { 
      data: null, 
      error: {
        message: 'Failed to load errand requests. Please try again later.',
        originalError: error
      }
    };
  }
};

export const createErrandRequest = async (errandRequest: any) => {
  try {
    // Validate required fields
    const requiredFields = ['service_id', 'description', 'location'];
    for (const field of requiredFields) {
      if (!errandRequest[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Add created_at timestamp if not provided
    const requestWithTimestamp = {
      ...errandRequest,
      created_at: errandRequest.created_at || new Date().toISOString(),
      status: errandRequest.status || 'pending' // Default status
    };
    
    // Execute query with timeout
    const { data, error } = await executeWithTimeout(
      supabase
        .from('errand_requests')
        .insert([requestWithTimestamp])
        .select(),
      DEFAULT_TIMEOUT,
      'Create errand request'
    );

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    logError({
      message: `Failed to create errand request: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'supabase.ts:createErrandRequest',
      context: { serviceId: errandRequest.service_id }
    });
    
    // Return structured error
    return { 
      data: null, 
      error: {
        message: error instanceof Error && error.message.includes('Missing required field') 
          ? error.message 
          : 'Failed to create errand request. Please try again later.',
        originalError: error
      }
    };
  }
};

export const updateErrandStatus = async (id: string, status: string, updateData: any = {}) => {
  try {
    // Validate status
    const validStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Combine status with any additional update data
    const updates = {
      status,
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    // Execute query with timeout and retry logic
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const { data, error } = await executeWithTimeout(
          supabase
            .from('errand_requests')
            .update(updates)
            .eq('id', id)
            .select(),
          DEFAULT_TIMEOUT,
          'Update errand status'
        );
        
        if (error) {
          throw error;
        }
        
        return { data, error: null };
      } catch (err) {
        attempts++;
        
        // If this is a network error and we haven't reached max attempts, retry
        if (err instanceof Error && 
            (err.message.includes('network') || err.message.includes('timeout')) && 
            attempts < maxAttempts) {
          // Exponential backoff with jitter
          const delay = Math.min(1000 * Math.pow(2, attempts) + Math.random() * 1000, 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Otherwise, rethrow the error
        throw err;
      }
    }
    
    // This should never be reached due to the throw in the loop
    throw new Error('Failed to update errand status after maximum retry attempts');
  } catch (error) {
    logError({
      message: `Failed to update errand status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'supabase.ts:updateErrandStatus',
      context: { id, status }
    });
    
    // Return structured error
    return { 
      data: null, 
      error: {
        message: error instanceof Error && error.message.includes('Invalid status') 
          ? error.message 
          : 'Failed to update errand status. Please try again later.',
        originalError: error
      }
    };
  }
};
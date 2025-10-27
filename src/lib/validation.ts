import { z } from 'zod';
import { createValidationErrorResponse } from './api-utils';

// Helper function to validate request data against a Zod schema
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate against schema
    const result = schema.safeParse(body);
    
    if (!result.success) {
      // Format validation errors
      const formattedErrors = formatZodErrors(result.error);
      return {
        success: false,
        response: createValidationErrorResponse(formattedErrors)
      };
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    return {
      success: false,
      response: createValidationErrorResponse({
        _error: 'Invalid JSON in request body'
      })
    };
  }
}

// Helper to format Zod errors into a more user-friendly structure
function formatZodErrors(error: z.ZodError) {
  const formattedErrors: Record<string, string> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    formattedErrors[path || '_error'] = issue.message;
  }
  
  return formattedErrors;
}

// Common validation schemas
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'user', 'employee']).optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const errandRequestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  userId: z.string().uuid('Invalid user ID'),
  status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }).optional(),
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']).optional(),
  managerId: z.string().uuid('Invalid manager ID'),
});

export const taskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  projectId: z.string().uuid('Invalid project ID'),
  assigneeId: z.string().uuid('Invalid assignee ID').optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});
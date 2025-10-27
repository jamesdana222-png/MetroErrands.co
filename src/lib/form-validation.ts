import { z } from 'zod';

// User form validation schema
export const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['admin', 'manager', 'employee']),
  phone: z.string().optional(),
});

// Project form validation schema
export const projectFormSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  manager_id: z.string().uuid('Invalid manager ID'),
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']),
  start_date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid start date',
  }),
  end_date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid end date',
  }).optional(),
});

// Task form validation schema
export const taskFormSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  project_id: z.string().uuid('Invalid project ID'),
  assignee_id: z.string().uuid('Invalid assignee ID').optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid due date',
  }).optional(),
});

// Login form validation schema
export const loginFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Helper function to validate form data
export function validateForm<T>(schema: z.ZodType<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  errors?: Record<string, string>;
} {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach(err => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      return { success: false, errors: fieldErrors };
    }
    return { success: false, errors: { _form: 'Validation failed' } };
  }
}
/**
 * Utility functions for standardized error handling across the application
 */

// Type for structured error logging
export interface ErrorDetails {
  message: string;
  code?: string | number;
  source: string;
  context?: Record<string, any>;
  stack?: string;
}

/**
 * Formats an error object into a consistent structure for logging
 * Works with any error type (Error, SupabaseError, unknown)
 */
export function formatError(error: any, source: string, context?: Record<string, any>): ErrorDetails {
  // Default error structure
  const errorDetails: ErrorDetails = {
    message: 'Unknown error occurred',
    source,
    context: context || {},
  };

  try {
    // Handle standard Error objects
    if (error instanceof Error) {
      errorDetails.message = error.message;
      errorDetails.stack = error.stack;
      
      // Extract additional properties that might be on custom errors
      const anyError = error as any;
      if (anyError.code) errorDetails.code = anyError.code;
      if (anyError.statusCode) errorDetails.code = anyError.statusCode;
      if (anyError.status) errorDetails.code = anyError.status;
    } 
    // Handle Supabase errors which might have a different structure
    else if (error && typeof error === 'object') {
      if (error.message) errorDetails.message = error.message;
      if (error.error_description) errorDetails.message = error.error_description;
      if (error.code) errorDetails.code = error.code;
      if (error.details) errorDetails.context = { ...errorDetails.context, details: error.details };
      if (error.hint) errorDetails.context = { ...errorDetails.context, hint: error.hint };
    } 
    // Handle primitive error values
    else if (error !== null && error !== undefined) {
      errorDetails.message = String(error);
    }

    // Add error object's string representation if it might help debugging
    if (error && typeof error === 'object' && typeof error.toString === 'function') {
      const errorString = error.toString();
      if (errorString !== '[object Object]') {
        errorDetails.context = { 
          ...errorDetails.context, 
          errorString 
        };
      }
    }
  } catch (formatError) {
    // If error formatting itself fails, provide a fallback
    errorDetails.message = 'Error occurred (failed to format error details)';
    errorDetails.context = { 
      ...errorDetails.context,
      formatError: formatError instanceof Error ? formatError.message : String(formatError)
    };
  }

  return errorDetails;
}

/**
 * Logs an error with consistent formatting and returns the formatted error
 * for further use (e.g., displaying to the user)
 */
export function logError(error: any, source: string, context?: Record<string, any>): ErrorDetails {
  const errorDetails = formatError(error, source, context);
  
  // Log to console with structured format
  console.error(`[ERROR] ${errorDetails.source}: ${errorDetails.message}`, {
    code: errorDetails.code,
    context: errorDetails.context,
    // Only include stack in development
    ...(process.env.NODE_ENV !== 'production' && { stack: errorDetails.stack })
  });
  
  return errorDetails;
}

/**
 * Creates a user-friendly error message from error details
 */
export function getUserFriendlyMessage(errorDetails: ErrorDetails): string {
  // Default generic message
  let message = 'An unexpected error occurred. Please try again later.';
  
  // Customize based on error code or source
  if (errorDetails.code) {
    if (errorDetails.code === 'PGRST301' || errorDetails.code === 404) {
      message = 'The requested resource was not found.';
    } else if (errorDetails.code === 'PGRST204' || errorDetails.code === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (errorDetails.code === 'PGRST116' || errorDetails.code === 401) {
      message = 'Your session has expired. Please log in again.';
    } else if (errorDetails.code === 'PGRST409' || errorDetails.code === 409) {
      message = 'This operation conflicts with another change. Please refresh and try again.';
    } else if (errorDetails.code === 'PGRST422' || errorDetails.code === 422) {
      message = 'The provided information is invalid. Please check your inputs.';
    } else if (errorDetails.code === 'PGRST429' || errorDetails.code === 429) {
      message = 'Too many requests. Please try again later.';
    } else if (errorDetails.code === 'PGRST500' || errorDetails.code === 500) {
      message = 'A server error occurred. Our team has been notified.';
    }
  }
  
  // For development, include the actual error message
  if (process.env.NODE_ENV !== 'production' && errorDetails.message) {
    message += ` (${errorDetails.message})`;
  }
  
  return message;
}

/**
 * Handles an error by logging it and returning a user-friendly message
 */
export function handleError(error: any, source: string, context?: Record<string, any>): string {
  const errorDetails = logError(error, source, context);
  return getUserFriendlyMessage(errorDetails);
}
/**
 * Centralized error logging utility
 * Provides consistent error logging across the application
 */

import { logError, formatError, ErrorDetails } from './error-utils';

/**
 * Log client-side errors with consistent formatting
 * @param error - The error object
 * @param source - The source of the error (component/function name)
 * @param context - Additional context information
 */
export function logClientError(error: any, source: string, context?: Record<string, any>): ErrorDetails {
  // Use the existing logError function from error-utils
  return logError(error, `[CLIENT] ${source}`, context);
}

/**
 * Log API errors with consistent formatting
 * @param error - The error object
 * @param source - The source of the error (API route)
 * @param context - Additional context information
 */
export function logApiError(error: any, source: string, context?: Record<string, any>): ErrorDetails {
  // Use the existing logError function from error-utils
  return logError(error, `[API] ${source}`, context);
}

/**
 * Log database errors with consistent formatting
 * @param error - The error object
 * @param source - The source of the error (database operation)
 * @param context - Additional context information
 */
export function logDbError(error: any, source: string, context?: Record<string, any>): ErrorDetails {
  // Use the existing logError function from error-utils
  return logError(error, `[DB] ${source}`, context);
}

/**
 * Create a standardized API error response
 * @param error - The error object
 * @param source - The source of the error
 * @param statusCode - HTTP status code
 */
export function createApiErrorResponse(error: any, source: string, statusCode: number = 500) {
  const errorDetails = logApiError(error, source);
  
  return {
    success: false,
    error: {
      code: errorDetails.code || 'ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An error occurred while processing your request'
        : errorDetails.message,
      ...(process.env.NODE_ENV !== 'production' && { details: errorDetails })
    },
    statusCode
  };
}
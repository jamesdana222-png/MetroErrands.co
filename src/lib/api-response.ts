/**
 * Standardized API response utilities
 */
import { NextResponse } from 'next/server';
import { logApiError } from './error-logger';

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T, message: string = 'Operation successful') {
  return NextResponse.json({
    success: true,
    data,
    message
  });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: any, 
  source: string, 
  statusCode: number = 500,
  userMessage?: string
) {
  const errorDetails = logApiError(error, source);
  
  // Use provided user message or get from error details
  const message = userMessage || (
    process.env.NODE_ENV === 'production' 
      ? 'An error occurred while processing your request'
      : errorDetails.message
  );
  
  return NextResponse.json({
    success: false,
    error: {
      code: errorDetails.code || String(statusCode),
      message,
      ...(process.env.NODE_ENV !== 'production' && { details: errorDetails })
    }
  }, { status: statusCode });
}

/**
 * Create a validation error response (400)
 */
export function createValidationErrorResponse(
  errors: Record<string, string[]> | string[],
  source: string
) {
  logApiError({ message: 'Validation error', errors }, source);
  
  return NextResponse.json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'The provided data is invalid',
      errors
    }
  }, { status: 400 });
}

/**
 * Create a not found error response (404)
 */
export function createNotFoundResponse(
  resource: string,
  source: string
) {
  logApiError({ message: `${resource} not found` }, source);
  
  return NextResponse.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `The requested ${resource} was not found`
    }
  }, { status: 404 });
}

/**
 * Create an unauthorized error response (401)
 */
export function createUnauthorizedResponse(
  source: string,
  message: string = 'Authentication required'
) {
  logApiError({ message }, source);
  
  return NextResponse.json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message
    }
  }, { status: 401 });
}

/**
 * Create a forbidden error response (403)
 */
export function createForbiddenResponse(
  source: string,
  message: string = 'You do not have permission to perform this action'
) {
  logApiError({ message }, source);
  
  return NextResponse.json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message
    }
  }, { status: 403 });
}
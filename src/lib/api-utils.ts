import { NextResponse } from 'next/server';

// Standard API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    version: string;
    timestamp: string;
    requestId?: string;
  };
}

// Standard HTTP headers for API responses
export const getStandardHeaders = (additionalHeaders = {}) => {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, max-age=0',
    ...additionalHeaders
  };
};

// Generate a unique request ID
export const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

// API version (to be used in all responses)
export const API_VERSION = 'v1';

// Success response helper
export function createSuccessResponse<T>(data: T, status = 200, additionalHeaders = {}) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      version: API_VERSION,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  };
  
  return NextResponse.json(response, { 
    status, 
    headers: getStandardHeaders(additionalHeaders)
  });
}

// Error response helper
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  status = 500,
  additionalHeaders = {}
) {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code,
      message,
      details
    },
    meta: {
      version: API_VERSION,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  };
  
  return NextResponse.json(response, { 
    status, 
    headers: getStandardHeaders(additionalHeaders)
  });
}

// Common error responses
export const createNotFoundResponse = (message = 'Resource not found', details?: any) => {
  return createErrorResponse('NOT_FOUND', message, details, 404);
};

export const createBadRequestResponse = (message = 'Invalid request', details?: any) => {
  return createErrorResponse('BAD_REQUEST', message, details, 400);
};

export const createUnauthorizedResponse = (message = 'Unauthorized', details?: any) => {
  return createErrorResponse('UNAUTHORIZED', message, details, 401);
};

export const createForbiddenResponse = (message = 'Forbidden', details?: any) => {
  return createErrorResponse('FORBIDDEN', message, details, 403);
};

export const createValidationErrorResponse = (details: any) => {
  return createErrorResponse('VALIDATION_ERROR', 'Validation failed', details, 422);
};

export const createServerErrorResponse = (message = 'Internal server error', details?: any) => {
  return createErrorResponse('SERVER_ERROR', message, details, 500);
};

export const createTooManyRequestsResponse = (message = 'Rate limit exceeded', details?: any) => {
  return createErrorResponse('TOO_MANY_REQUESTS', message, details, 429);
};
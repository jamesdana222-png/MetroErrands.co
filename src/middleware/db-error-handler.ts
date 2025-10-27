/**
 * Database Error Handling Middleware
 * 
 * This middleware intercepts database errors in API routes and provides
 * standardized error responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/error-utils';
import { isDatabaseInitialized, getDatabaseInitializationError } from '@/lib/db-init';

export interface DatabaseErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Middleware to handle database errors in API routes
 */
export function withDatabaseErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    // Check if database is initialized
    if (!isDatabaseInitialized()) {
      const error = getDatabaseInitializationError();
      const response: DatabaseErrorResponse = {
        success: false,
        error: {
          code: 'DB_NOT_INITIALIZED',
          message: error || 'Database is not initialized yet',
        },
      };
      
      return NextResponse.json(response, { status: 503 });
    }

    try {
      // Execute the original handler
      return await handler(req);
    } catch (err) {
      const error = err as Error;
      
      // Log the error
      logError('Database operation error in API route', {
        path: req.nextUrl.pathname,
        error,
      });

      // Determine error type and code
      let errorCode = 'DB_ERROR';
      let statusCode = 500;
      
      if (error.message.includes('timed out')) {
        errorCode = 'DB_TIMEOUT';
        statusCode = 504;
      } else if (error.message.includes('not found')) {
        errorCode = 'NOT_FOUND';
        statusCode = 404;
      } else if (error.message.includes('permission denied')) {
        errorCode = 'PERMISSION_DENIED';
        statusCode = 403;
      } else if (error.message.includes('duplicate')) {
        errorCode = 'DUPLICATE_ENTRY';
        statusCode = 409;
      } else if (error.message.includes('validation')) {
        errorCode = 'VALIDATION_ERROR';
        statusCode = 400;
      }

      // Create standardized error response
      const response: DatabaseErrorResponse = {
        success: false,
        error: {
          code: errorCode,
          message: error.message,
        },
      };

      return NextResponse.json(response, { status: statusCode });
    }
  };
}

/**
 * Helper function to create a successful API response
 */
export function createSuccessResponse<T>(data: T, message: string = 'Operation successful') {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}
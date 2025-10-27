/**
 * Database Health Check API Endpoint
 * 
 * This endpoint provides real-time information about database connectivity
 * and table status for monitoring and diagnostics.
 */

import { NextRequest } from 'next/server';
import { healthCheck } from '@/lib/db-api';
import { withDatabaseErrorHandling, createSuccessResponse } from '@/middleware/db-error-handler';

export const GET = withDatabaseErrorHandling(async (req: NextRequest) => {
  // Get timeout parameter from query string (default to 5000ms)
  const url = new URL(req.url);
  const timeout = parseInt(url.searchParams.get('timeout') || '5000', 10);
  
  // Run health check with specified timeout
  const result = await healthCheck({ timeout });
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Database health check failed');
  }
  
  return createSuccessResponse(result.data, 'Database health check completed');
});
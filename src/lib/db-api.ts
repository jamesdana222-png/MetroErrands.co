/**
 * Database API Utility
 * 
 * This module provides consistent data access patterns for interacting with Supabase.
 * It includes standardized error handling, response formatting, and timeout management.
 */

import { supabase } from './supabase';
import { logError } from './error-utils';
import { isDatabaseInitialized, getDatabaseInitializationError } from './db-init';

// Default timeout for database operations (in milliseconds)
const DEFAULT_TIMEOUT = 8000;

// Standard response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

/**
 * Execute a database operation with timeout
 */
async function executeWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Database operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    operation()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Check if database is ready for operations
 */
function checkDatabaseReady(): ApiResponse<null> {
  if (!isDatabaseInitialized()) {
    const error = getDatabaseInitializationError();
    return {
      success: false,
      error: {
        code: 'DB_NOT_INITIALIZED',
        message: String(error || 'Database is not initialized yet'),
      },
    };
  }
  return { success: true };
}

/**
 * Generic query function with standardized error handling and response format
 */
export async function query<T>(
  tableName: string,
  options: {
    select?: string;
    match?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
    single?: boolean;
    timeout?: number;
  } = {}
): Promise<ApiResponse<T>> {
  // Check if database is ready
  const readyCheck = checkDatabaseReady();
  if (!readyCheck.success) {
    return readyCheck as ApiResponse<T>;
  }

  try {
    const {
      select = '*',
      match = {},
      order,
      limit,
      offset,
      single = false,
      timeout = DEFAULT_TIMEOUT,
    } = options;

    // Build query
    let query = supabase.from(tableName).select(select);

    // Add filters
    Object.entries(match).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    // Add ordering
    if (order) {
      query = query.order(order.column, {
        ascending: order.ascending !== false,
      });
    }

    // Add pagination
    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1);
    }

    // Execute query with timeout
    const { data, error } = await executeWithTimeout<any>(
      () => (single ? query.single() : query),
      timeout
    );

    if (error) {
      logError('Database query error', {
        table: tableName,
        error,
        options,
      });

      return {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: error.message,
          details: error.details,
        },
      };
    }

    return {
      success: true,
      data: data as T,
      message: 'Query successful',
    };
  } catch (err) {
    const error = err as Error;
    logError('Unexpected database error', {
      table: tableName,
      error,
      options,
    });

    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error.message,
      },
    };
  }
}

/**
 * Insert data into a table
 */
export async function insert<T>(
  tableName: string,
  data: Record<string, any> | Record<string, any>[],
  options: {
    returning?: string;
    timeout?: number;
  } = {}
): Promise<ApiResponse<T>> {
  // Check if database is ready
  const readyCheck = checkDatabaseReady();
  if (!readyCheck.success) {
    return readyCheck as ApiResponse<T>;
  }

  try {
    const { returning = '*', timeout = DEFAULT_TIMEOUT } = options;

    // Execute insert with timeout
    const { data: result, error } = await executeWithTimeout(
      () => supabase.from(tableName).insert(data).select(returning),
      timeout
    );

    if (error) {
      logError('Database insert error', {
        table: tableName,
        error,
        data,
      });

      return {
        success: false,
        error: {
          code: 'INSERT_ERROR',
          message: error.message,
          details: error.details,
        },
      };
    }

    return {
      success: true,
      data: result as T,
      message: 'Insert successful',
    };
  } catch (err) {
    const error = err as Error;
    logError('Unexpected database error during insert', {
      table: tableName,
      error,
      data,
    });

    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error.message,
      },
    };
  }
}

/**
 * Update data in a table
 */
export async function update<T>(
  tableName: string,
  match: Record<string, any>,
  data: Record<string, any>,
  options: {
    returning?: string;
    timeout?: number;
  } = {}
): Promise<ApiResponse<T>> {
  // Check if database is ready
  const readyCheck = checkDatabaseReady();
  if (!readyCheck.success) {
    return readyCheck as ApiResponse<T>;
  }

  try {
    const { returning = '*', timeout = DEFAULT_TIMEOUT } = options;

    // Build query
    let query = supabase.from(tableName).update(data);

    // Add filters
    Object.entries(match).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    // Execute update with timeout
    const { data: result, error } = await executeWithTimeout(
      () => query.select(returning),
      timeout
    );

    if (error) {
      logError('Database update error', {
        table: tableName,
        error,
        match,
        data,
      });

      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message,
          details: error.details,
        },
      };
    }

    return {
      success: true,
      data: result as T,
      message: 'Update successful',
    };
  } catch (err) {
    const error = err as Error;
    logError('Unexpected database error during update', {
      table: tableName,
      error,
      match,
      data,
    });

    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error.message,
      },
    };
  }
}

/**
 * Delete data from a table
 */
export async function remove<T>(
  tableName: string,
  match: Record<string, any>,
  options: {
    returning?: string;
    timeout?: number;
  } = {}
): Promise<ApiResponse<T>> {
  // Check if database is ready
  const readyCheck = checkDatabaseReady();
  if (!readyCheck.success) {
    return readyCheck as ApiResponse<T>;
  }

  try {
    const { returning = '*', timeout = DEFAULT_TIMEOUT } = options;

    // Build query
    let query = supabase.from(tableName).delete();

    // Add filters
    Object.entries(match).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    // Execute delete with timeout
    const { data: result, error } = await executeWithTimeout(
      () => query.select(returning),
      timeout
    );

    if (error) {
      logError('Database delete error', {
        table: tableName,
        error,
        match,
      });

      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error.message,
          details: error.details,
        },
      };
    }

    return {
      success: true,
      data: result as T,
      message: 'Delete successful',
    };
  } catch (err) {
    const error = err as Error;
    logError('Unexpected database error during delete', {
      table: tableName,
      error,
      match,
    });

    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error.message,
      },
    };
  }
}

/**
 * Execute a raw SQL query
 * Use with caution - only for admin operations or complex queries
 */
export async function rawQuery<T>(
  sql: string,
  params: any[] = [],
  options: {
    timeout?: number;
  } = {}
): Promise<ApiResponse<T>> {
  // Check if database is ready
  const readyCheck = checkDatabaseReady();
  if (!readyCheck.success) {
    return readyCheck as ApiResponse<T>;
  }

  try {
    const { timeout = DEFAULT_TIMEOUT } = options;

    // Execute raw query with timeout
    const { data, error } = await executeWithTimeout(
      () => supabase.rpc('execute_sql', { sql_query: sql, params }),
      timeout
    );

    if (error) {
      logError('Raw SQL query error', {
        error,
        sql,
        params,
      });

      return {
        success: false,
        error: {
          code: 'SQL_ERROR',
          message: error.message,
          details: error.details,
        },
      };
    }

    return {
      success: true,
      data: data as T,
      message: 'Query successful',
    };
  } catch (err) {
    const error = err as Error;
    logError('Unexpected error during raw SQL query', {
      error,
      sql,
      params,
    });

    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error.message,
      },
    };
  }
}

/**
 * Health check function to verify database connectivity
 */
export async function healthCheck(
  options: {
    timeout?: number;
  } = {}
): Promise<ApiResponse<{ status: string; tables: Record<string, boolean> }>> {
  // Check if database is ready
  const readyCheck = checkDatabaseReady();
  if (!readyCheck.success) {
    return readyCheck as ApiResponse<any>;
  }

  try {
    const { timeout = DEFAULT_TIMEOUT } = options;

    // Test connection with a simple query
    const { data, error } = await executeWithTimeout(
      () => supabase.from('users').select('id').limit(1),
      timeout
    );

    if (error) {
      return {
        success: false,
        error: {
          code: 'CONNECTION_ERROR',
          message: error.message,
          details: error.details,
        },
      };
    }

    // Check critical tables
    const tables = ['users', 'service_categories', 'services', 'errand_requests', 'tasks', 'attendance_records', 'projects'];
    const tableStatus: Record<string, boolean> = {};

    // Check each table
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        tableStatus[table] = !error;
      } catch {
        tableStatus[table] = false;
      }
    }

    return {
      success: true,
      data: {
        status: 'connected',
        tables: tableStatus,
      },
      message: 'Database is healthy',
    };
  } catch (err) {
    const error = err as Error;
    logError('Health check error', { error });

    return {
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: error.message,
      },
    };
  }
}

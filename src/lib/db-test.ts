import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { supabase } from './supabase';
import { logError } from './error-utils';
import { isDatabaseInitialized, getDatabaseInitializationError } from './db-init';

const DEFAULT_TIMEOUT = 5000; // 5 seconds

// Helper function to execute operations with timeout
async function executeWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  
  return Promise.race([operation(), timeoutPromise]) as Promise<T>;
}

// This function tests the database connection
export async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // First check if database is initialized
    if (!isDatabaseInitialized()) {
      const initError = getDatabaseInitializationError();
      return {
        connected: false,
        initialized: false,
        error: initError || 'Database not initialized',
        details: { message: 'Database initialization has not completed' }
      };
    }
    
    // Test connection with timeout
    const result = await executeWithTimeout(async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      return data;
    });
    
    console.log('Database connection successful!', result);
    return {
      connected: true,
      initialized: true,
      data: result
    };
  } catch (err) {
    logError('Database connection test failed', err);
    return {
      connected: false,
      initialized: isDatabaseInitialized(),
      error: err instanceof Error ? err.message : 'Unknown error',
      details: err
    };
  }
}

// Test all critical tables
export async function testAllTables() {
  const results: Record<string, any> = {};
  const tables = [
    'users', 
    'service_categories', 
    'services', 
    'errand_requests', 
    'tasks', 
    'attendance_records', 
    'projects'
  ];
  
  let allSuccessful = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await executeWithTimeout(async () => {
        return supabase
          .from(table)
          .select('count')
          .limit(1);
      });
      
      if (error) {
        results[table] = { success: false, error: error.message };
        allSuccessful = false;
      } else {
        results[table] = { success: true, data };
      }
    } catch (err) {
      logError(`Test for table ${table} failed`, err);
      results[table] = { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
      allSuccessful = false;
    }
  }
  
  return {
    success: allSuccessful,
    initialized: isDatabaseInitialized(),
    results
  };
}
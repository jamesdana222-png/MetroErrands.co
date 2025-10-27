import { initializeDatabase } from './db-migrations';
import { logError } from './error-utils';

// Flag to track initialization status
let isInitialized = false;
let isInitializing = false;
let initializationError: Error | null = null;

/**
 * Initialize the database connection and run migrations if needed
 * This should be called during application startup
 */
export const initDb = async (): Promise<{ success: boolean; message: string }> => {
  // If already initialized, return success
  if (isInitialized) {
    return { success: true, message: 'Database already initialized' };
  }
  
  // If initialization is in progress, wait for it to complete
  if (isInitializing) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isInitializing) {
          clearInterval(checkInterval);
          if (isInitialized) {
            resolve({ success: true, message: 'Database initialization completed' });
          } else {
            resolve({ 
              success: false, 
              message: `Database initialization failed: ${initializationError?.message || 'Unknown error'}` 
            });
          }
        }
      }, 100);
    });
  }
  
  // Start initialization
  isInitializing = true;
  
  try {
    console.log('Initializing database...');
    const result = await initializeDatabase();
    
    if (result.success) {
      isInitialized = true;
      isInitializing = false;
      console.log('Database initialization successful');
      return result;
    } else {
      initializationError = new Error(result.message);
      isInitializing = false;
      logError({
        message: `Database initialization failed: ${result.message}`,
        source: 'db-init.ts:initDb'
      });
      return result;
    }
  } catch (error) {
    initializationError = error instanceof Error ? error : new Error('Unknown error during database initialization');
    isInitializing = false;
    logError({
      message: `Database initialization failed: ${initializationError.message}`,
      source: 'db-init.ts:initDb'
    });
    return { 
      success: false, 
      message: `Database initialization failed: ${initializationError.message}` 
    };
  }
};

/**
 * Check if the database is initialized
 */
export const isDatabaseInitialized = (): boolean => {
  return isInitialized;
};

/**
 * Check if the database is currently initializing
 */
export const isDatabaseInitializing = (): boolean => {
  return isInitializing;
};

/**
 * Get the database initialization error if any
 */
export const getDatabaseInitializationError = (): Error | null => {
  return initializationError;
};

/**
 * Reset the database initialization status
 * This is useful for testing or when the application needs to reinitialize the database
 */
export const resetDatabaseInitialization = (): void => {
  isInitialized = false;
  isInitializing = false;
  initializationError = null;
};
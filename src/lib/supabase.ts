/**
 * Supabase Replacement
 * 
 * This file replaces all Supabase functionality with mock implementations.
 * It exports the same interface as the original Supabase client to minimize code changes.
 */

import { authClient, signIn, signUp, signOut, getCurrentUser, isAuthConfigured } from './auth-mock';
import { dbClient, isDatabaseConfigured } from './db-mock';

// Export a mock Supabase client with the same interface
export const supabase = {
  ...authClient,
  ...dbClient
};

// Export auth functions
export { signIn, signUp, signOut, getCurrentUser };

// Export utility functions
export const isSupabaseConfigured = () => {
  return isAuthConfigured() && isDatabaseConfigured();
};

// Mock functions for database operations
export const getErrandRequests = async () => {
  return { data: [], error: null };
};

export const updateErrandStatus = async (id: string, status: string) => {
  return { data: null, error: null };
};

export const getServiceCategories = async () => {
  return { 
    data: [
      { id: '1', name: 'Delivery' },
      { id: '2', name: 'Pickup' },
      { id: '3', name: 'Shopping' }
    ], 
    error: null 
  };
};

export const createErrandRequest = async (data: any) => {
  return { data: { ...data, id: Math.random().toString(36).substring(2, 15) }, error: null };
};

// Mock function for timeout operations
export const executeWithTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> => {
  return promise;
};
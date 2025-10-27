'use client';

import { useState, useCallback } from 'react';
import { logClientError } from '@/lib/error-logger';
import { getUserFriendlyMessage } from '@/lib/error-utils';

interface ErrorState {
  message: string;
  details?: string;
  visible: boolean;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Hook for handling errors in React components
 */
export function useErrorHandler(componentName: string) {
  const [error, setError] = useState<ErrorState>({
    message: '',
    details: undefined,
    visible: false,
    severity: 'error'
  });

  /**
   * Handle an error and display a user-friendly message
   */
  const handleError = useCallback((err: any, context?: Record<string, any>) => {
    // Log the error
    const errorDetails = logClientError(err, componentName, context);
    
    // Get user-friendly message
    const userMessage = getUserFriendlyMessage(errorDetails);
    
    // Set error state
    setError({
      message: userMessage,
      details: process.env.NODE_ENV !== 'production' ? errorDetails.message : undefined,
      visible: true,
      severity: 'error'
    });
    
    return userMessage;
  }, [componentName]);

  /**
   * Display a warning message
   */
  const showWarning = useCallback((message: string, details?: string) => {
    setError({
      message,
      details,
      visible: true,
      severity: 'warning'
    });
  }, []);

  /**
   * Display an info message
   */
  const showInfo = useCallback((message: string, details?: string) => {
    setError({
      message,
      details,
      visible: true,
      severity: 'info'
    });
  }, []);

  /**
   * Clear the error message
   */
  const clearError = useCallback(() => {
    setError(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    error,
    handleError,
    showWarning,
    showInfo,
    clearError
  };
}
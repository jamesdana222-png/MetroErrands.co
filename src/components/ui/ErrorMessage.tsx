'use client';

import React from 'react';
import { AlertCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorMessageProps {
  message: string;
  details?: string;
  severity?: ErrorSeverity;
  onDismiss?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  details,
  severity = 'error',
  onDismiss,
  className = '',
}) => {
  // Define styles based on severity
  const severityStyles = {
    error: {
      container: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200',
      icon: <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />,
    },
    warning: {
      container: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />,
    },
    info: {
      container: 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
      icon: <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
    },
  };

  const { container, icon } = severityStyles[severity];

  return (
    <div className={`rounded-md p-4 mb-4 ${container} ${className}`} role="alert">
      <div className="flex">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{message}</h3>
          {details && (
            <div className="mt-2 text-sm opacity-80">
              <p>{details}</p>
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 rounded-md p-1.5 inline-flex text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <span className="sr-only">Dismiss</span>
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
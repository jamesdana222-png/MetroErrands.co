'use client';

import React, { useState, useEffect } from 'react';
import { testDatabaseConnection, testAllTables } from '@/lib/db-test';
import { isDatabaseInitialized, getDatabaseInitializationError } from '@/lib/db-init';

type TableStatus = {
  success: boolean;
  error?: string;
  data?: any;
};

type TestResults = {
  success: boolean;
  initialized: boolean;
  results: Record<string, TableStatus>;
};

export default function DatabaseStatus() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [tableResults, setTableResults] = useState<TestResults | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await testDatabaseConnection();
        if (result.connected) {
          setConnectionStatus('connected');
          // Test all tables
          const tableTests = await testAllTables();
          setTableResults(tableTests);
        } else {
          setConnectionStatus('error');
          setConnectionError(result.error || 'Unknown connection error');
        }
      } catch (error) {
        setConnectionStatus('error');
        setConnectionError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Database Status</h2>
        <div className="flex items-center">
          {connectionStatus === 'loading' && (
            <span className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking...
            </span>
          )}
          
          {connectionStatus === 'connected' && (
            <span className="inline-flex items-center text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              Connected
            </span>
          )}
          
          {connectionStatus === 'error' && (
            <span className="inline-flex items-center text-red-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
              Error
            </span>
          )}
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Connection Details</h3>
            {connectionStatus === 'error' ? (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {connectionError || 'Unknown connection error'}
              </div>
            ) : (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                Database connection established successfully
              </div>
            )}
          </div>
          
          {tableResults && (
            <div>
              <h3 className="text-md font-medium mb-2">Table Status</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(tableResults.results).map(([table, status]) => (
                      <tr key={table}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {table}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {status.success ? (
                            <span className="inline-flex items-center text-green-600">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                              </svg>
                              OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                              </svg>
                              {status.error || 'Error'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="mt-4 text-right">
            <button
              onClick={async () => {
                setConnectionStatus('loading');
                setTableResults(null);
                const result = await testDatabaseConnection();
                if (result.connected) {
                  setConnectionStatus('connected');
                  const tableTests = await testAllTables();
                  setTableResults(tableTests);
                } else {
                  setConnectionStatus('error');
                  setConnectionError(result.error || 'Unknown connection error');
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Refresh Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
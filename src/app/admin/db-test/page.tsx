'use client';

import React, { useState, useEffect } from 'react';
import { testDatabaseConnection, testAllTables } from '@/lib/db-test';
import { isDatabaseInitialized, getDatabaseInitializationError } from '@/lib/db-init';
import DatabaseStatus from '@/components/DatabaseStatus';

export default function DatabaseTestPage() {
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDatabaseTest = async () => {
    try {
      setIsRunningTest(true);
      setError(null);
      
      // Test database connection
      const connectionResult = await testDatabaseConnection();
      
      // If connected, test all tables
      let tablesResult = null;
      if (connectionResult.connected) {
        tablesResult = await testAllTables();
      }
      
      setTestResults({
        connection: connectionResult,
        tables: tablesResult
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Database test error:', err);
    } finally {
      setIsRunningTest(false);
    }
  };

  useEffect(() => {
    runDatabaseTest();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Database Status & Testing</h1>
        <button
          onClick={runDatabaseTest}
          disabled={isRunningTest}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunningTest ? 'Running Tests...' : 'Run Tests Again'}
        </button>
      </div>

      {/* Database Status Component */}
      <DatabaseStatus />
      
      {/* Test Results */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error running tests</p>
          <p>{error}</p>
        </div>
      )}
      
      {testResults && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Connection Test</h3>
            <div className={`p-4 rounded ${testResults.connection.connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <p className="font-medium">
                {testResults.connection.connected ? 'Connection Successful' : 'Connection Failed'}
              </p>
              {!testResults.connection.connected && (
                <p className="mt-2">{testResults.connection.error || 'Unknown error'}</p>
              )}
            </div>
          </div>
          
          {testResults.tables && (
            <div>
              <h3 className="text-lg font-medium mb-2">Table Tests</h3>
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(testResults.tables.results).map(([table, status]: [string, any]) => (
                      <tr key={table}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {table}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {status.success ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {status.error || (status.success ? 'Table exists and is accessible' : 'Unknown error')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Database Documentation */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Database Documentation</h2>
        
        <div className="prose max-w-none">
          <h3>Database Schema</h3>
          <p>
            The application uses Supabase (PostgreSQL) with the following tables:
          </p>
          
          <ul>
            <li><strong>users</strong> - Stores user accounts and authentication information</li>
            <li><strong>service_categories</strong> - Categories of services offered</li>
            <li><strong>services</strong> - Specific services within each category</li>
            <li><strong>errand_requests</strong> - Customer errand requests</li>
            <li><strong>tasks</strong> - Internal tasks assigned to employees</li>
            <li><strong>attendance_records</strong> - Employee attendance tracking</li>
            <li><strong>projects</strong> - Project management data</li>
          </ul>
          
          <h3>Database Initialization</h3>
          <p>
            The database is automatically initialized on application startup through the AuthProvider component.
            This process creates all necessary tables if they don't exist and applies any pending migrations.
          </p>
          
          <h3>Error Handling</h3>
          <p>
            All database operations include:
          </p>
          <ul>
            <li>Timeout handling (5-10 seconds depending on operation)</li>
            <li>Automatic retries with exponential backoff for critical operations</li>
            <li>Fallback to development data when in development mode</li>
            <li>Structured error logging</li>
          </ul>
          
          <h3>Connection Management</h3>
          <p>
            The application maintains a single Supabase client instance for efficiency.
            Connection parameters are configured through environment variables:
          </p>
          <ul>
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
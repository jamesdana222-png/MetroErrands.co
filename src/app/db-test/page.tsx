'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DatabaseTestPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableError, setTableError] = useState('');

  useEffect(() => {
    async function testConnection() {
      try {
        setLoading(true);
        const supabase = createClientComponentClient();
        
        // Test basic connection
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        if (error) {
          setTestResults({
            connected: false,
            error: error.message,
            details: error
          });
          return;
        }
        
        // Get list of tables
        const { data: tablesData, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
        
        if (tablesError) {
          console.error('Error fetching tables:', tablesError);
        } else if (tablesData) {
          setTables(tablesData.map(t => t.table_name));
        }
        
        setTestResults({
          connected: true,
          data
        });
      } catch (err) {
        setTestResults({
          connected: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          details: err
        });
      } finally {
        setLoading(false);
      }
    }
    
    testConnection();
  }, []);
  
  async function fetchTableData(tableName: string) {
    try {
      setLoading(true);
      setTableError('');
      const supabase = createClientComponentClient();
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(10);
      
      if (error) {
        setTableError(`Error fetching data from ${tableName}: ${error.message}`);
        setTableData([]);
      } else {
        setTableData(data || []);
      }
    } catch (err) {
      setTableError('Unexpected error fetching table data');
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }
  
  function handleTableSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const table = e.target.value;
    setSelectedTable(table);
    if (table) {
      fetchTableData(table);
    } else {
      setTableData([]);
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
      
      {loading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Testing database connection...</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          
          {testResults?.connected ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">✅ Connected successfully to Supabase!</p>
              <p>Your database connection is working properly.</p>
            </div>
          ) : (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">❌ Connection failed</p>
              <p>Error: {testResults?.error}</p>
              <pre className="mt-2 text-xs overflow-auto max-h-40">
                {JSON.stringify(testResults?.details, null, 2)}
              </pre>
            </div>
          )}
          
          {testResults?.connected && (
            <>
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Database Tables</h2>
                
                {tables.length > 0 ? (
                  <div>
                    <select 
                      className="block w-full p-2 border border-gray-300 rounded mb-4"
                      value={selectedTable}
                      onChange={handleTableSelect}
                    >
                      <option value="">Select a table to view data</option>
                      {tables.map(table => (
                        <option key={table} value={table}>{table}</option>
                      ))}
                    </select>
                    
                    {selectedTable && (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">
                          Data from {selectedTable} (showing up to 10 rows)
                        </h3>
                        
                        {tableError ? (
                          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {tableError}
                          </div>
                        ) : tableData.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                              <thead>
                                <tr>
                                  {Object.keys(tableData[0]).map(key => (
                                    <th key={key} className="px-4 py-2 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {tableData.map((row, i) => (
                                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    {Object.values(row).map((value: any, j) => (
                                      <td key={j} className="px-4 py-2 border-b border-gray-200 text-sm">
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p>No data found in this table.</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No tables found in the database.</p>
                )}
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Connection Details</h2>
                <div className="bg-gray-100 p-4 rounded">
                  <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
                  <p><strong>Project:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
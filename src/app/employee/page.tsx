'use client';

import { useEffect, useState } from 'react';
import { getErrandRequests, updateErrandStatus, getCurrentUser } from '@/lib/supabase';
import ViewSwitcher from '@/components/dashboard/ViewSwitcher';

export default function EmployeeDashboard() {
  const [errands, setErrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUserAndErrands = async () => {
      try {
        // Get current user
        const { data: userData, error: userError } = await getCurrentUser();
        if (userError) throw userError;
        setUser(userData);

        // Get assigned errands
        const { data: errandsData, error: errandsError } = await getErrandRequests();
        if (errandsError) throw errandsError;
        
        // Filter errands assigned to this employee
        // In a real app, you would have an employee_id field to filter by
        // For now, we'll show all in_progress errands as if they're assigned to this employee
        const assignedErrands = errandsData?.filter(errand => 
          errand.status === 'in_progress'
        ) || [];
        
        setErrands(assignedErrands);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndErrands();
  }, []);

  const handleCompleteErrand = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await updateErrandStatus(id, 'completed');
      if (error) throw error;
      
      // Remove the completed errand from the list
      setErrands(errands.filter(errand => errand.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Employee Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your assigned errands
          </p>
        </div>
        <ViewSwitcher currentView="employee" currentSection="dashboard" />
      </div>
      
      {/* Welcome Card */}
      <div className="mt-6 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Welcome back, {user?.email?.split('@')[0] || 'Employee'}!
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You have {errands.length} active errands assigned to you.
          </p>
        </div>
      </div>
      
      {/* Assigned Errands */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your Assigned Errands</h2>
            
            {errands.length === 0 ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-gray-500 dark:text-gray-400">You have no assigned errands at the moment.</p>
                <p className="text-gray-500 dark:text-gray-400">Check back later or contact your supervisor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Service</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {errands.map((errand) => (
                      <tr key={errand.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{errand.id?.substring(0, 8) || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{errand.services?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{errand.customer_name || 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {errand.created_at ? new Date(errand.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {errand.location || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleCompleteErrand(errand.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Mark Complete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Tips */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-100">Tips for Completing Errands</h3>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-blue-700 dark:text-blue-200">
          <li>Always confirm the customer's identity before providing service</li>
          <li>Take photos of completed errands when appropriate</li>
          <li>Contact support if you encounter any issues during service</li>
          <li>Update the customer on any delays or complications</li>
        </ul>
      </div>
    </div>
  );
}
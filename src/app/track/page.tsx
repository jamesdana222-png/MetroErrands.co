'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type TaskUpdate = {
  date: string;
  status: string;
  location: string;
};

type TrackingResult = {
  id: string;
  title: string;
  status: string;
  location?: string;
  estimatedDelivery?: string;
  assignedToName?: string;
  priority: string;
  updates: TaskUpdate[];
};

export default function TrackPage() {
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // First check tasks table
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          id, 
          title, 
          status, 
          priority, 
          deadline,
          assignedTo,
          createdAt,
          description
        `)
        .eq('id', trackingId)
        .single();
      
      if (taskData) {
        // Get employee name
        const { data: employeeData } = await supabase
          .from('users')
          .select('name')
          .eq('id', taskData.assignedTo)
          .single();
        
        // Get task updates
        const { data: updatesData } = await supabase
          .from('task_updates')
          .select('*')
          .eq('taskId', trackingId)
          .order('createdAt', { ascending: true });
        
        const formattedUpdates: TaskUpdate[] = updatesData ? updatesData.map(update => ({
          date: new Date(update.createdAt).toLocaleDateString(),
          status: update.status,
          location: update.location || 'N/A'
        })) : [];
        
        // Add initial status if no updates
        if (formattedUpdates.length === 0) {
          formattedUpdates.push({
            date: new Date(taskData.createdAt).toLocaleDateString(),
            status: 'Created',
            location: 'System'
          });
        }
        
        setTrackingResult({
          id: taskData.id,
          title: taskData.title,
          status: taskData.status,
          priority: taskData.priority,
          estimatedDelivery: taskData.deadline ? new Date(taskData.deadline).toLocaleDateString() : undefined,
          assignedToName: employeeData?.name,
          location: 'In progress',
          updates: formattedUpdates
        });
      } else {
        setError('Tracking ID not found. Please check and try again.');
        setTrackingResult(null);
      }
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError('An error occurred while tracking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-3xl font-bold text-primary-600">
              MetroErrandCo
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Track Your Errand</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter tracking number (e.g., TR123456)"
                className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                disabled={isLoading}
              >
                {isLoading ? 'Tracking...' : 'Track'}
              </button>
            </form>
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <div className="mt-4 text-sm text-gray-500">
              <p>Try sample tracking numbers: TR123456, TR789012</p>
            </div>
          </div>
          
          {trackingResult && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Task #{trackingResult.id}</h2>
                  <p className="text-xl font-semibold text-gray-700 mt-1">{trackingResult.title}</p>
                  {trackingResult.estimatedDelivery && (
                    <p className="text-gray-600 mt-1">Deadline: {trackingResult.estimatedDelivery}</p>
                  )}
                  {trackingResult.assignedToName && (
                    <p className="text-gray-600 mt-1">Assigned to: {trackingResult.assignedToName}</p>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full font-medium ${
                  trackingResult.status === 'completed' ? 'bg-green-100 text-green-800' :
                  trackingResult.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {trackingResult.status === 'pending' ? 'Pending' :
                   trackingResult.status === 'in_progress' ? 'In Progress' :
                   'Completed'}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Current Status</h3>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    trackingResult.status === 'completed' ? 'bg-green-500' :
                    trackingResult.status === 'in_progress' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <p className="text-gray-700">
                    This task is currently <span className="font-medium">{
                      trackingResult.status === 'pending' ? 'pending' :
                      trackingResult.status === 'in_progress' ? 'in progress' :
                      'completed'
                    }</span>
                    {trackingResult.location ? ` at ${trackingResult.location}` : ''}
                  </p>
                </div>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    trackingResult.priority === 'high' ? 'bg-red-100 text-red-800' :
                    trackingResult.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {trackingResult.priority.charAt(0).toUpperCase() + trackingResult.priority.slice(1)} Priority
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Task History</h3>
                <div className="space-y-4">
                  {trackingResult.updates.map((update, index) => (
                    <div key={index} className="flex">
                      <div className="mr-4 relative">
                        <div className="w-4 h-4 rounded-full bg-primary-600"></div>
                        {index < trackingResult.updates.length - 1 && (
                          <div className="absolute top-4 bottom-0 left-2 w-0.5 -ml-px bg-gray-300 h-full"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm text-gray-500">{update.date}</p>
                        <p className="font-medium">{update.status}</p>
                        <p className="text-gray-700">{update.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
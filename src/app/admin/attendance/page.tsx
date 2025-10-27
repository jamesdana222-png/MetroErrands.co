'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Filter, Download, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { attendanceService, userService } from '@/lib/db-service';
import { AttendanceRecord, User as UserType } from '@/lib/models';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Current user ID (would come from authentication in production)
const CURRENT_USER_ID = '1'; // admin@metro.com

type FormattedAttendanceRecord = {
  id: string;
  user_id: string;
  user_name: string;
  check_in: string;
  check_out: string | null;
  date: string;
  total_hours: number | null;
  status: 'present' | 'late' | 'absent';
};

type ActiveEmployee = {
  id: string;
  name: string;
  check_in: string;
  status: 'present' | 'late';
  duration: string;
};

export default function AttendanceTracking() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [employees, setEmployees] = useState<{id: string, name: string}[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<ActiveEmployee[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const supabase = createClientComponentClient();

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString: string | null) => {
    if (!timeString) return '—';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total hours
  const calculateHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return '—';
    
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diffHours = (end - start) / (1000 * 60 * 60);
    
    return diffHours.toFixed(2);
  };

  // Get month name and year
  const getMonthYearString = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Also refresh active employees every minute
      updateActiveEmployees();
    }, 60000);
    
    // Set up real-time subscription for attendance changes
    const attendanceSubscription = supabase
      .channel('admin-attendance-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'attendance'
        }, 
        () => {
          updateActiveEmployees();
        }
      )
      .subscribe();
    
    return () => {
      clearInterval(timer);
      supabase.removeChannel(attendanceSubscription);
    };
  }, []);

  // Calculate duration since check-in
  const calculateDuration = (checkInTime: string) => {
    const start = new Date(checkInTime).getTime();
    const now = new Date().getTime();
    const diffMinutes = Math.floor((now - start) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };
  
  // Update active employees list
  const updateActiveEmployees = async () => {
    try {
      // Get active users (currently checked in) from the database service
      const activeUsers = await attendanceService.getActiveUsers();
      
      // Ensure activeUsers is an array before mapping
      const usersArray = Array.isArray(activeUsers) ? activeUsers : [];
      
      // Format for display
      const formattedActiveUsers = usersArray.map(record => ({
        id: record.user_id,
        name: record.user_name,
        check_in: record.check_in,
        status: record.status as 'present' | 'late',
        duration: calculateDuration(record.check_in)
      }));
      
      setActiveEmployees(formattedActiveUsers);
    } catch (error) {
      console.error('Error updating active employees:', error);
      setActiveEmployees([]);
    }
  };

  // Initialize active employees on component mount
  useEffect(() => {
    // Initial set of active employees from database service
    updateActiveEmployees();
    
    return () => {};
  }, []);

  useEffect(() => {
    async function fetchAttendanceData() {
      try {
        setLoading(true);
        
        // Fetch real employees from the database
        const { data: employeesData, error: employeesError } = await supabase
          .from('users')
          .select('id, name')
          .order('name');
          
        if (employeesError) {
          console.error('Error fetching employees:', employeesError);
          setEmployees([]);
        } else {
          setEmployees(employeesData || []);
        }
        
        // Fetch real attendance records for the current month
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];
        
        const { data: records, error: recordsError } = await supabase
          .from('attendance')
          .select('*, users(name)')
          .gte('date', startOfMonth)
          .lte('date', endOfMonth)
          .order('date', { ascending: false });
          
        if (recordsError) {
          console.error('Error fetching attendance records:', recordsError);
          setAttendanceRecords([]);
        } else {
          // Format records to match the expected structure
          const formattedRecords = records.map(record => ({
            id: record.id,
            user_id: record.user_id,
            user_name: record.users?.name || 'Unknown User',
            check_in: record.check_in,
            check_out: record.check_out,
            date: record.date,
            total_hours: record.total_hours,
            status: record.status
          }));
          
          setAttendanceRecords(formattedRecords);
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setAttendanceRecords([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAttendanceData();
    
    // Set up real-time subscription for attendance changes
    const attendanceSubscription = supabase
      .channel('admin-attendance-records')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'attendance'
        }, 
        () => {
          fetchAttendanceData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(attendanceSubscription);
    };
  }, [currentMonth, supabase]);

  // Filter records by selected employee
  const filteredRecords = attendanceRecords.filter(record => {
    if (selectedEmployee === 'all') return true;
    return record.user_id === selectedEmployee;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Attendance Tracking</h1>
      
      {/* Real-time Monitoring Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Real-time Monitoring</h2>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-gray-700 dark:text-gray-300">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {activeEmployees.length === 0 ? (
            <div className="col-span-full bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">No employees currently checked in</p>
            </div>
          ) : (
            activeEmployees.map(employee => (
              <div key={employee.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className={`px-4 py-2 ${employee.status === 'present' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${employee.status === 'present' ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                      {employee.status === 'present' ? 'Present' : 'Late'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(employee.check_in)}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3">
                      <span className="text-primary-700 dark:text-primary-400 font-medium">
                        {employee.name ? employee.name.split(' ').map(n => n[0]).join('') : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{employee.name || 'Unknown Employee'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Working for {employee.duration}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button 
                      onClick={() => {
                        const message = prompt(`Enter message for ${employee.name}:`);
                        if (message) {
                          try {
                            // In a real app, this would send a message through a messaging service
                            console.log(`Admin message to ${employee.name}: ${message}`);
                            alert(`Message sent to ${employee.name}`);
                          } catch (error) {
                            console.error('Error sending message:', error);
                            alert('Failed to send message. Please try again.');
                          }
                        }
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 mb-8">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span className="font-medium">{getMonthYearString(currentMonth)}</span>
              </div>
              <button 
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="all">All Employees</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                            {record.user_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4 mr-1 text-green-500 dark:text-green-400" />
                          {formatTime(record.check_in)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4 mr-1 text-red-500 dark:text-red-400" />
                          {formatTime(record.check_out)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {record.total_hours ? `${record.total_hours.toFixed(2)} hrs` : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{filteredRecords.length}</span> records
          </p>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
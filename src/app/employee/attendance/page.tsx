'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { attendanceService } from '@/lib/db-service';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';

// Supabase client
const supabase = createClientComponentClient();

export default function EmployeeAttendance() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [checkOutTime, setCheckOutTime] = useState('');
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    // Fetch attendance data
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        // Get user's attendance records
        const userRecords = await attendanceService.getUserRecords(user.id);
        
        // Format records for display
        const formattedRecords = userRecords.map(record => ({
          id: record.id,
          date: record.date,
          checkIn: record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
          checkOut: record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
          totalHours: record.totalHours,
          status: record.status
        }));
        
        // Check if already checked in today
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = formattedRecords.find(record => record.date === today);
        
        if (todayRecord) {
          setTodayAttendance(todayRecord);
          
          if (todayRecord.checkIn) {
            setCheckedIn(true);
            setCheckInTime(todayRecord.checkIn);
          }
          
          if (todayRecord.checkOut) {
            setCheckOutTime(todayRecord.checkOut);
            setTotalHours(todayRecord.totalHours);
          }
        }
        
        setAttendance(formattedRecords);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up real-time subscription for attendance changes
    const attendanceSubscription = supabase
      .channel('attendance-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'attendance',
          filter: user?.id ? `userId=eq.${user.id}` : undefined
        }, 
        () => {
          fetchData();
        }
      )
      .subscribe();
    
    return () => {
      clearInterval(timer);
      supabase.removeChannel(attendanceSubscription);
    };
  }, [user?.id]);

  const handleCheckIn = async () => {
    if (!user?.id) {
      alert('You must be logged in to check in');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call the database service to check in
      const record = await attendanceService.checkIn(user.id);
      
      // Format the record for display
      const formattedRecord = {
        id: record.id,
        date: record.date,
        checkIn: new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        checkOut: null,
        totalHours: 0,
        status: record.status
      };
      
      setCheckInTime(formattedRecord.checkIn);
      setCheckedIn(true);
      setTodayAttendance(formattedRecord);
      
      // Add to attendance records
      setAttendance(prev => [formattedRecord, ...prev]);
      
      // Show success message
      alert("Checked in successfully!");
    } catch (error: any) {
      console.error('Error checking in:', error);
      alert('Failed to check in: ' + (error?.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user?.id) {
      alert('You must be logged in to check out');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call the database service to check out
      const record = await attendanceService.checkOut(user.id);
      
      // Format the record for display
      const formattedRecord = {
        id: record.id,
        date: record.date,
        checkIn: new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        checkOut: new Date(record.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        totalHours: record.totalHours,
        status: record.status
      };
      
      setCheckOutTime(formattedRecord.checkOut);
      setTotalHours(formattedRecord.totalHours);
      
      // Update today's attendance
      setTodayAttendance(formattedRecord);
      
      // Update in attendance records
      setAttendance(prev => 
        prev.map(r => r.id === formattedRecord.id ? formattedRecord : r)
      );
      
      setCheckedIn(false);
      
      // Show success message
      alert(`Successfully checked out at ${formattedRecord.checkOut}`);
    } catch (error: any) {
      console.error('Error checking out:', error);
      alert('Failed to check out: ' + (error?.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getMonthAttendance = () => {
    return attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth.getMonth() && 
             recordDate.getFullYear() === currentMonth.getFullYear();
    });
  };

  const getAttendanceSummary = () => {
    const monthAttendance = getMonthAttendance();
    const present = monthAttendance.filter(record => record.status === 'present').length;
    const halfDay = monthAttendance.filter(record => record.status === 'half-day').length;
    const absent = monthAttendance.filter(record => record.status === 'absent').length;
    const totalHours = monthAttendance.reduce((sum, record) => sum + record.totalHours, 0);
    
    return {
      present,
      halfDay,
      absent,
      totalHours: totalHours.toFixed(1)
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'half-day':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const summary = getAttendanceSummary();

  return (
    <div className="p-6">
      {/* Check In/Out Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Today's Attendance</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Current Time: {currentTime}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-4">
            {!checkedIn ? (
              <button 
                onClick={handleCheckIn}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <Clock className="h-4 w-4 mr-2" />
                Check In
              </button>
            ) : (
              <>
                <div className="text-gray-700 dark:text-gray-300">
                  Checked in at: <span className="font-medium">{checkInTime}</span>
                </div>
                <button 
                  onClick={handleCheckOut}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Check Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Present Days</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{summary.present}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Half Days</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{summary.halfDay}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Absent Days</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{summary.absent}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Hours</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{summary.totalHours}</p>
        </div>
      </div>
      
      {/* Attendance History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Attendance History</h2>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <button 
                  onClick={prevMonth}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="mx-2 text-gray-700 dark:text-gray-300">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={nextMonth}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              
              <button className="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check In</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check Out</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Hours</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {getMonthAttendance().map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(record.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.checkIn || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.checkOut || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.totalHours || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
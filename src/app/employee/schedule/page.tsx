'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

// Mock data for employee schedule
const MOCK_SCHEDULE = [
  {
    id: 1,
    date: '2023-07-10',
    timeSlot: '09:00 AM - 11:00 AM',
    errandType: 'Package Delivery',
    location: '123 Main St, Metro City',
    customer: 'John Smith',
    status: 'completed'
  },
  {
    id: 2,
    date: '2023-07-10',
    timeSlot: '01:00 PM - 03:00 PM',
    errandType: 'Grocery Shopping',
    location: '456 Oak Ave, Metro City',
    customer: 'Sarah Johnson',
    status: 'completed'
  },
  {
    id: 3,
    date: '2023-07-11',
    timeSlot: '10:00 AM - 12:00 PM',
    errandType: 'Document Delivery',
    location: '789 Pine Rd, Metro City',
    customer: 'Michael Brown',
    status: 'upcoming'
  },
  {
    id: 4,
    date: '2023-07-11',
    timeSlot: '03:00 PM - 05:00 PM',
    errandType: 'Prescription Pickup',
    location: '321 Elm St, Metro City',
    customer: 'Emily Davis',
    status: 'upcoming'
  },
  {
    id: 5,
    date: '2023-07-12',
    timeSlot: '09:00 AM - 11:00 AM',
    errandType: 'Package Delivery',
    location: '654 Maple Dr, Metro City',
    customer: 'Robert Wilson',
    status: 'upcoming'
  },
  {
    id: 6,
    date: '2023-07-12',
    timeSlot: '01:00 PM - 03:00 PM',
    errandType: 'Food Delivery',
    location: '987 Cedar Ln, Metro City',
    customer: 'Jennifer Taylor',
    status: 'upcoming'
  },
  {
    id: 7,
    date: '2023-07-13',
    timeSlot: '11:00 AM - 01:00 PM',
    errandType: 'Grocery Shopping',
    location: '246 Birch Blvd, Metro City',
    customer: 'David Miller',
    status: 'upcoming'
  },
  {
    id: 8,
    date: '2023-07-14',
    timeSlot: '02:00 PM - 04:00 PM',
    errandType: 'Document Delivery',
    location: '135 Spruce St, Metro City',
    customer: 'Lisa Anderson',
    status: 'upcoming'
  }
];

// Helper function to group schedule by date
const groupByDate = (schedule: any[]): Record<string, any[]> => {
  return schedule.reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, any[]>);
};

export default function EmployeeSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch schedule
    setTimeout(() => {
      setSchedule(groupByDate(MOCK_SCHEDULE));
      setLoading(false);
    }, 1000);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: '', date: null });
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        date: dateString,
        hasEvents: schedule[dateString] && schedule[dateString].length > 0,
        isToday: new Date().toDateString() === date.toDateString()
      });
    }
    
    return days;
  };

  const prevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const selectDay = (dateString: string | null) => {
    if (dateString) {
      const [year, month, day] = dateString.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    }
  };

  const getSelectedDateString = () => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateSchedule = schedule[getSelectedDateString()] || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar Section */}
        <div className="w-full md:w-1/2 lg:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex space-x-2">
              <button 
                onClick={prevMonth}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((day, index) => (
              <div 
                key={index}
                onClick={() => day.date && selectDay(day.date)}
                className={`
                  h-10 flex items-center justify-center text-sm rounded-full cursor-pointer
                  ${!day.date ? 'text-gray-300 dark:text-gray-700 cursor-default' : 'text-gray-700 dark:text-gray-300'}
                  ${day.isToday ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : ''}
                  ${day.date === getSelectedDateString() ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : ''}
                  ${day.hasEvents && day.date !== getSelectedDateString() ? 'font-bold' : ''}
                  ${day.date && !day.isToday && day.date !== getSelectedDateString() ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                `}
              >
                {day.day}
                {day.hasEvents && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary-500"></span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Schedule for Selected Date */}
        <div className="w-full md:w-1/2 lg:w-2/3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Schedule for {formatDate(selectedDate)}
            </h2>
            
            {selectedDateSchedule.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500 dark:text-gray-400">No errands scheduled for this date.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateSchedule.map((item) => (
                  <div 
                    key={item.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{item.errandType}</h3>
                        <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4 mr-1" />
                          {item.timeSlot}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="h-4 w-4 mr-1" />
                          {item.location}
                        </div>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Customer: {item.customer}
                        </div>
                      </div>
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${item.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}
                      `}>
                        {item.status === 'completed' ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                    
                    <div className="mt-4 flex justify-end space-x-2">
                      <button className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-650">
                        View Details
                      </button>
                      {item.status !== 'completed' && (
                        <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700">
                          Start Errand
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

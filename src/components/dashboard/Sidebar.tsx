'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Users, Clock, MessageSquare, Briefcase, 
  BarChart2, Settings, LogOut, Home, Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dbClient } from '@/lib/supabase';

type CounterKey = 'users' | 'tasks' | 'attendance' | 'projects';
type NavItem = { name: string; href: string; icon: any; counter: CounterKey | null };

// Define admin navigation items with notification counters
const adminNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: Home, counter: null },
  { name: 'User Management', href: '/admin/users', icon: Users, counter: 'users' },
  { name: 'Tasks', href: '/admin/tasks', icon: Briefcase, counter: 'tasks' },
  { name: 'Attendance', href: '/admin/attendance', icon: Clock, counter: 'attendance' },
  { name: 'Projects', href: '/admin/projects', icon: Briefcase, counter: 'projects' },
  { name: 'Database', href: '/admin/db-test', icon: Bell, counter: null },
  { name: 'Settings', href: '/admin/settings', icon: Settings, counter: null },
];

// Define employee navigation items with notification counters
const employeeNavItems: NavItem[] = [
  { name: 'My Tasks', href: '/employee/tasks', icon: Briefcase, counter: 'tasks' },
  { name: 'Attendance', href: '/employee/attendance', icon: Clock, counter: null },
  { name: 'Profile', href: '/employee/profile', icon: Users, counter: null },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [counters, setCounters] = useState<Record<CounterKey, number>>({
    users: 0,
    tasks: 0,
    attendance: 0,
    projects: 0,
  });
  const [totalNotifications, setTotalNotifications] = useState(0);
  
  // If not authenticated or still loading, don't render the sidebar
  if (!isAuthenticated || isLoading) {
    return null;
  }
  
  // Determine if this is an admin or employee based on the user role or path
  const isAdmin = user?.role === 'admin' || pathname?.startsWith('/admin');
  const navItems = isAdmin ? adminNavItems : employeeNavItems;
  const portalType = isAdmin ? 'Admin Portal' : 'Employee Portal';

  // Fetch notification counters
  useEffect(() => {
    const fetchCounters = async () => {
      if (!user) return;
      
      const newCounters = { ...counters };
      let newTotalNotifications = 0;
      
      try {
        // For admin: count new users awaiting approval
        if (isAdmin) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact' })
            .eq('status', 'pending');
          
          if (!usersError && usersData) {
            newCounters.users = usersData.length;
            newTotalNotifications += usersData.length;
          }
          
          // Count projects needing attention
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*', { count: 'exact' })
            .eq('status', 'pending');
            
          if (!projectsError && projectsData) {
            newCounters.projects = projectsData.length;
            newTotalNotifications += projectsData.length;
          }
          
          // Count attendance records needing review
          const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact' })
            .eq('status', 'pending');
            
          if (!attendanceError && attendanceData) {
            newCounters.attendance = attendanceData.length;
            newTotalNotifications += attendanceData.length;
          }
        }
        
        // Messages section removed
        
        // For both: count pending tasks
        let tasksQuery = supabase.from('tasks').select('*', { count: 'exact' });
        
        if (isAdmin) {
          tasksQuery = tasksQuery.eq('status', 'pending');
        } else {
          tasksQuery = tasksQuery
            .eq('assignee_id', user.id)
            .eq('status', 'pending');
        }
        
        const { data: tasksData, error: tasksError } = await tasksQuery;
        
        if (!tasksError && tasksData) {
          newCounters.tasks = tasksData.length;
          newTotalNotifications += tasksData.length;
        }
        
        setCounters(newCounters);
        setTotalNotifications(newTotalNotifications);
      } catch (error) {
        console.error('Error fetching notification counters:', error);
      }
    };
    
    fetchCounters();
    
    // Set up real-time listeners for updates
    let tasksChannel: RealtimeChannel | null = null;
    
    try {
      tasksChannel = supabase
        .channel('tasks-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'tasks' 
        }, () => fetchCounters())
        .subscribe();
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
    }
      
    return () => {
      try {
        if (tasksChannel) supabase.removeChannel(tasksChannel);
      } catch (error) {
        console.error('Error removing channels:', error);
      }
    };
  }, [user, isAdmin]);

  return (
    <div 
      className="h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">MetroErrandCo</h1>
          {totalNotifications > 0 && (
            <div className="relative">
              <Bell className="h-5 w-5 text-primary-600" aria-hidden="true" />
              <span 
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                aria-label={`${totalNotifications} notifications`}
                role="status"
              >
                {totalNotifications}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400" id="portal-type">{portalType}</p>
      </div>
      
      <nav 
        className="flex-1 px-4 space-y-1"
        aria-labelledby="portal-type"
      >
        <ul className="space-y-1 list-none p-0 m-0">
          {navItems.map((item) => {
            // Improved active state detection to handle nested routes
            const isActive = pathname === item.href || 
                            (pathname?.startsWith(item.href) && item.href !== '/admin' && item.href !== '/employee/dashboard');
            const Icon = item.icon;
            const notificationCount = item.counter ? counters[item.counter] : 0;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/30'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 mr-3" aria-hidden="true" />
                    <span>{item.name}</span>
                  </div>
                  {notificationCount > 0 && (
                    <span 
                      className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                      aria-label={`${notificationCount} ${item.name.toLowerCase()} notifications`}
                    >
                      {notificationCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Employee portal switch removed */}
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={(e) => {
            e.preventDefault();
            logout();
          }}
          className="flex items-center w-full px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30 rounded-md transition-colors"
          aria-label="Logout from application"
        >
          <LogOut className="h-5 w-5 mr-3" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

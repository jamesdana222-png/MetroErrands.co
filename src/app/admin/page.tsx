'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Briefcase, ClipboardList, BarChart2, 
  Calendar, Clock, AlertTriangle, CheckCircle, 
  TrendingUp, Activity
} from 'lucide-react';
import { authService } from '@/lib/db-service';
import { attendanceService } from '@/lib/db-service';
import { projectService } from '@/lib/db-service';
import { taskService } from '@/lib/db-service';
import { auditService } from '@/lib/db-service';
import ViewSwitcher from '@/components/dashboard/ViewSwitcher';

// Helper function to format timestamps
const getTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeProjects: 0,
    pendingTasks: 0,
    completedTasks: 0,
    attendanceToday: 0,
    lateToday: 0,
    pendingApprovals: 0
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if we're running in the browser
    if (typeof window !== 'undefined') {
      // Check if user is logged in as admin
      const currentUser = localStorage.getItem('currentUser');
      
      // For development purposes, create a mock admin user if none exists
      if (!currentUser) {
        // Create a mock admin user for testing
        const mockAdmin = {
          id: '1',
          email: 'admin@metro.com',
          name: 'Admin User',
          role: 'admin',
          department: 'Management',
          position: 'System Administrator'
        };
        localStorage.setItem('currentUser', JSON.stringify(mockAdmin));
      }
      
      // Fetch dashboard data
      fetchDashboardData();
    }
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get all users - properly await the async function
      const users = await authService.getAllUsers();
      const employees = Array.isArray(users) ? users.filter(user => user.role === 'employee') : [];
      
      // Get all projects with proper error handling
      let projects = [];
      try {
        projects = await projectService.getAllProjects();
        if (!Array.isArray(projects)) projects = [];
      } catch (projectError) {
        console.error('Error fetching projects:', projectError);
        projects = [];
      }
      
      const activeProjects = projects.filter(p => p.status === 'in_progress');
      const pendingApprovals = projects.filter(p => p.needsApproval);
      
      // Get attendance records with proper error handling and await
      const today = new Date().toISOString().split('T')[0];
      let attendanceRecords = [];
      try {
        attendanceRecords = await attendanceService.getAllRecords();
        if (!Array.isArray(attendanceRecords)) attendanceRecords = [];
      } catch (attendanceError) {
        console.error('Error fetching attendance records:', attendanceError);
        attendanceRecords = [];
      }
      
      const todayRecords = attendanceRecords.filter(record => record.date === today);
      const lateRecords = todayRecords.filter(record => record.status === 'late');
      
      // Get tasks with proper error handling
      let allTasks = [];
      try {
        allTasks = await taskService.getAllTasks();
        if (!Array.isArray(allTasks)) allTasks = [];
      } catch (taskError) {
        console.error('Error fetching tasks:', taskError);
        allTasks = [];
      }
      
      const pendingTasks = allTasks.filter(task => task.status === 'pending');
      const completedTasks = allTasks.filter(task => task.status === 'completed');
      
      // Update stats
      setStats({
        totalEmployees: employees.length,
        activeProjects: activeProjects.length,
        pendingTasks: pendingTasks.length,
        completedTasks: completedTasks.length,
        attendanceToday: todayRecords.length,
        lateToday: lateRecords.length,
        pendingApprovals: pendingApprovals.length
      });
      
      // Get recent activities from audit logs with proper error handling
      let logs = [];
      try {
        logs = await auditService.getAllLogs();
        if (!Array.isArray(logs)) logs = [];
      } catch (logError) {
        console.error('Error fetching audit logs:', logError);
        logs = [];
      }
      
      // Sort logs by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Take the 5 most recent logs
      const recentLogs = logs.slice(0, 5);
      
      // Format logs for display
      const formattedActivities = recentLogs.map(log => {
        // Determine icon based on entity type and action
        let icon;
        switch (log.entityType) {
          case 'user':
            icon = <Users className="h-4 w-4 text-blue-500" />;
            break;
          case 'project':
            icon = <Briefcase className="h-4 w-4 text-green-500" />;
            break;
          case 'task':
            icon = <ClipboardList className="h-4 w-4 text-amber-500" />;
            break;
          case 'attendance':
            icon = <Clock className="h-4 w-4 text-purple-500" />;
            break;
          default:
            icon = <Activity className="h-4 w-4 text-gray-500" />;
        }
        
        // Format timestamp
        const timestamp = new Date(log.timestamp);
        const timeAgo = getTimeAgo(timestamp);
        
        return {
          id: log.id,
          icon,
          title: log.description,
          description: `By ${log.userName}`,
          time: timeAgo
        };
      });
      
      setRecentActivities(formattedActivities);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error);
      
      // Set default values to prevent UI from breaking
      setStats({
        totalEmployees: 0,
        activeProjects: 0,
        pendingTasks: 0,
        completedTasks: 0,
        attendanceToday: 0,
        lateToday: 0,
        pendingApprovals: 0
      });
      
      setRecentActivities([]);
      
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
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <ViewSwitcher currentView="admin" currentSection="default" />
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Employees" 
          value={stats.totalEmployees} 
          icon={<Users className="h-8 w-8 text-blue-500" />}
          trend="+2 this week"
        />
        <StatCard 
          title="Active Projects" 
          value={stats.activeProjects} 
          icon={<Briefcase className="h-8 w-8 text-green-500" />}
          trend={`${stats.pendingApprovals} pending approval`}
        />
        <StatCard 
          title="Today's Attendance" 
          value={`${stats.attendanceToday}/${stats.totalEmployees}`} 
          icon={<Calendar className="h-8 w-8 text-purple-500" />}
          trend={`${stats.lateToday} late check-ins`}
        />
        <StatCard 
          title="Task Completion" 
          value={stats.completedTasks} 
          icon={<CheckCircle className="h-8 w-8 text-teal-500" />}
          trend={`${stats.pendingTasks} pending`}
        />
      </div>
      
      {/* Activity and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary-500" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                No recent activities to display
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-primary-500" />
            Performance Overview
          </h2>
          <div className="space-y-4">
            <PerformanceBar 
              label="Project Completion" 
              value={75} 
              color="bg-blue-500" 
            />
            <PerformanceBar 
              label="Task Efficiency" 
              value={82} 
              color="bg-green-500" 
            />
            <PerformanceBar 
              label="Attendance Rate" 
              value={stats.totalEmployees > 0 ? (stats.attendanceToday / stats.totalEmployees) * 100 : 0} 
              color="bg-purple-500" 
            />
            <PerformanceBar 
              label="Response Time" 
              value={68} 
              color="bg-amber-500" 
            />
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction 
            title="Add Employee" 
            icon={<Users className="h-5 w-5" />}
            onClick={() => router.push('/admin/users')}
          />
          <QuickAction 
            title="Create Project" 
            icon={<Briefcase className="h-5 w-5" />}
            onClick={() => router.push('/admin/projects')}
          />
          <QuickAction 
            title="Assign Tasks" 
            icon={<ClipboardList className="h-5 w-5" />}
            onClick={() => router.push('/admin/tasks')}
          />
          <QuickAction 
            title="View Reports" 
            icon={<BarChart2 className="h-5 w-5" />}
            onClick={() => router.push('/admin/analytics')}
          />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, trend }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ activity }) {
  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition">
      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
        {activity.icon}
      </div>
      <div>
        <p className="font-medium">{activity.title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.time}</p>
      </div>
    </div>
  );
}

// Performance Bar Component
function PerformanceBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium">{Math.round(value)}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div 
          className={`${color} h-2.5 rounded-full`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}

// Quick Action Component
function QuickAction({ title, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
    >
      <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900 mb-2">
        {icon}
      </div>
      <span className="text-sm font-medium">{title}</span>
    </button>
  );
}
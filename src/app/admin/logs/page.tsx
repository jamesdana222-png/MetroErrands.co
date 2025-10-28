"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Calendar, Clock, User, FileText, CheckSquare as CheckSquareIcon, Folder as FolderIcon, File as FileIcon, User as UserIcon, Clock as ClockIcon } from "lucide-react";

// Mock audit log service (would be replaced with actual service)
const auditLogService = {
  getAllLogs: async () => {
    // This would be replaced with an actual API call
    return [
      {
        id: '1',
        userId: '2',
        userName: 'Employee User',
        action: 'check_in',
        entityType: 'attendance',
        entityId: '123',
        details: 'User checked in at 9:00 AM',
        ipAddress: '192.168.1.1',
        timestamp: new Date(new Date().setHours(9, 0, 0)).toISOString()
      },
      {
        id: '2',
        userId: '2',
        userName: 'Employee User',
        action: 'check_out',
        entityType: 'attendance',
        entityId: '123',
        details: 'User checked out at 5:00 PM',
        ipAddress: '192.168.1.1',
        timestamp: new Date(new Date().setHours(17, 0, 0)).toISOString()
      },
      {
        id: '3',
        userId: '1',
        userName: 'Admin User',
        action: 'create',
        entityType: 'task',
        entityId: '456',
        details: 'Created task "Complete project documentation"',
        ipAddress: '192.168.1.2',
        timestamp: new Date(new Date().setHours(10, 30, 0)).toISOString()
      },
      {
        id: '4',
        userId: '2',
        userName: 'Employee User',
        action: 'update',
        entityType: 'task',
        entityId: '456',
        details: 'Updated task status to "in_progress"',
        ipAddress: '192.168.1.1',
        timestamp: new Date(new Date().setHours(11, 15, 0)).toISOString()
      },
      {
        id: '5',
        userId: '1',
        userName: 'Admin User',
        action: 'create',
        entityType: 'project',
        entityId: '789',
        details: 'Created project "Website Redesign"',
        ipAddress: '192.168.1.2',
        timestamp: new Date(new Date().setHours(14, 0, 0)).toISOString()
      }
    ];
  }
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<{
    id: string;
    userId: string;
    userName: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
    ipAddress: string;
    timestamp: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const logsData = await auditLogService.getAllLogs();
        setLogs(logsData);
      } catch (error) {
        console.error("Failed to load audit logs:", error);
        alert("Failed to load audit logs. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchLogs();
  }, []);

  // Filter logs based on search term and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;
    
    // Date filtering
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const today = new Date();
      const logDate = new Date(log.timestamp);
      
      if (dateFilter === 'today') {
        matchesDate = 
          logDate.getDate() === today.getDate() && 
          logDate.getMonth() === today.getMonth() && 
          logDate.getFullYear() === today.getFullYear();
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesDate = 
          logDate.getDate() === yesterday.getDate() && 
          logDate.getMonth() === yesterday.getMonth() && 
          logDate.getFullYear() === yesterday.getFullYear();
      } else if (dateFilter === 'this_week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        matchesDate = logDate >= startOfWeek;
      }
    }
    
    return matchesSearch && matchesAction && matchesEntity && matchesDate;
  });

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);  
    return date.toLocaleString();
  };

  // Helper function to get action badge color
  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'login':
      case 'logout':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'check_in':
      case 'check_out':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Helper function to get entity type badge color
  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case 'user':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'attendance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'task':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'project':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Helper function to get icon for entity type
  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'user':
        return <UserIcon className="h-4 w-4" />;
      case 'attendance':
        return <ClockIcon className="h-4 w-4" />;
      case 'task':
        return <CheckSquareIcon className="h-4 w-4" />;
      case 'project':
        return <FolderIcon className="h-4 w-4" />;
      default:
        return <FileIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View system activity and user actions
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                >
                  <option value="all">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="check_in">Check In</option>
                  <option value="check_out">Check Out</option>
                </select>
              </div>
              <select
                className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              >
                <option value="all">All Entities</option>
                <option value="user">User</option>
                <option value="attendance">Attendance</option>
                <option value="task">Task</option>
                <option value="project">Project</option>
              </select>
              <select
                className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                            {log.userName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{log.userName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">ID: {log.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getEntityColor(log.entityType)}`}>
                          <span className="mr-1">{getEntityIcon(log.entityType)}</span>
                          {log.entityType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{log.details}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Entity ID: {log.entityId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm || actionFilter !== 'all' || entityFilter !== 'all' || dateFilter !== 'all'
                        ? "No logs match your filters" 
                        : "No audit logs found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
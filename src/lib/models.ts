// Database models for the attendance and task management system

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  department: string;
  position: string;
  createdAt: string;
  lastLogin: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  totalHours: number | null;
  status: 'present' | 'late' | 'absent';
  notes: string;
  location: string;
  ipAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedBy: string;
  assignedTo: string;
  assignedToName: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  deadline: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  team: string[];
  createdBy: string;
  needsApproval?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  role: 'manager' | 'member';
  joinedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'check_in' | 'check_out';
  entityType: 'user' | 'attendance' | 'task' | 'project';
  entityId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}
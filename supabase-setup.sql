-- Create tables for the Errand Management System

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  date DATE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC,
  status TEXT CHECK (status IN ('present', 'late', 'absent')),
  notes TEXT,
  location TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  assigned_to_name TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  deadline TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  created_by UUID REFERENCES users(id),
  needs_approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project members table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('manager', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_name TEXT NOT NULL,
  action TEXT CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'check_in', 'check_out')),
  entity_type TEXT CHECK (entity_type IN ('user', 'attendance', 'task', 'project')),
  entity_id UUID,
  details TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial admin user
INSERT INTO users (email, name, role, department, position)
VALUES ('admin@metro.com', 'Admin User', 'admin', 'Management', 'System Administrator')
ON CONFLICT (email) DO NOTHING;

-- Insert initial employee user
INSERT INTO users (email, name, role, department, position)
VALUES ('employee@metro.com', 'Employee User', 'employee', 'Operations', 'Staff')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for attendance_records table
CREATE POLICY "Admins can view all attendance records" ON attendance_records
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own attendance records" ON attendance_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance records" ON attendance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance records" ON attendance_records
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for tasks table
CREATE POLICY "Admins can view all tasks" ON tasks
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view tasks assigned to them" ON tasks
  FOR SELECT USING (auth.uid() = assigned_to);

CREATE POLICY "Admins can insert tasks" ON tasks
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can update tasks assigned to them" ON tasks
  FOR UPDATE USING (auth.uid() = assigned_to);

-- Create policies for projects table
CREATE POLICY "Admins can view all projects" ON projects
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view projects they are members of" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = projects.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert projects" ON projects
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update projects" ON projects
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for project_members table
CREATE POLICY "Admins can view all project members" ON project_members
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view project members for their projects" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members AS pm
      WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert project members" ON project_members
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create policies for audit_logs table
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);
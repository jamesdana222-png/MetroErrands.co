import { supabase } from './supabase';
import { logError } from './error-utils';

// Timeout constants
const MIGRATION_TIMEOUT = 30000; // 30 seconds for migrations

// Helper function to execute a promise with a timeout
const executeWithTimeout = async (promise: Promise<any>, timeoutMs: number, operationName: string) => {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation '${operationName}' timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
};

// Function to check if a table exists
const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await executeWithTimeout(
      supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', tableName)
        .eq('table_schema', 'public'),
      MIGRATION_TIMEOUT,
      'Check table existence'
    );
    
    if (error) {
      throw error;
    }
    
    return data && data.length > 0;
  } catch (error) {
    logError({
      message: `Error checking if table exists: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'db-migrations.ts:tableExists',
      context: { tableName }
    });
    return false;
  }
};

// Function to run a SQL query
const runQuery = async (query: string, queryName: string): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await executeWithTimeout(
      supabase.rpc('run_sql', { query }),
      MIGRATION_TIMEOUT,
      queryName
    );
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    logError({
      message: `Error running query '${queryName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'db-migrations.ts:runQuery',
      context: { queryName }
    });
    return { success: false, error };
  }
};

// Migration: Create users table
const createUsersTable = async (): Promise<{ success: boolean; error?: any }> => {
  const exists = await tableExists('users');
  if (exists) {
    console.log('Users table already exists');
    return { success: true };
  }
  
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      department TEXT,
      position TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create RLS policies
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Users can read all users
    CREATE POLICY "Users can read all users"
      ON users FOR SELECT
      USING (true);
      
    -- Policy: Users can update their own data
    CREATE POLICY "Users can update their own data"
      ON users FOR UPDATE
      USING (auth.uid() = id);
      
    -- Policy: Only admins can delete users
    CREATE POLICY "Only admins can delete users"
      ON users FOR DELETE
      USING (
        auth.jwt() ->> 'role' = 'admin'
      );
  `;
  
  return await runQuery(query, 'Create users table');
};

// Migration: Create service_categories table
const createServiceCategoriesTable = async (): Promise<{ success: boolean; error?: any }> => {
  const exists = await tableExists('service_categories');
  if (exists) {
    console.log('Service categories table already exists');
    return { success: true };
  }
  
  const query = `
    CREATE TABLE IF NOT EXISTS service_categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create RLS policies
    ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Anyone can read service categories
    CREATE POLICY "Anyone can read service categories"
      ON service_categories FOR SELECT
      USING (true);
      
    -- Policy: Only admins can modify service categories
    CREATE POLICY "Only admins can modify service categories"
      ON service_categories FOR INSERT
      USING (
        auth.jwt() ->> 'role' = 'admin'
      );
      
    CREATE POLICY "Only admins can update service categories"
      ON service_categories FOR UPDATE
      USING (
        auth.jwt() ->> 'role' = 'admin'
      );
      
    CREATE POLICY "Only admins can delete service categories"
      ON service_categories FOR DELETE
      USING (
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Insert default service categories
    INSERT INTO service_categories (name, icon)
    VALUES 
      ('Delivery', 'truck'),
      ('Pickup', 'box'),
      ('Shopping', 'shopping-cart'),
      ('Waiting in Line', 'clock'),
      ('Other', 'ellipsis-h');
  `;
  
  return await runQuery(query, 'Create service categories table');
};

// Migration: Create services table
const createServicesTable = async (): Promise<{ success: boolean; error?: any }> => {
  const exists = await tableExists('services');
  if (exists) {
    console.log('Services table already exists');
    return { success: true };
  }
  
  const query = `
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER REFERENCES service_categories(id) ON DELETE CASCADE,
      price DECIMAL(10, 2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create RLS policies
    ALTER TABLE services ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Anyone can read services
    CREATE POLICY "Anyone can read services"
      ON services FOR SELECT
      USING (true);
      
    -- Policy: Only admins can modify services
    CREATE POLICY "Only admins can modify services"
      ON services FOR INSERT
      USING (
        auth.jwt() ->> 'role' = 'admin'
      );
      
    CREATE POLICY "Only admins can update services"
      ON services FOR UPDATE
      USING (
        auth.jwt() ->> 'role' = 'admin'
      );
      
    CREATE POLICY "Only admins can delete services"
      ON services FOR DELETE
      USING (
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Insert default services
    INSERT INTO services (name, description, category_id, price)
    VALUES 
      ('Document Delivery', 'Delivery of important documents', 1, 15.00),
      ('Package Delivery', 'Delivery of packages', 1, 20.00),
      ('Food Delivery', 'Delivery of food from restaurants', 1, 12.00),
      ('Mail Pickup', 'Pickup of mail from post office', 2, 10.00),
      ('Package Pickup', 'Pickup of packages from stores or offices', 2, 15.00),
      ('Grocery Shopping', 'Shopping for groceries', 3, 25.00),
      ('Retail Shopping', 'Shopping at retail stores', 3, 30.00),
      ('Government Office', 'Waiting in line at government offices', 4, 35.00),
      ('Post Office', 'Waiting in line at post office', 4, 20.00),
      ('Custom Errand', 'Custom errand service', 5, 40.00);
  `;
  
  return await runQuery(query, 'Create services table');
};

// Migration: Create errand_requests table
const createErrandRequestsTable = async (): Promise<{ success: boolean; error?: any }> => {
  const exists = await tableExists('errand_requests');
  if (exists) {
    console.log('Errand requests table already exists');
    return { success: true };
  }
  
  const query = `
    CREATE TABLE IF NOT EXISTS errand_requests (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create RLS policies
    ALTER TABLE errand_requests ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Users can read their own errand requests
    CREATE POLICY "Users can read their own errand requests"
      ON errand_requests FOR SELECT
      USING (
        auth.uid() = user_id OR 
        auth.uid() = assigned_to OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Users can create errand requests
    CREATE POLICY "Users can create errand requests"
      ON errand_requests FOR INSERT
      USING (
        auth.uid() = user_id
      );
      
    -- Policy: Users can update their own errand requests
    CREATE POLICY "Users can update their own errand requests"
      ON errand_requests FOR UPDATE
      USING (
        auth.uid() = user_id OR
        auth.uid() = assigned_to OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Only admins can delete errand requests
    CREATE POLICY "Only admins can delete errand requests"
      ON errand_requests FOR DELETE
      USING (
        auth.jwt() ->> 'role' = 'admin'
      );
  `;
  
  return await runQuery(query, 'Create errand requests table');
};

// Migration: Create tasks table
const createTasksTable = async (): Promise<{ success: boolean; error?: any }> => {
  const exists = await tableExists('tasks');
  if (exists) {
    console.log('Tasks table already exists');
    return { success: true };
  }
  
  const query = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
      assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'pending',
      deadline TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create RLS policies
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Users can read tasks assigned to them
    CREATE POLICY "Users can read tasks assigned to them"
      ON tasks FOR SELECT
      USING (
        auth.uid() = assigned_to OR
        auth.uid() = assigned_by OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Admins can create tasks
    CREATE POLICY "Admins can create tasks"
      ON tasks FOR INSERT
      USING (
        auth.uid() = assigned_by OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Users can update tasks assigned to them
    CREATE POLICY "Users can update tasks assigned to them"
      ON tasks FOR UPDATE
      USING (
        auth.uid() = assigned_to OR
        auth.uid() = assigned_by OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Only admins can delete tasks
    CREATE POLICY "Only admins can delete tasks"
      ON tasks FOR DELETE
      USING (
        auth.jwt() ->> 'role' = 'admin'
      );
  `;
  
  return await runQuery(query, 'Create tasks table');
};

// Migration: Create attendance_records table
const createAttendanceRecordsTable = async (): Promise<{ success: boolean; error?: any }> => {
  const exists = await tableExists('attendance_records');
  if (exists) {
    console.log('Attendance records table already exists');
    return { success: true };
  }
  
  const query = `
    CREATE TABLE IF NOT EXISTS attendance_records (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      clock_in TIMESTAMP WITH TIME ZONE,
      clock_out TIMESTAMP WITH TIME ZONE,
      status TEXT NOT NULL DEFAULT 'present',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create RLS policies
    ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Users can read their own attendance records
    CREATE POLICY "Users can read their own attendance records"
      ON attendance_records FOR SELECT
      USING (
        auth.uid() = user_id OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Users can create their own attendance records
    CREATE POLICY "Users can create their own attendance records"
      ON attendance_records FOR INSERT
      USING (
        auth.uid() = user_id OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Users can update their own attendance records
    CREATE POLICY "Users can update their own attendance records"
      ON attendance_records FOR UPDATE
      USING (
        auth.uid() = user_id OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Only admins can delete attendance records
    CREATE POLICY "Only admins can delete attendance records"
      ON attendance_records FOR DELETE
      USING (
        auth.jwt() ->> 'role' = 'admin'
      );
  `;
  
  return await runQuery(query, 'Create attendance records table');
};

// Migration: Create projects table
const createProjectsTable = async (): Promise<{ success: boolean; error?: any }> => {
  const exists = await tableExists('projects');
  if (exists) {
    console.log('Projects table already exists');
    return { success: true };
  }
  
  const query = `
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'planning',
      priority TEXT NOT NULL DEFAULT 'medium',
      deadline TIMESTAMP WITH TIME ZONE,
      progress INTEGER DEFAULT 0,
      needs_approval BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create project_members junction table
    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (project_id, user_id)
    );
    
    -- Create RLS policies for projects
    ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Users can read projects they are members of
    CREATE POLICY "Users can read projects they are members of"
      ON projects FOR SELECT
      USING (
        auth.uid() = created_by OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        ) OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Admins can create projects
    CREATE POLICY "Admins can create projects"
      ON projects FOR INSERT
      USING (
        auth.uid() = created_by OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Project creators and admins can update projects
    CREATE POLICY "Project creators and admins can update projects"
      ON projects FOR UPDATE
      USING (
        auth.uid() = created_by OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
          AND project_members.role = 'manager'
        ) OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Only admins can delete projects
    CREATE POLICY "Only admins can delete projects"
      ON projects FOR DELETE
      USING (
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Create RLS policies for project_members
    ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Users can read project members
    CREATE POLICY "Users can read project members"
      ON project_members FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM projects
          WHERE projects.id = project_members.project_id
          AND (
            projects.created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM project_members pm
              WHERE pm.project_id = project_members.project_id
              AND pm.user_id = auth.uid()
            )
          )
        ) OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Project creators and admins can add project members
    CREATE POLICY "Project creators and admins can add project members"
      ON project_members FOR INSERT
      USING (
        EXISTS (
          SELECT 1 FROM projects
          WHERE projects.id = project_members.project_id
          AND (
            projects.created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM project_members pm
              WHERE pm.project_id = project_members.project_id
              AND pm.user_id = auth.uid()
              AND pm.role = 'manager'
            )
          )
        ) OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Project creators and admins can update project members
    CREATE POLICY "Project creators and admins can update project members"
      ON project_members FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM projects
          WHERE projects.id = project_members.project_id
          AND (
            projects.created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM project_members pm
              WHERE pm.project_id = project_members.project_id
              AND pm.user_id = auth.uid()
              AND pm.role = 'manager'
            )
          )
        ) OR
        auth.jwt() ->> 'role' = 'admin'
      );
      
    -- Policy: Project creators and admins can remove project members
    CREATE POLICY "Project creators and admins can remove project members"
      ON project_members FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM projects
          WHERE projects.id = project_members.project_id
          AND (
            projects.created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM project_members pm
              WHERE pm.project_id = project_members.project_id
              AND pm.user_id = auth.uid()
              AND pm.role = 'manager'
            )
          )
        ) OR
        auth.jwt() ->> 'role' = 'admin'
      );
  `;
  
  return await runQuery(query, 'Create projects table');
};

// Run all migrations
export const runMigrations = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Running database migrations...');
    
    // Run migrations in order
    const migrations = [
      { name: 'Create users table', fn: createUsersTable },
      { name: 'Create service categories table', fn: createServiceCategoriesTable },
      { name: 'Create services table', fn: createServicesTable },
      { name: 'Create errand requests table', fn: createErrandRequestsTable },
      { name: 'Create tasks table', fn: createTasksTable },
      { name: 'Create attendance records table', fn: createAttendanceRecordsTable },
      { name: 'Create projects table', fn: createProjectsTable }
    ];
    
    let allSuccessful = true;
    const results: { name: string; success: boolean; error?: any }[] = [];
    
    for (const migration of migrations) {
      console.log(`Running migration: ${migration.name}`);
      const result = await migration.fn();
      results.push({ name: migration.name, success: result.success, error: result.error });
      
      if (!result.success) {
        allSuccessful = false;
        console.error(`Migration failed: ${migration.name}`, result.error);
      } else {
        console.log(`Migration successful: ${migration.name}`);
      }
    }
    
    if (allSuccessful) {
      return { success: true, message: 'All migrations completed successfully' };
    } else {
      const failedMigrations = results.filter(r => !r.success).map(r => r.name).join(', ');
      return { 
        success: false, 
        message: `Some migrations failed: ${failedMigrations}. Check the console for details.` 
      };
    }
  } catch (error) {
    logError({
      message: `Error running migrations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'db-migrations.ts:runMigrations'
    });
    return { 
      success: false, 
      message: `Migration failed with error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Function to check database connection and run migrations if needed
export const initializeDatabase = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Check database connection
    const { data, error } = await executeWithTimeout(
      supabase.from('information_schema.tables').select('table_name').limit(1),
      MIGRATION_TIMEOUT,
      'Check database connection'
    );
    
    if (error) {
      throw error;
    }
    
    console.log('Database connection successful');
    
    // Check if migrations are needed
    const usersTableExists = await tableExists('users');
    const errandRequestsTableExists = await tableExists('errand_requests');
    
    if (!usersTableExists || !errandRequestsTableExists) {
      console.log('Database schema needs to be created or updated');
      return await runMigrations();
    }
    
    return { success: true, message: 'Database is already initialized' };
  } catch (error) {
    logError({
      message: `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'db-migrations.ts:initializeDatabase'
    });
    return { 
      success: false, 
      message: `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};
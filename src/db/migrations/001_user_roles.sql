-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrator with full system access'),
  ('employee', 'Employee with access to assigned tasks'),
  ('customer', 'Customer with access to their own orders')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('view_users', 'View user profiles', 'users', 'read'),
  ('manage_users', 'Create, update, and delete users', 'users', 'write'),
  ('view_orders', 'View orders', 'orders', 'read'),
  ('manage_orders', 'Create, update, and delete orders', 'orders', 'write'),
  ('view_tasks', 'View tasks', 'tasks', 'read'),
  ('manage_tasks', 'Create, update, and delete tasks', 'tasks', 'write'),
  ('view_own_profile', 'View own profile', 'profile', 'read'),
  ('edit_own_profile', 'Edit own profile', 'profile', 'write')
ON CONFLICT (resource, action) DO NOTHING;

-- Assign permissions to roles
-- Admin role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name IN (
  'view_users', 'manage_users', 'view_orders', 'manage_orders', 
  'view_tasks', 'manage_tasks', 'view_own_profile', 'edit_own_profile'
)
ON CONFLICT DO NOTHING;

-- Employee role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'employee' AND p.name IN (
  'view_orders', 'view_tasks', 'manage_tasks', 'view_own_profile', 'edit_own_profile'
)
ON CONFLICT DO NOTHING;

-- Customer role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'customer' AND p.name IN (
  'view_orders', 'view_own_profile', 'edit_own_profile'
)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Roles table policies
CREATE POLICY roles_admin_all ON roles
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Permissions table policies
CREATE POLICY permissions_admin_all ON permissions
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Role_permissions table policies
CREATE POLICY role_permissions_admin_all ON role_permissions
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- User_roles table policies
CREATE POLICY user_roles_admin_all ON user_roles
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY user_roles_user_read ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Create function to assign default role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
BEGIN
  -- Get the customer role ID
  SELECT id INTO default_role_id FROM roles WHERE name = 'customer';
  
  -- Assign the default role to the new user
  INSERT INTO user_roles (user_id, role_id)
  VALUES (NEW.id, default_role_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically assign default role to new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE (permission_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name
  FROM permissions p
  JOIN role_permissions rp ON p.id = rp.permission_id
  JOIN user_roles ur ON rp.role_id = ur.role_id
  WHERE ur.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create errand_requests table
CREATE TABLE IF NOT EXISTS errand_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  requested_by UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE errand_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admin can see all requests
CREATE POLICY admin_all_access ON errand_requests 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Employees can see requests assigned to them or created by them
CREATE POLICY employee_access ON errand_requests 
  FOR SELECT 
  TO authenticated 
  USING (
    assigned_to = auth.uid() OR 
    requested_by = auth.uid()
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS errand_requests_assigned_to_idx ON errand_requests(assigned_to);
CREATE INDEX IF NOT EXISTS errand_requests_requested_by_idx ON errand_requests(requested_by);
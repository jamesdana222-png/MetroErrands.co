-- SQL to add missing columns to the users table

-- Add phone column
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add start_date column
ALTER TABLE users ADD COLUMN IF NOT EXISTS start_date DATE;

-- Add status column
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'inactive', 'suspended'));

-- Add any other columns that might be missing but used in your application
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMP WITH TIME ZONE;
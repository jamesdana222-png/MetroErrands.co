-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  company_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  dark_mode_default BOOLEAN DEFAULT FALSE,
  auto_logout_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_settings_record CHECK (id = 1)
);

-- Insert default settings
INSERT INTO public.settings (id, company_name, contact_email, contact_phone)
VALUES (1, 'Errand Company', 'contact@errandcompany.com', '+1234567890')
ON CONFLICT (id) DO NOTHING;
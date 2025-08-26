/*
  # Setup Configuration Tables

  1. New Tables
    - `app_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `system_status`
      - `id` (uuid, primary key) 
      - `component` (text)
      - `status` (text)
      - `last_check` (timestamp)
      - `details` (jsonb)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access only

  3. Initial Data
    - Setup completion flag
    - System health checks
*/

-- App Settings table for configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Status table for health monitoring
CREATE TABLE IF NOT EXISTS system_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'error', 'unknown')),
  last_check TIMESTAMPTZ DEFAULT NOW(),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(component)
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_status ENABLE ROW LEVEL SECURITY;

-- Policies for app_settings (admin only)
CREATE POLICY "Admins can manage app settings"
  ON app_settings
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Policies for system_status (admin only)  
CREATE POLICY "Admins can manage system status"
  ON system_status
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Create updated_at triggers
CREATE TRIGGER update_app_settings_updated_at 
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_status_updated_at
  BEFORE UPDATE ON system_status  
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial settings
INSERT INTO app_settings (key, value, description) VALUES
  ('setup_complete', 'false', 'Whether initial setup has been completed'),
  ('app_name', '"CloudVPS Pro"', 'Application display name'),
  ('maintenance_mode', 'false', 'Whether the app is in maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- Insert initial system status
INSERT INTO system_status (component, status, details) VALUES
  ('database', 'healthy', '{"message": "Database is operational"}'),
  ('proxmox', 'unknown', '{"message": "Proxmox connection not tested"}'),
  ('stripe', 'unknown', '{"message": "Stripe integration not tested"}'),
  ('email', 'unknown', '{"message": "Email service not tested"}')
ON CONFLICT (component) DO NOTHING;
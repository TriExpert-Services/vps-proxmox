/*
  # CloudVPS Pro - Core Database Schema
  
  1. New Tables
    - `users` - User accounts and authentication
    - `vps_plans` - Available VPS hosting plans  
    - `vps_instances` - Customer VPS instances
    - `support_tickets` - Customer support system
    - `app_settings` - Application configuration
    - `system_status` - System health monitoring

  2. Security
    - Enable RLS on all tables
    - Create appropriate access policies
    - Password hashing and secure authentication

  3. Features
    - Automated triggers for updated_at timestamps
    - JSON fields for flexible configuration
    - Comprehensive indexing for performance
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'support')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT FALSE,
  profile_data JSONB DEFAULT '{}'
);

-- VPS Plans table for hosting packages
CREATE TABLE IF NOT EXISTS vps_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  cpu INTEGER NOT NULL CHECK (cpu > 0),
  ram INTEGER NOT NULL CHECK (ram > 0),
  storage INTEGER NOT NULL CHECK (storage > 0),
  bandwidth INTEGER NOT NULL CHECK (bandwidth > 0),
  monthly_price DECIMAL(10,2) NOT NULL CHECK (monthly_price >= 0),
  setup_fee DECIMAL(10,2) DEFAULT 0 CHECK (setup_fee >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  features JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  template_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VPS Instances table for customer servers
CREATE TABLE IF NOT EXISTS vps_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES vps_plans(id),
  name VARCHAR(255) NOT NULL,
  hostname VARCHAR(255),
  proxmox_vmid INTEGER UNIQUE,
  proxmox_node VARCHAR(100),
  status VARCHAR(50) DEFAULT 'creating' CHECK (status IN ('creating', 'running', 'stopped', 'suspended', 'deleted', 'error')),
  ip_address INET,
  private_ip_address INET,
  ipv6_address INET,
  operating_system VARCHAR(100) DEFAULT 'Ubuntu 22.04 LTS',
  specifications JSONB NOT NULL,
  pricing JSONB NOT NULL,
  network_config JSONB DEFAULT '{}',
  firewall_rules JSONB DEFAULT '[]',
  backup_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  root_password VARCHAR(255),
  ssh_keys TEXT[],
  notes TEXT
);

-- Support Tickets table for customer support
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vps_id UUID REFERENCES vps_instances(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'waiting-customer', 'resolved', 'closed')),
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('technical', 'billing', 'general', 'abuse')),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  tags TEXT[]
);

-- Ticket Messages table for support conversations
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_staff_reply BOOLEAN DEFAULT FALSE,
  is_internal_note BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  attachments JSONB DEFAULT '[]'
);

-- Invoices table for billing
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  line_items JSONB NOT NULL DEFAULT '[]',
  payment_terms INTEGER DEFAULT 30,
  due_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VPS Backups table
CREATE TABLE IF NOT EXISTS vps_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vps_id UUID REFERENCES vps_instances(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  backup_type VARCHAR(50) DEFAULT 'manual' CHECK (backup_type IN ('manual', 'scheduled', 'snapshot')),
  file_path TEXT,
  file_size BIGINT,
  status VARCHAR(50) DEFAULT 'creating' CHECK (status IN ('creating', 'completed', 'failed', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  notes TEXT
);

-- App Settings table for configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Status table for health monitoring  
CREATE TABLE IF NOT EXISTS system_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  component TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'error', 'unknown')),
  last_check TIMESTAMPTZ DEFAULT NOW(),
  response_time INTEGER,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs table for security and compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_vps_plans_active ON vps_plans(active, sort_order);
CREATE INDEX IF NOT EXISTS idx_vps_instances_user_id ON vps_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_vps_instances_status ON vps_instances(status);
CREATE INDEX IF NOT EXISTS idx_vps_instances_proxmox_vmid ON vps_instances(proxmox_vmid);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_vps_backups_vps_id ON vps_backups(vps_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vps_plans_updated_at BEFORE UPDATE ON vps_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();  
CREATE TRIGGER update_vps_instances_updated_at BEFORE UPDATE ON vps_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_status_updated_at BEFORE UPDATE ON system_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number = 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for ticket number generation
CREATE TRIGGER generate_ticket_number_trigger
    BEFORE INSERT ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vps_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE vps_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vps_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users  
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- VPS Plans policies (public read, admin write)
CREATE POLICY "Anyone can view active plans" ON vps_plans
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage plans" ON vps_plans
  FOR ALL TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- VPS Instances policies
CREATE POLICY "Users can view own VPS" ON vps_instances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own VPS" ON vps_instances
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all VPS" ON vps_instances
  FOR ALL TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'support'));

-- Support Tickets policies
CREATE POLICY "Users can manage own tickets" ON support_tickets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Staff can manage assigned tickets" ON support_tickets
  FOR ALL TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'support'));

-- Ticket Messages policies  
CREATE POLICY "Users can view messages for own tickets" ON ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add messages to own tickets" ON ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage all ticket messages" ON ticket_messages
  FOR ALL TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'support'));

-- Invoices policies
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all invoices" ON invoices
  FOR ALL TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- VPS Backups policies
CREATE POLICY "Users can view backups for own VPS" ON vps_backups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vps_instances 
      WHERE id = vps_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create backups for own VPS" ON vps_backups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM vps_instances 
      WHERE id = vps_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all backups" ON vps_backups
  FOR ALL TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- App Settings policies (admin only)
CREATE POLICY "Admins can manage app settings" ON app_settings
  FOR ALL TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- System Status policies (admin only)
CREATE POLICY "Admins can manage system status" ON system_status
  FOR ALL TO authenticated  
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Audit Logs policies (admin read only)
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Function for audit logging
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, 
    action, 
    resource, 
    resource_id, 
    old_values, 
    new_values,
    ip_address
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::TEXT,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers for important tables
CREATE TRIGGER audit_vps_instances_changes
  AFTER INSERT OR UPDATE OR DELETE ON vps_instances
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_users_changes  
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_support_tickets_changes
  AFTER INSERT OR UPDATE OR DELETE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();
import { createClient, SupabaseClient, AuthResponse } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

class SupabaseService {
  private supabase: SupabaseClient;
  private adminSupabase?: SupabaseClient;

  constructor(url: string, key: string, serviceRoleKey?: string) {
    this.supabase = createClient(url, key);
    
    if (serviceRoleKey) {
      this.adminSupabase = createClient(url, serviceRoleKey);
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.from('users').select('count').limit(1);
      return !error;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }

  // Run database migrations
  async runMigrations(): Promise<void> {
    if (!this.adminSupabase) {
      throw new Error('Admin client not available for migrations');
    }

    const migrations = [
      // Users table
      `
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255),
          role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
          stripe_customer_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login TIMESTAMP WITH TIME ZONE
        );
      `,
      
      // VPS Instances table
      `
        CREATE TABLE IF NOT EXISTS vps_instances (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          plan VARCHAR(100) NOT NULL,
          proxmox_vmid INTEGER UNIQUE,
          proxmox_node VARCHAR(100),
          status VARCHAR(50) DEFAULT 'creating' CHECK (status IN ('creating', 'running', 'stopped', 'suspended', 'deleted')),
          ip_address INET,
          private_ip_address INET,
          operating_system VARCHAR(100),
          specifications JSONB,
          pricing JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          deleted_at TIMESTAMP WITH TIME ZONE,
          next_billing_date TIMESTAMP WITH TIME ZONE,
          root_password VARCHAR(255)
        );
      `,
      
      // Support Tickets table
      `
        CREATE TABLE IF NOT EXISTS support_tickets (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          subject VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'waiting-customer', 'resolved', 'closed')),
          priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('technical', 'billing', 'general')),
          assigned_to UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          resolved_at TIMESTAMP WITH TIME ZONE
        );
      `,
      
      // Ticket Messages table
      `
        CREATE TABLE IF NOT EXISTS ticket_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          is_staff_reply BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          attachments JSONB
        );
      `,
      
      // Invoices table
      `
        CREATE TABLE IF NOT EXISTS invoices (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          stripe_invoice_id VARCHAR(255),
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
          items JSONB,
          due_date TIMESTAMP WITH TIME ZONE,
          paid_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      
      // Usage Records table
      `
        CREATE TABLE IF NOT EXISTS usage_records (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          vps_id UUID REFERENCES vps_instances(id) ON DELETE CASCADE,
          record_date DATE NOT NULL,
          cpu_hours DECIMAL(8,2) DEFAULT 0,
          ram_hours DECIMAL(10,2) DEFAULT 0,
          storage_hours DECIMAL(10,2) DEFAULT 0,
          bandwidth_used DECIMAL(10,2) DEFAULT 0,
          network_in DECIMAL(10,2) DEFAULT 0,
          network_out DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(vps_id, record_date)
        );
      `,
      
      // Audit Logs table
      `
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id),
          action VARCHAR(100) NOT NULL,
          resource VARCHAR(100) NOT NULL,
          resource_id VARCHAR(255) NOT NULL,
          details JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      
      // VPS Plans table
      `
        CREATE TABLE IF NOT EXISTS vps_plans (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          cpu INTEGER NOT NULL,
          ram INTEGER NOT NULL, -- in GB
          storage INTEGER NOT NULL, -- in GB
          bandwidth INTEGER NOT NULL, -- in GB
          monthly_price DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          features JSONB,
          active BOOLEAN DEFAULT TRUE,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    ];

    const indexes = [
      // Performance indexes
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);',
      'CREATE INDEX IF NOT EXISTS idx_vps_instances_user_id ON vps_instances(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_vps_instances_status ON vps_instances(status);',
      'CREATE INDEX IF NOT EXISTS idx_vps_instances_proxmox_vmid ON vps_instances(proxmox_vmid);',
      'CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);',
      'CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);',
      'CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_usage_records_vps_id ON usage_records(vps_id);',
      'CREATE INDEX IF NOT EXISTS idx_usage_records_date ON usage_records(record_date);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);'
    ];

    // Function to update timestamps
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    const triggers = [
      'CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      'CREATE TRIGGER update_vps_instances_updated_at BEFORE UPDATE ON vps_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      'CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      'CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      'CREATE TRIGGER update_vps_plans_updated_at BEFORE UPDATE ON vps_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();'
    ];

    try {
      // Run migrations
      for (const migration of migrations) {
        await this.adminSupabase.rpc('exec_sql', { sql: migration });
      }

      // Create indexes
      for (const index of indexes) {
        await this.adminSupabase.rpc('exec_sql', { sql: index });
      }

      // Create trigger function
      await this.adminSupabase.rpc('exec_sql', { sql: triggerFunction });

      // Create triggers
      for (const trigger of triggers) {
        try {
          await this.adminSupabase.rpc('exec_sql', { sql: trigger });
        } catch (error) {
          // Ignore trigger creation errors (they might already exist)
          console.warn('Trigger creation warning:', error);
        }
      }

      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Migration error:', error);
      throw new Error(`Migration failed: ${error}`);
    }
  }

  // Insert default VPS plans
  async seedDefaultPlans(): Promise<void> {
    const defaultPlans = [
      {
        name: 'Starter VPS',
        description: 'Perfect for small websites and development',
        cpu: 1,
        ram: 2,
        storage: 20,
        bandwidth: 1000,
        monthly_price: 9.99,
        features: ['SSD Storage', '99.9% Uptime', '24/7 Support', 'Free SSL', 'Weekly Backups']
      },
      {
        name: 'Professional VPS',
        description: 'Ideal for business websites and applications',
        cpu: 2,
        ram: 4,
        storage: 50,
        bandwidth: 2000,
        monthly_price: 19.99,
        features: ['SSD Storage', '99.9% Uptime', '24/7 Support', 'Free SSL', 'Daily Backups', 'Root Access', 'Multiple OS']
      },
      {
        name: 'Enterprise VPS',
        description: 'High-performance solution for demanding applications',
        cpu: 4,
        ram: 8,
        storage: 100,
        bandwidth: 5000,
        monthly_price: 39.99,
        features: ['NVMe SSD Storage', '99.95% Uptime', 'Priority Support', 'Free SSL', 'Daily Backups', 'Root Access', 'Multiple OS', 'Private Network', 'DDoS Protection']
      }
    ];

    try {
      for (const plan of defaultPlans) {
        await this.supabase
          .from('vps_plans')
          .upsert(plan, { onConflict: 'name' });
      }
    } catch (error) {
      console.error('Failed to seed default plans:', error);
    }
  }

  // User management
  async createUser(userData: {
    email: string;
    password: string;
    metadata?: any;
  }): Promise<AuthResponse> {
    if (!this.adminSupabase) {
      throw new Error('Admin client required for user creation');
    }

    return await this.adminSupabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: userData.metadata,
      email_confirm: true
    });
  }

  async getUser(userId: string) {
    return await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
  }

  async updateUser(userId: string, updates: any) {
    return await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
  }

  // VPS management
  async createVPS(vpsData: any) {
    return await this.supabase
      .from('vps_instances')
      .insert(vpsData)
      .select()
      .single();
  }

  async getVPS(vpsId: string) {
    return await this.supabase
      .from('vps_instances')
      .select('*')
      .eq('id', vpsId)
      .single();
  }

  async getUserVPS(userId: string) {
    return await this.supabase
      .from('vps_instances')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
  }

  async updateVPS(vpsId: string, updates: any) {
    return await this.supabase
      .from('vps_instances')
      .update(updates)
      .eq('id', vpsId);
  }

  // Support tickets
  async createTicket(ticketData: any) {
    return await this.supabase
      .from('support_tickets')
      .insert(ticketData)
      .select()
      .single();
  }

  async getTicket(ticketId: string) {
    return await this.supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
  }

  async getUserTickets(userId: string) {
    return await this.supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  }

  // Analytics and reporting
  async getSystemStats() {
    const [users, vpsInstances, tickets] = await Promise.all([
      this.supabase.from('users').select('count'),
      this.supabase.from('vps_instances').select('count').is('deleted_at', null),
      this.supabase.from('support_tickets').select('count').in('status', ['open', 'in-progress'])
    ]);

    return {
      totalUsers: users.count || 0,
      totalVPS: vpsInstances.count || 0,
      openTickets: tickets.count || 0
    };
  }

  // Configuration management
  async saveConfiguration(config: any) {
    // Save configuration to a settings table or use environment variables
    // This is a placeholder - implement based on your needs
    console.log('Saving configuration:', config);
  }
}

export default SupabaseService;
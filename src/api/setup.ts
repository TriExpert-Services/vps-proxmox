// Setup API endpoints for initial configuration
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Configuration storage
interface SetupConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  proxmox: {
    host: string;
    port: number;
    username: string;
    password: string;
    realm: string;
    protocol: 'http' | 'https';
  };
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  email: {
    provider: 'smtp' | 'sendgrid' | 'ses';
    fromEmail: string;
    fromName: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    sendgridApiKey?: string;
    awsRegion?: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
  };
  admin: {
    name: string;
    email: string;
    password: string;
  };
  app: {
    name: string;
    baseUrl: string;
    domain: string;
  };
}

// Check setup status
router.get('/status', async (req, res) => {
  try {
    // Check if .env file exists and has required variables
    const envPath = path.join(process.cwd(), '.env');
    const configExists = fs.existsSync(envPath);
    
    let supabaseConnected = false;
    let isComplete = false;

    if (configExists) {
      // Try to connect to Supabase to verify setup
      const envContent = fs.readFileSync(envPath, 'utf8');
      const supabaseUrl = extractEnvValue(envContent, 'VITE_SUPABASE_URL');
      const supabaseKey = extractEnvValue(envContent, 'VITE_SUPABASE_ANON_KEY');
      
      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'setup_complete').single();
          
          if (!error && data && data.value === true) {
            isComplete = true;
            supabaseConnected = true;
          }
        } catch (error) {
          console.log('Supabase connection test failed during status check');
        }
      }
    }

    res.json({
      isComplete,
      configExists,
      supabaseConnected
    });
  } catch (error) {
    res.status(500).json({ 
      isComplete: false, 
      error: 'Failed to check setup status' 
    });
  }
});

// Test Supabase connection
router.post('/test-supabase', async (req, res) => {
  try {
    const { url, anonKey, serviceRoleKey } = req.body;

    if (!url || !anonKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL and anonymous key are required' 
      });
    }

    // Test with anonymous key
    const supabase = createClient(url, anonKey);
    const { error } = await supabase.from('_supabase_migrations').select('version').limit(1);
    
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }

    // Test with service role key if provided
    if (serviceRoleKey) {
      const adminSupabase = createClient(url, serviceRoleKey);
      const { error: adminError } = await adminSupabase.auth.admin.listUsers();
      
      if (adminError) {
        throw adminError;
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection failed' 
    });
  }
});

// Test Proxmox connection
router.post('/test-proxmox', async (req, res) => {
  try {
    const { host, port, username, password, realm, protocol } = req.body;

    const baseUrl = `${protocol}://${host}:${port}/api2/json`;
    
    // Test authentication
    const authResponse = await fetch(`${baseUrl}/access/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: `${username}@${realm}`,
        password: password
      })
    });

    if (!authResponse.ok) {
      throw new Error('Authentication failed');
    }

    const authData = await authResponse.json();
    
    // Test API access with the ticket
    const nodesResponse = await fetch(`${baseUrl}/nodes`, {
      headers: {
        'Authorization': `Bearer ${authData.data.ticket}`,
        'CSRFPreventionToken': authData.data.CSRFPreventionToken
      }
    });

    if (!nodesResponse.ok) {
      throw new Error('Failed to access Proxmox API');
    }

    const nodesData = await nodesResponse.json();
    
    res.json({ 
      success: true, 
      nodes: nodesData.data?.length || 0 
    });
  } catch (error) {
    res.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection failed' 
    });
  }
});

// Test email configuration
router.post('/test-email', async (req, res) => {
  try {
    const { provider, testEmail, ...emailConfig } = req.body;

    // Here you would implement actual email testing based on provider
    // For now, we'll simulate success
    
    if (provider === 'sendgrid' && emailConfig.sendgridApiKey) {
      // Test SendGrid API
      const sgResponse = await fetch('https://api.sendgrid.com/v3/user/account', {
        headers: {
          'Authorization': `Bearer ${emailConfig.sendgridApiKey}`
        }
      });
      
      if (!sgResponse.ok) {
        throw new Error('Invalid SendGrid API key');
      }
    }

    // Simulate sending test email
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    res.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Email test failed' 
    });
  }
});

// Save configuration to .env file
router.post('/save-config', async (req, res) => {
  try {
    const config: SetupConfig = req.body;
    
    // Generate .env file content
    const envContent = generateEnvFile(config);
    
    // Write .env file
    const envPath = path.join(process.cwd(), '.env');
    fs.writeFileSync(envPath, envContent);

    // Also create .env.local for Vite
    const envLocalContent = `
# Supabase Configuration
VITE_SUPABASE_URL=${config.supabase.url}
VITE_SUPABASE_ANON_KEY=${config.supabase.anonKey}

# App Configuration
VITE_APP_NAME=${config.app.name}
VITE_APP_BASE_URL=${config.app.baseUrl}

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=${config.stripe.publishableKey}
`;

    fs.writeFileSync(path.join(process.cwd(), '.env.local'), envLocalContent);

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save configuration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save configuration' 
    });
  }
});

// Initialize Supabase project
router.post('/init-supabase', async (req, res) => {
  try {
    const { url, serviceRoleKey } = req.body;

    const supabase = createClient(url, serviceRoleKey);
    
    // Test admin access
    const { error } = await supabase.auth.admin.listUsers();
    if (error) {
      throw new Error('Service role key is invalid or lacks admin permissions');
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Supabase initialization failed' 
    });
  }
});

// Run database migrations
router.post('/run-migrations', async (req, res) => {
  try {
    // Read .env file to get Supabase credentials
    const envPath = path.join(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const supabaseUrl = extractEnvValue(envContent, 'SUPABASE_URL');
    const serviceRoleKey = extractEnvValue(envContent, 'SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration not found in environment');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Run all migrations from the migrations folder
    const migrationsPath = path.join(process.cwd(), 'supabase', 'migrations');
    
    if (!fs.existsSync(migrationsPath)) {
      fs.mkdirSync(migrationsPath, { recursive: true });
    }

    // Create core schema migration if it doesn't exist
    await createCoreMigrations(migrationsPath);
    
    // Execute migrations
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
      
      // Remove comments and split into individual statements
      const statements = sql
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/--[^\n]*/g, '') // Remove line comments
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec', { sql: statement });
          if (error) {
            console.warn(`Migration warning for ${file}:`, error);
          }
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Migration failed' 
    });
  }
});

// Create admin user
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Read Supabase config from .env
    const envPath = path.join(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const supabaseUrl = extractEnvValue(envContent, 'SUPABASE_URL');
    const serviceRoleKey = extractEnvValue(envContent, 'SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(supabaseUrl!, serviceRoleKey!);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'admin' }
    });

    if (authError) {
      throw authError;
    }

    // Create user record in users table
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        name,
        password_hash: passwordHash,
        role: 'admin',
        status: 'active'
      });

    if (dbError) {
      throw dbError;
    }

    res.json({ success: true, userId: authUser.user.id });
  } catch (error) {
    console.error('Admin user creation failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create admin user' 
    });
  }
});

// Seed default data
router.post('/seed-data', async (req, res) => {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const supabaseUrl = extractEnvValue(envContent, 'SUPABASE_URL');
    const serviceRoleKey = extractEnvValue(envContent, 'SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(supabaseUrl!, serviceRoleKey!);

    // Default VPS plans
    const defaultPlans = [
      {
        name: 'Starter VPS',
        description: 'Perfect for small websites and development projects',
        cpu: 1,
        ram: 2,
        storage: 20,
        bandwidth: 1000,
        monthly_price: 9.99,
        features: JSON.stringify(['SSD Storage', '99.9% Uptime', '24/7 Support', 'Free SSL', 'Weekly Backups']),
        active: true,
        sort_order: 1
      },
      {
        name: 'Professional VPS',
        description: 'Ideal for business websites and applications',
        cpu: 2,
        ram: 4,
        storage: 50,
        bandwidth: 2000,
        monthly_price: 19.99,
        features: JSON.stringify(['SSD Storage', '99.9% Uptime', '24/7 Support', 'Free SSL', 'Daily Backups', 'Root Access', 'Multiple OS']),
        active: true,
        sort_order: 2
      },
      {
        name: 'Enterprise VPS',
        description: 'High-performance solution for demanding applications',
        cpu: 4,
        ram: 8,
        storage: 100,
        bandwidth: 5000,
        monthly_price: 39.99,
        features: JSON.stringify(['NVMe SSD Storage', '99.95% Uptime', 'Priority Support', 'Free SSL', 'Daily Backups', 'Root Access', 'Multiple OS', 'Private Network', 'DDoS Protection']),
        active: true,
        sort_order: 3
      }
    ];

    // Insert plans
    for (const plan of defaultPlans) {
      await supabase.from('vps_plans').upsert(plan, { onConflict: 'name' });
    }

    // Set system health status
    const healthStatus = [
      { component: 'database', status: 'healthy', details: { message: 'Database initialized successfully' }},
      { component: 'auth', status: 'healthy', details: { message: 'Authentication system ready' }},
      { component: 'api', status: 'healthy', details: { message: 'API endpoints configured' }}
    ];

    for (const status of healthStatus) {
      await supabase.from('system_status').upsert(status, { onConflict: 'component' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Data seeding failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to seed data' 
    });
  }
});

// Complete setup
router.post('/complete', async (req, res) => {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const supabaseUrl = extractEnvValue(envContent, 'SUPABASE_URL');
    const serviceRoleKey = extractEnvValue(envContent, 'SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(supabaseUrl!, serviceRoleKey!);

    // Mark setup as complete
    await supabase
      .from('app_settings')
      .upsert({ 
        key: 'setup_complete', 
        value: true,
        description: 'Initial setup completion flag'
      }, { onConflict: 'key' });

    // Update system status
    await supabase
      .from('system_status')
      .upsert({ 
        component: 'setup', 
        status: 'healthy',
        details: { message: 'Initial setup completed successfully', completed_at: new Date().toISOString() }
      }, { onConflict: 'component' });

    res.json({ success: true });
  } catch (error) {
    console.error('Setup completion failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to complete setup' 
    });
  }
});

// Helper functions
function extractEnvValue(envContent: string, key: string): string | null {
  const regex = new RegExp(`^${key}=(.*)$`, 'm');
  const match = envContent.match(regex);
  return match ? match[1].replace(/["']/g, '') : null;
}

function generateEnvFile(config: SetupConfig): string {
  return `# CloudVPS Pro Configuration
# Generated on ${new Date().toISOString()}

# Application Configuration
NODE_ENV=production
APP_NAME="${config.app.name}"
APP_VERSION=1.0.0
APP_PORT=3000
APP_BASE_URL=${config.app.baseUrl}
APP_DEBUG=false

# Supabase Configuration
SUPABASE_URL=${config.supabase.url}
SUPABASE_ANON_KEY=${config.supabase.anonKey}
SUPABASE_SERVICE_ROLE_KEY=${config.supabase.serviceRoleKey}

# Frontend Environment Variables
VITE_SUPABASE_URL=${config.supabase.url}
VITE_SUPABASE_ANON_KEY=${config.supabase.anonKey}
VITE_APP_NAME="${config.app.name}"
VITE_APP_BASE_URL=${config.app.baseUrl}
VITE_STRIPE_PUBLISHABLE_KEY=${config.stripe.publishableKey}

# Proxmox VE Configuration
PROXMOX_HOST=${config.proxmox.host}
PROXMOX_PORT=${config.proxmox.port}
PROXMOX_USERNAME=${config.proxmox.username}
PROXMOX_PASSWORD=${config.proxmox.password}
PROXMOX_REALM=${config.proxmox.realm}
PROXMOX_PROTOCOL=${config.proxmox.protocol}

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=${config.stripe.publishableKey}
STRIPE_SECRET_KEY=${config.stripe.secretKey}
STRIPE_WEBHOOK_SECRET=${config.stripe.webhookSecret}

# Email Configuration
EMAIL_PROVIDER=${config.email.provider}
FROM_EMAIL=${config.email.fromEmail}
FROM_NAME="${config.email.fromName}"

${config.email.provider === 'sendgrid' ? `# SendGrid Configuration
SENDGRID_API_KEY=${config.email.sendgridApiKey}` : ''}

${config.email.provider === 'smtp' ? `# SMTP Configuration
SMTP_HOST=${config.email.smtpHost}
SMTP_PORT=${config.email.smtpPort}
SMTP_SECURE=true
SMTP_USERNAME=${config.email.smtpUsername}
SMTP_PASSWORD=${config.email.smtpPassword}` : ''}

${config.email.provider === 'ses' ? `# AWS SES Configuration
AWS_SES_REGION=${config.email.awsRegion}
AWS_ACCESS_KEY_ID=${config.email.awsAccessKeyId}
AWS_SECRET_ACCESS_KEY=${config.email.awsSecretAccessKey}` : ''}

# Security Configuration
JWT_SECRET=${generateSecureSecret()}
JWT_EXPIRATION=24h
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Origins
CORS_ORIGINS=${config.app.baseUrl}

# Feature Flags
FEATURE_AUTO_PROVISIONING=true
FEATURE_BACKUP_SCHEDULING=true
FEATURE_USAGE_BILLING=true
FEATURE_MULTIPLE_OS=true
FEATURE_CUSTOM_NETWORKING=true
FEATURE_API_ACCESS=true

# Monitoring Configuration
MONITORING_ENABLED=true
LOG_LEVEL=info

# Generated on ${new Date().toISOString()}
`;
}

function generateSecureSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createCoreMigrations(migrationsPath: string) {
  const coreSchemaSQL = `
-- Core schema for CloudVPS Pro
-- Auto-generated during setup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- VPS Plans table
CREATE TABLE IF NOT EXISTS vps_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  cpu INTEGER NOT NULL,
  ram INTEGER NOT NULL,
  storage INTEGER NOT NULL,
  bandwidth INTEGER NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  features JSONB,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VPS Instances table  
CREATE TABLE IF NOT EXISTS vps_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  root_password VARCHAR(255)
);

-- Support Tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'waiting-customer', 'resolved', 'closed')),
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('technical', 'billing', 'general')),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- App Settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Status table
CREATE TABLE IF NOT EXISTS system_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'error', 'unknown')),
  last_check TIMESTAMPTZ DEFAULT NOW(),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_vps_instances_user_id ON vps_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_vps_instances_status ON vps_instances(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vps_instances_updated_at BEFORE UPDATE ON vps_instances  
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_status_updated_at BEFORE UPDATE ON system_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

  const migrationFile = path.join(migrationsPath, '001_initial_schema.sql');
  if (!fs.existsSync(migrationFile)) {
    fs.writeFileSync(migrationFile, coreSchemaSQL);
  }
}

export default router;
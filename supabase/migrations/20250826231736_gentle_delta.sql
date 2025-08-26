/*
  # Default Data Setup

  1. App Settings
    - Initial application configuration
    - Feature flags and system settings
    - Setup completion tracking

  2. VPS Plans  
    - Default hosting plans with competitive pricing
    - Feature configurations for each tier
    - Template assignments

  3. System Status
    - Initial health monitoring setup
    - Component status tracking
*/

-- Default application settings
INSERT INTO app_settings (key, value, description) VALUES
  ('setup_complete', 'false', 'Whether initial setup wizard has been completed'),
  ('app_name', '"CloudVPS Pro"', 'Application display name'),
  ('maintenance_mode', 'false', 'Whether the application is in maintenance mode'),
  ('registration_enabled', 'true', 'Whether new user registration is allowed'),
  ('auto_provisioning', 'true', 'Automatically provision VPS after payment'),
  ('backup_retention_days', '30', 'How many days to keep VPS backups'),
  ('max_vps_per_user', '10', 'Maximum VPS instances per user account'),
  ('support_email', '"support@cloudvpspro.com"', 'Primary support contact email'),
  ('billing_cycle', '"monthly"', 'Default billing cycle for new subscriptions'),
  ('currency', '"USD"', 'Default currency for pricing'),
  ('tax_rate', '0.0', 'Default tax rate (as decimal, e.g., 0.08 for 8%)'),
  ('stripe_connected', 'false', 'Whether Stripe is properly configured'),
  ('email_configured', 'false', 'Whether email service is configured'),
  ('proxmox_connected', 'false', 'Whether Proxmox VE is connected')
ON CONFLICT (key) DO NOTHING;

-- Default VPS plans
INSERT INTO vps_plans (
  name, 
  description, 
  cpu, 
  ram, 
  storage, 
  bandwidth, 
  monthly_price, 
  features, 
  active, 
  sort_order,
  template_id
) VALUES
  (
    'Starter VPS',
    'Perfect for small websites, blogs, and development projects. Ideal for beginners.',
    1,
    2,
    20,
    1000,
    9.99,
    '["SSD Storage", "99.9% Uptime", "24/7 Support", "Free SSL", "Weekly Backups", "Root Access", "1-Click OS Install"]',
    true,
    1,
    'ubuntu-22.04'
  ),
  (
    'Business VPS', 
    'Great for small to medium businesses and growing websites with moderate traffic.',
    2,
    4,
    50,
    2000,
    19.99,
    '["NVMe SSD Storage", "99.9% Uptime", "24/7 Support", "Free SSL", "Daily Backups", "Root Access", "Multiple OS Options", "Private Network", "Firewall Management"]',
    true,
    2,
    'ubuntu-22.04'
  ),
  (
    'Professional VPS',
    'Designed for professional applications, e-commerce sites, and resource-intensive projects.',  
    4,
    8,
    100,
    5000,
    39.99,
    '["NVMe SSD Storage", "99.95% Uptime", "Priority Support", "Free SSL", "Daily Backups", "Root Access", "Multiple OS Options", "Private Network", "Firewall Management", "DDoS Protection", "Load Balancer Ready"]',
    true,
    3,
    'ubuntu-22.04'
  ),
  (
    'Enterprise VPS',
    'Enterprise-grade performance for mission-critical applications and high-traffic websites.',
    8,
    16,
    200,
    10000, 
    79.99,
    '["NVMe SSD Storage", "99.99% Uptime", "Dedicated Support", "Free SSL", "Hourly Backups", "Root Access", "Multiple OS Options", "Private Network", "Advanced Firewall", "DDoS Protection", "Load Balancer", "Multiple IPs", "Priority Provisioning"]',
    true,
    4,
    'ubuntu-22.04'
  ),
  (
    'Ultimate VPS',
    'Maximum performance for demanding applications requiring extensive resources and guaranteed performance.',
    16,
    32,
    500,
    25000,
    149.99,
    '["NVMe SSD Storage", "99.99% Uptime", "Dedicated Support Manager", "Free SSL", "Real-time Backups", "Root Access", "Any OS Template", "Dedicated Network", "Advanced Security", "DDoS Protection", "Load Balancer", "Multiple IPs", "Custom Configuration", "SLA Guarantee"]',
    true,
    5,
    'ubuntu-22.04'
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  cpu = EXCLUDED.cpu,
  ram = EXCLUDED.ram,
  storage = EXCLUDED.storage,
  bandwidth = EXCLUDED.bandwidth,
  monthly_price = EXCLUDED.monthly_price,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Initial system status
INSERT INTO system_status (component, status, details) VALUES
  ('database', 'healthy', '{"message": "Database initialized successfully", "version": "PostgreSQL 15"}'),
  ('authentication', 'healthy', '{"message": "Supabase Auth configured", "provider": "supabase"}'),
  ('api', 'healthy', '{"message": "REST API endpoints active"}'),
  ('proxmox', 'unknown', '{"message": "Proxmox connection not configured"}'),
  ('stripe', 'unknown', '{"message": "Stripe payment gateway not configured"}'),
  ('email', 'unknown', '{"message": "Email service not configured"}'),
  ('backups', 'healthy', '{"message": "Backup system ready"}'),
  ('monitoring', 'healthy', '{"message": "System monitoring active"}')
ON CONFLICT (component) DO UPDATE SET
  status = EXCLUDED.status,
  details = EXCLUDED.details,
  last_check = NOW();

-- Operating system templates configuration
INSERT INTO app_settings (key, value, description) VALUES
  ('os_templates', '[
    {
      "id": "ubuntu-22.04",
      "name": "Ubuntu 22.04 LTS",
      "description": "Latest Ubuntu LTS with long-term support",
      "category": "linux",
      "proxmox_template": "ubuntu-22.04-template",
      "icon": "ubuntu",
      "popular": true
    },
    {
      "id": "ubuntu-20.04", 
      "name": "Ubuntu 20.04 LTS",
      "description": "Stable Ubuntu LTS release",
      "category": "linux",
      "proxmox_template": "ubuntu-20.04-template", 
      "icon": "ubuntu"
    },
    {
      "id": "debian-11",
      "name": "Debian 11 Bullseye",
      "description": "Stable and reliable Debian release",
      "category": "linux",
      "proxmox_template": "debian-11-template",
      "icon": "debian"
    },
    {
      "id": "centos-8",
      "name": "CentOS Stream 8", 
      "description": "Enterprise Linux distribution",
      "category": "linux",
      "proxmox_template": "centos-8-template",
      "icon": "centos"
    },
    {
      "id": "rocky-8",
      "name": "Rocky Linux 8",
      "description": "Enterprise-grade Linux, CentOS successor",
      "category": "linux", 
      "proxmox_template": "rocky-8-template",
      "icon": "rocky"
    }
  ]', 'Available operating system templates'),
  
  ('default_firewall_rules', '[
    {
      "name": "SSH Access",
      "protocol": "tcp",
      "port": 22,
      "source": "0.0.0.0/0",
      "action": "accept",
      "description": "Allow SSH access from anywhere"
    },
    {
      "name": "HTTP Access", 
      "protocol": "tcp",
      "port": 80,
      "source": "0.0.0.0/0",
      "action": "accept",
      "description": "Allow HTTP web traffic"
    },
    {
      "name": "HTTPS Access",
      "protocol": "tcp", 
      "port": 443,
      "source": "0.0.0.0/0",
      "action": "accept",
      "description": "Allow HTTPS web traffic"
    }
  ]', 'Default firewall rules for new VPS instances'),
  
  ('email_templates', '{
    "welcome": {
      "subject": "Welcome to {{app_name}}!",
      "template": "welcome_user"
    },
    "vps_created": {
      "subject": "Your VPS is ready - {{vps_name}}",
      "template": "vps_provisioned"
    },
    "payment_received": {
      "subject": "Payment Confirmation - {{amount}}",
      "template": "payment_confirmation" 
    },
    "ticket_reply": {
      "subject": "Support Ticket Update - #{{ticket_number}}",
      "template": "support_reply"
    }
  }', 'Email notification templates')
ON CONFLICT (key) DO NOTHING;
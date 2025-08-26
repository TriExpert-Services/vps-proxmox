# CloudVPS Pro - Deployment Guide

## Production Deployment

This guide covers deploying CloudVPS Pro to a production environment with high availability, security, and monitoring.

## Prerequisites

### Infrastructure Requirements
- Ubuntu 20.04+ or CentOS 8+ server
- Minimum 4GB RAM, 2 CPU cores, 50GB storage
- Domain name with SSL certificate
- Proxmox VE cluster (separate infrastructure)
- PostgreSQL 12+ database
- Redis 6+ for caching and sessions

### External Services
- Stripe account for payments
- Email service (SendGrid, AWS SES, or SMTP)
- Monitoring service (optional: DataDog, New Relic)
- CDN service (optional: CloudFlare)

## Infrastructure Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx postgresql postgresql-contrib redis-server certbot python3-certbot-nginx

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Create application user
sudo adduser --system --group --home /opt/cloudvps cloudvps
sudo mkdir -p /opt/cloudvps /var/log/cloudvps
sudo chown -R cloudvps:cloudvps /opt/cloudvps /var/log/cloudvps
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

-- Create database and user
CREATE DATABASE cloudvps_production;
CREATE USER cloudvps WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE cloudvps_production TO cloudvps;
ALTER USER cloudvps CREATEDB;

-- Exit postgres
\q
```

### 3. Redis Configuration

```bash
# Configure Redis
sudo nano /etc/redis/redis.conf

# Update these settings:
# bind 127.0.0.1
# port 6379
# requirepass your-redis-password
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

## Application Deployment

### 1. Deploy Application Code

```bash
# Switch to cloudvps user
sudo -u cloudvps -i

# Clone repository
cd /opt/cloudvps
git clone https://github.com/your-org/cloudvps-pro.git .

# Install dependencies
npm ci --production

# Build application
npm run build
```

### 2. Environment Configuration

```bash
# Create production environment file
sudo -u cloudvps nano /opt/cloudvps/.env.production

# Add production configuration:
NODE_ENV=production
APP_PORT=3000
APP_BASE_URL=https://your-domain.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloudvps_production
DB_USERNAME=cloudvps
DB_PASSWORD=your-secure-password
DB_SSL=true
DB_POOL_SIZE=20

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Proxmox
PROXMOX_HOST=proxmox.your-domain.com
PROXMOX_USERNAME=cloudvps@pve
PROXMOX_PASSWORD=your-proxmox-password
PROXMOX_PROTOCOL=https

# Stripe
STRIPE_SECRET_KEY=sk_live_your-live-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-live-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-sendgrid-key
FROM_EMAIL=noreply@your-domain.com
FROM_NAME=CloudVPS Pro

# Security
JWT_SECRET=your-super-secure-jwt-secret
BCRYPT_ROUNDS=12

# Monitoring
MONITORING_ENABLED=true
LOG_LEVEL=warn
METRICS_ENDPOINT=https://your-metrics-endpoint.com

# Set proper permissions
sudo chmod 600 /opt/cloudvps/.env.production
```

### 3. Database Migration

```bash
# Run database migrations
sudo -u cloudvps -i
cd /opt/cloudvps
npm run db:migrate:production

# Create admin user
npm run create-admin-user -- --email admin@your-domain.com --password secure-admin-password
```

## Web Server Configuration

### 1. Nginx Setup

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cloudvps-pro

# Add configuration:
```

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream for Node.js application
upstream cloudvps_backend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://your-domain.com$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:; frame-src 'self' js.stripe.com" always;

    # Logging
    access_log /var/log/nginx/cloudvps-access.log;
    error_log /var/log/nginx/cloudvps-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        application/javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rss+xml
        application/vnd.geo+json
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        font/opentype
        image/bmp
        image/svg+xml
        image/x-icon
        text/cache-manifest
        text/css
        text/plain
        text/vcard
        text/vnd.rim.location.xloc
        text/vtt
        text/x-component
        text/x-cross-domain-policy;

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff always;
        access_log off;
    }

    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;
        
        proxy_pass http://cloudvps_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        limit_req_status 429;
        
        proxy_pass http://cloudvps_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://cloudvps_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Main application
    location / {
        proxy_pass http://cloudvps_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Handle client-side routing
        try_files $uri $uri/ @fallback;
    }

    # Fallback for SPA routing
    location @fallback {
        proxy_pass http://cloudvps_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://cloudvps_backend;
        access_log off;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ \.(yml|yaml|ini|log|conf)$ {
        deny all;
    }
}

# www redirect
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    return 301 https://your-domain.com$request_uri;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/cloudvps-pro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 2. SSL Certificate

```bash
# Obtain SSL certificate
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet --reload-nginx
```

## Process Management

### 1. PM2 Configuration

```bash
# Create PM2 ecosystem file
sudo -u cloudvps nano /opt/cloudvps/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'cloudvps-pro',
    script: 'dist/server.js',
    cwd: '/opt/cloudvps',
    instances: 'max',
    exec_mode: 'cluster',
    env_file: '.env.production',
    merge_logs: true,
    log_file: '/var/log/cloudvps/combined.log',
    out_file: '/var/log/cloudvps/out.log',
    error_file: '/var/log/cloudvps/error.log',
    pid_file: '/var/run/cloudvps.pid',
    restart_delay: 4000,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Monitoring
    pmx: true,
    // Auto restart on file changes (disabled in production)
    watch: false,
    // Graceful shutdown
    kill_timeout: 5000,
    // Health check
    health_check_url: 'http://localhost:3000/health',
    // Log rotation
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    // Memory monitoring
    max_memory_restart: '1G',
    // CPU monitoring
    instances: require('os').cpus().length,
    // Error handling
    min_uptime: '10s',
    max_restarts: 10
  }]
};
```

```bash
# Start application with PM2
sudo -u cloudvps -i
cd /opt/cloudvps
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Run the generated command as root (it will be shown after pm2 startup)
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u cloudvps --hp /opt/cloudvps
```

### 2. Log Rotation

```bash
# Install PM2 log rotate
sudo -u cloudvps pm2 install pm2-logrotate

# Configure log rotation
sudo -u cloudvps pm2 set pm2-logrotate:max_size 10M
sudo -u cloudvps pm2 set pm2-logrotate:retain 30
sudo -u cloudvps pm2 set pm2-logrotate:compress true
sudo -u cloudvps pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Install and configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if needed)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Proxmox communication (adjust IP range)
sudo ufw allow from 10.0.0.0/8 to any port 8006

# Enable firewall
sudo ufw enable
```

### 2. System Security

```bash
# Update system packages regularly
sudo apt update && sudo apt upgrade -y

# Install fail2ban
sudo apt install fail2ban

# Configure fail2ban
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

```bash
# Start fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Database Security

```bash
# Secure PostgreSQL
sudo nano /etc/postgresql/12/main/postgresql.conf

# Update settings:
# listen_addresses = 'localhost'
# ssl = on
# shared_preload_libraries = 'pg_stat_statements'

# Update pg_hba.conf
sudo nano /etc/postgresql/12/main/pg_hba.conf

# Ensure only local connections are allowed:
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5
# host    all             all             ::1/128                 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## Monitoring and Logging

### 1. System Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Create monitoring script
sudo nano /opt/cloudvps/scripts/monitor.sh
```

```bash
#!/bin/bash
LOG_FILE="/var/log/cloudvps/system-monitor.log"

# Function to log with timestamp
log_with_timestamp() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# Check disk usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    log_with_timestamp "WARNING: Disk usage is ${DISK_USAGE}%"
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2{printf "%.2f%%", $3*100/$2 }')
log_with_timestamp "Memory usage: $MEM_USAGE"

# Check if application is running
if ! pm2 list | grep -q "cloudvps-pro.*online"; then
    log_with_timestamp "ERROR: CloudVPS Pro application is not running"
    # Auto-restart attempt
    sudo -u cloudvps pm2 restart cloudvps-pro
fi

# Check database connectivity
sudo -u cloudvps psql -h localhost -U cloudvps -d cloudvps_production -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    log_with_timestamp "ERROR: Database connection failed"
fi
```

```bash
# Make script executable
sudo chmod +x /opt/cloudvps/scripts/monitor.sh

# Add to crontab
sudo crontab -e
# Add: */5 * * * * /opt/cloudvps/scripts/monitor.sh
```

### 2. Log Management

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/cloudvps
```

```bash
/var/log/cloudvps/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 cloudvps cloudvps
    postrotate
        sudo -u cloudvps pm2 reloadLogs
    endscript
}

/var/log/nginx/cloudvps*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

## Backup Strategy

### 1. Database Backup

```bash
# Create backup script
sudo nano /opt/cloudvps/scripts/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/cloudvps/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="cloudvps_production"
DB_USER="cloudvps"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_DIR/cloudvps_db_$DATE.sql.gz"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "cloudvps_db_*.sql.gz" -mtime +30 -delete

# Log backup completion
echo "$(date '+%Y-%m-%d %H:%M:%S') - Database backup completed: cloudvps_db_$DATE.sql.gz" >> /var/log/cloudvps/backup.log
```

```bash
# Make executable
sudo chmod +x /opt/cloudvps/scripts/backup-db.sh

# Schedule daily backups
sudo crontab -e
# Add: 0 2 * * * /opt/cloudvps/scripts/backup-db.sh
```

### 2. Application Backup

```bash
# Create application backup script
sudo nano /opt/cloudvps/scripts/backup-app.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/cloudvps/backups/application"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/cloudvps"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files (excluding node_modules, logs, and temp files)
tar -czf "$BACKUP_DIR/cloudvps_app_$DATE.tar.gz" \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude="*.log" \
    --exclude="backups" \
    --exclude=".git" \
    -C $APP_DIR .

# Keep only last 7 days of application backups
find $BACKUP_DIR -name "cloudvps_app_*.tar.gz" -mtime +7 -delete

# Log backup completion
echo "$(date '+%Y-%m-%d %H:%M:%S') - Application backup completed: cloudvps_app_$DATE.tar.gz" >> /var/log/cloudvps/backup.log
```

```bash
# Make executable
sudo chmod +x /opt/cloudvps/scripts/backup-app.sh

# Schedule weekly backups
sudo crontab -e
# Add: 0 1 * * 0 /opt/cloudvps/scripts/backup-app.sh
```

## Maintenance Procedures

### 1. Application Updates

```bash
# Create update script
sudo nano /opt/cloudvps/scripts/update.sh
```

```bash
#!/bin/bash
APP_DIR="/opt/cloudvps"
BACKUP_DIR="/opt/cloudvps/backups/updates"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup before update
mkdir -p $BACKUP_DIR
cp -r $APP_DIR "$BACKUP_DIR/pre-update-$DATE"

# Switch to app directory
cd $APP_DIR

# Pull latest changes
git fetch origin
git checkout main
git pull origin main

# Install dependencies
npm ci --production

# Run database migrations
npm run db:migrate:production

# Build application
npm run build

# Restart application
sudo -u cloudvps pm2 restart cloudvps-pro

# Wait for application to start
sleep 10

# Check if application is running
if pm2 list | grep -q "cloudvps-pro.*online"; then
    echo "Update completed successfully"
    # Clean old backups (keep last 5)
    cd $BACKUP_DIR
    ls -t | tail -n +6 | xargs -d '\n' rm -rf --
else
    echo "Update failed - application not running"
    exit 1
fi
```

```bash
# Make executable
sudo chmod +x /opt/cloudvps/scripts/update.sh
```

### 2. Health Checks

```bash
# Create health check script
sudo nano /opt/cloudvps/scripts/health-check.sh
```

```bash
#!/bin/bash
HEALTH_LOG="/var/log/cloudvps/health.log"

# Function to log with timestamp
log_health() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $HEALTH_LOG
}

# Check application health
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$response" = "200" ]; then
    log_health "OK - Application is healthy"
else
    log_health "ERROR - Application health check failed (HTTP $response)"
    # Try to restart
    sudo -u cloudvps pm2 restart cloudvps-pro
fi

# Check database connection
sudo -u postgres psql -d cloudvps_production -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    log_health "OK - Database is accessible"
else
    log_health "ERROR - Database connection failed"
fi

# Check disk space
usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$usage" -gt 90 ]; then
    log_health "WARNING - Disk usage is ${usage}%"
fi

# Check memory usage
mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$mem_usage" -gt 90 ]; then
    log_health "WARNING - Memory usage is ${mem_usage}%"
fi
```

```bash
# Make executable and schedule
sudo chmod +x /opt/cloudvps/scripts/health-check.sh
sudo crontab -e
# Add: */2 * * * * /opt/cloudvps/scripts/health-check.sh
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Connect to database
sudo -u postgres psql -d cloudvps_production

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_vps_instances_user_id ON vps_instances(user_id);
CREATE INDEX CONCURRENTLY idx_vps_instances_status ON vps_instances(status);
CREATE INDEX CONCURRENTLY idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX CONCURRENTLY idx_support_tickets_status ON support_tickets(status);
CREATE INDEX CONCURRENTLY idx_invoices_user_id ON invoices(user_id);
CREATE INDEX CONCURRENTLY idx_audit_logs_created_at ON audit_logs(created_at);

-- Analyze tables for query planner
ANALYZE;

-- Set up automated VACUUM
ALTER SYSTEM SET autovacuum = on;
ALTER SYSTEM SET autovacuum_max_workers = 3;
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;

-- Apply changes
SELECT pg_reload_conf();
```

### 2. Application Optimization

```bash
# Configure PM2 for optimal performance
sudo -u cloudvps nano /opt/cloudvps/ecosystem.config.js

# Update the configuration:
```

```javascript
module.exports = {
  apps: [{
    name: 'cloudvps-pro',
    script: 'dist/server.js',
    cwd: '/opt/cloudvps',
    instances: require('os').cpus().length,
    exec_mode: 'cluster',
    env_file: '.env.production',
    node_args: [
      '--max-old-space-size=1024',
      '--optimize-for-size',
      '--gc-interval=100'
    ],
    max_memory_restart: '1G',
    // Enable monitoring
    monitoring: false, // Disable in production for better performance
    // Auto-scaling based on CPU usage
    min_uptime: '10s',
    max_restarts: 10,
    // Graceful reload
    kill_timeout: 5000,
    listen_timeout: 3000,
    // Advanced PM2 features
    merge_logs: true,
    time: true
  }]
};
```

## Troubleshooting

### Common Issues and Solutions

1. **Application won't start**
   ```bash
   # Check logs
   sudo -u cloudvps pm2 logs cloudvps-pro
   
   # Check system resources
   htop
   df -h
   
   # Restart services
   sudo systemctl restart nginx postgresql redis-server
   sudo -u cloudvps pm2 restart cloudvps-pro
   ```

2. **Database connection issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check connections
   sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
   
   # Check configuration
   sudo nano /etc/postgresql/12/main/postgresql.conf
   ```

3. **High memory usage**
   ```bash
   # Monitor memory
   free -h
   sudo -u cloudvps pm2 monit
   
   # Restart application
   sudo -u cloudvps pm2 restart cloudvps-pro
   
   # Check for memory leaks
   sudo -u cloudvps pm2 show cloudvps-pro
   ```

4. **SSL certificate issues**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Renew certificate
   sudo certbot renew
   
   # Test nginx configuration
   sudo nginx -t
   ```

### Emergency Procedures

1. **Complete system recovery**
   ```bash
   # Restore database from backup
   gunzip -c /opt/cloudvps/backups/database/cloudvps_db_YYYYMMDD_HHMMSS.sql.gz | sudo -u postgres psql cloudvps_production
   
   # Restore application
   tar -xzf /opt/cloudvps/backups/application/cloudvps_app_YYYYMMDD_HHMMSS.tar.gz -C /opt/cloudvps/
   
   # Restart services
   sudo systemctl restart postgresql nginx redis-server
   sudo -u cloudvps pm2 restart all
   ```

2. **Emergency maintenance mode**
   ```bash
   # Create maintenance page
   sudo nano /var/www/maintenance.html
   
   # Update nginx to show maintenance page
   sudo nano /etc/nginx/sites-available/cloudvps-pro
   # Add: return 503;
   
   sudo nginx -t && sudo systemctl reload nginx
   ```

This deployment guide provides a robust, production-ready setup for CloudVPS Pro with proper security, monitoring, and maintenance procedures.
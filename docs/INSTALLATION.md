# CloudVPS Pro Installation Guide

## Prerequisites

Before installing CloudVPS Pro, ensure you have the following:

### System Requirements
- Node.js 18+ and npm/yarn
- PostgreSQL 12+ or MySQL 8+
- Redis 6+ (for session storage and caching)
- SSL certificate for production deployment
- Proxmox VE 7+ cluster

### Proxmox VE Setup
1. Install Proxmox VE on your servers
2. Configure cluster (if using multiple nodes)
3. Create VM templates for different OS versions
4. Set up storage pools (local-lvm, NFS, Ceph, etc.)
5. Configure networking (bridges, VLANs, etc.)
6. Create API user with appropriate permissions

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/cloudvps-pro.git
cd cloudvps-pro
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies (if using separate backend)
cd backend && npm install && cd ..
```

### 3. Database Setup

#### PostgreSQL Setup
```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE cloudvps;
CREATE USER cloudvps WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE cloudvps TO cloudvps;

-- Connect to cloudvps database
\c cloudvps;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### Run Database Migrations
```bash
npm run db:migrate
```

### 4. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

#### Required Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloudvps
DB_USERNAME=cloudvps
DB_PASSWORD=your-secure-password

# Proxmox
PROXMOX_HOST=your-proxmox-host.com
PROXMOX_USERNAME=cloudvps@pve
PROXMOX_PASSWORD=your-proxmox-password

# Stripe
STRIPE_SECRET_KEY=sk_live_your-live-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-live-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-sendgrid-key
FROM_EMAIL=noreply@yourdomain.com

# Security
JWT_SECRET=generate-a-secure-random-string
```

### 5. Proxmox Configuration

#### Create API User
```bash
# SSH to Proxmox node
ssh root@your-proxmox-host

# Create user
pveum user add cloudvps@pve --comment "CloudVPS API User"
pveum passwd cloudvps@pve

# Create role with required permissions
pveum role add CloudVPS -privs "VM.Allocate VM.Clone VM.Config.CDROM VM.Config.CPU VM.Config.Cloudinit VM.Config.Disk VM.Config.HWType VM.Config.Memory VM.Config.Network VM.Config.Options VM.Console VM.Audit VM.PowerMgmt Datastore.AllocateSpace Datastore.Audit SDN.Use"

# Assign role to user
pveum aclmod / -user cloudvps@pve -role CloudVPS
```

#### Create VM Templates
```bash
# Download cloud images
cd /var/lib/vz/template/iso
wget https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img

# Create template VMs
qm create 9000 --name ubuntu-22.04-template --memory 2048 --cores 2 --net0 virtio,bridge=vmbr0
qm importdisk 9000 jammy-server-cloudimg-amd64.img local-lvm
qm set 9000 --scsihw virtio-scsi-pci --scsi0 local-lvm:vm-9000-disk-0
qm set 9000 --boot c --bootdisk scsi0
qm set 9000 --ide2 local-lvm:cloudinit
qm set 9000 --serial0 socket --vga serial0
qm set 9000 --agent enabled=1
qm template 9000
```

### 6. Build and Deploy

#### Development
```bash
# Start development server
npm run dev
```

#### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm run start
```

#### Using Docker
```bash
# Build Docker image
docker build -t cloudvps-pro .

# Run with Docker Compose
docker-compose up -d
```

### 7. Configure Web Server (Production)

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxmox console proxy (optional)
    location /console/ {
        proxy_pass https://your-proxmox-host:8006/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 8. Set Up SSL Certificate

#### Using Let's Encrypt
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 9. Configure Stripe Webhooks

1. Log into Stripe Dashboard
2. Go to Developers → Webhooks
3. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 10. Initialize System

```bash
# Create admin user
npm run create-admin-user

# Seed initial data
npm run db:seed

# Test Proxmox connection
npm run test:proxmox

# Test email sending
npm run test:email
```

## Post-Installation Configuration

### 1. Admin Dashboard Access

1. Navigate to `https://yourdomain.com/admin`
2. Log in with admin credentials
3. Configure system settings:
   - Proxmox nodes
   - VM templates
   - Pricing plans
   - Email templates
   - Payment settings

### 2. Create VPS Plans

```bash
# Using CLI
npm run create-plan --name "Starter VPS" --cpu 1 --ram 2 --storage 20 --price 9.99

# Or via Admin Dashboard
```

### 3. Network Configuration

Configure IP address pools in Proxmox:
```bash
# Example IP pool configuration
# This depends on your network setup
```

### 4. Backup Configuration

Set up automated backups in Proxmox:
```bash
# Create backup schedule
vzdump --mode snapshot --storage backup-storage --compress gzip --all 1
```

### 5. Monitoring Setup

Configure monitoring and alerting:
```bash
# Install monitoring tools
npm install -g pm2
pm2 install pm2-logrotate

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Testing the Installation

### 1. Health Checks

```bash
# Check application health
curl https://yourdomain.com/api/health

# Check Proxmox connectivity
curl https://yourdomain.com/api/proxmox/status

# Check database connectivity
npm run db:check
```

### 2. Create Test VPS

1. Register a test user account
2. Add a VPS plan to cart
3. Complete checkout process
4. Verify VPS creation in Proxmox
5. Test VPS management functions

### 3. Verify Email Delivery

```bash
# Send test email
npm run test:email -- --to your-email@domain.com
```

## Troubleshooting

### Common Issues

1. **Proxmox Connection Failed**
   - Check network connectivity
   - Verify credentials
   - Check SSL certificate issues
   - Ensure API user has correct permissions

2. **Database Connection Issues**
   - Check database server status
   - Verify credentials
   - Check network connectivity
   - Review database logs

3. **Email Delivery Problems**
   - Check email provider configuration
   - Verify API keys
   - Check spam folders
   - Review email service logs

4. **VPS Creation Fails**
   - Check Proxmox storage space
   - Verify template availability
   - Check network configuration
   - Review Proxmox logs

### Log Locations

- Application logs: `/var/log/cloudvps/`
- Nginx logs: `/var/log/nginx/`
- Proxmox logs: `/var/log/pveproxy/`
- Database logs: `/var/log/postgresql/`

### Support Commands

```bash
# View application logs
pm2 logs

# Check system resources
npm run system:status

# Run diagnostics
npm run diagnostics

# Export configuration
npm run config:export
```

## Security Considerations

1. **SSL/TLS Configuration**
   - Use strong cipher suites
   - Implement HSTS headers
   - Regular certificate renewal

2. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Regular backups
   - Access restrictions

3. **API Security**
   - Rate limiting implemented
   - JWT token expiration
   - Input validation
   - CORS restrictions

4. **Proxmox Security**
   - Dedicated API user with minimal permissions
   - Network isolation
   - Regular updates
   - Access logging

## Maintenance

### Regular Tasks

1. **Daily**
   - Monitor system resources
   - Check backup completion
   - Review error logs

2. **Weekly**
   - Update system packages
   - Review security logs
   - Performance monitoring

3. **Monthly**
   - Database maintenance
   - Certificate renewal check
   - Security audit
   - Backup testing

### Update Procedure

```bash
# Backup database
npm run db:backup

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Restart services
pm2 restart all
```

For additional support, please refer to the documentation or contact our support team.
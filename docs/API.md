# CloudVPS Pro API Documentation

## Overview

The CloudVPS Pro API provides programmatic access to manage VPS instances, users, billing, and support tickets. The API follows RESTful principles and uses JSON for data exchange.

## Base URL

```
Production: https://your-domain.com/api/v1
Staging: https://staging.your-domain.com/api/v1
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Obtain Authentication Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "expires_in": 86400
  }
}
```

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address. Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "data": {}, // Response data (on success)
  "error": {  // Error details (on failure)
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Additional error context
  },
  "pagination": { // For paginated responses
    "page": 1,
    "limit": 20,
    "total": 100,
    "has_next": true,
    "has_prev": false
  }
}
```

## Endpoints

### Authentication

#### POST /auth/login
Authenticate user and obtain access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /auth/refresh
Refresh authentication token.

#### POST /auth/logout
Invalidate current authentication token.

### Users

#### GET /users/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user",
    "status": "active",
    "created_at": "2025-01-01T00:00:00Z",
    "stripe_customer_id": "cus_abc123"
  }
}
```

#### PUT /users/profile
Update user profile.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

#### POST /users/change-password
Change user password.

**Request Body:**
```json
{
  "current_password": "old-password",
  "new_password": "new-password"
}
```

### VPS Management

#### GET /vps
List user's VPS instances.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status (running, stopped, creating, etc.)
- `sort`: Sort field (created_at, name, status)
- `order`: Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "vps-123",
      "name": "Web Server 01",
      "status": "running",
      "ip_address": "203.0.113.100",
      "private_ip": "10.0.0.100",
      "operating_system": "Ubuntu 22.04 LTS",
      "specifications": {
        "cpu": 2,
        "ram": 4,
        "storage": 50,
        "bandwidth": 2000
      },
      "pricing": {
        "monthly_price": 19.99,
        "currency": "USD"
      },
      "created_at": "2025-01-01T00:00:00Z",
      "next_billing_date": "2025-02-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "has_next": false,
    "has_prev": false
  }
}
```

#### GET /vps/{id}
Get specific VPS instance details.

#### POST /vps
Create new VPS instance.

**Request Body:**
```json
{
  "name": "My Web Server",
  "plan_id": "plan-professional",
  "operating_system": "ubuntu-22.04",
  "ssh_keys": ["ssh-rsa AAAAB3NzaC1yc2E..."]
}
```

#### PUT /vps/{id}
Update VPS instance configuration.

**Request Body:**
```json
{
  "name": "Updated Server Name"
}
```

#### DELETE /vps/{id}
Delete VPS instance.

**Query Parameters:**
- `force`: Force delete without confirmation (boolean)

#### POST /vps/{id}/start
Start VPS instance.

#### POST /vps/{id}/stop
Stop VPS instance.

#### POST /vps/{id}/restart
Restart VPS instance.

#### POST /vps/{id}/rebuild
Rebuild VPS with new operating system.

**Request Body:**
```json
{
  "operating_system": "centos-8",
  "ssh_keys": ["ssh-rsa AAAAB3NzaC1yc2E..."]
}
```

### VPS Monitoring

#### GET /vps/{id}/metrics
Get VPS resource usage metrics.

**Query Parameters:**
- `period`: Time period (hour, day, week, month)
- `start_time`: Start time (ISO 8601)
- `end_time`: End time (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "cpu_usage": 45.2,
    "ram_usage": 67.8,
    "disk_usage": 34.1,
    "network_in": 1250.5,
    "network_out": 890.3,
    "uptime": 1296000,
    "metrics_history": [
      {
        "timestamp": "2025-01-15T12:00:00Z",
        "cpu": 42.1,
        "ram": 65.4,
        "disk": 34.0,
        "network_in": 125.2,
        "network_out": 89.1
      }
    ]
  }
}
```

#### GET /vps/{id}/console
Get console access information.

**Response:**
```json
{
  "success": true,
  "data": {
    "console_url": "https://console.your-domain.com/vps-123",
    "vnc_password": "temp-password-123",
    "expires_at": "2025-01-15T13:00:00Z"
  }
}
```

### VPS Backups

#### GET /vps/{id}/backups
List VPS backups.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "backup-123",
      "name": "Daily Backup - 2025-01-15",
      "size": 2.4,
      "size_unit": "GB",
      "type": "automatic",
      "status": "completed",
      "created_at": "2025-01-15T03:00:00Z"
    }
  ]
}
```

#### POST /vps/{id}/backups
Create manual backup.

**Request Body:**
```json
{
  "name": "Pre-update backup",
  "description": "Backup before system update"
}
```

#### POST /vps/{id}/backups/{backup_id}/restore
Restore from backup.

#### DELETE /vps/{id}/backups/{backup_id}
Delete backup.

### VPS Networking

#### GET /vps/{id}/network
Get network configuration.

#### PUT /vps/{id}/network
Update network settings.

**Request Body:**
```json
{
  "firewall_rules": [
    {
      "action": "accept",
      "protocol": "tcp",
      "port": 80,
      "source": "0.0.0.0/0",
      "description": "HTTP access"
    }
  ]
}
```

#### POST /vps/{id}/network/ip
Request additional IP address.

### Plans and Pricing

#### GET /plans
List available VPS plans.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "plan-starter",
      "name": "Starter VPS",
      "description": "Perfect for small websites",
      "specifications": {
        "cpu": 1,
        "ram": 2,
        "storage": 20,
        "bandwidth": 1000
      },
      "pricing": {
        "monthly": 9.99,
        "annually": 99.99,
        "currency": "USD"
      },
      "features": [
        "SSD Storage",
        "99.9% Uptime",
        "24/7 Support"
      ]
    }
  ]
}
```

#### GET /plans/{id}
Get specific plan details.

### Billing and Invoices

#### GET /billing/invoices
List user invoices.

**Query Parameters:**
- `status`: Filter by status (paid, pending, overdue)
- `start_date`: Filter by date range
- `end_date`: Filter by date range

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "inv-123",
      "invoice_number": "INV-2025-001",
      "amount": 19.99,
      "currency": "USD",
      "status": "paid",
      "due_date": "2025-02-01T00:00:00Z",
      "paid_date": "2025-01-15T10:30:00Z",
      "items": [
        {
          "description": "Professional VPS - January 2025",
          "quantity": 1,
          "unit_price": 19.99,
          "total": 19.99
        }
      ]
    }
  ]
}
```

#### GET /billing/invoices/{id}
Get specific invoice.

#### GET /billing/invoices/{id}/pdf
Download invoice as PDF.

#### GET /billing/usage
Get current billing period usage.

**Response:**
```json
{
  "success": true,
  "data": {
    "current_period": {
      "start_date": "2025-01-01T00:00:00Z",
      "end_date": "2025-01-31T23:59:59Z",
      "total_cost": 19.99,
      "currency": "USD"
    },
    "services": [
      {
        "vps_id": "vps-123",
        "name": "Web Server 01",
        "plan": "Professional VPS",
        "cost": 19.99,
        "usage": {
          "cpu_hours": 744,
          "storage_gb_hours": 37200,
          "bandwidth_gb": 150.5
        }
      }
    ]
  }
}
```

### Payment Methods

#### GET /billing/payment-methods
List saved payment methods.

#### POST /billing/payment-methods
Add new payment method.

**Request Body:**
```json
{
  "payment_method_id": "pm_card_visa", // From Stripe
  "set_as_default": true
}
```

#### DELETE /billing/payment-methods/{id}
Remove payment method.

### Support Tickets

#### GET /support/tickets
List support tickets.

**Query Parameters:**
- `status`: Filter by status (open, in-progress, resolved, closed)
- `priority`: Filter by priority (low, medium, high, urgent)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ticket-123",
      "subject": "VPS Performance Issues",
      "status": "open",
      "priority": "high",
      "category": "technical",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z",
      "message_count": 2
    }
  ]
}
```

#### POST /support/tickets
Create new support ticket.

**Request Body:**
```json
{
  "subject": "VPS Performance Issues",
  "description": "My VPS has been running slowly since yesterday...",
  "priority": "high",
  "category": "technical",
  "vps_id": "vps-123" // Optional, if related to specific VPS
}
```

#### GET /support/tickets/{id}
Get ticket details with messages.

#### POST /support/tickets/{id}/messages
Add message to ticket.

**Request Body:**
```json
{
  "message": "I tried restarting but the issue persists.",
  "attachments": [
    {
      "filename": "screenshot.png",
      "content_type": "image/png",
      "data": "base64-encoded-file-data"
    }
  ]
}
```

#### PUT /support/tickets/{id}
Update ticket (close, reopen, change priority).

**Request Body:**
```json
{
  "status": "closed"
}
```

### Admin Endpoints (Admin Role Required)

#### GET /admin/stats
Get platform statistics.

#### GET /admin/users
List all users.

#### GET /admin/vps
List all VPS instances.

#### GET /admin/tickets
List all support tickets.

#### POST /admin/users/{id}/suspend
Suspend user account.

#### POST /admin/vps/{id}/suspend
Suspend VPS instance.

#### GET /admin/system/health
Get system health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "database": "online",
      "proxmox": "online",
      "stripe": "online",
      "email": "online"
    },
    "metrics": {
      "total_users": 1247,
      "active_vps": 2891,
      "system_load": 0.75,
      "memory_usage": 68.2,
      "disk_usage": 45.1
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Request is malformed or missing required fields |
| `UNAUTHORIZED` | Authentication token is missing or invalid |
| `FORBIDDEN` | User doesn't have permission for this action |
| `NOT_FOUND` | Requested resource doesn't exist |
| `CONFLICT` | Resource already exists or action conflicts with current state |
| `RATE_LIMITED` | Too many requests, rate limit exceeded |
| `VALIDATION_ERROR` | Request validation failed |
| `PROXMOX_ERROR` | Error communicating with Proxmox |
| `PAYMENT_ERROR` | Payment processing failed |
| `SYSTEM_ERROR` | Internal system error |

## Webhooks

CloudVPS Pro can send webhooks for various events. Configure webhook URLs in the admin panel.

### Webhook Events

#### VPS Events
- `vps.created` - VPS instance created
- `vps.started` - VPS instance started
- `vps.stopped` - VPS instance stopped
- `vps.deleted` - VPS instance deleted
- `vps.backup.created` - Backup created
- `vps.backup.failed` - Backup failed

#### Billing Events
- `invoice.created` - New invoice generated
- `invoice.paid` - Invoice paid
- `invoice.overdue` - Invoice overdue
- `payment.succeeded` - Payment successful
- `payment.failed` - Payment failed

#### User Events
- `user.registered` - New user registered
- `user.suspended` - User account suspended

### Webhook Payload

```json
{
  "event": "vps.created",
  "timestamp": "2025-01-15T10:00:00Z",
  "data": {
    "vps_id": "vps-123",
    "user_id": "user-456",
    "plan": "Professional VPS",
    // ... event-specific data
  }
}
```

### Webhook Security

Webhooks are signed with HMAC-SHA256. Verify the signature using the webhook secret:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

## SDK Examples

### Node.js

```javascript
const axios = require('axios');

class CloudVPSClient {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getVPSList() {
    const response = await this.client.get('/vps');
    return response.data;
  }

  async createVPS(config) {
    const response = await this.client.post('/vps', config);
    return response.data;
  }

  async startVPS(id) {
    const response = await this.client.post(`/vps/${id}/start`);
    return response.data;
  }
}
```

### Python

```python
import requests

class CloudVPSClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        }

    def get_vps_list(self):
        response = requests.get(f'{self.base_url}/vps', headers=self.headers)
        return response.json()

    def create_vps(self, config):
        response = requests.post(f'{self.base_url}/vps', 
                               json=config, headers=self.headers)
        return response.json()
```

### cURL Examples

```bash
# Get VPS list
curl -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     https://your-domain.com/api/v1/vps

# Create VPS
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"My Server","plan_id":"plan-professional"}' \
     https://your-domain.com/api/v1/vps

# Start VPS
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     https://your-domain.com/api/v1/vps/vps-123/start
```

## Testing

Use the provided Postman collection or create automated tests:

```javascript
// Jest example
describe('CloudVPS API', () => {
  test('should create VPS instance', async () => {
    const response = await api.post('/vps', {
      name: 'Test Server',
      plan_id: 'plan-starter'
    });
    
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.id).toBeDefined();
  });
});
```

For more information and support, visit our [Developer Portal](https://developers.your-domain.com).
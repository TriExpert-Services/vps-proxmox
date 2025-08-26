// Database service for VPS management
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'suspended' | 'cancelled';
  lastLogin?: Date;
}

export interface VPSInstance {
  id: string;
  userId: string;
  name: string;
  plan: string;
  proxmoxVmid: number;
  proxmoxNode: string;
  status: 'creating' | 'running' | 'stopped' | 'suspended' | 'deleted';
  ipAddress?: string;
  privateIpAddress?: string;
  operatingSystem: string;
  specifications: {
    cpu: number;
    ram: number; // in GB
    storage: number; // in GB
    bandwidth: number; // in GB
  };
  pricing: {
    monthlyPrice: number;
    currency: string;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  nextBillingDate: Date;
  rootPassword?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'waiting-customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'general';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isStaffReply: boolean;
  createdAt: Date;
  attachments?: string[];
}

export interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  dueDate: Date;
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface UsageRecord {
  id: string;
  vpsId: string;
  recordDate: Date;
  metrics: {
    cpuHours: number;
    ramHours: number; // GB-hours
    storageHours: number; // GB-hours
    bandwidthUsed: number; // GB
    networkIn: number; // GB
    networkOut: number; // GB
  };
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Mock database implementation (in production, use PostgreSQL/MySQL/MongoDB)
class DatabaseService {
  private users: Map<string, User> = new Map();
  private vpsInstances: Map<string, VPSInstance> = new Map();
  private supportTickets: Map<string, SupportTicket> = new Map();
  private ticketMessages: Map<string, TicketMessage[]> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private usageRecords: Map<string, UsageRecord[]> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Create admin user
    const adminUser: User = {
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Administrator',
      role: 'admin',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      status: 'active',
    };
    this.users.set(adminUser.id, adminUser);

    // Create test user
    const testUser: User = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'John Doe',
      role: 'user',
      stripeCustomerId: 'cus_test123',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      status: 'active',
      lastLogin: new Date(),
    };
    this.users.set(testUser.id, testUser);

    // Create mock VPS instances
    const vps1: VPSInstance = {
      id: 'vps-1',
      userId: 'user-1',
      name: 'Web Server 01',
      plan: 'Professional VPS',
      proxmoxVmid: 101,
      proxmoxNode: 'pve-node1',
      status: 'running',
      ipAddress: '203.0.113.100',
      privateIpAddress: '10.0.0.100',
      operatingSystem: 'Ubuntu 22.04 LTS',
      specifications: {
        cpu: 2,
        ram: 4,
        storage: 50,
        bandwidth: 2000,
      },
      pricing: {
        monthlyPrice: 19.99,
        currency: 'USD',
      },
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      nextBillingDate: new Date('2025-02-01'),
      rootPassword: 'temp_password_123',
    };
    this.vpsInstances.set(vps1.id, vps1);
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    await this.logAction('user_created', 'user', user.id, { email: user.email });
    
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    
    await this.logAction('user_updated', 'user', id, updates);
    
    return updatedUser;
  }

  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    const users = Array.from(this.users.values());
    return users.slice(offset, offset + limit);
  }

  // VPS operations
  async createVPS(vpsData: Omit<VPSInstance, 'id' | 'createdAt' | 'updatedAt'>): Promise<VPSInstance> {
    const vps: VPSInstance = {
      ...vpsData,
      id: `vps-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.vpsInstances.set(vps.id, vps);
    await this.logAction('vps_created', 'vps', vps.id, { userId: vps.userId, name: vps.name });
    
    return vps;
  }

  async getVPSById(id: string): Promise<VPSInstance | null> {
    return this.vpsInstances.get(id) || null;
  }

  async getVPSByUser(userId: string): Promise<VPSInstance[]> {
    const vpsInstances = Array.from(this.vpsInstances.values());
    return vpsInstances.filter(vps => vps.userId === userId && !vps.deletedAt);
  }

  async updateVPS(id: string, updates: Partial<VPSInstance>): Promise<VPSInstance | null> {
    const vps = this.vpsInstances.get(id);
    if (!vps) return null;

    const updatedVPS = { ...vps, ...updates, updatedAt: new Date() };
    this.vpsInstances.set(id, updatedVPS);
    
    await this.logAction('vps_updated', 'vps', id, updates);
    
    return updatedVPS;
  }

  async deleteVPS(id: string, softDelete = true): Promise<boolean> {
    const vps = this.vpsInstances.get(id);
    if (!vps) return false;

    if (softDelete) {
      vps.deletedAt = new Date();
      vps.status = 'deleted';
      this.vpsInstances.set(id, vps);
    } else {
      this.vpsInstances.delete(id);
    }

    await this.logAction('vps_deleted', 'vps', id, { softDelete });
    
    return true;
  }

  async getAllVPS(limit = 50, offset = 0): Promise<VPSInstance[]> {
    const vpsInstances = Array.from(this.vpsInstances.values());
    return vpsInstances
      .filter(vps => !vps.deletedAt)
      .slice(offset, offset + limit);
  }

  // Support ticket operations
  async createTicket(ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      ...ticketData,
      id: `ticket-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.supportTickets.set(ticket.id, ticket);
    this.ticketMessages.set(ticket.id, []);
    
    await this.logAction('ticket_created', 'ticket', ticket.id, { userId: ticket.userId, subject: ticket.subject });
    
    return ticket;
  }

  async getTicketById(id: string): Promise<SupportTicket | null> {
    return this.supportTickets.get(id) || null;
  }

  async getTicketsByUser(userId: string): Promise<SupportTicket[]> {
    const tickets = Array.from(this.supportTickets.values());
    return tickets.filter(ticket => ticket.userId === userId);
  }

  async updateTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | null> {
    const ticket = this.supportTickets.get(id);
    if (!ticket) return null;

    const updatedTicket = { ...ticket, ...updates, updatedAt: new Date() };
    this.supportTickets.set(id, updatedTicket);
    
    await this.logAction('ticket_updated', 'ticket', id, updates);
    
    return updatedTicket;
  }

  async addTicketMessage(message: Omit<TicketMessage, 'id' | 'createdAt'>): Promise<TicketMessage> {
    const ticketMessage: TicketMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      createdAt: new Date(),
    };

    const messages = this.ticketMessages.get(message.ticketId) || [];
    messages.push(ticketMessage);
    this.ticketMessages.set(message.ticketId, messages);

    // Update ticket's updatedAt timestamp
    await this.updateTicket(message.ticketId, { updatedAt: new Date() });
    
    await this.logAction('ticket_message_added', 'ticket_message', ticketMessage.id, { ticketId: message.ticketId });
    
    return ticketMessage;
  }

  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    return this.ticketMessages.get(ticketId) || [];
  }

  async getAllTickets(limit = 50, offset = 0): Promise<SupportTicket[]> {
    const tickets = Array.from(this.supportTickets.values());
    return tickets.slice(offset, offset + limit);
  }

  // Invoice operations
  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const invoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.invoices.set(invoice.id, invoice);
    await this.logAction('invoice_created', 'invoice', invoice.id, { userId: invoice.userId, amount: invoice.amount });
    
    return invoice;
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return this.invoices.get(id) || null;
  }

  async getInvoicesByUser(userId: string): Promise<Invoice[]> {
    const invoices = Array.from(this.invoices.values());
    return invoices.filter(invoice => invoice.userId === userId);
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const invoice = this.invoices.get(id);
    if (!invoice) return null;

    const updatedInvoice = { ...invoice, ...updates, updatedAt: new Date() };
    this.invoices.set(id, updatedInvoice);
    
    await this.logAction('invoice_updated', 'invoice', id, updates);
    
    return updatedInvoice;
  }

  // Usage tracking
  async recordUsage(usageData: Omit<UsageRecord, 'id' | 'createdAt'>): Promise<UsageRecord> {
    const usage: UsageRecord = {
      ...usageData,
      id: `usage-${Date.now()}`,
      createdAt: new Date(),
    };

    const records = this.usageRecords.get(usage.vpsId) || [];
    records.push(usage);
    this.usageRecords.set(usage.vpsId, records);
    
    return usage;
  }

  async getUsageRecords(vpsId: string, startDate: Date, endDate: Date): Promise<UsageRecord[]> {
    const records = this.usageRecords.get(vpsId) || [];
    return records.filter(record => 
      record.recordDate >= startDate && record.recordDate <= endDate
    );
  }

  // Analytics and reporting
  async getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalVPS: number;
    runningVPS: number;
    totalRevenue: number;
    openTickets: number;
  }> {
    const users = Array.from(this.users.values());
    const vpsInstances = Array.from(this.vpsInstances.values()).filter(vps => !vps.deletedAt);
    const tickets = Array.from(this.supportTickets.values());
    const invoices = Array.from(this.invoices.values());

    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      totalVPS: vpsInstances.length,
      runningVPS: vpsInstances.filter(v => v.status === 'running').length,
      totalRevenue: invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0),
      openTickets: tickets.filter(t => ['open', 'in-progress'].includes(t.status)).length,
    };
  }

  async getUserGrowthStats(days = 30): Promise<Array<{ date: string; count: number }>> {
    const users = Array.from(this.users.values());
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats: Array<{ date: string; count: number }> = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = users.filter(user => 
        user.createdAt.toISOString().split('T')[0] === dateStr
      ).length;
      
      stats.push({ date: dateStr, count });
    }
    
    return stats;
  }

  // Audit logging
  private async logAction(
    action: string,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    };

    this.auditLogs.set(log.id, log);
  }

  async getAuditLogs(
    limit = 100,
    offset = 0,
    filters?: {
      userId?: string;
      resource?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<AuditLog[]> {
    let logs = Array.from(this.auditLogs.values());

    if (filters) {
      logs = logs.filter(log => {
        if (filters.userId && log.userId !== filters.userId) return false;
        if (filters.resource && log.resource !== filters.resource) return false;
        if (filters.action && log.action !== filters.action) return false;
        if (filters.startDate && log.createdAt < filters.startDate) return false;
        if (filters.endDate && log.createdAt > filters.endDate) return false;
        return true;
      });
    }

    return logs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  // Cleanup operations
  async cleanupOldRecords(daysToKeep = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Clean up old audit logs
    for (const [id, log] of this.auditLogs.entries()) {
      if (log.createdAt < cutoffDate) {
        this.auditLogs.delete(id);
      }
    }

    // Clean up old usage records
    for (const [vpsId, records] of this.usageRecords.entries()) {
      const filteredRecords = records.filter(record => record.recordDate >= cutoffDate);
      this.usageRecords.set(vpsId, filteredRecords);
    }
  }
}

export default DatabaseService;
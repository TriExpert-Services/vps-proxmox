import { VPSPlan } from '../contexts/CartContext';

// Enhanced Proxmox API Service with error handling and logging
export interface ProxmoxConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  realm: string;
  protocol: 'http' | 'https';
}

export interface VMConfig {
  vmid: number;
  name: string;
  cores: number;
  memory: number;
  disk: number;
  template: string;
  network: string;
  ostype: string;
}

export interface VMStatus {
  status: 'running' | 'stopped' | 'paused' | 'suspended';
  uptime: number;
  cpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  netin: number;
  netout: number;
}

class ProxmoxService {
  private config: ProxmoxConfig;
  private ticket: string | null = null;
  private csrfToken: string | null = null;
  private ticketExpiry: number = 0;

  constructor(config: ProxmoxConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return `${this.config.protocol}://${this.config.host}:${this.config.port}/api2/json`;
  }

  private async authenticate(): Promise<void> {
    if (this.ticket && Date.now() < this.ticketExpiry) {
      return; // Token still valid
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/access/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: `${this.config.username}@${this.config.realm}`,
          password: this.config.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.ticket = data.data.ticket;
      this.csrfToken = data.data.CSRFPreventionToken;
      this.ticketExpiry = Date.now() + (2 * 60 * 60 * 1000); // 2 hours
    } catch (error) {
      console.error('Proxmox authentication error:', error);
      throw new Error('Failed to authenticate with Proxmox');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    await this.authenticate();

    const headers = {
      'CSRFPreventionToken': this.csrfToken!,
      'Cookie': `PVEAuthCookie=${this.ticket}`,
      ...options.headers,
    };

    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Proxmox API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get available nodes
  async getNodes(): Promise<any[]> {
    try {
      const data = await this.makeRequest('/nodes');
      return data.data || [];
    } catch (error) {
      console.error('Error fetching nodes:', error);
      return [];
    }
  }

  // Get node with least load
  async getOptimalNode(): Promise<string> {
    const nodes = await this.getNodes();
    if (nodes.length === 0) {
      throw new Error('No nodes available');
    }

    // Sort by CPU usage (ascending)
    const sortedNodes = nodes.sort((a, b) => a.cpu - b.cpu);
    return sortedNodes[0].node;
  }

  // Create VM from plan configuration
  async createVMFromPlan(plan: VPSPlan, userId: string, userName: string): Promise<{ vmid: number; node: string }> {
    const node = await this.getOptimalNode();
    const vmid = await this.getNextVMID();
    
    const vmConfig = {
      vmid,
      name: `${userName.toLowerCase().replace(/\s+/g, '-')}-${plan.name.toLowerCase().replace(/\s+/g, '-')}`,
      cores: plan.cpu,
      memory: plan.ram * 1024, // Convert GB to MB
      net0: 'virtio,bridge=vmbr0',
      scsi0: `local-lvm:${plan.storage}`,
      ostype: 'l26', // Linux 2.6+ kernel
      boot: 'order=scsi0',
      agent: '1',
      protection: '0',
      onboot: '1',
    };

    try {
      await this.makeRequest(`/nodes/${node}/qemu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(vmConfig as any),
      });

      // Clone from template if specified
      const template = this.getTemplateForPlan(plan);
      if (template) {
        await this.cloneTemplate(node, template, vmid);
      }

      // Configure additional settings
      await this.configureVM(node, vmid, plan);

      return { vmid, node };
    } catch (error) {
      console.error('VM creation failed:', error);
      throw new Error(`Failed to create VM: ${error}`);
    }
  }

  // Clone template
  private async cloneTemplate(node: string, templateId: number, newVmid: number): Promise<void> {
    await this.makeRequest(`/nodes/${node}/qemu/${templateId}/clone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        newid: newVmid.toString(),
        full: '1', // Full clone
        storage: 'local-lvm',
      }),
    });

    // Wait for clone to complete
    await this.waitForTask(node, 'qmclone');
  }

  // Configure VM after creation
  private async configureVM(node: string, vmid: number, plan: VPSPlan): Promise<void> {
    // Set resource limits based on plan
    const config = {
      cores: plan.cpu.toString(),
      memory: (plan.ram * 1024).toString(),
      // Network bandwidth limit (if supported)
      ...(plan.bandwidth && { 'net0': `virtio,bridge=vmbr0,rate=${plan.bandwidth}` }),
    };

    await this.makeRequest(`/nodes/${node}/qemu/${vmid}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(config),
    });
  }

  // Get next available VM ID
  private async getNextVMID(): Promise<number> {
    const nodes = await this.getNodes();
    const usedIds = new Set<number>();

    for (const node of nodes) {
      try {
        const vms = await this.makeRequest(`/nodes/${node.node}/qemu`);
        vms.data.forEach((vm: any) => usedIds.add(vm.vmid));
      } catch (error) {
        console.warn(`Could not fetch VMs from node ${node.node}:`, error);
      }
    }

    // Start from 100 and find next available ID
    for (let id = 100; id < 999999; id++) {
      if (!usedIds.has(id)) {
        return id;
      }
    }

    throw new Error('No available VM IDs');
  }

  // Get template ID for plan
  private getTemplateForPlan(plan: VPSPlan): number | null {
    // Template mapping - customize based on your templates
    const templates: Record<string, number> = {
      'ubuntu-22.04': 9000,
      'ubuntu-20.04': 9001,
      'centos-8': 9002,
      'debian-11': 9003,
      'fedora-37': 9004,
    };

    // Default to Ubuntu 22.04
    return templates['ubuntu-22.04'] || null;
  }

  // VM Control Operations
  async startVM(node: string, vmid: number): Promise<void> {
    await this.makeRequest(`/nodes/${node}/qemu/${vmid}/status/start`, {
      method: 'POST',
    });
  }

  async stopVM(node: string, vmid: number): Promise<void> {
    await this.makeRequest(`/nodes/${node}/qemu/${vmid}/status/stop`, {
      method: 'POST',
    });
  }

  async restartVM(node: string, vmid: number): Promise<void> {
    await this.makeRequest(`/nodes/${node}/qemu/${vmid}/status/reboot`, {
      method: 'POST',
    });
  }

  async shutdownVM(node: string, vmid: number): Promise<void> {
    await this.makeRequest(`/nodes/${node}/qemu/${vmid}/status/shutdown`, {
      method: 'POST',
    });
  }

  async deleteVM(node: string, vmid: number): Promise<void> {
    // Stop VM first if running
    const status = await this.getVMStatus(node, vmid);
    if (status.status === 'running') {
      await this.stopVM(node, vmid);
      await this.waitForVMStatus(node, vmid, 'stopped');
    }

    await this.makeRequest(`/nodes/${node}/qemu/${vmid}`, {
      method: 'DELETE',
    });
  }

  // Get VM status and metrics
  async getVMStatus(node: string, vmid: number): Promise<VMStatus> {
    const data = await this.makeRequest(`/nodes/${node}/qemu/${vmid}/status/current`);
    return data.data;
  }

  // Wait for VM to reach specific status
  private async waitForVMStatus(node: string, vmid: number, targetStatus: string, timeout = 60000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const status = await this.getVMStatus(node, vmid);
      if (status.status === targetStatus) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error(`Timeout waiting for VM ${vmid} to reach status ${targetStatus}`);
  }

  // Wait for task completion
  private async waitForTask(node: string, taskType: string, timeout = 300000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const tasks = await this.makeRequest(`/nodes/${node}/tasks`);
      const runningTask = tasks.data.find((task: any) => 
        task.type === taskType && task.status === 'running'
      );
      
      if (!runningTask) {
        return; // Task completed
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error(`Timeout waiting for task ${taskType} to complete`);
  }

  // Backup Operations
  async createBackup(node: string, vmid: number, storage = 'local'): Promise<string> {
    const response = await this.makeRequest(`/nodes/${node}/vzdump`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        vmid: vmid.toString(),
        storage,
        mode: 'snapshot',
        compress: 'gzip',
        notes: `Backup created on ${new Date().toISOString()}`,
      }),
    });

    return response.data;
  }

  async listBackups(node: string, storage = 'local'): Promise<any[]> {
    const data = await this.makeRequest(`/nodes/${node}/storage/${storage}/content`);
    return data.data.filter((item: any) => item.content === 'backup');
  }

  async restoreBackup(node: string, vmid: number, backupFile: string, storage = 'local'): Promise<void> {
    await this.makeRequest(`/nodes/${node}/vzdump/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        volume: `${storage}:backup/${backupFile}`,
        vmid: vmid.toString(),
      }),
    });
  }

  // Network Operations
  async getVMNetworkConfig(node: string, vmid: number): Promise<any> {
    const config = await this.makeRequest(`/nodes/${node}/qemu/${vmid}/config`);
    return config.data;
  }

  async updateVMNetwork(node: string, vmid: number, networkConfig: any): Promise<void> {
    await this.makeRequest(`/nodes/${node}/qemu/${vmid}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(networkConfig),
    });
  }

  // Resource monitoring
  async getVMMetrics(node: string, vmid: number, timeframe = 'hour'): Promise<any> {
    const data = await this.makeRequest(`/nodes/${node}/qemu/${vmid}/rrddata?timeframe=${timeframe}`);
    return data.data;
  }

  async getNodeResources(node: string): Promise<any> {
    const data = await this.makeRequest(`/nodes/${node}/status`);
    return data.data;
  }

  // Console access
  async getVNCTicket(node: string, vmid: number): Promise<{ ticket: string; port: number }> {
    const data = await this.makeRequest(`/nodes/${node}/qemu/${vmid}/vncproxy`, {
      method: 'POST',
    });
    return data.data;
  }

  // Firewall operations
  async getFirewallRules(node: string, vmid: number): Promise<any[]> {
    const data = await this.makeRequest(`/nodes/${node}/qemu/${vmid}/firewall/rules`);
    return data.data;
  }

  async addFirewallRule(node: string, vmid: number, rule: any): Promise<void> {
    await this.makeRequest(`/nodes/${node}/qemu/${vmid}/firewall/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(rule),
    });
  }

  // Template management
  async createTemplate(node: string, vmid: number, templateName: string): Promise<void> {
    await this.makeRequest(`/nodes/${node}/qemu/${vmid}/template`, {
      method: 'POST',
    });
  }

  async listTemplates(node: string): Promise<any[]> {
    const vms = await this.makeRequest(`/nodes/${node}/qemu`);
    return vms.data.filter((vm: any) => vm.template === 1);
  }
}

export default ProxmoxService;
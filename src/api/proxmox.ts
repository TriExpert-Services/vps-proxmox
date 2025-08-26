// Proxmox VE API Integration
// This file contains functions to interact with Proxmox VE API

export interface ProxmoxNode {
  node: string;
  status: string;
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
}

export interface ProxmoxVM {
  vmid: number;
  name: string;
  status: string;
  cpu: number;
  memory: number;
  disk: number;
  node: string;
  template?: string;
}

export interface CreateVMParams {
  vmid: number;
  name: string;
  cpu: number;
  memory: number; // in MB
  disk: number; // in GB
  template: string;
  node: string;
  network?: string;
}

class ProxmoxAPI {
  private baseUrl: string;
  private username: string;
  private password: string;
  private token?: string;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.username = username;
    this.password = password;
  }

  // Authenticate with Proxmox and get session ticket
  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api2/json/access/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: this.username,
          password: this.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.data.ticket;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Proxmox authentication failed:', error);
      return false;
    }
  }

  // Get list of nodes
  async getNodes(): Promise<ProxmoxNode[]> {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/api2/json/nodes`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get nodes:', error);
      return [];
    }
  }

  // Get VMs from a specific node
  async getVMs(node: string): Promise<ProxmoxVM[]> {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/api2/json/nodes/${node}/qemu`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get VMs:', error);
      return [];
    }
  }

  // Create a new VM
  async createVM(params: CreateVMParams): Promise<boolean> {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/api2/json/nodes/${params.node}/qemu`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          vmid: params.vmid.toString(),
          name: params.name,
          cores: params.cpu.toString(),
          memory: params.memory.toString(),
          scsi0: `local-lvm:${params.disk}`,
          net0: params.network || 'virtio,bridge=vmbr0',
          ostype: 'l26', // Linux 2.6+ kernel
          template: params.template
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to create VM:', error);
      return false;
    }
  }

  // Start VM
  async startVM(node: string, vmid: number): Promise<boolean> {
    return this.performVMAction(node, vmid, 'start');
  }

  // Stop VM
  async stopVM(node: string, vmid: number): Promise<boolean> {
    return this.performVMAction(node, vmid, 'stop');
  }

  // Restart VM
  async restartVM(node: string, vmid: number): Promise<boolean> {
    return this.performVMAction(node, vmid, 'restart');
  }

  // Delete VM
  async deleteVM(node: string, vmid: number): Promise<boolean> {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/api2/json/nodes/${node}/qemu/${vmid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to delete VM:', error);
      return false;
    }
  }

  // Get VM status and metrics
  async getVMStatus(node: string, vmid: number): Promise<any> {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/api2/json/nodes/${node}/qemu/${vmid}/status/current`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to get VM status:', error);
      return null;
    }
  }

  // Create VM backup
  async createBackup(node: string, vmid: number): Promise<boolean> {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/api2/json/nodes/${node}/vzdump`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          vmid: vmid.toString(),
          storage: 'local',
          mode: 'snapshot',
          compress: 'gzip'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  // Get available templates
  async getTemplates(node: string): Promise<any[]> {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/api2/json/nodes/${node}/aplinfo`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get templates:', error);
      return [];
    }
  }

  // Generic VM action performer
  private async performVMAction(node: string, vmid: number, action: string): Promise<boolean> {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/api2/json/nodes/${node}/qemu/${vmid}/status/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        }
      });

      return response.ok;
    } catch (error) {
      console.error(`Failed to ${action} VM:`, error);
      return false;
    }
  }

  // Get node resources
  async getNodeResources(node: string): Promise<any> {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/api2/json/nodes/${node}/status`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to get node resources:', error);
      return null;
    }
  }
}

// Singleton instance
let proxmoxClient: ProxmoxAPI | null = null;

export function initializeProxmox(baseUrl: string, username: string, password: string): ProxmoxAPI {
  proxmoxClient = new ProxmoxAPI(baseUrl, username, password);
  return proxmoxClient;
}

export function getProxmoxClient(): ProxmoxAPI | null {
  return proxmoxClient;
}

// VPS Management Functions
export class VPSManager {
  private proxmox: ProxmoxAPI;
  
  constructor(proxmox: ProxmoxAPI) {
    this.proxmox = proxmox;
  }

  async provisionVPS(planConfig: any, userId: string): Promise<{ success: boolean; vmid?: number; error?: string }> {
    try {
      // Get available nodes
      const nodes = await this.proxmox.getNodes();
      if (nodes.length === 0) {
        return { success: false, error: 'No available nodes' };
      }

      // Select node with least load
      const selectedNode = nodes.reduce((prev, current) => 
        (prev.cpu < current.cpu) ? prev : current
      );

      // Generate unique VM ID
      const vmid = Date.now() % 1000000;

      // Create VM parameters
      const vmParams: CreateVMParams = {
        vmid,
        name: `vps-${userId}-${vmid}`,
        cpu: planConfig.cpu,
        memory: planConfig.ram * 1024, // Convert GB to MB
        disk: planConfig.storage,
        template: planConfig.template || 'ubuntu-22.04-template',
        node: selectedNode.node,
        network: 'virtio,bridge=vmbr0'
      };

      // Create the VM
      const success = await this.proxmox.createVM(vmParams);
      
      if (success) {
        // Start the VM after creation
        await this.proxmox.startVM(selectedNode.node, vmid);
        return { success: true, vmid };
      } else {
        return { success: false, error: 'Failed to create VM' };
      }
    } catch (error) {
      console.error('VPS provisioning failed:', error);
      return { success: false, error: 'Provisioning failed' };
    }
  }

  async getVPSMetrics(node: string, vmid: number): Promise<any> {
    try {
      const status = await this.proxmox.getVMStatus(node, vmid);
      return {
        cpuUsage: Math.round(status.cpu * 100),
        ramUsage: Math.round((status.mem / status.maxmem) * 100),
        diskUsage: Math.round((status.disk / status.maxdisk) * 100),
        networkIn: Math.round(status.netin / 1024 / 1024), // Convert to MB
        networkOut: Math.round(status.netout / 1024 / 1024)
      };
    } catch (error) {
      console.error('Failed to get VPS metrics:', error);
      return null;
    }
  }

  async performAction(node: string, vmid: number, action: 'start' | 'stop' | 'restart'): Promise<boolean> {
    try {
      switch (action) {
        case 'start':
          return await this.proxmox.startVM(node, vmid);
        case 'stop':
          return await this.proxmox.stopVM(node, vmid);
        case 'restart':
          return await this.proxmox.restartVM(node, vmid);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Failed to ${action} VPS:`, error);
      return false;
    }
  }
}
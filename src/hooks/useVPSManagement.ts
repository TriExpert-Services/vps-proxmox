import { useState, useEffect } from 'react';
import { VPSPlan } from '../contexts/CartContext';
import ProxmoxService from '../services/ProxmoxService';
import DatabaseService, { VPSInstance } from '../services/DatabaseService';
import NotificationService from '../services/NotificationService';
import { config } from '../config/environment';

// Initialize services
const proxmoxService = new ProxmoxService(config.proxmox);
const dbService = new DatabaseService();
const notificationService = new NotificationService(
  config.email.provider,
  config.email
);

export interface VPSManagementState {
  instances: VPSInstance[];
  loading: boolean;
  error: string | null;
  creating: string | null; // ID of VPS being created
  actionLoading: Record<string, boolean>; // Track loading state for actions
}

export interface VPSMetrics {
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  uptime: string;
}

export function useVPSManagement(userId: string) {
  const [state, setState] = useState<VPSManagementState>({
    instances: [],
    loading: false,
    error: null,
    creating: null,
    actionLoading: {},
  });

  // Load user's VPS instances
  const loadInstances = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const instances = await dbService.getVPSByUser(userId);
      setState(prev => ({ ...prev, instances, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load VPS instances',
      }));
    }
  };

  // Provision new VPS from cart items
  const provisionVPS = async (plans: Array<{ plan: VPSPlan; quantity: number }>, userName: string): Promise<boolean> => {
    setState(prev => ({ ...prev, creating: 'processing' }));
    
    try {
      const createdInstances: VPSInstance[] = [];
      
      for (const { plan, quantity } of plans) {
        for (let i = 0; i < quantity; i++) {
          // Create VM in Proxmox
          const { vmid, node } = await proxmoxService.createVMFromPlan(plan, userId, userName);
          
          // Generate root password
          const rootPassword = generateSecurePassword();
          
          // Create database record
          const vpsInstance = await dbService.createVPS({
            userId,
            name: `${plan.name} ${i + 1}`,
            plan: plan.name,
            proxmoxVmid: vmid,
            proxmoxNode: node,
            status: 'creating',
            operatingSystem: 'Ubuntu 22.04 LTS',
            specifications: {
              cpu: plan.cpu,
              ram: plan.ram,
              storage: plan.storage,
              bandwidth: plan.bandwidth,
            },
            pricing: {
              monthlyPrice: plan.price,
              currency: 'USD',
            },
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            rootPassword,
          });

          createdInstances.push(vpsInstance);
        }
      }

      // Start all created VMs
      for (const instance of createdInstances) {
        await proxmoxService.startVM(instance.proxmoxNode, instance.proxmoxVmid);
        
        // Wait a bit for VM to start, then update status and get IP
        setTimeout(async () => {
          try {
            const status = await proxmoxService.getVMStatus(instance.proxmoxNode, instance.proxmoxVmid);
            const ipAddress = await generateIPAddress(); // In real implementation, get from Proxmox
            
            await dbService.updateVPS(instance.id, {
              status: status.status === 'running' ? 'running' : 'stopped',
              ipAddress,
              privateIpAddress: generatePrivateIP(),
            });

            // Send welcome email
            await notificationService.sendNotification({
              to: (await dbService.getUserById(userId))?.email || '',
              template: 'vpsCreated',
              variables: {
                name: userName,
                vpsName: instance.name,
                ipAddress,
                operatingSystem: instance.operatingSystem,
                cpuCores: instance.specifications.cpu,
                ramSize: instance.specifications.ram,
                storageSize: instance.specifications.storage,
                rootPassword: instance.rootPassword,
                vpsManagementUrl: `${config.app.baseUrl}/vps/${instance.id}`,
              },
            });
          } catch (error) {
            console.error('Error updating VPS post-creation:', error);
          }
        }, 10000); // 10 second delay
      }

      // Reload instances
      await loadInstances();
      
      setState(prev => ({ ...prev, creating: null }));
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        creating: null,
        error: error instanceof Error ? error.message : 'Failed to provision VPS',
      }));
      return false;
    }
  };

  // VPS control actions
  const performAction = async (instanceId: string, action: 'start' | 'stop' | 'restart'): Promise<boolean> => {
    setState(prev => ({
      ...prev,
      actionLoading: { ...prev.actionLoading, [instanceId]: true },
    }));

    try {
      const instance = await dbService.getVPSById(instanceId);
      if (!instance) throw new Error('VPS instance not found');

      // Perform action in Proxmox
      switch (action) {
        case 'start':
          await proxmoxService.startVM(instance.proxmoxNode, instance.proxmoxVmid);
          break;
        case 'stop':
          await proxmoxService.stopVM(instance.proxmoxNode, instance.proxmoxVmid);
          break;
        case 'restart':
          await proxmoxService.restartVM(instance.proxmoxNode, instance.proxmoxVmid);
          break;
      }

      // Update database status
      const newStatus = action === 'stop' ? 'stopped' : 
                       action === 'restart' ? 'running' : 'running';
      
      await dbService.updateVPS(instanceId, { status: newStatus as any });
      
      // Reload instances
      await loadInstances();
      
      setState(prev => ({
        ...prev,
        actionLoading: { ...prev.actionLoading, [instanceId]: false },
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        actionLoading: { ...prev.actionLoading, [instanceId]: false },
        error: error instanceof Error ? error.message : `Failed to ${action} VPS`,
      }));
      return false;
    }
  };

  // Get VPS metrics
  const getVPSMetrics = async (instanceId: string): Promise<VPSMetrics | null> => {
    try {
      const instance = await dbService.getVPSById(instanceId);
      if (!instance) return null;

      const status = await proxmoxService.getVMStatus(instance.proxmoxNode, instance.proxmoxVmid);
      
      return {
        cpuUsage: Math.round(status.cpu * 100),
        ramUsage: Math.round((status.mem / status.maxmem) * 100),
        diskUsage: Math.round((status.disk / status.maxdisk) * 100),
        networkIn: Math.round(status.netin / 1024 / 1024), // Convert to MB
        networkOut: Math.round(status.netout / 1024 / 1024),
        uptime: formatUptime(status.uptime),
      };
    } catch (error) {
      console.error('Error getting VPS metrics:', error);
      return null;
    }
  };

  // Create backup
  const createBackup = async (instanceId: string): Promise<boolean> => {
    setState(prev => ({
      ...prev,
      actionLoading: { ...prev.actionLoading, [`${instanceId}-backup`]: true },
    }));

    try {
      const instance = await dbService.getVPSById(instanceId);
      if (!instance) throw new Error('VPS instance not found');

      await proxmoxService.createBackup(instance.proxmoxNode, instance.proxmoxVmid);
      
      setState(prev => ({
        ...prev,
        actionLoading: { ...prev.actionLoading, [`${instanceId}-backup`]: false },
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        actionLoading: { ...prev.actionLoading, [`${instanceId}-backup`]: false },
        error: error instanceof Error ? error.message : 'Failed to create backup',
      }));
      return false;
    }
  };

  // Delete VPS
  const deleteVPS = async (instanceId: string): Promise<boolean> => {
    setState(prev => ({
      ...prev,
      actionLoading: { ...prev.actionLoading, [instanceId]: true },
    }));

    try {
      const instance = await dbService.getVPSById(instanceId);
      if (!instance) throw new Error('VPS instance not found');

      // Delete VM from Proxmox
      await proxmoxService.deleteVM(instance.proxmoxNode, instance.proxmoxVmid);
      
      // Soft delete from database
      await dbService.deleteVPS(instanceId, true);
      
      // Reload instances
      await loadInstances();
      
      setState(prev => ({
        ...prev,
        actionLoading: { ...prev.actionLoading, [instanceId]: false },
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        actionLoading: { ...prev.actionLoading, [instanceId]: false },
        error: error instanceof Error ? error.message : 'Failed to delete VPS',
      }));
      return false;
    }
  };

  // Get VNC console access
  const getConsoleAccess = async (instanceId: string): Promise<{ url: string; password: string } | null> => {
    try {
      const instance = await dbService.getVPSById(instanceId);
      if (!instance) return null;

      const vncTicket = await proxmoxService.getVNCTicket(instance.proxmoxNode, instance.proxmoxVmid);
      
      return {
        url: `${config.proxmox.protocol}://${config.proxmox.host}:${vncTicket.port}`,
        password: vncTicket.ticket,
      };
    } catch (error) {
      console.error('Error getting console access:', error);
      return null;
    }
  };

  // Initialize on mount
  useEffect(() => {
    loadInstances();
  }, [userId]);

  return {
    ...state,
    loadInstances,
    provisionVPS,
    performAction,
    getVPSMetrics,
    createBackup,
    deleteVPS,
    getConsoleAccess,
  };
}

// Helper functions
function generateSecurePassword(): string {
  const length = 16;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
}

function generateIPAddress(): string {
  // In real implementation, this would be allocated from a pool or retrieved from Proxmox
  return `203.0.113.${Math.floor(Math.random() * 254) + 1}`;
}

function generatePrivateIP(): string {
  return `10.0.0.${Math.floor(Math.random() * 254) + 1}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}